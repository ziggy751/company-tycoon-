import { test, expect } from "@playwright/test";
for (const mode of ["trackpad", "mouse"])
  test(`${mode}: primary drag, wheel/pinch, panel scrolling, rebinding and click interaction`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    await page.addInitScript(() =>
      localStorage.setItem(
        "streetwear-settings",
        JSON.stringify({ quality: "low", volume: 0, sensitivity: 1 }),
      ),
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Start your story" }).click();
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
