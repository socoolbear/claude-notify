/**
 * Configuration file loader for claude-notify.
 * Loads config from ~/.config/claude-notify/config.json with fallback to defaults.
 */

import { debug } from '@/logger';
import type { Config } from '@/types';
import { getHome } from '@/utils';

/**
 * Get default configuration.
 * Used when config file doesn't exist or for missing fields.
 */
function getDefaultConfig(): Config {
  return {
    ntfy: {
      server: 'https://ntfy.sh',
      topic: 'claude-notify',
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
  };
}

/**
 * Load configuration from ~/.config/claude-notify/config.json.
 * Returns default config if file doesn't exist.
 *
 * @returns Configuration object
 */
export async function loadConfig(): Promise<Config> {
  const configPath = `${getHome()}/.config/claude-notify/config.json`;

  debug(`Loading config from: ${configPath}`);

  const file = Bun.file(configPath);
  const exists = await file.exists();

  if (!exists) {
    debug('Config file not found, using defaults');
    return getDefaultConfig();
  }

  try {
    const content = await file.json();
    debug('Config file loaded successfully');
    return mergeWithDefaults(content);
  } catch (err) {
    debug(`Failed to parse config file: ${err}`);
    return getDefaultConfig();
  }
}
