import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

const baseConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"]
};

export default function nextConfig(phase) {
  return {
    ...baseConfig,
    // Keep dev and production artifacts isolated so `next build`
    // cannot corrupt the live dev server's server chunk map.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next"
  };
}
