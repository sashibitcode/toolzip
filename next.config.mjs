/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', 'pdf-lib', 'xlsx', 'pptxgenjs', 'archiver'],
  },
};

export default nextConfig;
