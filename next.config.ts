import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page is pre-rendered, so the preview ships as plain static files (`out/`):
  // no Node process on the server, just nginx serving a folder.
  output: "export",
  // The floating dev badge overlaps the sidebar footer in demos.
  devIndicators: false,
  // Do not write AGENTS.md into the repo on `next dev`.
  agentRules: false,
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
