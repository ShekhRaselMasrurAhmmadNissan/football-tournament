import type { NextConfig } from "next";

/**
 * The admin portal writes `src/data/tournament-data.ts` at runtime.
 * When the manager runs `next dev`, that write would normally trigger a refresh
 * and wipe the editor mid-save. `NEXT_DATA_HMR=false npm run dev` turns the
 * dev-server refresh off so saves always hold (production builds never watch files).
 */
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
