export const CALCULATION_PROFILES = {
  stage_probability_v1: {
    id: "stage_probability_v1",
    version: 1,
    description:
      "Failure is the residual of 1 - graduation - exit. Graduation + exit may not exceed 100%. Terminal stage graduation must be zero.",
  },
  construction_expected_cf_v1: {
    id: "construction_expected_cf_v1",
    version: 1,
    description:
      "Allocation-level expected cash flows. Deal count = allocation budget / expected cost per company. Expected follow-on cost uses stage-entry probabilities. Construction does not instantiate fake portfolio companies.",
  },
  current_forecast_v1: {
    id: "current_forecast_v1",
    version: 1,
    description:
      "Actual dated investment cash flows plus remaining modeled deployment. Remaining capacity = construction budget minus actual invested, not a rewrite of history. Monthly actual overrides do not replan deal counts.",
  },
  lp_multiples_matched_v1: {
    id: "lp_multiples_matched_v1",
    version: 1,
    description: "DPI = distributions / paidIn; RVPI = residual / paidIn; TVPI = (distributions + residual) / paidIn.",
  },
  irr_act365f_v1: {
    id: "irr_act365f_v1",
    version: 1,
    description:
      "Dated IRR using ACT/365F year fractions and a hybrid bisection/Newton solver. Multiple sign changes are a warning, not a uniqueness proof.",
  },
  fund_waterfall_european_v1: {
    id: "fund_waterfall_european_v1",
    version: 1,
    description:
      "Whole-fund European waterfall: return of contributed capital, preferred return on unreturned capital using ACT/365F, optional 100% catch-up, then remaining split at the carry rate. GP commitment is treated as a contributing interest, not as carry.",
  },
  fund_waterfall_american_unsupported: {
    id: "fund_waterfall_american_unsupported",
    version: 1,
    description: "Deal-by-deal American waterfall is not implemented in this prototype.",
  },
  liq_pref_stack_v1: {
    id: "liq_pref_stack_v1",
    version: 1,
    description:
      "Ordered seniority stack (index 0 is most senior). Supported: non-participating preferred and participating preferred with an optional cap. OPM/backsolve is unsupported.",
  },
  valuation_post_money_v1: {
    id: "valuation_post_money_v1",
    version: 1,
    description: "Company equity value equals the latest priced-round post-money, held constant until a new priced round.",
  },
  valuation_public_comps_v1: {
    id: "valuation_public_comps_v1",
    version: 1,
    description: "Simple public-comparables: selected metric times weighted median multiple, less net debt.",
  },
  valuation_dcf_v1: {
    id: "valuation_dcf_v1",
    version: 1,
    description: "Single-stage discounted free-cash-flow with a terminal Gordon growth value. Not a proprietary Carta engine.",
  },
  valuation_opm_unsupported: {
    id: "valuation_opm_unsupported",
    version: 1,
    description: "Option-pricing / backsolve engines are not implemented.",
  },
  loan_fixed_act365f_v1: {
    id: "loan_fixed_act365f_v1",
    version: 1,
    description: "Fixed-rate interest accrued on outstanding principal using ACT/365F. PIK and unsupported day-count combinations are rejected.",
  },
  capital_call_pro_rata_commitment_v1: {
    id: "capital_call_pro_rata_commitment_v1",
    version: 1,
    description: "Call amounts allocated by remaining unfunded commitment, with remainder assigned to the largest weight.",
  },
  formula_safe_expr_v1: {
    id: "formula_safe_expr_v1",
    version: 1,
    description: "Restricted arithmetic grammar over named KPI/report variables. No eval or arbitrary execution.",
  },
} as const;

export type CalculationProfileId = keyof typeof CALCULATION_PROFILES;

export const PROTOTYPE_ACCOUNTING_POLICY = {
  id: "prototype_capital_activity_v1",
  notCartaPolicy: true,
  rules: [
    "A capital-call notice is recorded at issuance and does not by itself equal paid-in capital.",
    "Accounting recognition uses the call effective/due date (Dr contributions receivable / Cr called capital).",
    "Cash receipts are separate events (Dr cash / Cr contributions receivable) and increase paid-in capital.",
    "Entries with effectiveDate after the as-of date are visible but excluded from as-of balances.",
    "Partial, early, and late receipts are supported. Reversals post offsetting journals and never delete history.",
    "This is a prototype policy resolving source conflict G05; it is not Carta's verified LPA engine.",
  ],
} as const;
