import { chromium } from "@playwright/test";
import fs from "node:fs";

const ART = "/opt/cursor/artifacts";
fs.mkdirSync(ART, { recursive: true });

async function shot(page, name) {
  const path = `${ART}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log("screenshot", path);
}

async function login(page, label) {
  await page.goto("http://127.0.0.1:3000/login", { waitUntil: "networkidle" });
  if (await page.getByRole("heading", { name: "Carta Fund ERP" }).count()) {
    await page.selectOption("select[name=userId]", { label });
    await page.getByRole("button", { name: "Enter workspace" }).click();
    await page.waitForURL(/\/(home|lp|data-collection|audit)/);
  }
}

async function switchPersona(page, userId) {
  await page.selectOption("header select[name=userId]", userId);
  await page.getByRole("button", { name: "Switch" }).click();
  await page.waitForTimeout(800);
}

const browser = await chromium.launch({
  headless: false,
  args: ["--no-sandbox", "--window-size=1600,1000"],
});
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(20_000);

await login(page, "Alex Chen · investment_editor");
await page.goto("http://127.0.0.1:3000/home", { waitUntil: "networkidle" });
await shot(page, "home-tvpi");

await page.goto("http://127.0.0.1:3000/funds/fund_nb_ii/forecasting/investments/inv_nimbus_ii", {
  waitUntil: "networkidle",
});
const unrealizedBefore = await page.locator("text=Unrealized").first().locator("xpath=..").textContent();
console.log("nimbus metrics container", unrealizedBefore);
try {
  await page.getByText("Edit", { exact: true }).first().click();
  await page.waitForTimeout(500);
  await shot(page, "nimbus-editor-open");
  const notes = page.locator("label", { hasText: "Notes" }).locator("xpath=following::input[1]");
  if (await notes.count()) {
    await notes.fill("browser nested save");
    await page.getByRole("button", { name: "Close nested editor" }).click();
  }
  await page.getByRole("button", { name: "Save Changes" }).click();
  await page.waitForTimeout(800);
  await page.reload({ waitUntil: "networkidle" });
} catch (error) {
  console.log("nested editor step", error.message);
  await shot(page, "nimbus-editor-error");
}
await shot(page, "nimbus-after-nested-save");
const body = await page.locator("body").innerText();
if (!body.includes("3,080,000") && !body.includes("3080000")) {
  console.log("WARN: expected nimbus unrealized 3,080,000 still present");
}
console.log(body.slice(0, 800));

await page.goto("http://127.0.0.1:3000/funds/fund_nb_ii/forecasting/time-machine?asOf=2025-06-30", {
  waitUntil: "networkidle",
});
await shot(page, "time-machine-2025-06-30");

await page.goto("http://127.0.0.1:3000/funds/fund_nb_ii/forecasting/scenarios", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Recalculate" }).nth(1).click();
await page.waitForTimeout(1000);
await shot(page, "scenario-heavier-followon");

await page.goto("http://127.0.0.1:3000/data-collection", { waitUntil: "networkidle" });
if (await page.getByRole("button", { name: "Reject" }).count()) {
  await page.getByRole("button", { name: "Reject" }).first().click();
  await page.waitForTimeout(800);
}
await shot(page, "data-collection-after-reject");

await page.goto("http://127.0.0.1:3000/valuations", { waitUntil: "networkidle" });
const fvBefore = await page.locator("text=Booked Fund II").textContent();
console.log("fv before draft", fvBefore);
await page.getByRole("button", { name: "Save draft" }).click();
await page.waitForTimeout(800);
await shot(page, "valuations-draft");
await switchPersona(page, "user_morgan");
await page.goto("http://127.0.0.1:3000/valuations", { waitUntil: "networkidle" });
if (await page.getByRole("button", { name: "Post" }).count()) {
  await page.getByRole("button", { name: "Post" }).first().click();
  await page.waitForTimeout(1000);
}
await shot(page, "valuations-posted");
await page.goto("http://127.0.0.1:3000/funds/fund_nb_ii/operations/ledger", { waitUntil: "networkidle" });
await shot(page, "ledger-after-post");

await page.goto("http://127.0.0.1:3000/fundraising", { waitUntil: "networkidle" });
if (await page.getByRole("button", { name: /countersigned/i }).count()) {
  await page.getByRole("button", { name: /countersigned/i }).click();
  await page.waitForTimeout(800);
}
await shot(page, "fundraising-countersigned");
await page.goto("http://127.0.0.1:3000/funds/fund_nb_ii/operations/calls", { waitUntil: "networkidle" });
if (await page.getByRole("button", { name: "Receive" }).count()) {
  await page.getByRole("button", { name: "Receive" }).first().click();
  await page.waitForTimeout(800);
}
await shot(page, "capital-call-receipt");

await switchPersona(page, "user_lp_atlantic");
await page.goto("http://127.0.0.1:3000/lp", { waitUntil: "networkidle" });
await shot(page, "lp-portal-atlantic");
await switchPersona(page, "user_lp_meridian");
await page.goto("http://127.0.0.1:3000/lp", { waitUntil: "networkidle" });
await shot(page, "lp-portal-meridian");

await switchPersona(page, "user_alex");
await page.goto("http://127.0.0.1:3000/waterfalls", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Run" }).first().click();
await page.waitForTimeout(1000);
await shot(page, "waterfall-run");
await page.getByRole("button", { name: "Mark inputs changed" }).first().click();
await page.waitForTimeout(500);
await shot(page, "waterfall-stale");
await page.goto("http://127.0.0.1:3000/funds/fund_nb_ii/operations/distributions", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Simulate approval / pay" }).first().click();
await page.waitForTimeout(800);
await shot(page, "distribution-blocked");
if (await page.getByRole("button", { name: /Confirm bank/i }).count()) {
  await page.getByRole("button", { name: /Confirm bank/i }).click();
  await page.waitForTimeout(800);
}
await shot(page, "distribution-after-bank");

console.log("demo script complete");
await page.waitForTimeout(2000);
await browser.close();
