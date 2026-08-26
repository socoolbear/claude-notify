/**
 * 외부 명령 실행 헬퍼 테스트
 */

import { describe, expect, test } from 'bun:test';
import { runCommand } from '@/utils';

describe('runCommand', () => {
  test('성공 시 exitCode 0 과 stdout 반환', async () => {
    const result = await runCommand('echo', ['hello']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
  });

  test('종료 코드가 0 이 아니면 그대로 반환 (throw 하지 않음)', async () => {
    const result = await runCommand('sh', ['-c', 'exit 3']);

    expect(result.exitCode).toBe(3);
  });

  test('명령을 찾을 수 없으면 exitCode -1', async () => {
    const result = await runCommand('claude-notify-no-such-command', []);

    expect(result.exitCode).toBe(-1);
  });

  test('인자는 셸을 거치지 않고 그대로 전달된다', async () => {
    const result = await runCommand('echo', ['$(whoami)', '&&', 'rm -rf /']);

    expect(result.stdout.trim()).toBe('$(whoami) && rm -rf /');
  });
});
