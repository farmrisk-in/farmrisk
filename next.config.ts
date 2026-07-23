import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
