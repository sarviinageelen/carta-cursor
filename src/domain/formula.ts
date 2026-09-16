import { dec } from "./money";
import { ok, unavailable, type CalcResult } from "./results";
import { CALCULATION_PROFILES } from "./profiles";

export type FormulaVariable = {
  name: string;
  value: string | null;
};

const TOKEN = /[A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[()+\-*/]/g;

export function evaluateFormula(
  expression: string,
  variables: FormulaVariable[],
): CalcResult<string> {
  const profile = CALCULATION_PROFILES.formula_safe_expr_v1.id;
  const trimmed = expression.replace(/\s+/g, "");
  if (!trimmed) {
    return unavailable("missing_data", "Formula is empty.", profile);
  }
  if (/[^A-Za-z0-9_+\-*/().]/.test(trimmed)) {
    return unavailable("unsupported_configuration", "Formula contains unsupported characters.", profile);
  }
  const lookup = new Map(variables.map((variable) => [variable.name, variable.value]));
  const tokens = trimmed.match(TOKEN);
  if (!tokens || tokens.join("") !== trimmed) {
    return unavailable("unsupported_configuration", "Formula could not be tokenized.", profile);
  }
  const output: string[] = [];
  const ops: string[] = [];
  const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const applyOp = (op: string, b: string, a: string): CalcResult<string> => {
    const av = dec(a);
    const bv = dec(b);
    if (op === "/" && bv.isZero()) {
      return unavailable("zero_denominator", "Division by zero in formula.", profile);
    }
    const result =
      op === "+" ? av.plus(bv) : op === "-" ? av.minus(bv) : op === "*" ? av.times(bv) : av.div(bv);
    return ok(result.toFixed(), profile);
  };

  for (const token of tokens) {
    if (/^[A-Za-z_]/.test(token)) {
      if (!lookup.has(token)) {
        return unavailable("missing_data", `Unknown variable ${token}.`, profile);
      }
      const value = lookup.get(token);
      if (value == null) {
        return unavailable("missing_data", `Variable ${token} has no value for the selected period.`, profile);
      }
      output.push(value);
    } else if (/^\d/.test(token)) {
      output.push(token);
    } else if (token === "(") {
      ops.push(token);
    } else if (token === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        const op = ops.pop() as string;
        const b = output.pop();
        const a = output.pop();
        if (a == null || b == null) return unavailable("unsupported_configuration", "Unbalanced formula.", profile);
        const applied = applyOp(op, b, a);
        if (applied.status !== "ok") return applied;
        output.push(applied.value);
      }
      if (ops.pop() !== "(") {
        return unavailable("unsupported_configuration", "Mismatched parentheses.", profile);
      }
    } else {
      while (
        ops.length &&
        ops[ops.length - 1] !== "(" &&
        precedence[ops[ops.length - 1]] >= precedence[token]
      ) {
        const op = ops.pop() as string;
        const b = output.pop();
        const a = output.pop();
        if (a == null || b == null) return unavailable("unsupported_configuration", "Unbalanced formula.", profile);
        const applied = applyOp(op, b, a);
        if (applied.status !== "ok") return applied;
        output.push(applied.value);
      }
      ops.push(token);
    }
  }
  while (ops.length) {
    const op = ops.pop() as string;
    if (op === "(") return unavailable("unsupported_configuration", "Mismatched parentheses.", profile);
    const b = output.pop();
    const a = output.pop();
    if (a == null || b == null) return unavailable("unsupported_configuration", "Unbalanced formula.", profile);
    const applied = applyOp(op, b, a);
    if (applied.status !== "ok") return applied;
    output.push(applied.value);
  }
  if (output.length !== 1) {
    return unavailable("unsupported_configuration", "Formula did not resolve to a single value.", profile);
  }
  return ok(dec(output[0]).toFixed(), profile);
}

export function shiftPeriod(period: string, offsetMonths: number): string {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offsetMonths, 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
