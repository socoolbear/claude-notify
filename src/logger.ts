/**
 * Toggleable file logging system.
 * Controlled via CLAUDE_NOTIFY_LOG and CLAUDE_NOTIFY_LOG_LEVEL environment variables.
 */

import { getBoolEnv, getEnv, getHome } from '@/utils';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Check if logging is enabled via CLAUDE_NOTIFY_LOG environment variable.
 */
function isLoggingEnabled(): boolean {
  return getBoolEnv('CLAUDE_NOTIFY_LOG', false);
}

/**
 * Get configured log level from CLAUDE_NOTIFY_LOG_LEVEL environment variable.
 * Defaults to 'info'.
 */
function getConfiguredLogLevel(): LogLevel {
  const level = getEnv('CLAUDE_NOTIFY_LOG_LEVEL', 'info');
  return (LOG_LEVELS[level as LogLevel] !== undefined ? level : 'info') as LogLevel;
}

/**
 * Get log file path.
 * Returns ~/.config/claude-notify/notify.log
 */
function getLogFilePath(): string {
  const home = getHome();
  return `${home}/.config/claude-notify/notify.log`;
}

/**
 * Core logging function.
 * Writes log entry to file with timestamp and level prefix.
 *
 * @param level - Log level
 * @param message - Log message
 */
export function log(level: LogLevel, message: string): void {
  if (!isLoggingEnabled()) {
    return;
  }

  const configuredLevel = getConfiguredLogLevel();
  if (LOG_LEVELS[level] < LOG_LEVELS[configuredLevel]) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  const logFilePath = getLogFilePath();

  try {
    const file = Bun.file(logFilePath);
    const writer = file.writer();

    writer.write(logEntry);
    writer.flush();
    writer.end();
  } catch (err) {
    // Fail silently to avoid disrupting main program
    console.error(`Failed to write log: ${err}`);
  }
}

/**
 * Log debug message.
 */
export function debug(message: string): void {
  log('debug', message);
}

/**
 * Log info message.
 */
export function info(message: string): void {
  log('info', message);
}

/**
 * Log warning message.
 */
export function warn(message: string): void {
  log('warn', message);
}

/**
 * Log error message.
 */
export function error(message: string): void {
  log('error', message);
}
