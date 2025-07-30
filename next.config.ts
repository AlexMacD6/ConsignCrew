import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
	// !! WARN !!
	typescript: {
		// Skip type checking at build time
		ignoreBuildErrors: true,
	},
	// !! WARN !!
	eslint: {
		// Allow production builds to succeed even with ESLint errors
		ignoreDuringBuilds: true,
	},
	// Disable CSS source maps in development to prevent 404 errors
	productionBrowserSourceMaps: false,
	// SEO optimizations
	compress: true,
	poweredByHeader: false,
	generateEtags: true,
	experimental: {
		serverActions: {
			allowedOrigins: ['localhost:3000'],
			bodySizeLimit: '100mb',
		},
	},
	images: {
		domains: ['d1lbhlimt20t50.cloudfront.net'],
		remotePatterns: [
			new URL('https://d3hcmh2afavni1.cloudfront.net/**'),
			new URL('https://d137kvqp5ded0n.cloudfront.net/**'),
			new URL('https://d1lbhlimt20t50.cloudfront.net/**'),
			new URL('https://rigconcierge-dev.s3.amazonaws.com/**'),
			new URL('https://rigreview.s3.us-east-1.amazonaws.com/**'),
			new URL('https://*.googleusercontent.com/**'),
			new URL('https://placehold.co/**'),
			new URL('https://loremflickr.com/**'),
			new URL('https://picsum.photos/**'),
			new URL('https://images.unsplash.com/**'),
			new URL('https://images.pexels.com/**'),
			new URL('https://avatars.githubusercontent.com/**'),
			new URL('https://i.pravatar.cc/**'),
		],
	},
	webpack: (config, { dev, isServer }) => {
		config.resolve.alias = {
			...config.resolve.alias,
			'@': path.resolve(__dirname, 'src'),
		}
		
		// Add fallbacks for Node.js modules that might be imported in client-side code
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				net: false,
				tls: false,
				crypto: false,
				stream: false,
				url: false,
				zlib: false,
				http: false,
				https: false,
				assert: false,
				os: false,
				path: false,
				'supports-color': false,
				debug: false,
				util: false,
				buffer: false,
				process: false,
			}
		}
		
		// Disable CSS source maps in development to prevent 404 errors
		if (dev && !isServer) {
			config.devtool = 'eval-source-map'
		}
		
		return config
	},
}

export default nextConfig
