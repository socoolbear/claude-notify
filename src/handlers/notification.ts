import { TerminalNotifierAdapter, createNtfyAdapter } from '@/adapters';
import { debug, info, warn } from '@/logger';
import {
  CHANNEL_TYPES,
  type Config,
  type NotificationHookInput,
  type NotificationTypeConfig,
} from '@/types';
import {
  detectSystemState,
  detectTerminalBundleId,
  selectChannels,
  shouldSkipNotification,
} from '@/utils';

/** 기본 알림 설정 */
const DEFAULT_NOTIFICATION_CONFIG: NotificationTypeConfig = {
  enabled: true,
  title: 'Claude Code',
  message_template: '{message}',
  channels: [CHANNEL_TYPES.TERMINAL_NOTIFIER, CHANNEL_TYPES.NTFY],
};

/**
 * Notification 이벤트 처리 및 스마트 알림 결정
 */
export async function handleNotification(
  input: NotificationHookInput,
  config: Config,
): Promise<void> {
  const { notification_type, message } = input;

  debug(`Notification received: ${notification_type}`);
  debug(`Message: ${message}`);

  // 시스템 상태 감지
  const state = await detectSystemState();

  debug(`System state: ${JSON.stringify(state)}`);

  // 알림 타입별 설정 가져오기 (없으면 기본값 사용)
  const notificationConfig =
    config.notifications?.[notification_type] ?? DEFAULT_NOTIFICATION_CONFIG;

  if (!notificationConfig.enabled) {
    info(`Notification type ${notification_type} is disabled`);
    return;
  }

  // 스마트 알림 결정 로직
  const shouldSkip = shouldSkipNotification(state, config.skip_when_active ?? true);

  if (shouldSkip) {
    info('Skipping notification (terminal is active)');
    return;
  }

  // 알림 채널 결정
  const channels = selectChannels(state, notificationConfig.channels);

  debug(`Selected channels: ${channels.join(', ')}`);

  if (channels.length === 0) {
    info('No channels available for notification');
    return;
  }

  // 터미널 Bundle ID 감지 (terminal-notifier 알림 클릭 시 활성화)
  const bundleId = detectTerminalBundleId();

  if (bundleId) {
    debug(`Detected terminal Bundle ID: ${bundleId}`);
  }

  // 알림 전송
  await sendNotifications(channels, notificationConfig, message, config, bundleId);
}

/**
 * 선택된 채널로 알림 전송
 */
async function sendNotifications(
  channels: string[],
  notificationConfig: { title: string; message_template: string },
  message: string,
  config: Config,
  activateBundleId?: string,
): Promise<void> {
  const finalMessage = notificationConfig.message_template.replace('{message}', message);

  const promises = channels.map(async (channel) => {
    try {
      if (channel === CHANNEL_TYPES.TERMINAL_NOTIFIER) {
        await TerminalNotifierAdapter.send({
          title: notificationConfig.title,
          message: finalMessage,
          activateBundleId,
        });

        info('Notification sent via terminal-notifier');
      } else if (channel === CHANNEL_TYPES.NTFY) {
        const adapter = createNtfyAdapter(config.ntfy);

        await adapter.send({
          title: notificationConfig.title,
          message: finalMessage,
        });

        info('Notification sent via ntfy');
      }
    } catch (error) {
      warn(`Failed to send notification via ${channel}: ${error}`);
    }
  });

  await Promise.all(promises);
}
