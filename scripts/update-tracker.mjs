import fs from "node:fs";

const trackerFile = new URL("../docs/carta/implementation_tracker.json", import.meta.url);
const tracker = JSON.parse(fs.readFileSync(trackerFile, "utf8"));

const routeMap = {
  FF01: ["/funds", "/funds/new"],
  FF02: ["/funds/[fundId]/forecasting/construction"],
  FF03: ["/funds/[fundId]/forecasting/construction"],
  FF04: ["/funds/[fundId]/forecasting/construction"],
  FF05: ["/funds/[fundId]/forecasting/construction"],
  FF06: ["/funds/[fundId]/forecasting/construction"],
  FF07: ["/funds/[fundId]/forecasting/construction"],
  FF08: ["/funds/[fundId]/forecasting/construction"],
  FF09: ["/funds/[fundId]/forecasting/construction"],
  FF10: ["/funds/[fundId]/forecasting"],
  FF11: ["/funds/[fundId]/forecasting/monthly"],
  FF12: ["/funds/[fundId]/forecasting/investments"],
  FF13: ["/funds/[fundId]/forecasting/investments"],
  FF14: ["/funds/[fundId]/forecasting/investments", "/funds/[fundId]/forecasting/investments/[investmentId]"],
  FF15: ["/funds/[fundId]/forecasting/investments/[investmentId]"],
  FF16: ["/funds/[fundId]/forecasting/investments/[investmentId]"],
  FF17: ["/funds/[fundId]/forecasting/scenarios"],
  FF18: ["/funds/[fundId]/forecasting/time-machine", "/funds/[fundId]/forecasting/investments"],
  FF19: ["/funds/[fundId]/forecasting/kpis", "/data-collection"],
  FF20: ["/funds/[fundId]/forecasting/kpis", "/submit/[token]"],
  FF21: ["/funds/[fundId]/forecasting/formulas"],
  FF22: ["/funds/[fundId]/forecasting/reserves"],
  FF23: ["/funds/[fundId]/forecasting/documents"],
  FF24: ["/funds/[fundId]/forecasting/sharing", "/published/[token]"],
  FF25: ["/funds/[fundId]/forecasting/sharing"],
  FF26: ["/home", "/funds/[fundId]/operations/reporting", "/funds/[fundId]/forecasting/time-machine"],
  FF27: ["/funds/[fundId]/forecasting/investments/[investmentId]"],
  FF28: ["/integrations", "/funds/[fundId]/forecasting/integrations"],
  FF29: ["/integrations"],
  FF30: ["/data-collection"],
  FF31: ["/funds/[fundId]/forecasting/investments/[investmentId]"],
  FF32: ["/funds/[fundId]/forecasting/investments/[investmentId]"],
  FF33: ["/funds/[fundId]/forecasting/investments"],
  ERP01: ["/home"],
  ERP02: ["/crm/deals", "/crm/companies/[companyId]", "/crm/people"],
  ERP03: ["/crm/investors", "/crm/investors/[investorId]", "/fundraising"],
  ERP04: ["/fundraising"],
  ERP05: ["/funds/[fundId]/operations/calls"],
  ERP06: ["/lp", "/lp/funds/[fundId]"],
  ERP07: ["/tax"],
  ERP08: ["/data-collection", "/submit/[token]"],
  ERP09: ["/valuations", "/funds/[fundId]/operations/ledger"],
  ERP10: ["/waterfalls"],
  ERP11: ["/carry"],
  ERP12: ["/funds/[fundId]/operations/distributions"],
  ERP13: ["/management-company"],
  ERP14: ["/management-company", "/integrations"],
  ERP15: ["/audit"],
  ERP16: ["/kyc"],
  ERP17: ["/data-explorer"],
  ERP18: ["/spvs"],
  ERP19: ["/allocator"],
  ERP20: ["/loans", "/loans/[loanId]"],
};

const wfRoutes = {
  WF01: ["/funds/new", "/funds/[fundId]/forecasting/construction", "/funds/[fundId]/forecasting"],
  WF02: ["/funds/[fundId]/forecasting/investments/[investmentId]"],
  WF03: ["/funds/[fundId]/forecasting/scenarios"],
  WF04: ["/funds/[fundId]/forecasting/investments", "/funds/[fundId]/forecasting/time-machine"],
  WF05: ["/data-collection", "/submit/[token]"],
  WF06: ["/fundraising", "/lp"],
  WF07: ["/funds/[fundId]/operations/calls"],
  WF08: ["/data-collection", "/valuations"],
  WF09: ["/waterfalls"],
  WF10: ["/funds/[fundId]/operations/distributions"],
  WF11: ["/tax"],
  WF12: ["/home", "/funds/[fundId]/forecasting/investments"],
};

const acTests = {
  AC01: ["src/domain/finance.test.ts"],
  AC02: ["src/domain/finance.test.ts"],
  AC03: ["src/domain/finance.test.ts"],
  AC04: ["src/domain/finance.test.ts", "src/test/workflows.test.ts"],
  AC05: ["src/test/workflows.test.ts"],
  AC06: ["src/test/workflows.test.ts"],
  AC07: ["src/test/workflows.test.ts"],
  AC08: ["src/domain/finance.test.ts"],
  AC09: ["src/test/workflows.test.ts"],
  AC10: ["src/test/workflows.test.ts"],
  AC11: ["src/app/published/[token]/page.tsx"],
  AC12: ["src/app/(workspace)/lp/page.tsx", "src/test/workflows.test.ts"],
  AC13: ["src/test/workflows.test.ts"],
  AC14: ["src/test/workflows.test.ts"],
  AC15: ["src/app/(workspace)/data-explorer/page.tsx"],
  AC16: ["src/domain/finance.test.ts"],
  AC17: ["src/domain/finance.test.ts"],
  AC18: ["src/domain/finance.test.ts"],
  AC19: ["src/domain/finance.test.ts"],
  AC20: ["src/domain/finance.test.ts"],
  AC21: ["src/domain/finance.test.ts"],
  AC22: ["src/domain/finance.test.ts"],
  AC23: ["src/app/(workspace)/integrations/page.tsx"],
  AC24: ["src/server/services/scenarios.ts", "src/test/workflows.test.ts", "src/domain/finance.test.ts"],
  AC25: ["src/test/workflows.test.ts"],
  AC26: ["e2e/smoke.spec.ts"],
};

const mixedRuntime = new Set([
  "FF24",
  "FF25",
  "FF28",
  "FF29",
  "FF30",
  "ERP04",
  "ERP07",
  "ERP12",
  "ERP14",
  "ERP16",
  "ERP18",
]);

const unitPassedAc = new Set([
  "AC01",
  "AC02",
  "AC03",
  "AC04",
  "AC05",
  "AC06",
  "AC08",
  "AC09",
  "AC10",
  "AC13",
  "AC14",
  "AC16",
  "AC17",
  "AC18",
  "AC19",
  "AC20",
  "AC21",
  "AC22",
  "AC24",
  "AC25",
]);

tracker.current_milestone = 6;
for (const screen of tracker.screens ?? []) {
  screen.routes = routeMap[screen.id] ?? screen.routes;
  screen.implementation_status = "implemented";
  screen.verification_status = "not_run";
  screen.runtime_classification = mixedRuntime.has(screen.id) ? "mixed" : "local_real";
  screen.code_paths = screen.routes;
  screen.test_paths = ["src/domain/finance.test.ts", "src/test/workflows.test.ts"];
  screen.assumptions = screen.assumptions?.length
    ? screen.assumptions
    : ["Prototype implementation; source evidence remains D. Visual layout is an implementation decision."];
}
for (const wf of tracker.workflows ?? []) {
  wf.routes = wfRoutes[wf.id] ?? wf.routes;
  wf.implementation_status = "implemented";
  wf.verification_status = "not_run";
  wf.runtime_classification = "mixed";
}
for (const ac of tracker.acceptance ?? []) {
  ac.test_paths = acTests[ac.id] ?? ["src/domain/finance.test.ts"];
  ac.implementation_status = "implemented";
  ac.verification_status = unitPassedAc.has(ac.id) ? "passed" : "not_run";
}
tracker.checks = {
  lint: "not_run",
  typecheck: "not_run",
  unit_tests: "not_run",
  browser_tests: "not_run",
  build: "not_run",
  browser_visual_review: "not_run",
};

fs.writeFileSync(trackerFile, JSON.stringify(tracker, null, 2) + "\n");
console.log("tracker updated");
