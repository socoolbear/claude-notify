/**
 * Input sanitization utilities for security.
 * Prevents command injection and validates input structure.
 */

/**
 * 알림 텍스트에서 제어 문자 (ASCII 0-31, 127) 를 제거한다.
 *
 * 외부 명령은 execFile 로 인자를 배열 전달하므로 셸 이스케이프는 필요 없다.
 * 이 함수는 제어 문자가 알림 표시를 깨뜨리는 것을 막는 용도다.
 */
export function sanitizeForShell(input: string): string {
  if (!input) {
    return '';
  }

  // 제어 문자 제거 (ASCII 0-31, 127)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Security sanitization requires control character removal
  return input.replace(/[\x00-\x1f\x7f]/g, '');
}

/**
 * HookInput 유효성 검증
 */
function isValidHookInput(input: unknown): boolean {
  if (typeof input !== 'object' || input === null) {
    return false;
  }

  const obj = input as Record<string, unknown>;

  // hook_event_name 필수
  if (typeof obj.hook_event_name !== 'string') {
    return false;
  }

  // 허용된 이벤트 타입만 허용
  return ['Notification', 'Stop'].includes(obj.hook_event_name);
}

export default isValidHookInput;
