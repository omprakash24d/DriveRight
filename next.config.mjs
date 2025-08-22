// next.config.mjs
import { config } from "dotenv";

config({ path: "./.env" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your configuration here
  experimental: {
    esmExternals: 'loose',
  },
  
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('plyr-react');
    }
    return config;
  },
};

export default nextConfig;
