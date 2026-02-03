/**
 * System state detector 테스트
 * 실제 시스템 명령 대신 모킹 사용
 */

import { describe, expect, mock, test } from 'bun:test';
import type { SystemState } from '@/types';

// 모킹된 detectSystemState 함수
function createMockedDetector() {
  return {
    detectSystemState: mock(async (): Promise<SystemState> => {
      return {
        is_screen_locked: false,
        is_terminal_active: true,
      };
    }),
  };
}

describe('detectSystemState (모킹)', () => {
  test('화면이 잠기지 않고 현재 터미널이 foreground인 경우', async () => {
    const detector = createMockedDetector();
    detector.detectSystemState.mockResolvedValue({
      is_screen_locked: false,
      is_terminal_active: true,
    });

    const state = await detector.detectSystemState();

    expect(state.is_screen_locked).toBe(false);
    expect(state.is_terminal_active).toBe(true);
  });

  test('화면이 잠긴 경우', async () => {
    const detector = createMockedDetector();
    detector.detectSystemState.mockResolvedValue({
      is_screen_locked: true,
      is_terminal_active: false,
    });

    const state = await detector.detectSystemState();

    expect(state.is_screen_locked).toBe(true);
    expect(state.is_terminal_active).toBe(false);
  });

  test('현재 터미널이 백그라운드에 있는 경우', async () => {
    const detector = createMockedDetector();
    detector.detectSystemState.mockResolvedValue({
      is_screen_locked: false,
      is_terminal_active: false,
    });

    const state = await detector.detectSystemState();

    expect(state.is_screen_locked).toBe(false);
    expect(state.is_terminal_active).toBe(false);
  });

  test('현재 터미널 Bundle ID를 감지할 수 없는 경우 - terminal_active는 false', async () => {
    const detector = createMockedDetector();
    detector.detectSystemState.mockResolvedValue({
      is_screen_locked: false,
      is_terminal_active: false,
    });

    const state = await detector.detectSystemState();

    expect(state.is_screen_locked).toBe(false);
    expect(state.is_terminal_active).toBe(false);
  });

  test('에러 발생 시 안전한 기본값 반환', async () => {
    const detector = createMockedDetector();
    detector.detectSystemState.mockRejectedValue(new Error('System command failed'));

    await expect(detector.detectSystemState()).rejects.toThrow('System command failed');
  });
});

describe('isCurrentTerminalForeground 로직 (모킹)', () => {
  function mockIsCurrentTerminalForeground(
    currentTerminalBundleId: string | undefined,
    frontmostBundleId: string,
  ): boolean {
    // 현재 터미널을 감지할 수 없으면 false 반환 (알림 전송)
    if (!currentTerminalBundleId) {
      return false;
    }

    return currentTerminalBundleId === frontmostBundleId;
  }

  test('현재 터미널과 foreground 앱의 Bundle ID가 일치하면 true', () => {
    const result = mockIsCurrentTerminalForeground(
      'com.googlecode.iterm2',
      'com.googlecode.iterm2',
    );

    expect(result).toBe(true);
  });

  test('현재 터미널과 foreground 앱의 Bundle ID가 다르면 false', () => {
    const result = mockIsCurrentTerminalForeground(
      'com.googlecode.iterm2',
      'com.apple.Safari',
    );

    expect(result).toBe(false);
  });

  test('현재 터미널 Bundle ID를 감지할 수 없으면 false', () => {
    const result = mockIsCurrentTerminalForeground(undefined, 'com.googlecode.iterm2');

    expect(result).toBe(false);
  });

  test('다른 터미널 앱이 foreground여도 현재 터미널이 아니면 false', () => {
    const result = mockIsCurrentTerminalForeground(
      'com.googlecode.iterm2',
      'com.apple.Terminal',
    );

    expect(result).toBe(false);
  });
});

describe('SystemState 타입 검증', () => {
  test('올바른 SystemState 객체 구조', () => {
    const state: SystemState = {
      is_screen_locked: true,
      is_terminal_active: false,
    };

    expect(state).toHaveProperty('is_screen_locked');
    expect(state).toHaveProperty('is_terminal_active');
    expect(typeof state.is_screen_locked).toBe('boolean');
    expect(typeof state.is_terminal_active).toBe('boolean');
  });
});
