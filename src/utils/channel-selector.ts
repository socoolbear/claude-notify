import { debug } from '@/logger';
import { CHANNEL_TYPES, type SystemState } from '@/types';

/**
 * 시스템 상태에 따라 알림 채널 결정
 *
 * 우선순위:
 * 1. 화면 잠금 → ntfy만 (모바일 푸시)
 * 2. 터미널 비활성 → terminal-notifier만 (로컬 알림)
 * 3. 기본 → 설정된 모든 채널
 */
export function selectChannels(
  state: SystemState,
  configuredChannels: readonly string[],
): string[] {
  // 화면 잠금 시 → ntfy만 (모바일 푸시)
  if (state.is_screen_locked) {
    const hasNtfy = configuredChannels.includes(CHANNEL_TYPES.NTFY);

    debug(`Screen locked - selecting ntfy only: ${hasNtfy}`);

    return hasNtfy ? [CHANNEL_TYPES.NTFY] : [];
  }

  // 터미널에서 떨어져 있음 → terminal-notifier만 (로컬 알림)
  if (!state.is_terminal_active) {
    const hasTerminalNotifier = configuredChannels.includes(CHANNEL_TYPES.TERMINAL_NOTIFIER);

    debug(`Away from terminal - selecting terminal-notifier: ${hasTerminalNotifier}`);

    return hasTerminalNotifier ? [CHANNEL_TYPES.TERMINAL_NOTIFIER] : [];
  }

  // 기본: 설정된 모든 채널 사용
  return [...configuredChannels];
}

/**
 * 터미널 활성화 상태에 따라 알림 스킵 여부 결정
 * 단, 화면 잠금 시에는 스킵하지 않음 (모바일 알림 필요)
 */
export function shouldSkipNotification(state: SystemState, skipWhenActive: boolean): boolean {
  if (state.is_screen_locked) {
    return false;
  }

  return state.is_terminal_active && skipWhenActive;
}
