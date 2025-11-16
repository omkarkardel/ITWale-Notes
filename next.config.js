/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config, { dev }) => {
		// Avoid Windows rename errors in dev cache (ENOENT on .pack.gz rename)
		if (dev) config.cache = false
		return config
	},
	async headers() {
		const isDev = process.env.NODE_ENV !== 'production'
		// Allow calling the external backend domain in production
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
		let backendOrigin = ''
		try {
			if (backendUrl) {
				const u = new URL(backendUrl)
				backendOrigin = `${u.protocol}//${u.host}`
			}
		} catch {}
		const csp = [
			"default-src 'self'",
			"img-src 'self' data: blob:",
			// Next.js Fast Refresh in dev may need 'unsafe-eval'
			`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
			"style-src 'self' 'unsafe-inline'",
			// HMR websockets in dev + backend origin in prod
			`connect-src 'self'${isDev ? ' ws:' : ''} https://it-wale-notes-backend-ytak.vercel.app`,
			"frame-ancestors 'none'",
		].join('; ')
		return [
			{
				source: '/(.*)',
				headers: [
					{ key: 'X-Frame-Options', value: 'DENY' },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					{ key: 'Permissions-Policy', value: "geolocation=(), microphone=(), camera=()" },
					{ key: 'Content-Security-Policy', value: csp },
				],
			},
		]
	},
};

module.exports = nextConfig;
