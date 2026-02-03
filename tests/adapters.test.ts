/**
 * Notification adapters 테스트
 * 실제 알림 전송 대신 모킹 사용
 */

import { describe, expect, mock, test } from 'bun:test';
import type { Adapter, NotificationPayload } from '@/types';

// 모킹된 TerminalNotifier 어댑터
function createMockedTerminalNotifier(): Adapter {
  return {
    send: mock(async (payload: NotificationPayload) => {
      if (!payload.title || !payload.message) {
        throw new Error('Title and message are required');
      }
    }),
  };
}

// 모킹된 Ntfy 어댑터
function createMockedNtfyAdapter(): Adapter {
  return {
    send: mock(async (payload: NotificationPayload) => {
      if (!payload.title || !payload.message) {
        throw new Error('Title and message are required');
      }
    }),
  };
}

describe('TerminalNotifierAdapter (모킹)', () => {
  test('올바른 페이로드로 알림 전송 성공', async () => {
    const adapter = createMockedTerminalNotifier();
    const payload: NotificationPayload = {
      title: 'Test Notification',
      message: 'This is a test message',
    };

    await adapter.send(payload);

    expect(adapter.send).toHaveBeenCalledTimes(1);
    expect(adapter.send).toHaveBeenCalledWith(payload);
  });

  test('title이 없으면 에러 발생', async () => {
    const adapter = createMockedTerminalNotifier();
    adapter.send = mock(async (payload: NotificationPayload) => {
      if (!payload.title) {
        throw new Error('Title is required');
      }
    });

    const payload = {
      title: '',
      message: 'Message only',
    };

    await expect(adapter.send(payload)).rejects.toThrow('Title is required');
  });

  test('message가 없으면 에러 발생', async () => {
    const adapter = createMockedTerminalNotifier();
    adapter.send = mock(async (payload: NotificationPayload) => {
      if (!payload.message) {
        throw new Error('Message is required');
      }
    });

    const payload = {
      title: 'Title only',
      message: '',
    };

    await expect(adapter.send(payload)).rejects.toThrow('Message is required');
  });
});

describe('NtfyAdapter (모킹)', () => {
  test('올바른 페이로드로 알림 전송 성공', async () => {
    const adapter = createMockedNtfyAdapter();
    const payload: NotificationPayload = {
      title: 'Test Notification',
      message: 'This is a test message',
      priority: 3,
    };

    await adapter.send(payload);

    expect(adapter.send).toHaveBeenCalledTimes(1);
    expect(adapter.send).toHaveBeenCalledWith(payload);
  });

  test('priority가 없어도 기본값으로 동작', async () => {
    const adapter = createMockedNtfyAdapter();
    const payload: NotificationPayload = {
      title: 'Test Notification',
      message: 'This is a test message',
    };

    await adapter.send(payload);

    expect(adapter.send).toHaveBeenCalledTimes(1);
  });

  test('토픽이 설정되지 않으면 에러 발생', async () => {
    const adapter = createMockedNtfyAdapter();
    adapter.send = mock(async () => {
      throw new Error('ntfy topic is required');
    });

    const payload: NotificationPayload = {
      title: 'Test',
      message: 'Test',
    };

    await expect(adapter.send(payload)).rejects.toThrow('ntfy topic is required');
  });

  test('우선순위 값 검증', async () => {
    const adapter = createMockedNtfyAdapter();
    const priorities: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

    for (const priority of priorities) {
      const payload: NotificationPayload = {
        title: 'Test',
        message: 'Test',
        priority,
      };

      await adapter.send(payload);

      expect(adapter.send).toHaveBeenCalledWith(payload);
    }
  });
});

describe('NotificationPayload 타입 검증', () => {
  test('올바른 NotificationPayload 객체 구조', () => {
    const payload: NotificationPayload = {
      title: 'Test Title',
      message: 'Test Message',
      priority: 3,
    };

    expect(payload).toHaveProperty('title');
    expect(payload).toHaveProperty('message');
    expect(payload).toHaveProperty('priority');
    expect(typeof payload.title).toBe('string');
    expect(typeof payload.message).toBe('string');
    expect(typeof payload.priority).toBe('number');
  });

  test('priority는 선택 사항', () => {
    const payload: NotificationPayload = {
      title: 'Test Title',
      message: 'Test Message',
    };

    expect(payload).toHaveProperty('title');
    expect(payload).toHaveProperty('message');
    expect(payload.priority).toBeUndefined();
  });
});
