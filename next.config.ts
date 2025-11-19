import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'pino',
    'thread-stream',
    'pino-elasticsearch',
    'sonic-boom'
  ],
};

export default nextConfig;
