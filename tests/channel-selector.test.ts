/**
 * 채널 선택 / 스킵 판정 테스트
 */

import { describe, expect, test } from 'bun:test';
import type { SystemState } from '@/types';
import { selectChannels, shouldSkipNotification } from '@/utils';

const ALL_CHANNELS = ['terminal-notifier', 'ntfy'];

function createState(overrides: Partial<SystemState> = {}): SystemState {
  return {
    is_screen_locked: false,
    is_terminal_active: false,
    ...overrides,
  };
}

describe('selectChannels', () => {
  test('화면 잠금 시 ntfy만 선택', () => {
    const state = createState({ is_screen_locked: true, is_terminal_active: true });

    expect(selectChannels(state, ALL_CHANNELS)).toEqual(['ntfy']);
  });

  test('화면 잠금이지만 ntfy가 설정에 없으면 빈 배열', () => {
    const state = createState({ is_screen_locked: true });

    expect(selectChannels(state, ['terminal-notifier'])).toEqual([]);
  });

  test('터미널 비활성이면 terminal-notifier만 선택', () => {
    const state = createState({ is_terminal_active: false });

    expect(selectChannels(state, ALL_CHANNELS)).toEqual(['terminal-notifier']);
  });

  test('터미널 활성이면 설정된 모든 채널 사용', () => {
    const state = createState({ is_terminal_active: true });

    expect(selectChannels(state, ALL_CHANNELS)).toEqual(ALL_CHANNELS);
  });

  test('강제 모드는 화면 잠금 상태에서도 모든 채널 사용', () => {
    const state = createState({ is_screen_locked: true, is_terminal_active: true });

    expect(selectChannels(state, ALL_CHANNELS, true)).toEqual(ALL_CHANNELS);
  });

  test('강제 모드는 터미널 비활성 상태에서도 모든 채널 사용', () => {
    const state = createState({ is_terminal_active: false });

    expect(selectChannels(state, ALL_CHANNELS, true)).toEqual(ALL_CHANNELS);
  });
});

describe('shouldSkipNotification', () => {
  test('터미널 활성 + skip_when_active 면 스킵', () => {
    const state = createState({ is_terminal_active: true });

    expect(shouldSkipNotification(state, true)).toBe(true);
  });

  test('skip_when_active 가 false 면 스킵하지 않음', () => {
    const state = createState({ is_terminal_active: true });

    expect(shouldSkipNotification(state, false)).toBe(false);
  });

  test('화면 잠금 시에는 터미널 활성이어도 스킵하지 않음', () => {
    const state = createState({ is_screen_locked: true, is_terminal_active: true });

    expect(shouldSkipNotification(state, true)).toBe(false);
  });

  test('강제 모드는 스킵하지 않음', () => {
    const state = createState({ is_terminal_active: true });

    expect(shouldSkipNotification(state, true, true)).toBe(false);
  });
});
