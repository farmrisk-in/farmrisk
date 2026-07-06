import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.29.101"], // temporary fix for CORS issue in development
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
