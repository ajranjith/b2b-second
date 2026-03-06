/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/bff/v1/:path*",
        destination: "http://localhost:3001/api/bff/v1/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/2-dealer/:path*",
        destination: "/dealer/:path*",
        permanent: false,
      },
      {
        source: "/1-admin/:path*",
        destination: "/admin/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
