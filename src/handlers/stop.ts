import { createNtfyAdapter } from '@/adapters';
import { info, warn } from '@/logger';
import type { Config, NotificationTypeConfig, StopHookInput } from '@/types';

/** 기본 Stop 알림 설정 */
const DEFAULT_STOP_CONFIG: NotificationTypeConfig = {
  enabled: true,
  title: 'Claude Code Session',
  message_template: 'Session stopped: {reason}',
  channels: ['ntfy'],
};

/**
 * Stop 이벤트 처리
 * 세션 종료는 중요한 이벤트이므로 항상 알림
 */
export async function handleStop(input: StopHookInput, config: Config): Promise<void> {
  const { stop_reason } = input;

  info(`Session stopped: ${stop_reason}`);

  // Stop 이벤트 설정 확인 (없으면 기본값 사용)
  const stopConfig = config.notifications?.stop ?? DEFAULT_STOP_CONFIG;

  if (!stopConfig.enabled) {
    info('Stop notification is disabled');
    return;
  }

  // Stop 이벤트는 항상 ntfy로 알림 (세션 종료는 중요)
  if (!stopConfig.channels.includes('ntfy')) {
    info('ntfy channel not configured for stop notification');
    return;
  }

  const finalMessage = stopConfig.message_template.replace('{reason}', stop_reason);

  try {
    const adapter = createNtfyAdapter(config.ntfy);

    await adapter.send({
      title: stopConfig.title,
      message: finalMessage,
    });

    info('Stop notification sent via ntfy');
  } catch (error) {
    warn(`Failed to send stop notification: ${error}`);
  }
}
