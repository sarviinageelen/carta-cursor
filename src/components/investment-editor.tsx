"use client";

import { useMemo, useState } from "react";
import { saveInvestmentAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Callout, Panel } from "@/components/ui/panel";

type EventDraft = {
  id?: string;
  kind: string;
  date: string;
  amount: string;
  ownership?: string | null;
  isProjected?: boolean;
  notes?: string | null;
  securityType?: string | null;
};

export function InvestmentEditor({
  fundId,
  investmentId,
  caseId,
  version,
  inceptionDate,
  events,
}: {
  fundId: string;
  investmentId: string;
  caseId: string;
  version: number;
  inceptionDate: string | null;
  events: EventDraft[];
}) {
  const [draft, setDraft] = useState(events);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const nested = editingIndex != null ? draft[editingIndex] : null;

  const chronologyWarning = useMemo(() => {
    if (!inceptionDate) return null;
    const first = draft.find((event) => event.kind === "financing");
    if (first && first.date < inceptionDate) return "First investment date cannot precede fund inception.";
    return null;
  }, [draft, inceptionDate]);

  function updateNested(patch: Partial<EventDraft>) {
    if (editingIndex == null) return;
    setDraft((current) => current.map((event, index) => (index === editingIndex ? { ...event, ...patch } : event)));
    setDirty(true);
  }

  return (
    <div className="space-y-3">
      <Callout title="Nested save">
        Event edits stay on this draft until you press Save Changes. Cancel restores the last persisted events. This is our declared nested-save behavior.
      </Callout>
      {chronologyWarning ? <Callout tone="warning" title="Validation">{chronologyWarning}</Callout> : null}
      <Panel>
        <table className="min-w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-muted">
              <th className="px-3 py-2">Date</th>
              <th>Kind</th>
              <th>Amount</th>
              <th>Projected</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draft.map((event, index) => (
              <tr key={event.id ?? index} className="border-t border-line">
                <td className="px-3 py-2">{event.date}</td>
                <td>{event.kind}</td>
                <td className="tabular-nums">{event.amount}</td>
                <td>{event.isProjected ? "yes" : "no"}</td>
                <td>
                  <button className="text-accent" type="button" onClick={() => setEditingIndex(index)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {nested ? (
        <Panel className="p-4">
          <h3 className="mb-2 font-medium">Nested event editor</h3>
          <div className="grid max-w-lg gap-2">
            <Label>Kind</Label>
            <Select value={nested.kind} onChange={(event) => updateNested({ kind: event.target.value })}>
              {["financing", "ownership_update", "valuation_update", "secondary_purchase", "partial_sale", "investment_income", "exit"].map((kind) => (
                <option key={kind}>{kind}</option>
              ))}
            </Select>
            <Label>Date</Label>
            <Input value={nested.date} onChange={(event) => updateNested({ date: event.target.value })} />
            <Label>Amount</Label>
            <Input value={nested.amount} onChange={(event) => updateNested({ amount: event.target.value })} />
            <Label>Ownership</Label>
            <Input value={nested.ownership ?? ""} onChange={(event) => updateNested({ ownership: event.target.value })} />
            <label className="text-[13px]">
              <input
                type="checkbox"
                checked={Boolean(nested.isProjected)}
                onChange={(event) => updateNested({ isProjected: event.target.checked })}
              />{" "}
              Projected
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingIndex(null)}>
                Close nested editor
              </Button>
            </div>
          </div>
        </Panel>
      ) : null}
      <form
        action={saveInvestmentAction}
        onSubmit={() => setDirty(false)}
      >
        <input type="hidden" name="fundId" value={fundId} />
        <input type="hidden" name="investmentId" value={investmentId} />
        <input type="hidden" name="caseId" value={caseId} />
        <input type="hidden" name="version" value={version} />
        <input type="hidden" name="eventsJson" value={JSON.stringify(draft)} />
        <div className="flex gap-2">
          <Button type="submit" disabled={Boolean(chronologyWarning)}>
            Save Changes
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setDraft(events);
              setDirty(false);
              setEditingIndex(null);
            }}
          >
            Cancel
          </Button>
          {dirty ? <span className="self-center text-[12px] text-warning">Unsaved draft</span> : null}
        </div>
      </form>
    </div>
  );
}
