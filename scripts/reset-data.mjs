/**
 * Rebuilds the STARTING DATA module (src/data/tournament-data.ts).
 * Usage: npm run reset-data
 * Keeps teams, clears all 15 ties back to "to be announced" on the fixed venue.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FILE = path.join(process.cwd(), "src", "data", "tournament-data.ts");
const FIXED_VENUE = "Magura Govt. Primary School Play Ground";

function sliceLiteral(source, name) {
  const marker = `export const ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const lineEnd = source.indexOf("\n", start + marker.length);
  let eq = -1;
  for (let at = source.indexOf("=", start + marker.length); at !== -1 && (lineEnd === -1 || at < lineEnd); ) {
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
    const ch = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth += 1;
    else if (ch === close) {
      depth -= 1;
      if (depth === 0) {
        const literal = source.slice(from, i + 1);
        try {
          return JSON.parse(literal);
        } catch {
          return JSON.parse(
            literal.replace(/,(\s*[}\]])/g, "$1").replace(/([{,])(\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1$2"$3"$4'),
          );
        }
      }
    }
  }
  return null;
}

const source = await readFile(FILE, "utf8").catch(() => "");
const teams = sliceLiteral(source, "TEAMS") ?? [];
const config =
  sliceLiteral(source, "TOURNAMENT_CONFIG") ?? {
    name: "Magura Golden Cup",
    edition: "2026",
    organiser: "Magura Golden Football Club",
    kickoff: "2026-11-07T16:00:00+06:00",
    finalDate: "2026-11-29T19:00:00+06:00",
    prizePool: 90000,
    format: "16 teams · Single elimination",
  };

if (teams.length !== 16) {
  console.error(`Expected 16 teams in the starting data, found ${teams.length}. Aborting.`);
  process.exit(1);
}

const awards = [
  { id: "award-pom", title: "Player of the Match", recipient: null, note: "" },
  { id: "award-pot", title: "Player of the Tournament", recipient: null, note: "" },
  { id: "award-gk", title: "Best Goalkeeper", recipient: null, note: "" },
];

const fullConfig = {
  ...config,
  venue: FIXED_VENUE,
  championPrize: 50000,
  runnerUpPrize: 40000,
  prizePool: 90000,
  awards,
};

const venues = [{ id: "v1", name: FIXED_VENUE, city: "Magura", capacity: 0, surface: "" }];

const matches = [];
["r16-8-slots-here"].forEach(() => {});
const PLAN = [
  ["r16", 8],
  ["qf", 4],
  ["sf", 2],
  ["final", 1],
];
PLAN.forEach(([stage, count]) => {
  for (let slot = 1; slot <= count; slot += 1) {
    matches.push({
      id: `${stage}-${slot}`,
      stage,
      slot,
      teamAId: null,
      teamBId: null,
      teamAScore: null,
      teamBScore: null,
      teamAPens: null,
      teamBPens: null,
      winnerId: null,
      status: "scheduled",
      kickoff: null,
      venue: FIXED_VENUE,
      minute: 0,
      goals: [],
      cards: [],
      needsReview: false,
      reviewNote: null,
    });
  }
});

const HEADER = `/**
 * STARTING DATA — only used once, to fill an empty MongoDB database.
 *
 * The live site and the /admin portal read and write MongoDB
 * (see src/lib/server/tournament-store.ts). This file is the initial fixture:
 * it was seeded into the database, and can be re-loaded any time with
 * \`npm run seed\` or \`npm run seed -- --wipe\`.
 */
import type { Match, Team, TournamentConfig, Venue } from "@/lib/types";
`;

const lit = (name, type, value) => `export const ${name}: ${type} = ${JSON.stringify(value, null, 2)};\n`;
const out = [
  HEADER,
  lit("TOURNAMENT_CONFIG", "TournamentConfig", fullConfig),
  lit("VENUES", "Venue[]", venues),
  lit("TEAMS", "Team[]", teams),
  lit("MATCHES", "Match[]", matches),
].join("\n");

await writeFile(FILE, out, "utf8");
console.log(
  `Rebuilt ${path.relative(process.cwd(), FILE)} — ${teams.length} teams, ${matches.length} blank ties on "${FIXED_VENUE}". Run "npm run seed -- --wipe" to push it into MongoDB.`,
);
