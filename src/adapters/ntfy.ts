/**
 * ntfy.sh HTTP API adapter for remote push notifications.
 * Supports server, topic, and authentication token configuration.
 */

import { debug, error } from '@/logger';
import type { Adapter, NotificationPayload, NtfyConfig } from '@/types';
import { getEnv } from '@/utils';

/**
 * Create ntfy adapter with configuration.
 *
 * Environment variables override config:
 * - NTFY_SERVER: ntfy server URL
 * - NTFY_TOPIC: ntfy topic name
 * - NTFY_TOKEN: authentication token
 */
export function createNtfyAdapter(config: NtfyConfig): Adapter {
  return {
    async send(payload: NotificationPayload): Promise<void> {
      const server = getEnv('NTFY_SERVER') ?? config.server ?? 'https://ntfy.sh';
      const topic = getEnv('NTFY_TOPIC') ?? config.topic;
      const token = getEnv('NTFY_TOKEN') ?? config.token;

      if (!topic) {
        error('Ntfy: Topic not configured');
        throw new Error('ntfy topic is required');
      }

      const url = `${server}/${topic}`;
      const { title, message, priority = 3 } = payload;

      debug(`Ntfy: Sending notification to ${url} - title="${title}", priority=${priority}`);

      const headers: HeadersInit = {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Title': title,
        'X-Priority': priority.toString(),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        debug('Ntfy: Using authentication token');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: message,
      });

      if (!response.ok) {
        error(`Ntfy: HTTP ${response.status} - ${response.statusText}`);
        throw new Error(`ntfy API request failed: ${response.status} ${response.statusText}`);
      }

      debug('Ntfy: Notification sent successfully');
    },
  };
}
