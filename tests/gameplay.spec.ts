import { test, expect } from "@playwright/test";
test("new game → design → manufacture → advertise → pack → ship → upgrade → refresh", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByLabel("Company name").fill("NIGHT SHIFT");
  await page.getByRole("button", { name: "Open the studio" }).click();
  await expect(page.getByText("$500", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Toggle simulation speed" }).click();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: "Save as new product" }).click();
  await expect(
    page.getByRole("button", { name: "Sample saved — ready to produce" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Produce", exact: true }).click();
  await page.getByRole("button", { name: "Print", exact: true }).click();
  await expect(page.getByText("Heat press ready", { exact: true })).toBeVisible(
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "SocialHub", exact: true }).click();
  await page.getByRole("button", { name: "Publish product reveal" }).click();
  await page.getByRole("button", { name: /^Orders/ }).click();
  await page
    .getByRole("button", { name: "Pack order" })
    .click({ timeout: 15000 });
  await page.getByRole("button", { name: "Ship · $5" }).click();
  await expect(
    page.locator(".badge.success").filter({ hasText: "delivered" }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Finances", exact: true }).click();
  await expect(page.getByText("$525", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Sale · Alex R.")).toBeVisible();
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page
    .getByRole("button", { name: "Purchase & install" })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Installed" })).toBeVisible();
  await expect(page.getByText("First sale", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close workstation" }).click();
  await page.getByRole("button", { name: "Save journal" }).click();
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/bedroom.png" });
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("$405", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await expect(
    page.locator(".badge.success").filter({ hasText: "delivered" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("menu and mobile layout remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Start your story" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-menu.png" });
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "Supplies", exact: true }).click();
  await expect(page.getByRole("button", { name: "Buy 5 · $60" })).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
});
test("manual slots, local export/import and corrupt-save rejection", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Manage saves" }).click();
  const slot = page
    .locator(".save-slot")
    .filter({ has: page.getByText("slot 1", { exact: true }) });
  await slot.getByRole("button", { name: "Save here" }).click();
  await expect(
    slot.getByRole("button", { name: "Load", exact: true }),
  ).toBeEnabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export save" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("streetwear-empire-save.json");
  const path = await file.path();
  expect(path).toBeTruthy();
  await page.getByRole("button", { name: "Supplies", exact: true }).click();
  await page.getByRole("button", { name: "Buy 5 · $60" }).click();
  await expect(page.getByText("$440", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Manage saves" }).click();
  await slot.getByRole("button", { name: "Load", exact: true }).click();
  await expect(page.getByText("$500", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Manage saves" }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":99}'),
    });
  await expect(page.getByRole("status")).toContainText(
    "Unsupported save version",
  );
  await page.locator("input[type=file]").setInputFiles(path!);
  await expect(page.getByRole("status")).toContainText("Save imported");
  await expect(page.getByText("$500", { exact: true })).toBeVisible();
});
