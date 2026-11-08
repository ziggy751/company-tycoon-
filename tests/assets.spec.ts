import { test, expect } from "@playwright/test";
test("bundled CC0 chair loads locally with no renderer crash", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const asset = page.waitForResponse((r) =>
    r.url().endsWith("/assets/furniture/SheenChair.glb"),
  );
  await page.goto("/");
  const response = await asset;
  expect(response.ok()).toBe(true);
  expect((await response.body()).subarray(0, 4).toString()).toBe("glTF");
  await page
    .getByRole("button", { name: "Create Company", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose Streetwear & Clothing", exact: true })
    .click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await expect(page.locator(".world canvas")).toBeVisible();
  await expect(
    page.getByText("3D could not start.", { exact: false }),
  ).toHaveCount(0);
  await page.screenshot({ path: "test-results/authored-chair-high.png" });
  expect(errors).toEqual([]);
});
