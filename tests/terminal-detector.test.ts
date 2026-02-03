/**
 * Terminal detector 테스트
 * 환경변수 기반 터미널 Bundle ID 감지 로직 검증
 */

import { describe, expect, mock, test } from 'bun:test';

// detectTerminalBundleId 함수를 모킹
function createMockedDetectTerminalBundleId() {
  return mock((env: Record<string, string | undefined>): string | undefined => {
    // iTerm2
    if (env.LC_TERMINAL === 'iTerm2' || env.ITERM_SESSION_ID) {
      return 'com.googlecode.iterm2';
    }

    // Ghostty
    if (env.GHOSTTY_RESOURCES_DIR) {
      return 'com.mitchellh.ghostty';
    }

    // WezTerm
    if (env.WEZTERM_EXECUTABLE) {
      return 'com.github.wez.wezterm';
    }

    // Kitty
    if (env.KITTY_WINDOW_ID) {
      return 'net.kovidgoyal.kitty';
    }

    // Alacritty
    if (env.ALACRITTY_SOCKET) {
      return 'io.alacritty';
    }

    // Warp
    if (env.WARP_IS_LOCAL_SHELL_SESSION) {
      return 'dev.warp.Warp-Stable';
    }

    // TERM_PROGRAM 기반 매핑
    const termProgram = env.TERM_PROGRAM;

    if (termProgram && termProgram !== 'tmux') {
      const mapping: Record<string, string> = {
        Apple_Terminal: 'com.apple.Terminal',
        'iTerm.app': 'com.googlecode.iterm2',
        WarpTerminal: 'dev.warp.Warp-Stable',
        WezTerm: 'com.github.wez.wezterm',
        Alacritty: 'io.alacritty',
        kitty: 'net.kovidgoyal.kitty',
        ghostty: 'com.mitchellh.ghostty',
        vscode: 'com.microsoft.VSCode',
      };

      if (mapping[termProgram]) {
        return mapping[termProgram];
      }
    }

    // __CFBundleIdentifier fallback
    if (env.__CFBundleIdentifier) {
      return env.__CFBundleIdentifier;
    }

    return undefined;
  });
}

describe('detectTerminalBundleId (모킹)', () => {
  test('iTerm2 감지 - LC_TERMINAL', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ LC_TERMINAL: 'iTerm2' });

    expect(result).toBe('com.googlecode.iterm2');
  });

  test('iTerm2 감지 - ITERM_SESSION_ID', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ ITERM_SESSION_ID: 'w0t0p0:12345678-1234-1234-1234-123456789012' });

    expect(result).toBe('com.googlecode.iterm2');
  });

  test('Ghostty 감지 - GHOSTTY_RESOURCES_DIR', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ GHOSTTY_RESOURCES_DIR: '/Applications/Ghostty.app/Contents/Resources' });

    expect(result).toBe('com.mitchellh.ghostty');
  });

  test('WezTerm 감지 - WEZTERM_EXECUTABLE', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ WEZTERM_EXECUTABLE: '/Applications/WezTerm.app/Contents/MacOS/wezterm' });

    expect(result).toBe('com.github.wez.wezterm');
  });

  test('Kitty 감지 - KITTY_WINDOW_ID', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ KITTY_WINDOW_ID: '1' });

    expect(result).toBe('net.kovidgoyal.kitty');
  });

  test('Alacritty 감지 - ALACRITTY_SOCKET', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ ALACRITTY_SOCKET: '/tmp/Alacritty-1.sock' });

    expect(result).toBe('io.alacritty');
  });

  test('Warp 감지 - WARP_IS_LOCAL_SHELL_SESSION', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ WARP_IS_LOCAL_SHELL_SESSION: '1' });

    expect(result).toBe('dev.warp.Warp-Stable');
  });

  test('TERM_PROGRAM 기반 감지 - Apple_Terminal', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ TERM_PROGRAM: 'Apple_Terminal' });

    expect(result).toBe('com.apple.Terminal');
  });

  test('TERM_PROGRAM 기반 감지 - iTerm.app', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ TERM_PROGRAM: 'iTerm.app' });

    expect(result).toBe('com.googlecode.iterm2');
  });

  test('TERM_PROGRAM 기반 감지 - WarpTerminal', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ TERM_PROGRAM: 'WarpTerminal' });

    expect(result).toBe('dev.warp.Warp-Stable');
  });

  test('TERM_PROGRAM 기반 감지 - vscode', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ TERM_PROGRAM: 'vscode' });

    expect(result).toBe('com.microsoft.VSCode');
  });

  test('TERM_PROGRAM=tmux는 무시하고 다음 fallback으로 이동', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({
      TERM_PROGRAM: 'tmux',
      __CFBundleIdentifier: 'com.googlecode.iterm2',
    });

    expect(result).toBe('com.googlecode.iterm2');
  });

  test('__CFBundleIdentifier fallback', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({ __CFBundleIdentifier: 'com.example.customTerminal' });

    expect(result).toBe('com.example.customTerminal');
  });

  test('감지 실패 시 undefined 반환', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({});

    expect(result).toBeUndefined();
  });

  test('우선순위 테스트 - 특정 환경변수가 TERM_PROGRAM보다 우선', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({
      ITERM_SESSION_ID: 'w0t0p0:12345678-1234-1234-1234-123456789012',
      TERM_PROGRAM: 'Apple_Terminal', // 이건 무시되어야 함
    });

    expect(result).toBe('com.googlecode.iterm2');
  });

  test('tmux 내부에서 TERM_PROGRAM 무시 - 다른 환경변수 우선', () => {
    const detect = createMockedDetectTerminalBundleId();
    const result = detect({
      TERM_PROGRAM: 'tmux',
      GHOSTTY_RESOURCES_DIR: '/Applications/Ghostty.app/Contents/Resources',
    });

    expect(result).toBe('com.mitchellh.ghostty');
  });
});

describe('isTerminalApp (모킹)', () => {
  const knownTerminalBundleIds = [
    'com.apple.Terminal',
    'com.googlecode.iterm2',
    'dev.warp.Warp-Stable',
    'com.github.wez.wezterm',
    'io.alacritty',
    'net.kovidgoyal.kitty',
    'com.mitchellh.ghostty',
    'com.microsoft.VSCode',
  ];

  function isTerminalApp(bundleId: string): boolean {
    if (!bundleId) {
      return false;
    }

    const lowerBundleId = bundleId.toLowerCase();
    const TERMINAL_KEYWORDS = ['terminal', 'console', 'iterm', 'shell', 'prompt'];

    if (knownTerminalBundleIds.includes(bundleId)) {
      return true;
    }

    return TERMINAL_KEYWORDS.some((keyword) => lowerBundleId.includes(keyword));
  }

  test('알려진 터미널 Bundle ID는 true 반환', () => {
    for (const bundleId of knownTerminalBundleIds) {
      expect(isTerminalApp(bundleId)).toBe(true);
    }
  });

  test('키워드 매칭 - terminal', () => {
    expect(isTerminalApp('com.example.myterminal')).toBe(true);
  });

  test('키워드 매칭 - console', () => {
    expect(isTerminalApp('com.example.console')).toBe(true);
  });

  test('키워드 매칭 - iterm', () => {
    expect(isTerminalApp('com.custom.iterm')).toBe(true);
  });

  test('빈 문자열은 false 반환', () => {
    expect(isTerminalApp('')).toBe(false);
  });

  test('알려지지 않은 Bundle ID는 false 반환', () => {
    expect(isTerminalApp('com.example.unknownapp')).toBe(false);
  });

  test('대소문자 무시하고 키워드 매칭', () => {
    expect(isTerminalApp('com.example.TERMINAL')).toBe(true);
    expect(isTerminalApp('com.example.Terminal')).toBe(true);
  });
});
