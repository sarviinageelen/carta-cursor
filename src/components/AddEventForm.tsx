"use client";

import { useActionState } from "react";
import { addInvestmentEvent, type ActionState } from "@/server/actions";

const INITIAL: ActionState = { ok: false, message: "" };

export function AddEventForm({
  investmentId,
  fundId,
  defaultDate,
}: {
  investmentId: string;
  fundId: string;
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(
    addInvestmentEvent,
    INITIAL,
  );

  return (
    <form action={formAction} className="px-4 py-4">
      <input type="hidden" name="investmentId" value={investmentId} />
      <input type="hidden" name="fundId" value={fundId} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted">Event type</span>
          <select
            name="kind"
            defaultValue="valuation"
            className="w-full rounded border border-line bg-surface px-2 py-1.5 text-[13px]"
          >
            <option value="valuation">Valuation mark</option>
            <option value="distribution">Distribution</option>
            <option value="invest">Capital deployment</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] text-muted">Amount (USD)</span>
          <input
            name="amount"
            inputMode="decimal"
            placeholder="e.g. 2500000"
            required
            className="tabular w-full rounded border border-line bg-surface px-2 py-1.5 text-[13px]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] text-muted">Event date</span>
          <input
            type="date"
            name="eventDate"
            defaultValue={defaultDate}
            required
            className="tabular w-full rounded border border-line bg-surface px-2 py-1.5 text-[13px]"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] text-muted">Note (optional)</span>
          <input
            name="note"
            maxLength={200}
            placeholder="e.g. Series C mark"
            className="w-full rounded border border-line bg-surface px-2 py-1.5 text-[13px]"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-accent px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Record event"}
        </button>
        {state.message ? (
          <span
            role="status"
            className={`text-[12px] ${state.ok ? "text-positive" : "text-negative"}`}
          >
            {state.message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
