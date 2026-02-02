/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */

  experimental: {
    serverActions: {
      allowedOrigins: ["10.10.184.118:3000", "localhost:3000"],
    },
  },
};

export default nextConfig;
