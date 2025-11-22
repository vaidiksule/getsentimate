/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // allow YouTube thumbnail hosts used by your backend
    domains: ['i.ytimg.com', 'img.youtube.com', 'yt3.ggpht.com'],
    // OR (alternative) use remotePatterns for finer control:
    // remotePatterns: [
    //   { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
    //   { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
    // ],
  },
  reactStrictMode: false,
};

module.exports = nextConfig;
