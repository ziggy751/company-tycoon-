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
  await page.locator("input[type=file]").setInputFiles({
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
test("two companies keep balances independent through switching and refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByLabel("Company name").fill("FIRST LABEL");
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "Supplies", exact: true }).click();
  await page.getByRole("button", { name: "Buy 5 · $60" }).click();
  await page.getByRole("button", { name: "Save & return to menu" }).click();
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByLabel("Company name").fill("SECOND LABEL");
  await page.getByRole("button", { name: "Open the studio" }).click();
  await expect(page.getByText("$500", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save & return to menu" }).click();
  for (const [name, cash] of [
    ["FIRST LABEL", "$440"],
    ["SECOND LABEL", "$500"],
    ["FIRST LABEL", "$440"],
  ]) {
    await page.getByRole("button", { name: "My Companies" }).click();
    await page
      .locator(".save-slot")
      .filter({ has: page.getByRole("heading", { name, exact: true }) })
      .getByRole("button", { name: "Play", exact: true })
      .click();
    await expect(page.getByText(cash, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Save & return to menu" }).click();
  }
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("$440", { exact: true })).toBeVisible();
});
test("original autosave migrates without losing money or deleting its backup", async ({
  page,
}) => {
  await page.goto("/");
  const old = await import("../src/game/simulation").then((m) =>
    m.newGame("LEGACY LABEL"),
  );
  delete old.companyId;
  await page.evaluate(async (game) => {
    const d = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("streetwear-empire", 2);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const tx = d.transaction(["saves", "meta"], "readwrite");
    tx.objectStore("saves").put({ game, savedAt: 1 }, "autosave");
    tx.objectStore("meta").delete("migrated");
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    d.close();
  }, old);
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByText("LEGACY LABEL / BEDROOM STUDIO")).toBeVisible();
  await expect(page.getByText("$500", { exact: true })).toBeVisible();
});
test("manufactured wardrobe sample and home controls persist", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({
        quality: "low",
        sensitivity: 1,
        volume: 0,
        firstPerson: false,
        invert: false,
      }),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "Toggle simulation speed" }).click();
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: "Save as new product" }).click();
  await page.getByRole("button", { name: "Produce", exact: true }).click();
  await page.getByRole("button", { name: "Print", exact: true }).click();
  await expect(page.getByText("Heat press ready", { exact: true })).toBeVisible(
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("button", { name: "Open wardrobe & home controls" })
    .click();
  await page
    .getByRole("button", { name: "Set aside one sample & wear" })
    .click();
  await expect(
    page.getByRole("button", { name: "Wearing this design" }),
  ).toBeDisabled();
  await expect(page.getByText(/0 saleable · Sample owned/)).toBeVisible();
  await page.getByRole("button", { name: "Turn interior lights off" }).click();
  await page
    .getByRole("button", { name: "Open bedroom door", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Save journal" }).click();
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("button", { name: "Open wardrobe & home controls" })
    .click();
  await expect(
    page.getByRole("button", { name: "Wearing this design" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Turn interior lights on" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("button", { name: "Close bedroom door", exact: true })
      .last(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close workstation" }).click();
  await page.keyboard.down("KeyS");
  await page.waitForTimeout(6500);
  await page.keyboard.up("KeyS");
  await page.getByRole("button", { name: "Save journal" }).click();
  await expect(page.getByText("Saved locally", { exact: true })).toBeVisible();
  const position = await page.evaluate(async () => {
    const d = await new Promise<IDBDatabase>((res) => {
      const r = indexedDB.open("streetwear-empire", 2);
      r.onsuccess = () => res(r.result);
    });
    const tx = d.transaction(["meta", "companies"], "readonly");
    const id = await new Promise<IDBValidKey>((res) => {
      const r = tx.objectStore("meta").get("active");
      r.onsuccess = () => res(r.result);
    });
    const game = await new Promise<{ game: { player: number[] } }>((res) => {
      const r = tx.objectStore("companies").get(id);
      r.onsuccess = () => res(r.result);
    });
    d.close();
    return game.game.player;
  });
  expect(position[1]).toBeGreaterThan(10);
  await page.screenshot({ path: "test-results/outside-home.png" });
});
test("company deletion requires confirmation and updates Continue", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({
        quality: "low",
        sensitivity: 1,
        volume: 0,
        firstPerson: false,
        invert: false,
      }),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByLabel("Company name").fill("DELETE TEST");
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "Save & return to menu" }).click();
  await page.getByRole("button", { name: "My Companies" }).click();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "DELETE TEST", exact: true }),
  ).toBeVisible();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "DELETE TEST", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Close companies" }).click();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
});
