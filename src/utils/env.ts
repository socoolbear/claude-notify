/**
 * Environment variable utilities with fallback support.
 * Handles HOME detection, environment variable reading, and type conversion.
 */

/**
 * Get HOME directory path with fallback.
 * Priority: process.env.HOME > /tmp
 */
export function getHome(): string {
  const home = process.env.HOME;

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
  return process.env[key] ?? defaultValue;
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

/**
 * 알림 강제 발송 모드 여부.
 * CLAUDE_NOTIFY_FORCE=true 면 터미널 활성 스킵과 채널 축소를 모두 무시하고
 * 설정된 모든 채널로 발송한다 (설치 직후 동작 확인용).
 */
export function isForceMode(): boolean {
  return getBoolEnv('CLAUDE_NOTIFY_FORCE', false);
}
