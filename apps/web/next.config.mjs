/** @type {import('next').NextConfig} */
const nextConfig = {
  // The engine is a TS-source workspace package — let Next transpile it.
  transpilePackages: ["@onward/engine"],
  reactStrictMode: true,
  // pdf-parse pulls in pdfjs-dist (workers/native bits); let Node require it at
  // runtime instead of webpack bundling it, which breaks in server routes.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
