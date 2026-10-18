/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@repo/trpc",
    "@repo/database",
    "@repo/error",
    "@repo/services",
    "@bible-strong/avatar-react",
  ],
  // avatar-core → ajv is a CJS/ESM hybrid that crashes when Next.js bundles it
  // for the server. The avatar only ever runs client-side (ssr: false dynamic
  // import), so we exclude these from server bundling entirely.
  serverExternalPackages: ["ajv", "@bible-strong/avatar-core"],
  env: {},
};

export default nextConfig;
