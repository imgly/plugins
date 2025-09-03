import {
  createFalClient as createClient,
  type FalClient as FalClientType
} from '@fal-ai/client';

export type FalClient = FalClientType;

export function createFalClient(
  proxyUrl: string,
  headers?: Record<string, string>
): FalClient {
  const client = createClient({
    proxyUrl,
    requestMiddleware: async (request) => {
      return {
        ...request,
        headers: {
          ...request.headers,
          ...(headers ?? {})
        }
      };
    }
  });

  return client;
}
