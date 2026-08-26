/**
 * Configuration file loader for claude-notify.
 * Loads config from ~/.config/claude-notify/config.json with fallback to defaults.
 */

import { readFile } from 'node:fs/promises';
import { debug } from '@/logger';
import type { Config } from '@/types';
import { getHome } from '@/utils';

/**
 * Get default configuration.
 * Used when config file doesn't exist or for missing fields.
 *
 * ntfy.topic 의 기본값은 빈 문자열이다. 잘 알려진 토픽명을 기본값으로 두면
 * 설정 없이 설치한 사용자의 알림 내용이 공개 토픽으로 흘러나가기 때문에,
 * 토픽이 정해지기 전까지 ntfy 발송은 건너뛴다.
 */
function getDefaultConfig(): Config {
  return {
    ntfy: {
      server: 'https://ntfy.sh',
      topic: '',
    },
    terminal_notifier: {
      enabled: true,
    },
    log: {
      enabled: false,
      level: 'info',
    },
    skip_when_active: true,
  };
}

/**
 * Merge partial config with default config.
 * Performs deep merge for nested objects.
 *
 * @param partial - Partial configuration from file
 * @returns Complete configuration with defaults filled in
 */
function mergeWithDefaults(partial: Partial<Config>): Config {
  const defaults = getDefaultConfig();

  return {
    ntfy: {
      ...defaults.ntfy,
      ...partial.ntfy,
    },
    terminal_notifier: {
      ...defaults.terminal_notifier,
      ...partial.terminal_notifier,
    },
    log: {
      ...defaults.log,
      ...partial.log,
    },
    skip_when_active: partial.skip_when_active ?? defaults.skip_when_active,
    notifications: partial.notifications ?? defaults.notifications,
  };
}

/**
 * Load configuration from ~/.config/claude-notify/config.json.
 * Returns default config if file doesn't exist or cannot be parsed.
 *
 * @returns Configuration object
 */
export async function loadConfig(): Promise<Config> {
  const configPath = `${getHome()}/.config/claude-notify/config.json`;

  debug(`Loading config from: ${configPath}`);

  let content: string;

  try {
    content = await readFile(configPath, 'utf-8');
  } catch {
    debug('Config file not found, using defaults');
    return getDefaultConfig();
  }

  try {
    const parsed = JSON.parse(content) as Partial<Config>;

    debug('Config file loaded successfully');

    return mergeWithDefaults(parsed);
  } catch (err) {
    debug(`Failed to parse config file: ${err}`);
    return getDefaultConfig();
  }
}
