/**
 * Configuration 로드 테스트
 */

import { $ } from 'bun';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { loadConfig } from '@/config';
import type { Config } from '@/types';

describe('loadConfig', () => {
  let originalHome: string | undefined;
  let testHome: string;

  beforeEach(() => {
    originalHome = process.env.HOME;
    testHome = '/tmp/claude-notify-test';
    process.env.HOME = testHome;
  });

  afterEach(async () => {
    if (originalHome) {
      process.env.HOME = originalHome;
    }

    // 테스트 디렉토리 정리
    await $`rm -rf ${testHome}/.config/claude-notify`.quiet();
  });

  test('설정 파일이 없으면 기본값 반환', async () => {
    const config = await loadConfig();

    expect(config.ntfy.server).toBe('https://ntfy.sh');
    expect(config.ntfy.topic).toBe('claude-notify');
    expect(config.terminal_notifier.enabled).toBe(true);
    expect(config.log.enabled).toBe(false);
    expect(config.log.level).toBe('info');
    expect(config.skip_when_active).toBe(true);
  });

  test('부분 설정만 있으면 기본값과 병합', async () => {
    const configDir = `${testHome}/.config/claude-notify`;
    await $`mkdir -p ${configDir}`.quiet();

    const partialConfig = {
      ntfy: {
        topic: 'custom-topic',
      },
    };

    const configPath = `${configDir}/config.json`;
    await Bun.write(configPath, JSON.stringify(partialConfig));

    const config = await loadConfig();

    expect(config.ntfy.server).toBe('https://ntfy.sh'); // 기본값
    expect(config.ntfy.topic).toBe('custom-topic'); // 커스텀 값
    expect(config.terminal_notifier.enabled).toBe(true); // 기본값
  });

  test('완전한 설정 파일 로드', async () => {
    const configDir = `${testHome}/.config/claude-notify`;
    await $`mkdir -p ${configDir}`.quiet();

    const fullConfig: Config = {
      ntfy: {
        server: 'https://custom.ntfy.sh',
        topic: 'my-topic',
        token: 'secret-token',
      },
      terminal_notifier: {
        enabled: false,
      },
      log: {
        enabled: true,
        level: 'debug',
      },
      skip_when_active: false,
    };

    const configPath = `${configDir}/config.json`;
    await Bun.write(configPath, JSON.stringify(fullConfig));

    const config = await loadConfig();

    expect(config.ntfy.server).toBe('https://custom.ntfy.sh');
    expect(config.ntfy.topic).toBe('my-topic');
    expect(config.ntfy.token).toBe('secret-token');
    expect(config.terminal_notifier.enabled).toBe(false);
    expect(config.log.enabled).toBe(true);
    expect(config.log.level).toBe('debug');
    expect(config.skip_when_active).toBe(false);
  });

  test('잘못된 JSON 파일이면 기본값 반환', async () => {
    const configDir = `${testHome}/.config/claude-notify`;
    await $`mkdir -p ${configDir}`.quiet();

    const configPath = `${configDir}/config.json`;
    await Bun.write(configPath, 'invalid json {');

    const config = await loadConfig();

    expect(config.ntfy.server).toBe('https://ntfy.sh'); // 기본값으로 fallback
  });
});
