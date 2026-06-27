/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export → served by Cloudflare Workers Static Assets.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
