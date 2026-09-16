import { test, expect } from "@playwright/test";

test("login and open fund forecasting", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("Independent prototype")).toBeVisible();
  await page.getByRole("button", { name: "Enter workspace" }).click();
  await expect(page.getByRole("heading", { name: "Northbridge Capital" })).toBeVisible();
  await page.goto("/funds/fund_nb_ii/forecasting");
  await expect(page.getByText("Current Forecast")).toBeVisible();
  await page.goto("/valuations");
  await expect(page.getByRole("heading", { name: "Valuation workbench" })).toBeVisible();
  await page.goto("/waterfalls");
  await expect(page.getByRole("heading", { name: "Multi-entity waterfall" })).toBeVisible();
  await page.goto("/lp");
  await expect(page.getByRole("heading", { name: "LP Portal" })).toBeVisible();
});
