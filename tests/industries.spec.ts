import { tool, closeUI, axis, exitGame } from "./helpers";
import { test, expect, type Page } from "@playwright/test";
const industries = [
  {
    id: "streetwear",
    name: "Streetwear & Clothing",
    product: "Cotton T-shirt",
    price: 3900,
  },
  {
    id: "mtb",
    name: "MTB Accessories",
    product: "Frame-protection decal kit",
    price: 2400,
  },
  {
    id: "haircare",
    name: "Hair & Styling Accessories",
    product: "Acetate claw clip",
    price: 2200,
  },
];
async function create(page: Page, industry: (typeof industries)[number]) {
  await page
    .getByRole("button", { name: "Create Company", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose " + industry.name, exact: true })
    .click();
  await page
    .getByLabel("Company name")
    .fill(industry.id.toUpperCase() + " TEST");
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "No, start playing" }).click();
  await page.getByRole("button", { name: "Toggle simulation speed" }).click();
}
async function design(page: Page, id: string) {
  await tool(page, "design");
  await page
    .getByRole("button", {
      name: "Save product design",
      exact: true,
    })
    .click();
  await tool(page, "production");
}
async function manufacture(page: Page, id: string) {
  if (id === "streetwear") {
    await page.getByRole("button", { name: "Print", exact: true }).click();
    await expect(
      page.getByText("Heat press ready", { exact: true }),
    ).toBeVisible({ timeout: 20000 });
  } else {
    if (id === "mtb") {
      await page
        .getByRole("button", {
          name: "Make & approve prototype · $15",
          exact: true,
        })
        .click();
      await expect(
        page.getByText("Workstation ready", { exact: true }),
      ).toBeVisible({ timeout: 20000 });
    }
    await tool(page, "inventory");
    await page.getByRole("button", { name: /^Contract 3 pieces/ }).click();
    await tool(page, "receiving");
    const unpack = page.getByRole("button", { name: "Unpack delivery" });
    await expect(unpack).toBeEnabled({ timeout: 30000 });
    await unpack.click();
    await tool(page, "production");
    if (id === "mtb") {
      const inspect = page.getByRole("button", {
        name: "Inspect incoming batch",
        exact: true,
      });
      await expect(inspect).toBeEnabled({ timeout: 25000 });
      await inspect.click();
      await expect(page.getByText(/3 finished · 0 uninspected/)).toBeVisible({
        timeout: 15000,
      });
    } else {
      const label = page.getByRole("button", {
        name: "Label one accessory · $1.50",
        exact: true,
      });
      await expect(label).toBeEnabled({ timeout: 25000 });
      await label.click();
      await expect(page.getByText(/1 finished · 2 unlabelled/)).toBeVisible({
        timeout: 15000,
      });
    }
  }
}
test("three different companies remain independent through switching and reload", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({ quality: "low", sensitivity: 1, volume: 0 }),
    ),
  );
  await page.goto("/");
  for (const i of industries) {
    await create(page, i);
    await design(page, i.id);
    await exitGame(page);
  }
  await page.reload();
  for (const i of industries) {
    await page
      .getByRole("button", { name: "My Companies", exact: true })
      .click();
    const card = page.locator(".save-slot").filter({
      has: page.getByRole("heading", {
        name: i.id.toUpperCase() + " TEST",
        exact: true,
      }),
    });
    await expect(card).toContainText(i.name);
    await card.getByRole("button", { name: "Play", exact: true }).click();
    await tool(page, "design");
    await expect(
      page.locator(".window-body strong").filter({ hasText: i.product }),
    ).toBeVisible();
    await exitGame(page);
  }
});
test("optional tutorial pays $100 once and preserves the reward after reload", async ({
  page,
}) => {
  test.setTimeout(150000);
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({ quality: "low", sensitivity: 1, volume: 0 }),
    ),
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Create Company", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Choose Streetwear & Clothing", exact: true })
    .click();
  await page.getByRole("button", { name: "Open the studio" }).click();
  await page.getByRole("button", { name: "Yes, start tutorial" }).click();
  await page.keyboard.down("KeyW");
  try {
    await expect(
      page.getByText("Open the design workstation", { exact: true }),
    ).toBeVisible({ timeout: 12000 });
  } finally {
    await page.keyboard.up("KeyW");
  }
  await page.getByRole("button", { name: "Toggle simulation speed" }).click();
  await design(page, "streetwear");
  await tool(page, "inventory");
  await page
    .locator(".supply")
    .filter({ hasText: "Cotton T-shirt blanks" })
    .getByRole("button", { name: "Order 1", exact: true })
    .click();
  await tool(page, "production");
  await manufacture(page, "streetwear");
  await tool(page, "social");
  await page
    .getByRole("button", { name: "Publish product reveal", exact: true })
    .click();
  await tool(page, "orders");
  await page
    .getByRole("button", { name: "Pack order", exact: true })
    .click({ timeout: 20000 });
  await page.getByRole("button", { name: "Ship · $5", exact: true }).click();
  await expect(page.locator(".badge.success")).toBeVisible({ timeout: 15000 });
  await tool(page, "finances");
  await expect(
    page.getByText("Tutorial completion grant", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$613", { exact: true }).first()).toBeVisible();
  await exitGame(page);
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await closeUI(page);
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("button", { name: "Start / resume tutorial", exact: true })
    .click();
  await tool(page, "finances");
  await expect(
    page.getByText("Tutorial completion grant", { exact: true }),
  ).toHaveCount(1);
  await expect(page.getByText("$613", { exact: true }).first()).toBeVisible();
});
test("earned garage purchase changes the physical workspace, capacity and supplier batches", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.addInitScript(() =>
    localStorage.setItem(
      "streetwear-settings",
      JSON.stringify({ quality: "low", sensitivity: 1, volume: 0 }),
    ),
  );
  await page.goto("/");
  await create(page, industries[1]);
  const { newGame } = await import("../src/game/simulation");
  const g = newGame(
    "WORKSHOP TEST",
    "",
    "#d9ed91",
    "Independent",
    "#a77c62",
    "mtb",
  );
  g.designs = [
    {
      id: "1",
      kind: "frame-kit",
      name: "Trail protection",
      color: "#506e73",
      ink: "#223322",
      text: "TRAIL",
      fit: "Regular",
      graphic: "type",
      price: 2400,
      stock: 0,
      rawStock: 0,
      prototypeApproved: true,
    },
  ];
  g.orders = Array.from({ length: 334 }, (_, i) => ({
    id: String(i + 2),
    designId: "1",
    customer: "Fixture buyer",
    price: 2400,
    status: "delivered" as const,
  }));
  g.ledger = [
    {
      id: "1000",
      time: 0,
      label: "Fixture supplier, packaging, postage and marketing costs",
      amount: -441600,
      type: "expense",
    },
    {
      id: "1001",
      time: 0,
      label: "Stockroom shelving",
      amount: -12000,
      type: "expense",
    },
    ...g.orders.map((o, i) => ({
      id: String(1002 + i),
      time: 0,
      label: "Sale · Fixture buyer",
      amount: 2400,
      type: "revenue" as const,
    })),
  ];
  g.cash = 398000;
  g.reputation = 100;
  g.upgrades = ["storage"];
  g.nextId = 2000;
  await closeUI(page);
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Manage saves" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "earned-garage.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await expect(page.getByRole("status")).toContainText("Save imported");
  await tool(page, "upgrades");
  await page
    .getByRole("button", { name: "Purchase garage · $1,500", exact: true })
    .click();
  await tool(page, "upgrades");
  await expect(
    page.getByRole("button", { name: "Garage owned", exact: true }),
  ).toBeDisabled();
  await tool(page, "inventory");
  await page
    .getByRole("button", { name: "Contract 6 pieces · $27", exact: true })
    .click();
  await expect(
    page.getByText("6 × Trail protection", { exact: true }),
  ).toBeVisible({ timeout: 45000 });
  await exitGame(page);
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.locator(".brand-home b").filter({ hasText: "WORKSHOP TEST" }),
  ).toBeVisible();
  await page.keyboard.press("KeyM");
  await expect(
    page.getByRole("complementary", { name: "World map" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Navigate to Starter home", exact: true })
    .click();
  await page.screenshot({ path: "test-results/garage-workshop.png" });
});
test("industry selection remains usable at 1024 and 1920 pixel widths", async ({
  page,
}) => {
  for (const width of [1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page
      .getByRole("button", { name: "Create Company", exact: true })
      .click();
    for (const i of industries)
      await expect(
        page.getByRole("button", { name: "Choose " + i.name, exact: true }),
      ).toBeVisible();
    await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
    await page
      .getByRole("button", { name: "Back to main menu", exact: true })
      .click();
  }
});
