/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@repo/trpc",
    "@repo/database",
    "@repo/error",
    "@repo/services",
  ],
  env: {},
};

export default nextConfig;