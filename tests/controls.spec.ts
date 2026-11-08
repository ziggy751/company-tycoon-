import { test, expect } from "@playwright/test";
for (const mode of ["trackpad", "mouse"])
  test(`${mode}: primary drag, wheel/pinch, panel scrolling, rebinding and click interaction`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    await page.addInitScript(
      () =>
        !localStorage.getItem("streetwear-settings") &&
        localStorage.setItem(
          "streetwear-settings",
          JSON.stringify({ quality: "low", volume: 0, sensitivity: 1 }),
        ),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Create Company" }).click();
    await page
      .getByRole("button", {
        name: "Choose Streetwear & Clothing",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Open the studio" }).click();
    await page.getByRole("button", { name: "Open settings" }).click();
    await page.getByLabel("Input preset").selectOption(mode);
    await page.getByRole("button", { name: "Rebind interact" }).click();
    await page.keyboard.press("KeyF");
    await expect(
      page.getByRole("button", { name: "Rebind interact" }),
    ).toHaveText("F");
    await page.getByRole("button", { name: "Close workstation" }).click();
    await page.keyboard.press("KeyF");
    await expect(
      page.getByRole("button", { name: "Close bedroom door", exact: true }),
    ).toBeVisible();
    const canvas = page.locator(".world canvas");
    const before = await canvas.getAttribute("data-camera");
    await page.mouse.move(900, 380);
    await page.mouse.down({ button: "left" });
    await page.mouse.move(1100, 450, { steps: 10 });
    await page.mouse.up();
    await expect(canvas).not.toHaveAttribute("data-camera", before || "");
    const orbit = await canvas.getAttribute("data-camera");
    if (mode === "trackpad")
      await canvas.dispatchEvent("wheel", {
        deltaY: -70,
        deltaMode: 0,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
    else {
      await page.mouse.move(1000, 450);
      await page.mouse.wheel(0, 120);
    }
    await expect(canvas).not.toHaveAttribute("data-camera", orbit || "");
    await page.getByRole("button", { name: "Open settings" }).click();
    const body = page.locator(".panel-body");
    await body.evaluate((e) => {
      e.scrollTop = 0;
    });
    await page.mouse.move(1280, 450);
    await page.mouse.wheel(0, 600);
    await expect
      .poll(() => body.evaluate((e) => e.scrollTop))
      .toBeGreaterThan(0);
    await page.getByRole("button", { name: "Close workstation" }).click();
    await page.getByRole("button", { name: "Design", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Save as new product" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Close workstation" }).click();
    await page.getByRole("button", { name: "Save journal" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Open settings" }).click();
    await expect(page.getByLabel("Input preset")).toHaveValue(mode);
    await expect(
      page.getByRole("button", { name: "Rebind interact" }),
    ).toHaveText("F");
  });
test("menus and text focus isolate game input; blur releases movement and drag capture", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    if (!localStorage.getItem("streetwear-settings"))
      localStorage.setItem(
        "streetwear-settings",
        JSON.stringify({ quality: "low", volume: 0, sensitivity: 1 }),
      );
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create Company", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose Streetwear & Clothing", exact: true })
    .click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "No, start playing" }).click();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByLabel("Product name").fill("");
  await page.getByLabel("Product name").pressSequentially("wasd e test");
  await page.getByLabel("Product name").press("Tab");
  await expect(
    page.getByRole("complementary", { name: "Design studio" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("complementary", { name: "Design studio" }),
  ).toHaveCount(0);
  await page.keyboard.down("KeyW");
  await page.waitForTimeout(500);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForTimeout(300);
  const target = await page
    .locator(".world canvas")
    .getAttribute("data-camera")
    .then((s) => s?.split(",").slice(3).join(","));
  await page.waitForTimeout(600);
  const later = await page
    .locator(".world canvas")
    .getAttribute("data-camera")
    .then((s) => s?.split(",").slice(3).join(","));
  const earlierTarget = target!.split(",").map(Number),
    laterTarget = later!.split(",").map(Number);
  expect(
    Math.hypot(...laterTarget.map((v, i) => v - earlierTarget[i])),
  ).toBeLessThan(0.1);
  await page.keyboard.up("KeyW");
  await page.mouse.move(1000, 400);
  await page.mouse.down();
  await page.mouse.move(1100, 430, { steps: 4 });
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.mouse.up();
  await page.getByRole("button", { name: "Open settings" }).click();
  await expect(
    page.getByRole("complementary", { name: "Settings" }),
  ).toBeVisible();
});
test("main-menu preferences do not accidentally create a company", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({ quality: "low", volume: 0, sensitivity: 1 }),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("Input preset")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Close menu settings" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "My Companies", exact: true }).click();
  await expect(
    page.getByText(
      "No companies yet. Create your first business from the main menu.",
      { exact: true },
    ),
  ).toBeVisible();
});
