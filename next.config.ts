import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.29.196"],
  turbopack: {
    root: "./",
  },
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
