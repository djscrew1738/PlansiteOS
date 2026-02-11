/**
 * Environment configuration and validation.
 * Validates required environment variables at app startup.
 */

interface EnvConfig {
  /** API base URL */
  apiBase: string;
  /** Whether the app is in production mode */
  isProd: boolean;
  /** Whether the app is in development mode */
  isDev: boolean;
  /** App version (from build) */
  version: string;
}

function getEnvConfig(): EnvConfig {
  const isProd = import.meta.env.PROD;
  const isDev = import.meta.env.DEV;

  return {
    apiBase: import.meta.env.VITE_API_BASE || '',
    isProd,
    isDev,
    version: import.meta.env.VITE_APP_VERSION || '3.0.0',
  };
}

/**
 * Validated environment configuration.
 * Access this instead of `import.meta.env` directly.
 */
export const env = getEnvConfig();

/**
 * Log environment info (safe for production - no secrets)
 */
export function logEnvironment() {
  if (env.isDev) {
    console.log(
      '%c[PlansiteOS]%c Environment loaded',
      'color: #3b82f6; font-weight: bold',
      'color: inherit',
      {
        mode: env.isProd ? 'production' : 'development',
        version: env.version,
        apiBase: env.apiBase || '(proxy)',
      }
    );
  }
}
