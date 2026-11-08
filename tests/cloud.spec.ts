import { test, expect, type BrowserContext, type Page } from "@playwright/test";
import { Sqlite } from "../worker/testDatabase";
import { api, type Env } from "../worker/index";
function fixture() {
  const db = new Sqlite();
  let code = "",
    network = true;
  const env: Env = {
    DB: db,
    AUTH_SECRET: "browser-test-only-32-character-secret",
    RESEND_API_KEY: "fake-test-only",
    AUTH_FROM: "test@example.com",
  };
  return {
    db,
    get code() {
      return code;
    },
    set online(v: boolean) {
      network = v;
    },
    async route(context: BrowserContext) {
      await context.addInitScript(() =>
        localStorage.setItem(
          "streetwear-settings",
          JSON.stringify({ quality: "low", volume: 0, sensitivity: 1 }),
        ),
      );
      await context.route("**/api/**", async (route) => {
        if (!network) {
          await route.abort("internetdisconnected");
          return;
        }
        const r = route.request();
        const response = await api(
          new Request(r.url(), {
            method: r.method(),
            headers: await r.allHeaders(),
            body: r.postData() || undefined,
          }),
          env,
          async (_url, options) => {
            const data = JSON.parse(String(options?.body));
            code = /code is (\d{6})/.exec(data.text)![1];
            return new Response("{}", { status: 200 });
          },
        );
        await route.fulfill({
          status: response.status,
          headers: Object.fromEntries(response.headers),
          body: await response.text(),
        });
      });
    },
  };
}
async function signIn(
  page: Page,
  f: ReturnType<typeof fixture>,
  email = "player@example.com",
) {
  await page
    .getByRole("button", { name: "Email login & cloud saves", exact: true })
    .click();
  await page.getByLabel("Email address").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in code" }).click();
  await expect(page.getByLabel("Six-digit verification code")).toBeVisible();
  expect(f.code).toMatch(/^\d{6}$/);
  await page.getByLabel("Six-digit verification code").fill(f.code);
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Verify code & sign in" }).click(),
  ]);
  await expect(
    page.getByRole("button", { name: "Start your story" }),
  ).toBeVisible();
}
async function newCompany(page: Page, name: string) {
  await page.getByRole("button", { name: "Start your story" }).click();
  await page.getByLabel("Company name").fill(name);
  await page.getByRole("button", { name: "Open the studio" }).click();
}
async function play(page: Page, name: string) {
  await page.getByRole("button", { name: "My Companies" }).click();
  await page
    .locator(".save-slot")
    .filter({ has: page.getByRole("heading", { name, exact: true }) })
    .getByRole("button", { name: "Play", exact: true })
    .click();
}
test("email login, independent cloud companies, refresh, second device, and offline conflict recovery", async ({
  browser,
}) => {
  test.setTimeout(240000);
  const f = fixture(),
    one = await browser.newContext(),
    two = await browser.newContext();
  try {
    await f.route(one);
    await f.route(two);
    const a = await one.newPage(),
      b = await two.newPage();
    await a.goto("/");
    await signIn(a, f);
    await newCompany(a, "CLOUD A");
    await a.getByRole("button", { name: "Supplies", exact: true }).click();
    await a.getByRole("button", { name: "Buy 5 · $60" }).click();
    await a.getByRole("button", { name: "Save & return to menu" }).click();
    await newCompany(a, "CLOUD B");
    await a.getByRole("button", { name: "Save & return to menu" }).click();
    await a.reload();
    await play(a, "CLOUD A");
    await expect(a.getByText("$440", { exact: true })).toBeVisible();
    await a.getByRole("button", { name: "Save & return to menu" }).click();
    f.db.sql.exec("UPDATE rate_limits SET expires_at=0");
    await b.goto("/");
    await signIn(b, f);
    await play(b, "CLOUD A");
    await expect(b.getByText("$440", { exact: true })).toBeVisible();
    await b.getByRole("button", { name: "Supplies", exact: true }).click();
    await b.getByRole("button", { name: "Buy 5 · $60" }).click();
    await b.getByRole("button", { name: "Save & return to menu" }).click();
    // Device A has cached an older clean revision. Work offline, then reconnect.
    f.online = false;
    await play(a, "CLOUD A");
    await a.getByRole("button", { name: "Supplies", exact: true }).click();
    await a.getByRole("button", { name: "Buy 1", exact: true }).first().click();
    await expect(a.getByText("$428", { exact: true })).toBeVisible();
    await a.getByRole("button", { name: "Save & return to menu" }).click();
    f.online = true;
    await a.evaluate(() => window.dispatchEvent(new Event("online")));
    await a
      .getByRole("button", { name: "Email login & cloud saves", exact: true })
      .click();
    await expect(
      a
        .getByText("Sync conflict · both copies preserved", { exact: true })
        .first(),
    ).toBeVisible({ timeout: 15000 });
    await Promise.all([
      a.waitForEvent("load"),
      a.getByRole("button", { name: "Keep both & return to menu" }).click(),
    ]);
    await play(a, "CLOUD A (offline copy)");
    await expect(a.getByText("$428", { exact: true })).toBeVisible();
    await a.getByRole("button", { name: "Save & return to menu" }).click();
    await play(a, "CLOUD A");
    await expect(a.getByText("$380", { exact: true })).toBeVisible();
  } finally {
    await one.close();
    await two.close();
    f.db.sql.close();
  }
});
test("guest progress imports once without removing the original local company", async ({
  context,
  page,
}) => {
  test.setTimeout(150000);
  const f = fixture();
  try {
    await f.route(context);
    await page.goto("/");
    await newCompany(page, "LOCAL ORIGINAL");
    await page.getByRole("button", { name: "Save & return to menu" }).click();
    await signIn(page, f);
    await page
      .getByRole("button", { name: "Email login & cloud saves", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Import existing local companies once" })
      .click();
    await expect(page.getByText(/Local companies copied/)).toBeVisible();
    await page
      .getByRole("button", { name: "Import existing local companies once" })
      .click();
    expect(
      f.db.sql
        .prepare("SELECT count(*) n FROM companies WHERE payload IS NOT NULL")
        .get()!.n,
    ).toBe(1);
    await Promise.all([
      page.waitForEvent("load"),
      page.getByRole("button", { name: "Sign out", exact: true }).click(),
    ]);
    await play(page, "LOCAL ORIGINAL");
    await expect(page.getByText("$500", { exact: true })).toBeVisible();
  } finally {
    f.db.sql.close();
  }
});
