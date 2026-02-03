import { createNtfyAdapter } from '@/adapters';
import { debug, info, warn } from '@/logger';
import type { Config, NotificationTypeConfig, StopHookInput, SystemState } from '@/types';
import { detectSystemState } from '@/utils';

/** 기본 Stop 알림 설정 */
const DEFAULT_STOP_CONFIG: NotificationTypeConfig = {
  enabled: true,
  title: 'Claude Code Session',
  message_template: 'Session completed',
  channels: ['ntfy'],
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
  if (state.is_terminal_active && (config.skip_when_active ?? true)) {
    info('Skipping stop notification (terminal is active)');
    return;
  }

  // 알림 채널 결정
  const channels = determineChannels(state, stopConfig);

  debug(`Selected channels: ${channels.join(', ')}`);

  if (channels.length === 0) {
    info('No channels available for stop notification');
    return;
  }

  // 알림 전송
  await sendStopNotifications(channels, stopConfig, config);
}

/**
 * 시스템 상태에 따라 알림 채널 결정
 */
function determineChannels(
  state: SystemState,
  stopConfig: { channels: readonly string[] },
): string[] {
  // 화면 잠금 시 → ntfy만 (모바일 푸시)
  if (state.is_screen_locked) {
    return stopConfig.channels.includes('ntfy') ? ['ntfy'] : [];
  }

  // 터미널에서 떨어져 있음 → 설정된 채널 사용
  return [...stopConfig.channels];
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

  for (const channel of channels) {
    try {
      if (channel === 'ntfy') {
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
