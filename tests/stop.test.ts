/**
 * Stop handler 테스트
 * 시스템 상태에 따른 Stop 알림 처리 로직 검증
 */

import { describe, expect, test } from 'bun:test';
import type { NotificationTypeConfig, SystemState } from '@/types';

describe('handleStop 로직 (모킹)', () => {
  // determineChannels 모킹
  function mockDetermineChannels(
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

  // shouldSkipStopNotification 모킹
  function shouldSkipStopNotification(
    state: SystemState,
    skipWhenActive: boolean,
  ): boolean {
    return state.is_terminal_active && skipWhenActive;
  }

  test('터미널 활성화 시 알림 스킵 (skip_when_active=true)', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: true };

    const shouldSkip = shouldSkipStopNotification(state, true);

    expect(shouldSkip).toBe(true);
  });

  test('터미널 활성화 시 알림 전송 (skip_when_active=false)', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: true };

    const shouldSkip = shouldSkipStopNotification(state, false);

    expect(shouldSkip).toBe(false);
  });

  test('터미널 비활성화 시 알림 전송', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };

    const shouldSkip = shouldSkipStopNotification(state, true);

    expect(shouldSkip).toBe(false);
  });

  test('화면 잠금 시 ntfy 채널만 사용', () => {
    const state: SystemState = { is_screen_locked: true, is_terminal_active: false };
    const stopConfig = { channels: ['terminal-notifier', 'ntfy'] as const };

    const channels = mockDetermineChannels(state, stopConfig);

    expect(channels).toEqual(['ntfy']);
  });

  test('화면 잠금 시 ntfy 없으면 빈 배열', () => {
    const state: SystemState = { is_screen_locked: true, is_terminal_active: false };
    const stopConfig = { channels: ['terminal-notifier'] as const };

    const channels = mockDetermineChannels(state, stopConfig);

    expect(channels).toEqual([]);
  });

  test('화면 잠금 안됨 + 터미널 비활성 시 모든 채널 사용', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };
    const stopConfig = { channels: ['terminal-notifier', 'ntfy'] as const };

    const channels = mockDetermineChannels(state, stopConfig);

    expect(channels).toEqual(['terminal-notifier', 'ntfy']);
  });
});

describe('Stop 알림 스킵 시나리오 (통합)', () => {
  function simulateHandleStop(
    state: SystemState,
    config: { skip_when_active: boolean; enabled: boolean; channels: readonly string[] },
  ): { skipped: boolean; reason?: string; channels?: string[] } {
    // enabled 확인
    if (!config.enabled) {
      return { skipped: true, reason: 'disabled' };
    }

    // 터미널 활성화 시 스킵
    if (state.is_terminal_active && config.skip_when_active) {
      return { skipped: true, reason: 'terminal_active' };
    }

    // 채널 결정
    let channels: string[];
    if (state.is_screen_locked) {
      channels = config.channels.includes('ntfy') ? ['ntfy'] : [];
    } else {
      channels = [...config.channels];
    }

    if (channels.length === 0) {
      return { skipped: true, reason: 'no_channels' };
    }

    return { skipped: false, channels };
  }

  test('WebStorm foreground + skip_when_active=true → 스킵', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: true };
    const config = { skip_when_active: true, enabled: true, channels: ['ntfy'] as const };

    const result = simulateHandleStop(state, config);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('terminal_active');
  });

  test('Chrome foreground + skip_when_active=true → ntfy 전송', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };
    const config = { skip_when_active: true, enabled: true, channels: ['ntfy'] as const };

    const result = simulateHandleStop(state, config);

    expect(result.skipped).toBe(false);
    expect(result.channels).toEqual(['ntfy']);
  });

  test('화면 잠금 상태 → ntfy만 전송', () => {
    const state: SystemState = { is_screen_locked: true, is_terminal_active: false };
    const config = {
      skip_when_active: true,
      enabled: true,
      channels: ['terminal-notifier', 'ntfy'] as const,
    };

    const result = simulateHandleStop(state, config);

    expect(result.skipped).toBe(false);
    expect(result.channels).toEqual(['ntfy']);
  });

  test('Stop 알림 비활성화 → 스킵', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };
    const config = { skip_when_active: true, enabled: false, channels: ['ntfy'] as const };

    const result = simulateHandleStop(state, config);

    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('disabled');
  });
});

describe('Stop 알림 채널 결정 로직', () => {
  function mockDetermineChannels(
    state: SystemState,
    stopConfig: NotificationTypeConfig,
  ): string[] {
    if (state.is_screen_locked) {
      return stopConfig.channels.includes('ntfy') ? ['ntfy'] : [];
    }

    return [...stopConfig.channels];
  }

  test('ntfy만 설정된 경우 - 정상 시나리오', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };
    const stopConfig: NotificationTypeConfig = {
      enabled: true,
      title: 'Session End',
      message_template: 'Done',
      channels: ['ntfy'],
    };

    const channels = mockDetermineChannels(state, stopConfig);

    expect(channels).toEqual(['ntfy']);
  });

  test('terminal-notifier만 설정된 경우 - 정상 시나리오', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };
    const stopConfig: NotificationTypeConfig = {
      enabled: true,
      title: 'Session End',
      message_template: 'Done',
      channels: ['terminal-notifier'],
    };

    const channels = mockDetermineChannels(state, stopConfig);

    expect(channels).toEqual(['terminal-notifier']);
  });

  test('빈 채널 목록 → 빈 배열 반환', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };
    const stopConfig: NotificationTypeConfig = {
      enabled: true,
      title: 'Session End',
      message_template: 'Done',
      channels: [],
    };

    const channels = mockDetermineChannels(state, stopConfig);

    expect(channels).toEqual([]);
  });

  test('화면 잠금 + terminal-notifier만 있음 → 빈 배열', () => {
    const state: SystemState = { is_screen_locked: true, is_terminal_active: false };
    const stopConfig: NotificationTypeConfig = {
      enabled: true,
      title: 'Session End',
      message_template: 'Done',
      channels: ['terminal-notifier'],
    };

    const channels = mockDetermineChannels(state, stopConfig);

    expect(channels).toEqual([]);
  });
});

describe('NotificationTypeConfig 타입 검증', () => {
  test('올바른 NotificationTypeConfig 구조', () => {
    const config: NotificationTypeConfig = {
      enabled: true,
      title: 'Claude Code Session',
      message_template: 'Session completed',
      channels: ['ntfy'],
    };

    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('title');
    expect(config).toHaveProperty('message_template');
    expect(config).toHaveProperty('channels');
    expect(typeof config.enabled).toBe('boolean');
    expect(typeof config.title).toBe('string');
    expect(typeof config.message_template).toBe('string');
    expect(Array.isArray(config.channels)).toBe(true);
  });

  test('channels 배열 값 검증', () => {
    const config: NotificationTypeConfig = {
      enabled: true,
      title: 'Test',
      message_template: 'Message',
      channels: ['ntfy', 'terminal-notifier'],
    };

    expect(config.channels).toContain('ntfy');
    expect(config.channels).toContain('terminal-notifier');
    expect(config.channels.length).toBe(2);
  });
});

describe('기본 Stop 알림 설정', () => {
  test('DEFAULT_STOP_CONFIG 구조 검증', () => {
    const DEFAULT_STOP_CONFIG: NotificationTypeConfig = {
      enabled: true,
      title: 'Claude Code Session',
      message_template: 'Session completed',
      channels: ['ntfy'],
    };

    expect(DEFAULT_STOP_CONFIG.enabled).toBe(true);
    expect(DEFAULT_STOP_CONFIG.title).toBe('Claude Code Session');
    expect(DEFAULT_STOP_CONFIG.message_template).toBe('Session completed');
    expect(DEFAULT_STOP_CONFIG.channels).toEqual(['ntfy']);
  });
});

describe('복합 시나리오 - 실제 사용 패턴', () => {
  function simulateFullHandleStop(
    state: SystemState,
    stopConfig: NotificationTypeConfig | undefined,
    globalConfig: { skip_when_active?: boolean },
  ): { sent: boolean; channels?: string[]; reason?: string } {
    // 기본값 사용
    const DEFAULT_STOP_CONFIG: NotificationTypeConfig = {
      enabled: true,
      title: 'Claude Code Session',
      message_template: 'Session completed',
      channels: ['ntfy'],
    };

    const config = stopConfig ?? DEFAULT_STOP_CONFIG;
    const skipWhenActive = globalConfig.skip_when_active ?? true;

    // disabled 체크
    if (!config.enabled) {
      return { sent: false, reason: 'disabled' };
    }

    // 터미널 활성화 시 스킵
    if (state.is_terminal_active && skipWhenActive) {
      return { sent: false, reason: 'terminal_active' };
    }

    // 채널 결정
    let channels: string[];
    if (state.is_screen_locked) {
      channels = config.channels.includes('ntfy') ? ['ntfy'] : [];
    } else {
      channels = [...config.channels];
    }

    if (channels.length === 0) {
      return { sent: false, reason: 'no_channels' };
    }

    return { sent: true, channels };
  }

  test('설정 없음 → 기본값 사용 → 정상 전송', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };

    const result = simulateFullHandleStop(state, undefined, {});

    expect(result.sent).toBe(true);
    expect(result.channels).toEqual(['ntfy']);
  });

  test('커스텀 설정 → 여러 채널 전송', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: false };
    const stopConfig: NotificationTypeConfig = {
      enabled: true,
      title: 'Custom Title',
      message_template: 'Custom message',
      channels: ['ntfy', 'terminal-notifier'],
    };

    const result = simulateFullHandleStop(state, stopConfig, {});

    expect(result.sent).toBe(true);
    expect(result.channels).toEqual(['ntfy', 'terminal-notifier']);
  });

  test('skip_when_active=false → 터미널 활성화여도 전송', () => {
    const state: SystemState = { is_screen_locked: false, is_terminal_active: true };

    const result = simulateFullHandleStop(state, undefined, { skip_when_active: false });

    expect(result.sent).toBe(true);
    expect(result.channels).toEqual(['ntfy']);
  });

  test('화면 잠금 + 커스텀 설정 → ntfy만 전송', () => {
    const state: SystemState = { is_screen_locked: true, is_terminal_active: false };
    const stopConfig: NotificationTypeConfig = {
      enabled: true,
      title: 'Custom',
      message_template: 'Message',
      channels: ['ntfy', 'terminal-notifier'],
    };

    const result = simulateFullHandleStop(state, stopConfig, {});

    expect(result.sent).toBe(true);
    expect(result.channels).toEqual(['ntfy']);
  });
});
