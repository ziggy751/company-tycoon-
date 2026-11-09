import { expect, type Page } from "@playwright/test";
export async function closeUI(page: Page) {
  if (
    await page
      .getByRole("button", { name: "Exit computer", exact: true })
      .count()
  )
    await page
      .getByRole("button", { name: "Exit computer", exact: true })
      .click();
  else if (
    await page.getByRole("button", { name: "Close workstation" }).count()
  )
    await page.getByRole("button", { name: "Close workstation" }).click();
  if (await page.getByRole("button", { name: "No, start playing" }).count())
    await page.getByRole("button", { name: "No, start playing" }).click();
}
export async function position(page: Page) {
  return (await page.locator(".world canvas").getAttribute("data-player"))!
    .split(",")
    .map(Number);
}
export async function axis(page: Page, index: number, goal: number) {
  const p = await position(page);
  if (Math.abs(p[index] - goal) < 0.16) return;
  const key =
    index === 0
      ? p[index] > goal
        ? "KeyA"
        : "KeyD"
      : p[index] > goal
        ? "KeyW"
        : "KeyS";
  await page.keyboard.down(key);
  try {
    await expect
      .poll(
        async () =>
          ((await position(page))[index] - goal) * Math.sign(goal - p[index]),
        { timeout: 45000, intervals: [25] },
      )
      .toBeGreaterThan(-0.12);
  } finally {
    await page.keyboard.up(key);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  }
}
export async function tool(page: Page, id: string) {
  const apps: Record<string, string> = {
    design: "Design Studio",
    inventory: "Supplier Market",
    catalogue: "Product Catalogue",
    social: "SocialHub",
    finances: "Finances",
    upgrades: "Property",
    store: "Online Store",
    inbox: "Email Inbox",
  };
  if (await page.getByRole("region", { name: "SummitOS desktop" }).count()) {
    if (id === "computer") return;
    if (apps[id]) {
      await page
        .getByRole("button", { name: "Show desktop", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Open " + apps[id], exact: true })
        .click();
      return;
    }
  }
  await closeUI(page);
  await expect(page.locator(".world canvas")).toHaveAttribute(
    "data-property",
    (await page.locator(".brand-home small").textContent())?.includes("GARAGE")
      ? "garage"
      : "home",
  );
  await expect(page.locator(".world canvas")).toHaveAttribute(
    "data-world-key",
    (await page.locator(".brand-home").getAttribute("data-world-key"))!,
  );
  let p = await position(page);
  const garage = p[0] > 24;
  if (garage && id !== "receiving" && id !== "wardrobe") {
    await axis(page, 1, -14);
    await axis(page, 0, 30);
    if (id === "production") {
      await axis(page, 0, 27);
      await axis(page, 1, -14.5);
    } else if (id === "orders") {
      await axis(page, 1, -10);
      await axis(page, 0, 33);
    } else await axis(page, 1, -17.3);
  } else if (id === "receiving" || id === "wardrobe") {
    // Route through both home doorways along the open hallway.
    if (p[1] < 3.6) {
      await axis(page, 1, -0.8);
      await axis(page, 0, 0);
      await axis(page, 1, 3);
      await expect(page.locator(".interaction-prompt")).toContainText(/Door/);
      if (
        (await page.locator(".interaction-prompt").textContent())?.includes(
          "Open Door",
        )
      )
        await page.locator(".interaction-prompt").click();
    }
    await axis(page, 0, 0);
    await axis(page, 1, id === "receiving" ? 11 : 8.5);
    if (id === "wardrobe") await axis(page, 0, -3.5);
  } else {
    if (p[1] > 4.4) {
      await axis(page, 0, 0);
      await axis(page, 1, 5);
      await expect(page.locator(".interaction-prompt")).toContainText(/Door/);
      if (
        (await page.locator(".interaction-prompt").textContent())?.includes(
          "Open Door",
        )
      )
        await page.locator(".interaction-prompt").click();
    }
    await axis(page, 0, 0);
    await axis(page, 1, -0.8);
    if (id === "production") {
      await axis(page, 0, 3.3);
      await axis(page, 1, -1.35);
    } else if (id === "orders") {
      await axis(page, 1, 2.2);
      await axis(page, 0, 2.25);
    } else {
      await axis(page, 1, -1.25);
    }
  }
  const actual = ["production", "orders", "receiving", "wardrobe"].includes(id)
    ? id
    : "computer";
  const labels: Record<string, string> = {
    computer: "Use Computer",
    production: garage ? "Use Workshop Bench" : "Use Manufacturing Station",
    orders: garage ? "Use Dispatch Station" : "Use Packing Station",
    receiving: "Receive Deliveries",
    wardrobe: "Open Wardrobe",
  };
  await expect(page.locator(".interaction-prompt")).toContainText(
    labels[actual],
  );
  await page.locator(".interaction-prompt").click();
  if (actual === "computer") {
    const names: Record<string, string> = {
      design: "Design Studio",
      inventory: "Supplier Market",
      catalogue: "Product Catalogue",
      social: "SocialHub",
      finances: "Finances",
      upgrades: "Property",
      orders: "Orders",
      store: "Online Store",
      inbox: "Email Inbox",
    };
    if (id !== "computer")
      await page
        .getByRole("button", { name: "Open " + names[id], exact: true })
        .click();
  }
}

export async function exitGame(page: Page) {
  await closeUI(page);
  await page
    .getByRole("button", { name: "Save & return to menu", exact: true })
    .click();
}
