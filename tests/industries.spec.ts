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
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page
    .getByRole("button", {
      name: id === "streetwear" ? "Save as new product" : "Save product design",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "Produce", exact: true }).click();
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
        page.getByRole("button", { name: /^Contract 3 pieces/ }),
      ).toBeVisible({ timeout: 20000 });
    }
    await page
      .getByRole("button", { name: /^(Contract|Source) 3 pieces/ })
      .click();
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
for (const i of industries)
  test(`${i.id}: design, real production, sale, independent save and refresh`, async ({
    page,
  }) => {
    test.setTimeout(150000);
    await page.addInitScript(() =>
      localStorage.setItem(
        "streetwear-settings",
        JSON.stringify({ quality: "low", sensitivity: 1, volume: 0 }),
      ),
    );
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await create(page, i);
    await design(page, i.id);
    await manufacture(page, i.id);
    await page.getByRole("button", { name: "SocialHub", exact: true }).click();
    await page
      .getByRole("button", { name: "Publish product reveal", exact: true })
      .click();
    await page.getByRole("button", { name: /^Orders/ }).click();
    await page
      .getByRole("button", { name: "Pack order", exact: true })
      .first()
      .click({ timeout: 20000 });
    await page
      .getByRole("button", { name: "Ship · $5", exact: true })
      .first()
      .click();
    await expect(page.locator(".badge.success").first()).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("button", { name: "Finances", exact: true }).click();
    await expect(
      page.getByText("Sale · Alex R.", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Save & return to menu", exact: true })
      .click();
    await page.reload();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Produce", exact: true }).click();
    await expect(
      page.getByText(
        i.id === "streetwear" ? "Heat press ready" : "Workstation ready",
        { exact: true },
      ),
    ).toBeVisible();
    await page.screenshot({ path: `test-results/${i.id}-production.png` });
    expect(errors).toEqual([]);
  });
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
    await page
      .getByRole("button", { name: "Save & return to menu", exact: true })
      .click();
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
    await page.getByRole("button", { name: "Design", exact: true }).click();
    if (i.id === "streetwear")
      await expect(
        page.getByText("Studio tee 01", { exact: true }),
      ).toBeVisible();
    else
      await expect(
        page.locator(".panel-body strong").filter({ hasText: i.product }),
      ).toBeVisible();
    await page
      .getByRole("button", { name: "Save & return to menu", exact: true })
      .click();
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
  await page.getByRole("button", { name: "Supplies", exact: true }).click();
  await page
    .getByRole("button", { name: "Buy 1", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Produce", exact: true }).click();
  await manufacture(page, "streetwear");
  await page.getByRole("button", { name: "SocialHub", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish product reveal", exact: true })
    .click();
  await page.getByRole("button", { name: /^Orders/ }).click();
  await page
    .getByRole("button", { name: "Pack order", exact: true })
    .click({ timeout: 20000 });
  await page.getByRole("button", { name: "Ship · $5", exact: true }).click();
  await expect(page.locator(".badge.success")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Finances", exact: true }).click();
  await expect(
    page.getByText("Tutorial completion grant", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("$613", { exact: true }).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Save & return to menu", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Open settings" }).click();
  await page
    .getByRole("button", { name: "Start / resume tutorial", exact: true })
    .click();
  await page.getByRole("button", { name: "Finances", exact: true }).click();
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
  await page.getByRole("button", { name: "Open settings" }).click();
  await page.getByRole("button", { name: "Manage saves" }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "earned-garage.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await expect(page.getByRole("status")).toContainText("Save imported");
  await page.getByRole("button", { name: "Workspace", exact: true }).click();
  await page
    .getByRole("button", { name: "Purchase garage · $1,500", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Garage owned", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Produce", exact: true }).click();
  await page
    .getByRole("button", { name: "Contract 6 pieces · $27", exact: true })
    .click();
  await expect(page.getByText(/0 finished · 6 uninspected/)).toBeVisible({
    timeout: 25000,
  });
  await page
    .getByRole("button", { name: "Save & return to menu", exact: true })
    .click();
  await page.reload();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByText("WORKSHOP TEST / GARAGE WORKSHOP", { exact: true }),
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
