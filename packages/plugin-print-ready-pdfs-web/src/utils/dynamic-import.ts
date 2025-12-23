/**
 * Dynamic import utilities that work around Webpack 5's static analysis.
 *
 * Webpack 5 transforms `import()` calls at build time, which breaks dynamic
 * module loading when the path is determined at runtime. These utilities use
 * `new Function()` to create imports that Webpack cannot statically analyze.
 *
 * IMPORTANT: The `new Function()` approach may fail in strict CSP environments
 * that block `unsafe-eval`. However:
 * - In Node.js: CSP doesn't apply, so this is safe
 * - In browsers: Use the `assetPath` option instead of relying on import.meta.url
 */

/**
 * Creates a dynamic import function that bypasses Webpack's static analysis.
 *
 * In test environments (vitest), returns the standard import() to allow mocking.
 * In production, uses new Function() to prevent Webpack from transforming the import.
 */
export function createDynamicImport(): (specifier: string) => Promise<any> {
  const isTestEnv =
    typeof process !== 'undefined' &&
    (process.env.VITEST === 'true' || process.env.NODE_ENV === 'test');

  if (isTestEnv) {
    // In test environments, use direct import to allow mocking
    return (s: string) => import(s);
  }

  // In production, use indirect import to prevent Webpack static analysis
  // Note: This may fail in CSP-restricted browser environments that block eval
  // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
  return new Function('s', 'return import(s)') as (s: string) => Promise<any>;
}
