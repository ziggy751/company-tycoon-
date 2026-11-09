import { test, expect } from "@playwright/test";
import { tool, position, closeUI } from "./helpers";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({ quality: "low", volume: 0, sensitivity: 1 }),
    ),
  );
});
async function create(
  page: import("@playwright/test").Page,
  industry = "Streetwear & Clothing",
) {
  await page.goto("/");
  await expect(
    page.locator(".world-label,.interaction-prompt,.dock"),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Create Company", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose " + industry, exact: true })
    .click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "No, start playing" }).click();
}
test("physical computer, draggable windows, focus, minimise, restore, scroll isolation and Escape", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await create(page);
  await tool(page, "computer");
  await expect(
    page.locator(".interaction-prompt,.dock,.world-label"),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Open Product Catalogue", exact: true })
    .click();
  const win = page.getByRole("article", { name: "Product Catalogue window" });
  await expect(win).toBeVisible();
  const rect = await win.boundingBox();
  await win.locator(".window-title").hover();
  await page.mouse.down();
  await page.mouse.move(rect!.x + 200, rect!.y + 80, { steps: 8 });
  await page.mouse.up();
  expect((await win.boundingBox())!.x).not.toBe(rect!.x);
  await page.getByLabel("Search products").fill("tote");
  await expect(page.locator(".catalogue-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Favourite Canvas tote bag" }).click();
  await expect(
    page.getByRole("button", { name: "Favourite Canvas tote bag" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Compare Canvas tote bag").check();
  await expect(page.locator(".comparison")).toContainText("$9");
  await page.getByLabel("Search products").fill("");
  const pose = await page.locator(".world canvas").getAttribute("data-camera");
  const body = win.locator(".window-body");
  await body.hover();
  await page.mouse.wheel(0, 700);
  await expect.poll(() => body.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await expect(page.locator(".world canvas")).toHaveAttribute(
    "data-camera",
    pose!,
  );
  await page
    .getByRole("button", { name: "Minimize Product Catalogue", exact: true })
    .click();
  await expect(win).toBeHidden();
  await page.getByRole("button", { name: "Restore Product Catalogue" }).click();
  await expect(win).toBeVisible();
  await page
    .getByRole("button", { name: "Maximize Product Catalogue" })
    .click();
  await expect(win).toHaveClass(/maximized/);
  await page
    .getByRole("button", { name: "Close Product Catalogue", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open Design Studio", exact: true })
    .click();
  await page.getByLabel("Product name", { exact: true }).fill("wasd e test");
  await page.getByLabel("Product name", { exact: true }).press("Tab");
  await expect(
    page.getByRole("article", { name: "Design Studio window" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Minimize Design Studio", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restore Design Studio", exact: true })
    .click();
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue(
    "wasd e test",
  );
  const at = await position(page);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("region", { name: "SummitOS desktop" }),
  ).toHaveCount(0);
  expect(
    Math.hypot(...(await position(page)).map((v, i) => v - at[i])),
  ).toBeLessThan(0.1);
  await tool(page, "computer");
  await page
    .getByRole("button", { name: "Open Finances", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Cash balance over eight recent periods" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/summit-desktop.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Exit computer", exact: true })
    .click();
  expect(errors).toEqual([]);
});
test("timed supplies are paid once, received physically and preserved across refresh", async ({
  page,
}) => {
  await create(page);
  await page.getByRole("button", { name: "Toggle simulation speed" }).click();
  await tool(page, "inventory");
  await page
    .getByRole("button", { name: "Order 5 · $60", exact: true })
    .click();
  await expect(page.locator(".cash-indicator")).toHaveText("$440");
  await expect(
    page.getByRole("article", { name: "Supplier Market window" }),
  ).toContainText("In transit");
  await tool(page, "receiving");
  const unpack = page.getByRole("button", { name: "Unpack delivery" });
  await expect(unpack).toBeEnabled({ timeout: 15000 });
  await unpack.click();
  await expect(unpack).toHaveCount(0);
  await page.getByRole("button", { name: "Close workstation" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".minimal-status")).toContainText("Saved locally");
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await tool(page, "inventory");
  await expect(
    page.getByRole("article", { name: "Supplier Market window" }),
  ).toContainText("10 on hand");
  await expect(page.locator(".cash-indicator")).toHaveText("$440");
});
for (const industry of [
  "Streetwear & Clothing",
  "MTB Accessories",
  "Hair & Styling Accessories",
])
  test(industry + ": full physical workflow and reload", async ({ page }) => {
    test.setTimeout(150000);
    await create(page, industry);
    await page.getByRole("button", { name: "Toggle simulation speed" }).click();
    await tool(page, "design");
    await page
      .getByRole("button", { name: "Save product design", exact: true })
      .click();
    if (industry === "Streetwear & Clothing") {
      await tool(page, "production");
      await page.getByRole("button", { name: "Print", exact: true }).click();
      await expect(
        page.getByText("Heat press ready", { exact: true }),
      ).toBeVisible({ timeout: 20000 });
    } else {
      if (industry === "MTB Accessories") {
        await tool(page, "production");
        await page
          .getByRole("button", { name: "Make & approve prototype · $15" })
          .click();
        await expect(
          page.getByText("Workstation ready", { exact: true }),
        ).toBeVisible({ timeout: 15000 });
      }
      await tool(page, "inventory");
      await page.getByRole("button", { name: /^Contract 3 pieces/ }).click();
      await tool(page, "receiving");
      const unpack = page.getByRole("button", { name: "Unpack delivery" });
      await expect(unpack).toBeEnabled({ timeout: 30000 });
      await unpack.click();
      await tool(page, "production");
      await page
        .getByRole("button", {
          name:
            industry === "MTB Accessories"
              ? "Inspect incoming batch"
              : "Label one accessory · $1.50",
          exact: true,
        })
        .click();
      await expect(
        page.getByText("Workstation ready", { exact: true }),
      ).toBeVisible({ timeout: 15000 });
    }
    await tool(page, "social");
    await page
      .getByRole("button", { name: "Publish product reveal", exact: true })
      .click();
    await tool(page, "orders");
    await page
      .locator(".order")
      .filter({ hasText: "Alex R." })
      .getByRole("button", { name: "Pack order", exact: true })
      .click({ timeout: 20000 });
    await page
      .locator(".order")
      .filter({ hasText: "Alex R." })
      .getByRole("button", { name: "Ship · $5", exact: true })
      .click();
    await expect(page.locator(".badge.success").first()).toBeVisible({
      timeout: 15000,
    });
    await tool(page, "finances");
    await expect(
      page.getByText("Sale · Alex R.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Cash balance over eight recent periods" }),
    ).toBeVisible();
    await closeUI(page);
    await page
      .getByRole("button", { name: "Save & return to menu", exact: true })
      .click();
    await page.reload();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await tool(page, "orders");
    await expect(page.locator(".badge.success").first()).toBeVisible();
  });
test("desktop fits a narrow viewport and contains scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await create(page);
  await tool(page, "catalogue");
  await expect(page.getByLabel("Search products")).toBeVisible();
  await expect(page.locator("body")).toHaveJSProperty("scrollWidth", 390);
  await page.screenshot({ path: "test-results/mobile-desktop.png" });
});

for (const mode of ["trackpad", "mouse"])
  test(`${mode}: first-person drag and computer round trip release input`, async ({
    page,
  }) => {
    await create(page);
    await tool(page, "computer");
    await closeUI(page);
    await page
      .getByRole("button", { name: "Open settings", exact: true })
      .click();
    await page.getByLabel("Input preset").selectOption(mode);
    await page.getByLabel("First-person camera", { exact: true }).check();
    await closeUI(page);
    const canvas = page.locator(".world canvas");
    await expect(canvas).toHaveAttribute("data-view", /.+/);
    const before = await canvas.getAttribute("data-view");
    await page.mouse.move(900, 400);
    await page.mouse.down();
    await page.mouse.move(980, 420, { steps: 6 });
    await page.mouse.up();
    await expect(canvas).not.toHaveAttribute("data-view", before!);
    const where = await position(page);
    await page.keyboard.press("KeyE");
    await expect(
      page.getByRole("region", { name: "SummitOS desktop" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("region", { name: "SummitOS desktop" }),
    ).toHaveCount(0);
    await page.mouse.move(1050, 450);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect
      .poll(async () =>
        Math.hypot(...(await position(page)).map((v, i) => v - where[i])),
      )
      .toBeLessThan(0.1);
  });
