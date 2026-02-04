import { TerminalNotifierAdapter, createNtfyAdapter } from '@/adapters';
import { debug, info, warn } from '@/logger';
import {
  CHANNEL_TYPES,
  type Config,
  type NotificationTypeConfig,
  type StopHookInput,
} from '@/types';
import {
  detectSystemState,
  detectTerminalBundleId,
  selectChannels,
  shouldSkipNotification,
} from '@/utils';

/** 기본 Stop 알림 설정 */
const DEFAULT_STOP_CONFIG: NotificationTypeConfig = {
  enabled: true,
  title: 'Claude Code Session',
  message_template: 'Session completed',
  channels: [CHANNEL_TYPES.TERMINAL_NOTIFIER, CHANNEL_TYPES.NTFY],
};

/**
 * Stop 이벤트 처리
 * 시스템 상태에 따라 알림 전송 결정
 */
export async function handleStop(input: StopHookInput, config: Config): Promise<void> {
  const { session_id } = input;

  debug(`Session stopped: ${session_id}`);

  // 시스템 상태 감지
  const state = await detectSystemState();

  debug(`System state: ${JSON.stringify(state)}`);

  // Stop 이벤트 설정 확인 (없으면 기본값 사용)
  const stopConfig = config.notifications?.stop ?? DEFAULT_STOP_CONFIG;

  if (!stopConfig.enabled) {
    info('Stop notification is disabled');
    return;
  }

  // 터미널이 활성화되어 있고 skip_when_active 설정이 true면 알림 스킵
  if (shouldSkipNotification(state, config.skip_when_active ?? true)) {
    info('Skipping stop notification (terminal is active)');
    return;
  }

  // 알림 채널 결정
  const channels = selectChannels(state, stopConfig.channels);

  debug(`Selected channels: ${channels.join(', ')}`);

  if (channels.length === 0) {
    info('No channels available for stop notification');
    return;
  }

  // 알림 전송
  await sendStopNotifications(channels, stopConfig, config);
}

/**
 * 선택된 채널로 알림 전송
 */
async function sendStopNotifications(
  channels: string[],
  stopConfig: NotificationTypeConfig,
  config: Config,
): Promise<void> {
  const finalMessage = stopConfig.message_template;

  // terminal-notifier 알림 클릭 시 활성화할 Bundle ID
  const bundleId = detectTerminalBundleId();

  if (bundleId) {
    debug(`Detected terminal Bundle ID: ${bundleId}`);
  }

  for (const channel of channels) {
    try {
      if (channel === CHANNEL_TYPES.TERMINAL_NOTIFIER) {
        await TerminalNotifierAdapter.send({
          title: stopConfig.title,
          message: finalMessage,
          activateBundleId: bundleId,
        });

        info('Stop notification sent via terminal-notifier');
      } else if (channel === CHANNEL_TYPES.NTFY) {
        const adapter = createNtfyAdapter(config.ntfy);

        await adapter.send({
          title: stopConfig.title,
          message: finalMessage,
        });

        info('Stop notification sent via ntfy');
      }
    } catch (error) {
      warn(`Failed to send stop notification via ${channel}: ${error}`);
    }
  }
}
