import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

function buildCsp(phase) {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  const scriptDirectives = ["'self'", "'unsafe-inline'"];

  if (isDev) {
    scriptDirectives.push("'unsafe-eval'");
  }

  const connectDirectives = ["'self'"];

  if (isDev) {
    connectDirectives.push("ws:", "wss:");
  }

  return [
    "default-src 'self'",
    `script-src ${scriptDirectives.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://blueprint.bryanjohnson.com https://cdn.shopify.com",
    "font-src 'self' data:",
    `connect-src ${connectDirectives.join(" ")}`,
    "media-src 'self' blob: data:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join("; ");
}

const baseConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blueprint.bryanjohnson.com"
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com"
      }
    ]
  }
};

export default function nextConfig(phase) {
  const contentSecurityPolicy = buildCsp(phase);

  return {
    ...baseConfig,
    // Keep dev and production artifacts isolated so `next build`
    // cannot corrupt the live dev server's server chunk map.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            {
              key: "Content-Security-Policy",
              value: contentSecurityPolicy
            },
            {
              key: "Referrer-Policy",
              value: "strict-origin-when-cross-origin"
            },
            {
              key: "X-Frame-Options",
              value: "SAMEORIGIN"
            },
            {
              key: "X-Content-Type-Options",
              value: "nosniff"
            },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
            }
          ]
        },
        {
          source: "/api/:path*",
          headers: [
            {
              key: "Cache-Control",
              value: "no-store, private, max-age=0"
            }
          ]
        }
      ];
    }
  };
}
