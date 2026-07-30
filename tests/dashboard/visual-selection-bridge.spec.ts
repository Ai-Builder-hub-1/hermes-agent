import path from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test } from "@playwright/test";

const projectRoot = path.resolve(__dirname, "../../");
const activePrototypePath = path.join(projectRoot, "docs/design/prototype-gallery/hermes-cost-cockpit-active.html");

test.describe("Visual Selection Bridge", () => {
  test("captures a stable review id from a selected dashboard region", async ({ page }) => {
    await page.goto(pathToFileURL(activePrototypePath).href);

    await page.getByRole("button", { name: "Select UI" }).click();
    await page.locator('[data-review-id="cost-cockpit.sidebar"]').click({ position: { x: 32, y: 32 } });

    await expect(page.locator(".hvsb-panel")).toHaveAttribute("data-open", "true");
    await expect(page.locator("[data-hvsb-subtitle]")).toContainText("cost-cockpit.sidebar");
    await expect(page.locator("[data-hvsb-output]")).toContainText("Change cost-cockpit.sidebar");
    await expect(page.locator("[data-hvsb-output]")).toContainText("docs/design/prototype-gallery/hermes-cost-cockpit-active.html");
  });

  test("captures a smart inner element while preserving parent review routing", async ({ page }) => {
    await page.goto(pathToFileURL(activePrototypePath).href);

    await expect(page.getByRole("button", { name: "Smart mode" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Region mode" })).toHaveCount(0);
    await page.getByRole("button", { name: "Select UI" }).click();
    await page.locator('[data-review-id="cost-cockpit.sidebar-cockpit-nav"] .side-item').nth(1).locator("span").first().click();

    await expect(page.locator(".hvsb-panel")).toHaveAttribute("data-open", "true");
    await expect(page.locator("[data-hvsb-subtitle]")).toContainText("cost-cockpit.sidebar-cockpit-nav");
    await expect(page.locator("[data-hvsb-output]")).toContainText("inside cost-cockpit.sidebar-cockpit-nav");
    await expect(page.locator("[data-hvsb-output]")).toContainText("Selected element:");
    await expect(page.locator("[data-hvsb-output]")).toContainText("Virtual ID:");
    await expect(page.locator("[data-hvsb-output]")).toContainText("Element selector:");
  });

  test("infers metric label, value, card, and parent section boundaries", async ({ page }) => {
    await page.goto(pathToFileURL(activePrototypePath).href);

    await page.getByRole("button", { name: "Select UI" }).click();
    await page.locator('[data-review-id="cost-cockpit.metric-cards"] .metric .label').first().click();

    await expect(page.locator(".hvsb-panel")).toHaveAttribute("data-open", "true");
    await expect(page.locator("[data-hvsb-subtitle]")).toContainText("metric-label.tokens-processed");
    await expect(page.locator("[data-hvsb-candidates]")).toContainText("Metric label: Tokens processed");
    await expect(page.locator("[data-hvsb-candidates]")).toContainText("Metric card: Tokens processed");
    await expect(page.locator("[data-hvsb-candidates]")).toContainText("Parent region");

    await page.locator("[data-hvsb-candidates] .hvsb-candidate").filter({ hasText: "Metric card: Tokens processed" }).click();
    await expect(page.locator("[data-hvsb-output]")).toContainText("metric-card.tokens-processed");

    await page.locator("[data-hvsb-candidates] .hvsb-candidate").filter({ hasText: "Parent region" }).click();
    await expect(page.locator("[data-hvsb-output]")).toContainText("Change cost-cockpit.metric-cards inside cost-cockpit.metric-cards");
  });

  test("switches cockpit sidebar views without leaving the active prototype", async ({ page }) => {
    await page.goto(pathToFileURL(activePrototypePath).href);

    await expect(page.locator('[data-view-panel="overview"]')).toBeVisible();
    await page.getByRole("button", { name: /Business units/ }).click();

    await expect(page.locator('[data-view-panel="overview"]')).toBeHidden();
    await expect(page.locator('[data-view-panel="business-units"]')).toBeVisible();
    await expect(page.locator('[data-review-id="cost-cockpit.view-business-units"]')).toContainText("Business units should compare operating pressure");
    await expect(page.locator(".search")).toContainText("Business-unit comparison");

    await page.getByRole("button", { name: /Media Engine/ }).click();
    await expect(page.locator('[data-view-panel="media-engine"]')).toBeVisible();
    await expect(page.locator('[data-review-id="cost-cockpit.view-media-engine"]')).toContainText("Media Engine should show production throughput");
    await expect(page.locator(".search")).toContainText("Media Engine drilldown");
  });
});
