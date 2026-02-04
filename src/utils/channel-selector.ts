import { debug } from '@/logger';
import { CHANNEL_TYPES, type SystemState } from '@/types';

/**
 * 시스템 상태에 따라 알림 채널 결정
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

  // 터미널에서 떨어져 있음 → 설정된 채널 사용
  return [...configuredChannels];
}

/**
 * 터미널 활성화 상태에 따라 알림 스킵 여부 결정
 */
export function shouldSkipNotification(state: SystemState, skipWhenActive: boolean): boolean {
  return state.is_terminal_active && skipWhenActive;
}
