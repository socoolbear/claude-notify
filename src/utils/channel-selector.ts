import { debug } from '@/logger';
import { CHANNEL_TYPES, type SystemState } from '@/types';

/**
 * 시스템 상태에 따라 알림 채널 결정
 *
 * 우선순위:
 * 1. 강제 모드 → 설정된 모든 채널 (동작 확인용)
 * 2. 화면 잠금 → ntfy만 (모바일 푸시)
 * 3. 터미널 비활성 → terminal-notifier만 (로컬 알림)
 * 4. 기본 → 설정된 모든 채널
 */
export function selectChannels(
  state: SystemState,
  configuredChannels: readonly string[],
  force = false,
): string[] {
  // 강제 모드 — 상태와 무관하게 설정된 모든 채널로 발송
  if (force) {
    debug('Force mode - selecting all configured channels');

    return [...configuredChannels];
  }

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
 * 단, 화면 잠금 시와 강제 모드에서는 스킵하지 않음
 */
export function shouldSkipNotification(
  state: SystemState,
  skipWhenActive: boolean,
  force = false,
): boolean {
  if (force) {
    return false;
  }

  if (state.is_screen_locked) {
    return false;
  }

  return state.is_terminal_active && skipWhenActive;
}
