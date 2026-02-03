import { debug, warn } from '@/logger';
import type { SystemState } from '@/types';
import { isFrontmostAppTerminal } from '@/utils';
import { $ } from 'bun';

/**
 * 화면 잠금 상태 확인 (macOS)
 */
async function isScreenLocked(): Promise<boolean> {
  try {
    // ioreg 명령으로 화면 잠금 상태 확인
    const result = await $`ioreg -n Root -d1 -a`.text();

    const isLocked = result.includes('"CGSSessionScreenIsLocked" = Yes');
    debug(`Screen lock status: ${isLocked}`);

    return isLocked;
  } catch (error) {
    warn(`Failed to detect screen lock status: ${error}`);
    return false; // 에러 시 안전한 기본값
  }
}

/**
 * 시스템 상태 감지 (화면 잠금 + 터미널 활성화)
 */
export async function detectSystemState(): Promise<SystemState> {
  const [is_screen_locked, is_terminal_active] = await Promise.all([
    isScreenLocked(),
    isFrontmostAppTerminal(),
  ]);

  debug(
    `System state detected: screen_locked=${is_screen_locked}, terminal_active=${is_terminal_active}`,
  );

  return {
    is_screen_locked,
    is_terminal_active,
  };
}
