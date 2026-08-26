/**
 * macOS native notification adapter using terminal-notifier.
 * Sends notifications via the macOS Notification Center.
 */

import { debug, error } from '@/logger';
import type { Adapter, NotificationPayload } from '@/types';
import { runCommand, sanitizeForShell } from '@/utils';

export const TerminalNotifierAdapter: Adapter = {
  async send(payload: NotificationPayload): Promise<boolean> {
    const { title, message, activateBundleId } = payload;

    debug(`TerminalNotifier: Sending notification - title="${title}", message="${message}"`);

    if (activateBundleId) {
      debug(`TerminalNotifier: Will activate bundle ID: ${activateBundleId}`);
    }

    const args = [
      '-title',
      sanitizeForShell(title),
      '-message',
      sanitizeForShell(message),
      '-sound',
      'default',
    ];

    if (activateBundleId) {
      args.push('-activate', sanitizeForShell(activateBundleId));
    }

    const result = await runCommand('terminal-notifier', args);

    if (result.exitCode === 0) {
      debug('TerminalNotifier: Notification sent successfully');

      return true;
    }

    if (result.exitCode === -1) {
      error(
        'TerminalNotifier: terminal-notifier 를 실행할 수 없습니다 (brew install terminal-notifier)',
      );
      throw new Error('terminal-notifier not found');
    }

    error(`TerminalNotifier: Failed with exit code ${result.exitCode} ${result.stderr.trim()}`);
    throw new Error(`terminal-notifier failed with exit code ${result.exitCode}`);
  },
};
