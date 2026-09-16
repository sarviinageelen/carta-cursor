import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";

export type EntityNode = {
  id: string;
  name: string;
  kind: "company" | "holding" | "fund" | "gp" | "lp" | "other";
  preferredAmount?: string;
};

export type EntityEdge = {
  fromId: string;
  toId: string;
  ownership: string;
};

export type EntityWaterfallInput = {
  exitEntityId: string;
  exitValue: string;
  nodes: EntityNode[];
  edges: EntityEdge[];
};

export type StakeholderProceeds = {
  nodeId: string;
  name: string;
  amount: string;
  path: string[];
};

export function runEntityWaterfall(input: EntityWaterfallInput): CalcResult<{
  proceeds: StakeholderProceeds[];
  totalDistributed: string;
}> {
  const profile = "entity_waterfall_ownership_pref_v1";
  const byId = new Map(input.nodes.map((node) => [node.id, node]));
  if (!byId.has(input.exitEntityId)) {
    return unavailable("missing_data", "Exit entity is not in the structure.", profile);
  }
  const outgoing = new Map<string, EntityEdge[]>();
  const incomingCount = new Map<string, number>();
  for (const node of input.nodes) incomingCount.set(node.id, 0);
  for (const edge of input.edges) {
    if (!byId.has(edge.fromId) || !byId.has(edge.toId)) {
      return unavailable("missing_data", "Edge references an unknown node.", profile);
    }
    if (dec(edge.ownership).lt(0)) {
      return unavailable("unsupported_configuration", "Ownership cannot be negative.", profile);
    }
    outgoing.set(edge.fromId, [...(outgoing.get(edge.fromId) ?? []), edge]);
    incomingCount.set(edge.toId, (incomingCount.get(edge.toId) ?? 0) + 1);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const hasCycle = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const edge of outgoing.get(id) ?? []) {
      if (hasCycle(edge.toId)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  if (hasCycle(input.exitEntityId)) {
    return unavailable("cycle_detected", "Entity graph contains a cycle.", profile);
  }

  const proceeds: StakeholderProceeds[] = [];
  const walk = (nodeId: string, amount: ReturnType<typeof dec>, path: string[]) => {
    const node = byId.get(nodeId);
    if (!node) return;
    const nextPath = [...path, nodeId];
    const children = outgoing.get(nodeId) ?? [];
    if (children.length === 0) {
      proceeds.push({ nodeId, name: node.name, amount: amount.toFixed(), path: nextPath });
      return;
    }
    let remaining = amount;
    const pref = node.preferredAmount ? dec(node.preferredAmount) : dec(0);
    if (pref.gt(0)) {
      const prefPaid = remaining.lt(pref) ? remaining : pref;
      remaining = remaining.minus(prefPaid);
      const prefOwners = children;
      const prefWeight = prefOwners.reduce((acc, edge) => acc.plus(dec(edge.ownership)), dec(0));
      if (prefWeight.gt(0)) {
        for (const edge of prefOwners) {
          walk(edge.toId, prefPaid.times(dec(edge.ownership)).div(prefWeight), nextPath);
        }
      }
    }
    const residualWeight = children.reduce((acc, edge) => acc.plus(dec(edge.ownership)), dec(0));
    if (residualWeight.isZero()) {
      proceeds.push({ nodeId, name: node.name, amount: remaining.toFixed(), path: nextPath });
      return;
    }
    for (const edge of children) {
      walk(edge.toId, remaining.times(dec(edge.ownership)).div(residualWeight), nextPath);
    }
  };

  walk(input.exitEntityId, dec(input.exitValue), []);
  const total = proceeds.reduce((acc, row) => acc.plus(dec(row.amount)), dec(0));
  return ok({ proceeds, totalDistributed: total.toFixed() }, profile);
}
