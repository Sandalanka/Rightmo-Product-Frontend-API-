import type { NextConfig } from "next";

// Product images are served from the backend's /storage path.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8089/api/v1");
const isLocalApi = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(apiUrl.hostname);

const nextConfig: NextConfig = {
  images: {
    // Resize + convert product photos (full-size ~370 KB JPEGs) to small WebP/AVIF per screen size.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [new URL(`${apiUrl.origin}/storage/**`)],
    // Next refuses to optimise images from private IPs by default. When the API itself runs locally
    // (dev / same-machine setups), allow it; remotePatterns above still limits this to the API's /storage images.
    dangerouslyAllowLocalIP: isLocalApi,
  },
};

export default nextConfig;
