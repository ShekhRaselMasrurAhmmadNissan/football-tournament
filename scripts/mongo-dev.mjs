/**
 * Starts a local MongoDB for development/testing and keeps it running.
 *
 *   npm run db:start
 *
 * - If MONGODB_URI points somewhere else (Atlas, Docker, a server), this is a no-op
 *   and just says so.
 * - Otherwise it boots an in-memory MongoDB on the port from MONGODB_URI
 *   (default 127.0.0.1:27017), so you get a working database with zero installs.
 *
 * Stop it with Ctrl+C. Data lives only while this process runs — use
 * `npm run seed` (or the auto-seed on first request) to fill it.
 */
import { MongoMemoryServer } from "mongodb-memory-server";

const uri = process.env.MONGODB_URI?.trim() || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB?.trim() || "magura_golden_cup";

let host = "127.0.0.1";
let port = 27017;
try {
  const parsed = new URL(uri);
  host = parsed.hostname || host;
  port = Number(parsed.port || 27017);
} catch {
  /* keep defaults */
}

const isLocal =
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)$/.test(host) && !uri.includes("replicaSet=");

if (!isLocal) {
  console.log(`MONGODB_URI points at ${host} — not starting a local database.`);
  process.exit(0);
}

const server = await MongoMemoryServer.create({
  instance: { port, dbName, ip: host === "localhost" ? "127.0.0.1" : host },
});

console.log(`MongoDB ready at ${server.getUri()} (database "${dbName}")`);
console.log("Leave this running and start the app with `npm run dev` in another terminal.");

const shutdown = async () => {
  await server.stop().catch(() => undefined);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
