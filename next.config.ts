/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // This helps with some Amplify-specific SSR issues
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig; // Using module.exports for maximum compatibility
