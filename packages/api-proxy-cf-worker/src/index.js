export default {
	async fetch(request, ENV) {
		const rewrittenHostname = ENV.REWRITTEN_HOSTNAME;
		const whitelistedPaths = JSON.parse(ENV.WHITELISTED_PATHS);
		const allowedOrigins = JSON.parse(ENV.ALLOWED_REQUEST_HOSTNAMES);
		const origin = request.headers.get('origin');

		// CORS headers for all responses - Access-Control-Allow-Origin can only be a single origin or *
		const corsHeaders = {
			'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
		};

		// Handle preflight OPTIONS request
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: corsHeaders,
			});
		}

		if (origin && !allowedOrigins.includes(origin)) {
			return new Response('Forbidden: ' + origin + ' is not allowed.', {
				status: 403,
				headers: corsHeaders,
			});
		}

		const url = new URL(request.url);

		// Check if incoming path is whitelisted
		if (!whitelistedPaths.includes(url.pathname)) {
			return new Response('Forbidden: ' + url.pathname + ' is not allowed.', {
				status: 403,
				headers: corsHeaders,
			});
		}

		// Rewrite URL to target the actual API
		url.hostname = rewrittenHostname;
		url.protocol = 'https:';
		url.port = '';

		const token = ENV.SOUNDSTRIPE_TOKEN || '';

		// Create new request with proper headers (don't include CORS headers here)
		const modifiedRequest = new Request(url.toString(), {
			method: request.method,
			headers: {
				Accept: 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				Authorization: `Bearer ${token}`,
			},
			body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
		});

		const response = await fetch(modifiedRequest);

		console.log('Response from Soundstripe API:', response);

		// Create new response with CORS headers
		const modifiedResponse = new Response(response.body, {
			status: response.status,
			headers: {
				...corsHeaders,
			},
		});

		return modifiedResponse;
	},
};
