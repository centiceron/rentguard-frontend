/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        // Put your Beanstalk URL right here! (Keep the http://)
        destination:
          "http://rentguard-api.us-east-1.elasticbeanstalk.com/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig; // Or export default nextConfig; depending on your setup
