# Using Proxy Services

For security reasons, you should never include your AI service API keys directly in client-side code. Instead, you should set up proxy services that securely forward requests to AI providers while keeping your API keys secure on the server side.

Each AI provider configuration requires a `proxyUrl` parameter, which should point to your server-side endpoint that handles authentication and forwards requests to the AI service:

```typescript
text2image: FalAiImage.RecraftV3({
    proxyUrl: 'http://your-proxy-server.com/api/proxy'
});

// Or use Recraft20b with icon style support:
// text2image: FalAiImage.Recraft20b({
//     proxyUrl: 'http://your-proxy-server.com/api/proxy'
// });
```

## Proxy Implementation Requirements

Your proxy should implement specific requirements for each AI service:

### 1. Anthropic Proxy

- **Target URL**: `https://api.anthropic.com/`
- **Authentication Header**: Add `X-Api-Key` header with your Anthropic API key
- **Request Handling**: Forward request body as-is to Anthropic API
- **Response Handling**: Remove `content-encoding` headers to handle compressed responses correctly

### 2. fal.ai Proxy

- **Dynamic URL**: Use a special header called `x-fal-target-url` to determine the actual endpoint
- **Authentication Header**: Add `Authorization: Key YOUR_FAL_KEY` header
- **Request Forwarding**: Preserve the complete request body and query parameters
- For more information on the requirements, refer to fal.ai's [documentation](https://docs.fal.ai/model-endpoints/server-side/#the-proxy-formula).

### 3. ElevenLabs Proxy

- **Target URL**: `https://api.elevenlabs.io/`
- **Authentication Header**: Add `xi-api-key` header with your ElevenLabs API key
- **Headers**: Add an `Accept: audio/mpeg` header for audio requests.
- **Response Handling**: Remove `content-encoding` headers to handle compressed responses correctly

### 4. OpenAI Proxy

- **Target URL**: `https://api.openai.com/v1/`
- **Authentication Header**: Add `Authorization: Bearer YOUR_OPENAI_API_KEY` header
- **Response Handling**: Remove `content-encoding` headers to handle compressed responses correctly
- **Rate Limiting**: Implement rate limiting based on your OpenAI plan tier (recommended)
- For more information on the requirements, refer to OpenAI's [documentation](https://platform.openai.com/docs/api-reference/debugging-requests)

## Important Information for All Proxies

**Response Streaming**

To handle large responses efficiently, response streaming should be enabled for all proxies. Common approaches include:

-   **Axios**: `responseType: 'stream'`
-   **Fetch API**: Access `response.body` as a `ReadableStream`
-   **Node.js native HTTP clients**: Use stream-based responses
-   **Other HTTP clients**: Check documentation for streaming support


## General Proxy Design

A well-designed proxy service should:

1. **Route requests** to the appropriate AI service based on the endpoint path
2. **Add authentication** headers containing your API keys
3. **Forward the request body** to maintain payload integrity
4. **Handle response streaming** for services that support it (like Anthropic)
5. **Implement proper CORS headers** to allow browser requests
6. **Add appropriate error handling** and logging
7. **Consider rate limiting** to protect your API keys from overuse

## Security Considerations

When implementing your proxy:

- Store API keys securely as environment variables
- Implement request validation to prevent abuse
- Consider adding user authentication to your proxy endpoints
- Monitor usage to detect unusual patterns
- Implement proper error handling without leaking sensitive information

This approach ensures your API keys remain secure while still allowing your application to utilize AI services. For a complete example of a proxy implementation, you can find various proxy templates online that can be adapted for your specific needs.