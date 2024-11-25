/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: config => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      zlib: require.resolve('browserify-zlib'),
    };
    return config;
  },
  env: {
    NEXT_PUBLIC_HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
    NEXT_PUBLIC_QUICKNODE_RPC_URL: process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL,
    NEXT_PUBLIC_ANKR_RPC_URL: process.env.NEXT_PUBLIC_ANKR_RPC_URL,
    NEXT_PUBLIC_SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  },
};

module.exports = nextConfig;
