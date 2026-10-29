/**
 * Verifies the MongoDB connection configured in .env.local.
 *
 *   npm run db:check
 *
 * Prints the host/database it connected to, the collection counts, and a
 * readable explanation when the credentials or network are wrong.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

// Load .env.local the way Next.js does, without extra dependencies.
const envFile = path.join(process.cwd(), ".env.local");
try {
  const raw = await readFile(envFile, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
} catch {
  /* no .env.local — fall back to the process environment */
}

const uri = process.env.MONGODB_URI?.trim();
if (!uri) {
  console.error("MONGODB_URI is not set. Put it in .env.local (see .env.example).");
  process.exit(1);
}

if (uri.includes("<db_username>") || uri.includes("<db_password>")) {
  console.error("MONGODB_URI still contains the <db_username>/<db_password> placeholders — replace them with your real Atlas user.");
  process.exit(1);
}

const dbName =
  process.env.MONGODB_DB?.trim() ||
  (() => {
    try {
      return new URL(uri).pathname.replace(/^\//, "") || "magura_golden_cup";
    } catch {
      return "magura_golden_cup";
    }
  })();

const host = (() => {
  try {
    return new URL(uri).host;
  } catch {
    return "(unparseable URI)";
  }
})();

console.log(`Connecting to ${host} … database "${dbName}"`);

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });

try {
  await client.connect();
  const db = client.db(dbName);
  const [config, venues, teams, matches] = await Promise.all([
    db.collection("tournament_config").countDocuments(),
    db.collection("tournament_venues").countDocuments(),
    db.collection("tournament_teams").countDocuments(),
    db.collection("tournament_matches").countDocuments(),
  ]);
  console.log("Connected successfully.");
  console.log(`Collections: config ${config}, venues ${venues}, teams ${teams}, matches ${matches}`);
  if (!config) console.log('Database is empty — run "npm run seed" to load the starting data.');
} catch (error) {
  const message = error.message ?? String(error);
  console.error("Connection failed:", message);
  if (/Authentication failed|bad auth/i.test(message)) {
    console.error("→ Check the Atlas database user's username and password (special characters must be percent-encoded, e.g. @ → %40).");
  } else if (/ENOTFOUND|querySrv|ETIMEOUT|Server selection timed out/i.test(message)) {
    console.error("→ Check your internet connection and that Network Access in Atlas allows your current IP (0.0.0.0/0 for anywhere).");
  }
  process.exit(1);
} finally {
  await client.close().catch(() => undefined);
}
