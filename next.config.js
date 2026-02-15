/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  webpack: (config, { isServer }) => {
    // Fix for undici and other module issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Handle private class fields issue
    config.module.rules.push({
      test: /\.(js|mjs|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'next-swc-loader',
        options: {
          isServer,
        },
      },
    })

    return config
  },
  // Disable type checking during build (we'll catch errors in dev)
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable eslint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
