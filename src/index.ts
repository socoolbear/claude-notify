/**
 * Main entry point for claude-notify.
 * Reads Claude Code hook JSON from stdin and routes to appropriate handlers.
 */

import { loadConfig } from '@/config';
import { handleNotification, handleStop } from '@/handlers';
import { debug, error, info } from '@/logger';
import type { HookInput } from '@/types';
import { isValidHookInput } from '@/utils';

/**
 * stdin 을 끝까지 읽어 문자열로 반환.
 * 파이프 입력이 없는 대화형 실행(TTY)에서는 대기하지 않고 빈 문자열을 반환한다.
 */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }

  const chunks: Buffer[] = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }

  return Buffer.concat(chunks).toString('utf-8');
}

async function main(): Promise<void> {
  try {
    // 1. stdin에서 JSON 읽기
    const inputText = await readStdin();

    if (!inputText.trim()) {
      debug('Empty input received');
      return;
    }

    // 2. JSON 파싱
    const parsed = JSON.parse(inputText);

    if (!isValidHookInput(parsed)) {
      error('Invalid hook input format');
      process.exit(1);
    }

    const input = parsed as HookInput;
    debug(`Received event: ${input.hook_event_name}`);

    // 3. 설정 로드
    const config = await loadConfig();

    // 4. 이벤트 라우팅
    switch (input.hook_event_name) {
      case 'Notification':
        await handleNotification(input, config);
        break;
      case 'Stop':
        await handleStop(input, config);
        break;
      default: {
        const unknownInput = input as { hook_event_name?: string };
        debug(`Unknown event: ${unknownInput.hook_event_name ?? 'undefined'}`);
      }
    }

    info('Hook processing completed');
  } catch (err) {
    error(`Failed to process hook: ${err}`);
    process.exit(1);
  }
}

main();
