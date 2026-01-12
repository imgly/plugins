// These constants here are added by the base esbuild config

declare const PLUGIN_VERSION: string;

declare namespace NodeJS {
  interface ProcessEnv {
    CESDK_LICENSE: string;
    EACHLABS_PROXY_URL: string;
    ANTHROPIC_PROXY_URL: string;
  }
}
