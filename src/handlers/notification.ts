import { TerminalNotifierAdapter, createNtfyAdapter } from '@/adapters';
import { debug, info, warn } from '@/logger';
import type { Config, NotificationHookInput, NotificationTypeConfig, SystemState } from '@/types';
import { detectSystemState } from '@/utils';

/** 기본 알림 설정 */
const DEFAULT_NOTIFICATION_CONFIG: NotificationTypeConfig = {
  enabled: true,
  title: 'Claude Code',
  message_template: '{message}',
  channels: ['terminal-notifier', 'ntfy'],
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
  const shouldSkip = shouldSkipNotification(state, config);

  if (shouldSkip) {
    info('Skipping notification (terminal is active)');
    return;
  }

  // 알림 채널 결정
  const channels = determineChannels(state, notificationConfig);

  debug(`Selected channels: ${channels.join(', ')}`);

  // 알림 전송
  await sendNotifications(channels, notificationConfig, message, config);
}

/**
 * 터미널이 활성화되어 있고 skip_when_active 설정이 true면 알림 스킵
 */
function shouldSkipNotification(state: SystemState, config: Config): boolean {
  return state.is_terminal_active && (config.skip_when_active ?? true);
}

/**
 * 시스템 상태에 따라 알림 채널 결정
 */
function determineChannels(
  state: SystemState,
  notificationConfig: { channels: readonly string[] },
): string[] {
  // 화면 잠금 시 → ntfy만 (모바일 푸시)
  if (state.is_screen_locked) {
    return notificationConfig.channels.includes('ntfy') ? ['ntfy'] : [];
  }

  // 터미널에서 떨어져 있음 (화면 잠금 아니고 터미널 비활성) → terminal-notifier (로컬)
  const awayFromTerminal = !state.is_terminal_active && !state.is_screen_locked;

  if (awayFromTerminal) {
    return notificationConfig.channels.includes('terminal-notifier') ? ['terminal-notifier'] : [];
  }

  // 기본: 설정된 모든 채널 사용
  return [...notificationConfig.channels];
}

/**
 * 선택된 채널로 알림 전송
 */
async function sendNotifications(
  channels: string[],
  notificationConfig: { title: string; message_template: string },
  message: string,
  config: Config,
): Promise<void> {
  const finalMessage = notificationConfig.message_template.replace('{message}', message);

  const promises = channels.map(async (channel) => {
    try {
      if (channel === 'terminal-notifier') {
        await TerminalNotifierAdapter.send({
          title: notificationConfig.title,
          message: finalMessage,
        });

        info('Notification sent via terminal-notifier');
      } else if (channel === 'ntfy') {
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
