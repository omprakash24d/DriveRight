/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
      {
        protocol: 'https',
        hostname: 'drivingschoolarwal.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'om.indhinditech.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
