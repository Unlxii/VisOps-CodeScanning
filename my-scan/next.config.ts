import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  experimental: {
    serverActions: {
      allowedOrigins: ["10.10.184.118:3000", "localhost:3000"],
    },
  },
  allowedDevOrigins: [
      "localhost:3000", 
      "10.10.184.118:3000", 
      "10.10.184.118"
    ],
};

export default nextConfig;
