/**
 * Environment variable utilities 테스트
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { getBoolEnv, getEnv, getHome } from '@/utils';

describe('getHome', () => {
  let originalHome: string | undefined;

  beforeEach(() => {
    originalHome = process.env.HOME;
  });

  afterEach(() => {
    if (originalHome) {
      process.env.HOME = originalHome;
    } else {
      delete process.env.HOME;
    }
  });

  test('process.env.HOME이 설정된 경우 반환', () => {
    process.env.HOME = '/Users/testuser';

    expect(getHome()).toBe('/Users/testuser');
  });

  test('HOME이 없으면 /tmp 반환', () => {
    delete process.env.HOME;

    expect(getHome()).toBe('/tmp');
  });
});

describe('getEnv', () => {
  let originalTestVar: string | undefined;

  beforeEach(() => {
    originalTestVar = process.env.TEST_VAR;
  });

  afterEach(() => {
    if (originalTestVar !== undefined) {
      process.env.TEST_VAR = originalTestVar;
    } else {
      delete process.env.TEST_VAR;
    }
  });

  test('환경변수 값이 설정된 경우 반환', () => {
    process.env.TEST_VAR = 'test-value';

    expect(getEnv('TEST_VAR')).toBe('test-value');
  });

  test('환경변수가 없으면 기본값 반환', () => {
    delete process.env.TEST_VAR;

    expect(getEnv('TEST_VAR', 'default')).toBe('default');
  });

  test('환경변수도 기본값도 없으면 undefined 반환', () => {
    delete process.env.TEST_VAR;

    expect(getEnv('TEST_VAR')).toBeUndefined();
  });
});

describe('getBoolEnv', () => {
  let originalTestBool: string | undefined;

  beforeEach(() => {
    originalTestBool = process.env.TEST_BOOL;
  });

  afterEach(() => {
    if (originalTestBool !== undefined) {
      process.env.TEST_BOOL = originalTestBool;
    } else {
      delete process.env.TEST_BOOL;
    }
  });

  test('"true" 문자열은 true 반환', () => {
    process.env.TEST_BOOL = 'true';

    expect(getBoolEnv('TEST_BOOL')).toBe(true);
  });

  test('"1" 문자열은 true 반환', () => {
    process.env.TEST_BOOL = '1';

    expect(getBoolEnv('TEST_BOOL')).toBe(true);
  });

  test('"yes" 문자열은 true 반환', () => {
    process.env.TEST_BOOL = 'yes';

    expect(getBoolEnv('TEST_BOOL')).toBe(true);
  });

  test('대소문자 무관하게 처리', () => {
    process.env.TEST_BOOL = 'TRUE';

    expect(getBoolEnv('TEST_BOOL')).toBe(true);
  });

  test('"false" 문자열은 false 반환', () => {
    process.env.TEST_BOOL = 'false';

    expect(getBoolEnv('TEST_BOOL')).toBe(false);
  });

  test('환경변수가 없으면 기본값 반환 (false)', () => {
    delete process.env.TEST_BOOL;

    expect(getBoolEnv('TEST_BOOL')).toBe(false);
  });

  test('환경변수가 없을 때 커스텀 기본값 반환', () => {
    delete process.env.TEST_BOOL;

    expect(getBoolEnv('TEST_BOOL', true)).toBe(true);
  });
});
