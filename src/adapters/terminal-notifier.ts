/**
 * macOS native notification adapter using terminal-notifier.
 * Sends notifications via the macOS Notification Center.
 */

import { debug, error } from '@/logger';
import type { Adapter, NotificationPayload } from '@/types';
import { $ } from 'bun';

export const TerminalNotifierAdapter: Adapter = {
  async send(payload: NotificationPayload): Promise<void> {
    const { title, message } = payload;

    debug(`TerminalNotifier: Sending notification - title="${title}", message="${message}"`);

    const result =
      await $`terminal-notifier -title ${title} -message ${message} -sound default`.nothrow();

    if (result.exitCode === 0) {
      debug('TerminalNotifier: Notification sent successfully');
      return;
    }

    error(`TerminalNotifier: Failed with exit code ${result.exitCode}`);
    throw new Error(`terminal-notifier failed with exit code ${result.exitCode}`);
  },
};
