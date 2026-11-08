import fs from "node:fs";
import path from "node:path";
const config = JSON.parse(fs.readFileSync("wrangler.cloud.jsonc", "utf8"));
const id =
  process.env.CLOUDFLARE_D1_DATABASE_ID || config.d1_databases[0].database_id;
if (
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id || "",
  )
)
  throw new Error(
    "Set CLOUDFLARE_D1_DATABASE_ID to the ID of your existing company-tycoon-saves database. No database will be created automatically.",
  );
config.main = path.resolve(config.main);
config.assets.directory = path.resolve(config.assets.directory);
config.d1_databases[0].database_id = id;
config.d1_databases[0].migrations_dir = path.resolve("migrations");
fs.mkdirSync(".wrangler", { recursive: true });
fs.writeFileSync(".wrangler/deploy.jsonc", JSON.stringify(config, null, 2));
