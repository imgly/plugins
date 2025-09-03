export default {
	async fetch(request, ENV) {
		/**
		 * An object with different URLs to fetch
		 * @param {Object} ORIGINS
		 */
		const rewrittenHostname = ENV.REWRITTEN_HOSTNAME;
		const whitelistedPaths = JSON.parse(ENV.WHITELISTED_PATHS);
		const allowedRequestHostNames = JSON.parse(ENV.ALLOWED_REQUEST_HOSTNAMES);

		const requestHostName = request.headers.get('host');

		if (!allowedRequestHostNames.includes(requestHostName)) {
			return new Response('Forbidden: ' + requestHostName + ' is not allowed.', { status: 403 });
		}

		const url = new URL(request.url);

		// Check if incoming path is whitelisted
		if (!whitelistedPaths.includes(url.pathname)) {
			return new Response('Forbidden: ' + url.pathname + ' is not allowed.', { status: 403 });
		}

		// Check if incoming hostname is a key in the ORIGINS object
		url.hostname = rewrittenHostname;
		url.protocol = 'https:';
		url.port = '';
		// add bearer token:
		const token = ENV.SOUNDSTRIPE_TOKEN || '';
		// If it is, proxy request to that third party origin
		const response = await fetch(url.toString(), {
			...request,
			headers: {
				...request.headers,
				Authorization: `Bearer ${token}`,
			},
		});
		return response;
	},
};
