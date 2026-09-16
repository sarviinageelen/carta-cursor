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
  await page.waitForTimeout(1000);
}

const browser = await chromium.launch({
  headless: false,
  args: ["--no-sandbox", "--window-size=1600,1000"],
});
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);

await login(page, "Alex Chen · investment_editor");
await switchPersona(page, "user_morgan");
await page.goto("http://127.0.0.1:3000/valuations", { waitUntil: "networkidle" });
if (await page.getByRole("button", { name: "Post" }).count()) {
  await page.getByRole("button", { name: "Post" }).first().click();
  await page.waitForTimeout(1200);
}
await shot(page, "valuations-posted");
const fv = await page.locator("text=Booked Fund II").textContent();
console.log("fv after post", fv);
await page.goto("http://127.0.0.1:3000/funds/fund_nb_ii/operations/ledger", { waitUntil: "networkidle" });
await shot(page, "ledger-after-post");

await page.goto("http://127.0.0.1:3000/fundraising", { waitUntil: "networkidle" });
const advance = page.getByRole("button", { name: /countersigned|signed|in progress/i });
if (await advance.count()) {
  await advance.first().click();
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
console.log("atlantic", (await page.locator("body").innerText()).slice(0, 500));

await switchPersona(page, "user_lp_meridian");
await page.goto("http://127.0.0.1:3000/lp", { waitUntil: "networkidle" });
await shot(page, "lp-portal-meridian");
console.log("meridian", (await page.locator("body").innerText()).slice(0, 500));

await switchPersona(page, "user_alex");
await page.goto("http://127.0.0.1:3000/waterfalls", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Run" }).first().click();
await page.waitForTimeout(1000);
await shot(page, "waterfall-run");
await page.getByRole("button", { name: "Mark inputs changed" }).first().click();
await page.waitForTimeout(600);
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
console.log("distributions", (await page.locator("body").innerText()).slice(0, 800));

console.log("continuation complete");
await page.waitForTimeout(1500);
await browser.close();
