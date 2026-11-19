/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: [
      'puppeteer-core',
      'pdf-lib',
      'xlsx',
      'pptxgenjs',
      'archiver',
      'pdf-parse',
      '@pdfsmaller/pdf-encrypt',
      '@localonlytools/pdf-decrypt',
      'mammoth',
      'jszip',
      '@thednp/dommatrix',
    ],
  },
};

export default nextConfig;
