import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // TypeScript is enforced by the explicit `npm run typecheck` CI step. This
  // avoids a Node 26/Next CLI --showConfig parsing issue in the local runner.
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
      ]
    }];
  }
};

export default nextConfig;
