import type { NextConfig } from "next";

const securityHeaders = [
  // Force HTTPS for two years once seen over HTTPS (Vercel serves HTTPS always).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Browsers must not guess content types (blocks e.g. HTML sniffed from an image).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The site has no legitimate reason to be iframed — blocks clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // We use none of these browser features; deny them outright.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
