/**
 * Claude Code Hook 이벤트 타입
 */
export type HookEventName = 'Notification' | 'Stop';

/**
 * 알림 타입
 */
export type NotificationType =
  | 'permission_prompt'
  | 'idle_prompt'
  | 'auth_success'
  | 'elicitation_dialog';

/**
 * Notification 이벤트 입력
 */
export interface NotificationHookInput {
  hook_event_name: 'Notification';
  notification_type: NotificationType;
  message: string;
  session_id?: string;
  timestamp?: string;
}

/**
 * Stop 이벤트 입력
 */
export interface StopHookInput {
  hook_event_name: 'Stop';
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  stop_hook_active: boolean;
}

/**
 * Claude Code Hook JSON 입력
 */
export type HookInput = NotificationHookInput | StopHookInput;

/**
 * 시스템 상태
 */
export interface SystemState {
  /** 화면이 잠겨있는지 여부 */
  is_screen_locked: boolean;
  /** 터미널이 foreground에 있는지 여부 */
  is_terminal_active: boolean;
}

/**
 * ntfy 설정
 */
export interface NtfyConfig {
  /** ntfy 서버 URL (기본값: https://ntfy.sh) */
  server?: string;
  /** ntfy 토픽 이름 */
  topic: string;
  /** ntfy 인증 토큰 (선택) */
  token?: string;
}

/**
 * terminal-notifier 설정
 */
export interface TerminalNotifierConfig {
  /** terminal-notifier 활성화 여부 (기본값: true) */
  enabled?: boolean;
}

/**
 * 로그 설정
 */
export interface LogConfig {
  /** 로그 활성화 여부 (기본값: false) */
  enabled?: boolean;
  /** 로그 레벨 (기본값: info) */
  level?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 개별 알림 타입별 설정
 */
export interface NotificationTypeConfig {
  /** 알림 활성화 여부 */
  enabled: boolean;
  /** 알림 제목 */
  title: string;
  /** 메시지 템플릿 ({message} 플레이스홀더 사용) */
  message_template: string;
  /** 사용할 알림 채널 목록 */
  channels: ('terminal-notifier' | 'ntfy')[];
}

/**
 * 알림 설정 (타입별)
 */
export interface NotificationsConfig {
  /** permission_prompt 알림 설정 */
  permission_prompt?: NotificationTypeConfig;
  /** idle_prompt 알림 설정 */
  idle_prompt?: NotificationTypeConfig;
  /** auth_success 알림 설정 */
  auth_success?: NotificationTypeConfig;
  /** elicitation_dialog 알림 설정 */
  elicitation_dialog?: NotificationTypeConfig;
  /** stop 이벤트 알림 설정 */
  stop?: NotificationTypeConfig;
}

/**
 * 애플리케이션 설정
 */
export interface Config {
  /** ntfy 푸시 알림 설정 */
  ntfy: NtfyConfig;
  /** terminal-notifier 로컬 알림 설정 */
  terminal_notifier: TerminalNotifierConfig;
  /** 로그 설정 */
  log: LogConfig;
  /** 터미널이 활성화되어 있을 때 알림 스킵 여부 (기본값: true) */
  skip_when_active?: boolean;
  /** 알림 타입별 설정 */
  notifications?: NotificationsConfig;
}

/**
 * 알림 페이로드
 */
export interface NotificationPayload {
  /** 알림 제목 */
  title: string;
  /** 알림 메시지 */
  message: string;
  /** 알림 우선순위 (1: min, 3: default, 5: high) */
  priority?: 1 | 2 | 3 | 4 | 5;
  /** 알림 클릭 시 활성화할 앱의 Bundle ID (terminal-notifier 전용) */
  activateBundleId?: string;
}

/**
 * 알림 채널 타입 상수
 */
export const CHANNEL_TYPES = {
  TERMINAL_NOTIFIER: 'terminal-notifier',
  NTFY: 'ntfy',
} as const;

export type ChannelType = (typeof CHANNEL_TYPES)[keyof typeof CHANNEL_TYPES];

/**
 * 알림 어댑터 인터페이스
 */
export interface Adapter {
  /** 알림 전송 */
  send(payload: NotificationPayload): Promise<void>;
}
