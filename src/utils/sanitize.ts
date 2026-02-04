/**
 * Input sanitization utilities for security.
 * Prevents command injection and validates input structure.
 */

/**
 * 쉘 명령어에 안전하게 전달할 수 있도록 문자열 sanitize
 * 제어 문자 및 위험한 문자 제거
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

export default isValidHookInput
