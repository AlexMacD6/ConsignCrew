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
	// Redirect favicon.ico requests to the actual favicon
	async redirects() {
		return [
			{
				source: '/favicon.ico',
				destination: '/TreasureHub - Favicon Black.png',
				permanent: false,
			},
		];
	},
	// Security headers for photo protection
	async headers() {
		return [
			{
				// Apply security headers to all routes
				source: '/(.*)',
				headers: [
					{
						key: 'X-DNS-Prefetch-Control',
						value: 'on'
					},
					{
						key: 'Strict-Transport-Security',
						value: 'max-age=63072000; includeSubDomains; preload'
					},
					{
						key: 'X-Frame-Options',
						value: 'SAMEORIGIN'
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff'
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block'
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin'
					},
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=()'
					},
				],
			},
			{
				// Additional security headers for API routes
				source: '/api/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'no-store, must-revalidate'
					},
				],
			},
		];
	},
	// CORS headers are handled dynamically in middleware.ts
	experimental: {
		serverActions: {
			allowedOrigins: [
				'localhost:3000',
				'localhost:8081',
				'192.168.4.119:3000',
				'192.168.4.119:8081',
			],
			bodySizeLimit: '100mb',
		},
	},
	images: {
		remotePatterns: [
			new URL('https://d3hcmh2afavni1.cloudfront.net/**'),
			new URL('https://d137kvqp5ded0n.cloudfront.net/**'),
			new URL('https://d1lbhlimt20t50.cloudfront.net/**'),
			new URL('https://dtlqyjbwka60p.cloudfront.net/**'),
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
			'@': path.resolve(__dirname, 'app'),
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
		
		// Use Next.js default devtool for better performance
		if (dev && !isServer) {
			config.devtool = false
		}
		
		return config
	},
}

export default nextConfig
