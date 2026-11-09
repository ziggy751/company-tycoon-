import { test, expect } from "@playwright/test";
import { axis, tool, closeUI, position } from "./helpers";
test("hands-on clothing: box, press, inspection, packing and courier payment persist", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({ quality: "low", volume: 0, sensitivity: 1 }),
    ),
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create Company", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose Streetwear & Clothing", exact: true })
    .click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "No, start playing" }).click();
  await page.getByRole("button", { name: "Toggle simulation speed" }).click();
  await tool(page, "design");
  await page
    .getByRole("button", { name: "Save product design", exact: true })
    .click();
  await tool(page, "inventory");
  await page
    .getByRole("button", { name: "Order 1", exact: true })
    .last()
    .click();
  await tool(page, "production");
  await page.getByRole("button", { name: "Start hands-on clothing" }).click();
  await closeUI(page);
  const interact = async (text: string) => {
    await expect(page.locator(".interaction-prompt")).toContainText(text);
    await page.keyboard.press("KeyE");
  };
  const aisle = async () => {
    await axis(page, 1, -0.1);
    await axis(page, 0, 0);
  };
  await aisle();
  await axis(page, 1, 3);
  await interact("Open Door");
  await axis(page, 1, 11);
  await interact("Pick up delivery box");
  await expect(page.getByRole("status")).toContainText("Carrying delivery");
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await page.getByLabel("First-person camera", { exact: true }).check();
  await closeUI(page);
  await expect
    .poll(
      async () => {
        const p = await position(page),
          v = (await page.locator(".world canvas").getAttribute("data-view"))!
            .split(",")
            .map(Number);
        return Math.hypot(v[0] - p[0], v[1] - 1.55, v[2] - p[1]);
      },
      { timeout: 15000 },
    )
    .toBeLessThan(0.3);
  await page.screenshot({
    path: "test-results/first-person-box.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Open settings", exact: true })
    .click();
  await page.getByLabel("First-person camera", { exact: true }).uncheck();
  await closeUI(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".minimal-status")).toContainText("Saved locally");
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Carrying delivery");
  await page.getByRole("button", { name: "Toggle simulation speed" }).click();
  await expect(page.locator(".world canvas")).toHaveAttribute(
    "data-world-key",
    (await page.locator(".brand-home").getAttribute("data-world-key"))!,
  );
  await axis(page, 1, 5);
  await axis(page, 1, -0.1);
  await axis(page, 0, 1);
  await interact("Open box");
  await interact("Pick up a blank");
  await axis(page, 0, 3.3);
  await axis(page, 1, -1.25);
  await interact("Manufacturing");
  await page.getByRole("button", { name: "Lay blank shirt on press" }).click();
  await page.getByRole("button", { name: "Position custom transfer" }).click();
  await page.getByRole("button", { name: "Lower and run heat press" }).click();
  await closeUI(page);
  await expect(page.locator(".interaction-prompt")).toContainText(
    "collect shirt",
    { timeout: 15000 },
  );
  await page.keyboard.press("KeyE");
  await axis(page, 1, -0.1);
  await axis(page, 0, 1);
  await interact("Inspect printed");
  await interact("Store inspected");
  await tool(page, "social");
  await page
    .getByRole("button", { name: "Publish product reveal", exact: true })
    .click();
  await closeUI(page);
  await axis(page, 1, -0.1);
  await axis(page, 0, 1);
  await interact("Collect reserved");
  await axis(page, 0, 0);
  await axis(page, 1, 2.2);
  await axis(page, 0, 2.25);
  for (const text of [
    "Place customer",
    "Add protective",
    "Check & attach",
    "Seal customer",
    "Pick up finished",
  ])
    await interact(text);
  await axis(page, 0, 0);
  await axis(page, 1, 11);
  await interact("Leave parcel");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".minimal-status")).toContainText("Saved locally");
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await tool(page, "finances");
  await expect(page.getByText("Sale · Alex R.", { exact: true })).toBeVisible({
    timeout: 15000,
  });
  expect(errors).toEqual([]);
});
