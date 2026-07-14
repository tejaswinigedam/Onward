/** @type {import('next').NextConfig} */
const nextConfig = {
  // The engine is a TS-source workspace package — let Next transpile it.
  transpilePackages: ["@onward/engine"],
  reactStrictMode: true,
};

export default nextConfig;
