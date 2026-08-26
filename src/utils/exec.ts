/**
 * 외부 명령 실행 헬퍼.
 * execFile 을 쓰므로 셸을 거치지 않는다 — 인자가 배열로 전달돼 명령 주입이 원천적으로 불가능하다.
 */

import { execFile } from 'node:child_process';

export interface CommandResult {
  /** 프로세스 종료 코드. 실행 자체가 실패하면 -1 */
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * 외부 명령을 실행한다. 실패해도 throw 하지 않고 exitCode 로 알린다.
 *
 * @param file - 실행할 명령 (PATH 에서 탐색)
 * @param args - 인자 배열 (셸 해석 없이 그대로 전달)
 * @returns 종료 코드와 stdout / stderr
 */
export function runCommand(file: string, args: string[]): Promise<CommandResult> {
  return new Promise((resolve) => {
    execFile(file, args, { encoding: 'utf-8' }, (err, stdout, stderr) => {
      if (!err) {
        resolve({ exitCode: 0, stdout, stderr });
        return;
      }

      const exitCode = typeof err.code === 'number' ? err.code : -1;

      resolve({ exitCode, stdout, stderr });
    });
  });
}
