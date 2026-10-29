/**
 * Seeds MongoDB with the tournament data.
 *
 *   npm run seed            → replace everything with the bundled starting data
 *   npm run seed -- --wipe  → same, but explicitly drops the collections first
 *
 * The starting data comes from src/data/tournament-data.ts (kept as the initial
 * fixture of the project). After seeding, MongoDB is the single source of truth.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MongoClient } from "mongodb";

// ---- load .env.local so `npm run seed` sees MONGODB_URI -----------------------
async function loadEnvLocal() {
  try {
    const raw = await readFile(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      const [, key, value] = match;
      if (process.env[key] === undefined) process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  } catch {
    /* no .env.local — use the process environment */
  }
}
await loadEnvLocal();
// ------------------------------------------------------------------------------

const URI = process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017";
const DB_NAME = process.env.MONGODB_DB?.trim() || (() => {
  try {
    const pathname = new URL(URI).pathname.replace(/^\//, "");
    return pathname || "magura_golden_cup";
  } catch {
    return "magura_golden_cup";
  }
})();

const SOURCE = path.join(process.cwd(), "src", "data", "tournament-data.ts");

const FIXED_VENUE = "Magura Govt. Primary School Play Ground";

/** Reads one declaration out of the data module, tolerant of unquoted keys. */
function readDeclaration(source, name) {
  const marker = `export const ${name}`;
  const index = source.indexOf(marker);
  if (index < 0) return null;

  const lineEnd = source.indexOf("\n", index + marker.length);
  let eq = -1;
  for (let at = source.indexOf("=", index + marker.length); at !== -1 && (lineEnd === -1 || at < lineEnd); ) {
    eq = at;
    at = source.indexOf("=", at + 1);
  }
  if (eq === -1) return null;

  const bracket = source.indexOf("[", eq);
  const brace = source.indexOf("{", eq);
  const isObject = brace !== -1 && (bracket === -1 || brace < bracket);
  const from = isObject ? brace : bracket;
  const open = isObject ? "{" : "[";
  const close = isObject ? "}" : "]";

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = from; i < source.length; i += 1) {
    const char = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        const literal = source.slice(from, i + 1);
        try {
          return JSON.parse(literal);
        } catch {
          const tolerant = literal
            .replace(/,(\s*[}\]])/g, "$1")
            .replace(/([{,])(\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1$2"$3"$4');
          return JSON.parse(tolerant);
        }
      }
    }
  }
  return null;
}

const STAGE_ORDER = ["r16", "qf", "sf", "final"];
const order = (match) => STAGE_ORDER.indexOf(match.stage) * 100 + match.slot;

async function main() {
  const source = await readFile(SOURCE, "utf8").catch(() => "");
  const config = readDeclaration(source, "TOURNAMENT_CONFIG");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const venues = readDeclaration(source, "VENUES") ?? [];
  const teams = readDeclaration(source, "TEAMS") ?? [];
  const matches = readDeclaration(source, "MATCHES") ?? [];

  if (!config || teams.length !== 16) {
    console.error(`Could not read the starting data from ${SOURCE} (teams: ${teams.length}).`);
    process.exit(1);
  }

  const client = new MongoClient(URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(DB_NAME);

  if (process.argv.includes("--wipe")) {
    await Promise.all(
      ["tournament_config", "tournament_venues", "tournament_teams", "tournament_matches"].map((name) =>
        db.collection(name).deleteMany({}),
      ),
    );
    console.log("Cleared existing collections.");
  }

  const fullConfig = {
    ...config,
    venue: FIXED_VENUE,
    championPrize: Number(config.championPrize ?? 50000),
    runnerUpPrize: Number(config.runnerUpPrize ?? 40000),
    prizePool: Number(config.championPrize ?? 50000) + Number(config.runnerUpPrize ?? 40000),
    awards:
      config.awards ?? [
        { id: "award-pom", title: "Player of the Match", recipient: null, note: "" },
        { id: "award-pot", title: "Player of the Tournament", recipient: null, note: "" },
        { id: "award-gk", title: "Best Goalkeeper", recipient: null, note: "" },
      ],
  };
  await db.collection("tournament_config").replaceOne({ _id: "config" }, fullConfig, { upsert: true });

  await db.collection("tournament_venues").replaceOne(
    { _id: "v1" },
    { _id: "v1", name: FIXED_VENUE, city: "Magura", capacity: 0, surface: "" },
    { upsert: true },
  );
  await db.collection("tournament_venues").deleteMany({ _id: { $ne: "v1" } });

  await db.collection("tournament_teams").bulkWrite(
    teams.map(({ id, ...rest }) => ({
      replaceOne: { filter: { _id: id }, replacement: { _id: id, ...rest }, upsert: true },
    })),
    { ordered: false },
  );

  const migrate = (match) => {
    // Old auto-bracket field names are dropped on purpose — the manual model starts blank.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, homeId, awayId, homeScore, awayScore, homePens, awayPens, homeFrom, awayFrom, ...rest } = match;
    return {
      ...rest,
      _id: id,
      teamAId: match.teamAId ?? homeId ?? null,
      teamBId: match.teamBId ?? awayId ?? null,
      teamAScore: match.teamAScore ?? homeScore ?? null,
      teamBScore: match.teamBScore ?? awayScore ?? null,
      teamAPens: match.teamAPens ?? homePens ?? null,
      teamBPens: match.teamBPens ?? awayPens ?? null,
      winnerId: null,
      status: "scheduled",
      kickoff: null,
      venue: FIXED_VENUE,
      minute: 0,
      goals: Array.isArray(match.goals) ? match.goals : [],
      cards: Array.isArray(match.cards) ? match.cards : [],
      needsReview: false,
      reviewNote: null,
      order: order({ ...match, id }),
    };
  };

  if (matches.length) {
    await db.collection("tournament_matches").bulkWrite(
      matches.map((match) => ({
        replaceOne: { filter: { _id: match.id }, replacement: migrate(match), upsert: true },
      })),
      { ordered: false },
    );
  }

  const counts = {
    config: await db.collection("tournament_config").countDocuments(),
    venues: await db.collection("tournament_venues").countDocuments(),
    teams: await db.collection("tournament_teams").countDocuments(),
    matches: await db.collection("tournament_matches").countDocuments(),
  };

  console.log(`Seeded ${DB_NAME}: ${counts.config} config, ${counts.venues} venues, ${counts.teams} teams, ${counts.matches} matches.`);
  await client.close();
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  console.error("Is MongoDB running? Set MONGODB_URI in .env.local if it is on another host.");
  process.exit(1);
});
