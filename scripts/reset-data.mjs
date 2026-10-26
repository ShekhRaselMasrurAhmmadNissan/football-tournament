/**
 * Rebuilds src/data/tournament-data.ts from the current teams array.
 * Usage: npm run reset-data
 * Keeps teams + venues + config, wipes all match results.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const FILE = path.join(process.cwd(), "src", "data", "tournament-data.ts");

function sliceLiteral(source, name) {
  const marker = `export const ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  const eq = source.indexOf("=", start);
  const bracket = source.indexOf("[", eq);
  const brace = source.indexOf("{", eq);
  const isObject = brace >= 0 && (bracket < 0 || brace < bracket);
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
    if (char === '"') inString = true;
    else if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return JSON.parse(source.slice(from, i + 1));
    }
  }
  return null;
}

const source = await readFile(FILE, "utf8").catch(() => "");
const teams = sliceLiteral(source, "TEAMS") ?? [];
const venues = sliceLiteral(source, "VENUES") ?? [];
const config = sliceLiteral(source, "TOURNAMENT_CONFIG") ?? {
  name: "Magura Golden Cup",
  edition: "2026",
  organiser: "Magura Golden Football Club",
  kickoff: "2026-11-07T16:00:00+06:00",
  finalDate: "2026-11-29T19:00:00+06:00",
  prizePool: 1200000,
  format: "16 teams · Single elimination",
};

if (teams.length !== 16) {
  console.error(`Expected 16 teams in the data file, found ${teams.length}. Aborting.`);
  process.exit(1);
}

const PAIRS = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [3, 14],
  [6, 11],
  [7, 10],
  [2, 15],
];

const matches = [];
PAIRS.forEach(([h, a], i) =>
  matches.push({
    id: `r16-${i + 1}`,
    stage: "r16",
    slot: i + 1,
    homeId: teams[h - 1].id,
    awayId: teams[a - 1].id,
    homeScore: null,
    awayScore: null,
    homePens: null,
    awayPens: null,
    status: "scheduled",
    kickoff: new Date(Date.UTC(2026, 10, 7 + Math.floor(i / 2), 10 + (i % 2) * 3)).toISOString(),
    venue: (venues[i % Math.max(venues.length, 1)] ?? { name: "Main Ground" }).name,
    minute: 0,
    goals: [],
    cards: [],
    homeFrom: null,
    awayFrom: null,
  }),
);
[
  ["qf", 4, "r16"],
  ["sf", 2, "qf"],
  ["final", 1, "sf"],
].forEach(([stage, count, from]) => {
  for (let s = 1; s <= count; s += 1) {
    matches.push({
      id: `${stage}-${s}`,
      stage,
      slot: s,
      homeId: null,
      awayId: null,
      homeScore: null,
      awayScore: null,
      homePens: null,
      awayPens: null,
      status: "scheduled",
      kickoff: new Date(Date.UTC(2026, 10, 15 + s, 12)).toISOString(),
      venue: (venues[s % Math.max(venues.length, 1)] ?? { name: "Main Ground" }).name,
      minute: 0,
      goals: [],
      cards: [],
      homeFrom: `${from}-${s * 2 - 1}`,
      awayFrom: `${from}-${s * 2}`,
    });
  }
});

const HEADER = `/**
 * Tournament data — a plain array of match objects, edited by the /admin portal.
 * No database, no JSON file: this module *is* the store. Every save rewrites the
 * \`matches\` / \`teams\` / \`config\` / \`venues\` declarations below.
 */
import type { Match, Team, TournamentConfig, Venue } from "@/lib/types";
`;

const lit = (name, type, value) => `export const ${name}: ${type} = ${JSON.stringify(value, null, 2)};\n`;
const out = [
  HEADER,
  lit("TOURNAMENT_CONFIG", "TournamentConfig", config),
  lit("VENUES", "Venue[]", venues),
  lit("TEAMS", "Team[]", teams),
  lit("MATCHES", "Match[]", matches),
].join("\n");

await writeFile(FILE, out, "utf8");
console.log(`Rebuilt ${path.relative(process.cwd(), FILE)} — ${teams.length} teams, ${matches.length} matches, ${venues.length} venues.`);
