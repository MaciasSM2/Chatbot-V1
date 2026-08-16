const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const cleanedApiUrl = (rawApiUrl && rawApiUrl !== '/api') ? rawApiUrl.replace(/\/api$/, '') : null;
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_SOCKET_URL || cleanedApiUrl || 'http://localhost:3014';

const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${BACKEND_URL}/health`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${BACKEND_URL}/socket.io/:path*`,
      },
    ];
  },
};

export default nextConfig;
