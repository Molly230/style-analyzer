/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生产构建时忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
  images: {
    // 允许从任何域名加载图片
    domains: [],
    unoptimized: true
  },
  // 性能优化
  compress: true,
  poweredByHeader: false,
  
  // Webpack 优化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 优化打包大小
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.vendor = {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: 10,
      };
    }
    return config;
  },
}

module.exports = nextConfig