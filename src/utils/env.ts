/**
 * Environment variable utilities with fallback support.
 * Handles HOME detection, environment variable reading, and type conversion.
 */

/**
 * Get HOME directory path with fallback.
 * Priority: process.env.HOME > Bun.env.HOME > /tmp
 */
export function getHome(): string {
  const home = process.env.HOME ?? Bun.env.HOME;

  if (home) {
    return home;
  }

  return '/tmp';
}

/**
 * Get environment variable with optional default value.
 * Uses nullish coalescing for safe fallback handling.
 *
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Environment variable value or default
 */
export function getEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] ?? Bun.env[key] ?? defaultValue;
}

/**
 * Get boolean environment variable.
 * Treats 'true', '1', 'yes' (case-insensitive) as true.
 *
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @returns Boolean value
 */
export function getBoolEnv(key: string, defaultValue = false): boolean {
  const value = getEnv(key);

  if (!value) {
    return defaultValue;
  }

  return ['true', '1', 'yes'].includes(value.toLowerCase());
}
