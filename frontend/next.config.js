/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['img.youtube.com'], // Add the domain here
  },
  reactStrictMode: false, // Add this line to disable Strict Mode
};

module.exports = nextConfig;