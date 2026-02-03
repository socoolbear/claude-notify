import { debug, warn } from '@/logger';
import type { SystemState } from '@/types';
import { detectTerminalBundleId, getFrontmostAppBundleId, isTerminalApp } from '@/utils';
import { $ } from 'bun';

/**
 * 화면 잠금 상태 확인 (macOS)
 */
async function isScreenLocked(): Promise<boolean> {
  try {
    // ioreg 명령으로 화면 잠금 상태 확인
    const result = await $`ioreg -n Root -d1`.text();

    const isLocked = result.includes('"IOConsoleLocked" = Yes');
    debug(`Screen lock status: ${isLocked}`);

    return isLocked;
  } catch (error) {
    warn(`Failed to detect screen lock status: ${error}`);
    return false; // 에러 시 안전한 기본값
  }
}

/**
 * 현재 터미널이 foreground인지 확인
 * Claude Code가 실행 중인 터미널과 foreground 앱이 같은지 비교
 */
async function isCurrentTerminalForeground(): Promise<boolean> {
  const currentTerminalBundleId = detectTerminalBundleId();
  const frontmostBundleId = await getFrontmostAppBundleId();

  debug(`Current terminal: ${currentTerminalBundleId}, Frontmost app: ${frontmostBundleId}`);

  // 1단계: 환경변수 기반 감지 성공 시 정확한 비교
  if (currentTerminalBundleId) {
    const isMatch = currentTerminalBundleId === frontmostBundleId;
    debug(`Terminal Bundle ID match: ${isMatch}`);
    return isMatch;
  }

  // 2단계: Fallback - frontmost 앱이 알려진 터미널/IDE인지 확인
  const isFrontmostTerminal = isTerminalApp(frontmostBundleId);
  debug(`Fallback check - Frontmost app is terminal: ${isFrontmostTerminal}`);
  return isFrontmostTerminal;
}

/**
 * 시스템 상태 감지 (화면 잠금 + 터미널 활성화)
 */
export async function detectSystemState(): Promise<SystemState> {
  const [is_screen_locked, is_terminal_active] = await Promise.all([
    isScreenLocked(),
    isCurrentTerminalForeground(),
  ]);

  debug(
    `System state detected: screen_locked=${is_screen_locked}, terminal_active=${is_terminal_active}`,
  );

  return {
    is_screen_locked,
    is_terminal_active,
  };
}
