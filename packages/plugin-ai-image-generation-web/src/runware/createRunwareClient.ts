import {
  Runware,
  RunwareClient as SDKRunwareClient
} from '@runware/sdk-js';

type RunwareClientType = InstanceType<typeof SDKRunwareClient>;

let clientInstance: RunwareClientType | null = null;

export async function createRunwareClient(
  proxyUrl: string
): Promise<RunwareClientType> {
  // Reuse existing client if already initialized
  if (clientInstance != null) {
    return clientInstance;
  }

  // The proxy URL handles the WebSocket connection and API key injection
  clientInstance = await Runware.initialize({
    apiKey: 'cG2JlITgfZ1m1MTNvv6jdKlCYYwVlelz', // Proxy handles authentication
    // url: proxyUrl
  });

  return clientInstance;
}

export function getRunwareClient(): RunwareClientType | null {
  return clientInstance;
}
