# claude-notify

Claude Code 알림 훅 시스템 for macOS

![TypeScript](https://img.shields.io/badge/TypeScript-ES2022-3178c6?style=flat-square)
![Node](https://img.shields.io/badge/Runtime-Node%2018%2B-339933?style=flat-square)
![Bun](https://img.shields.io/badge/Build-Bun-f471b6?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 개요

**claude-notify**는 Claude Code 의 hooks 시스템과 통합되는 알림 매니저입니다. 시스템 상태(터미널 활성화, 화면 잠금 등)에 따라 알림 채널을 자동으로 선택하여 적절한 시점에 사용자에게 알림을 전달합니다.

### 주요 특징

- **스마트 알림 라우팅**: 시스템 상태를 감지하여 최적의 알림 채널 자동 선택
  - 터미널 활성화 → 알림 스킵 (이미 화면 보고 있음)
  - 화면 잠금 → ntfy 푸시 (모바일)
  - 터미널 비활성 → terminal-notifier (로컬 macOS 알림)
- **다중 알림 채널**: terminal-notifier(로컬)와 ntfy(모바일 푸시) 어댑터 지원
- **커스터마이징 가능**: JSON 설정으로 알림 타입별 채널, 메시지 템플릿 설정
- **환경변수 오버라이드**: 설정 파일 없이 환경변수로도 커스터마이징 가능

## 설치

### 플러그인으로 설치 (권장)

Claude Code 플러그인으로 설치하면 훅 등록이 자동으로 됩니다. `~/.claude/settings.json` 을 직접 편집할 필요가 없습니다.

```bash
# 1. 마켓플레이스 등록 (최초 1회)
/plugin marketplace add socoolbear/cc-marketplace

# 2. 설치
/plugin install claude-notify@socoolbear-cc-marketplace

# 3. ntfy 토픽 설정 + 동작 확인
/claude-notify:notify-setup
```

문제가 생기면 `/claude-notify:notify-doctor` 로 진단할 수 있습니다.

**사전 요구사항**

| 항목 | 용도 | 설치 |
|------|------|------|
| `terminal-notifier` | macOS 로컬 알림 | `brew install terminal-notifier` |
| Node.js 18+ | 훅 실행 | Claude Code 사용자면 대부분 이미 있습니다 |

### 수동 설치 (플러그인을 쓰지 않는 경우)

```bash
bun install
make install        # dist/claude-notify.mjs → ~/.local/bin/claude-notify
```

빌드에는 [Bun](https://bun.sh) 이 필요하지만, 산출물은 shebang 이 붙은 Node 스크립트라 **실행에는 Bun 이 필요하지 않습니다.**

이 경로로 설치하면 훅은 직접 등록해야 합니다 — 아래 [Claude Code 훅 설정](#claude-code-훅-설정) 참고.


## 설정

### 설정 파일 생성

`~/.config/claude-notify/config.json` 파일을 생성하여 알림 동작을 커스터마이징할 수 있습니다.

#### 기본 설정 (자동 생성)

설정 파일을 생성하지 않으면 다음의 기본값이 적용됩니다:

```json
{
  "ntfy": {
    "server": "https://ntfy.sh",
    "topic": ""
  },
  "terminal_notifier": {
    "enabled": true
  },
  "log": {
    "enabled": false,
    "level": "info"
  },
  "skip_when_active": true
}
```

**ntfy 토픽에는 기본값이 없습니다.** 잘 알려진 토픽명을 기본값으로 두면 설정하지 않은 사용자의 알림 내용이 공개 토픽으로 새어나가기 때문입니다. 토픽이 비어 있으면 ntfy 발송을 건너뛰고 terminal-notifier 로만 알립니다. `/claude-notify:notify-setup` 이나 `NTFY_TOPIC` 으로 토픽을 정하세요.

#### 전체 설정 예시

```json
{
  "ntfy": {
    "server": "https://ntfy.sh",
    "topic": "my-claude-topic",
    "token": "your-optional-auth-token"
  },
  "terminal_notifier": {
    "enabled": true
  },
  "log": {
    "enabled": true,
    "level": "debug"
  },
  "skip_when_active": true,
  "notifications": {
    "permission_prompt": {
      "enabled": true,
      "title": "Claude Code",
      "message_template": "권한 요청: {message}",
      "channels": ["terminal-notifier", "ntfy"]
    },
    "idle_prompt": {
      "enabled": true,
      "title": "Claude Code",
      "message_template": "유휴 시간 알림: {message}",
      "channels": ["ntfy"]
    },
    "auth_success": {
      "enabled": true,
      "title": "Claude Code",
      "message_template": "인증 성공: {message}",
      "channels": ["terminal-notifier"]
    },
    "elicitation_dialog": {
      "enabled": true,
      "title": "Claude Code",
      "message_template": "{message}",
      "channels": ["terminal-notifier", "ntfy"]
    },
    "stop": {
      "enabled": true,
      "title": "Claude Code",
      "message_template": "세션 종료: {reason}",
      "channels": ["terminal-notifier"]
    }
  }
}
```

### 환경변수 오버라이드

설정 파일 없이 환경변수로도 설정할 수 있습니다:

```bash
# ntfy 설정
export NTFY_SERVER="https://ntfy.sh"
export NTFY_TOPIC="my-topic"
export NTFY_TOKEN="my-token"

# 로깅 설정
export CLAUDE_NOTIFY_LOG=true
export CLAUDE_NOTIFY_LOG_LEVEL=debug

# claude-notify 실행
echo '{"hook_event_name":"Notification","notification_type":"permission_prompt","message":"test"}' | claude-notify
```

| 환경변수 | 용도 |
|----------|------|
| `NTFY_SERVER` / `NTFY_TOPIC` / `NTFY_TOKEN` | ntfy 설정 오버라이드 |
| `CLAUDE_NOTIFY_LOG` / `CLAUDE_NOTIFY_LOG_LEVEL` | 파일 로깅 활성화와 레벨 |
| `CLAUDE_NOTIFY_FORCE` | 강제 발송 모드 — 터미널 활성 스킵과 채널 축소를 무시하고 설정된 모든 채널로 발송합니다. 설치 직후 동작 확인용입니다 |

```bash
# 터미널을 보고 있어도 두 채널 모두로 발송해 동작 확인
echo '{"hook_event_name":"Notification","notification_type":"permission_prompt","message":"연결 테스트"}' \
  | CLAUDE_NOTIFY_FORCE=true claude-notify
```

## Claude Code 훅 설정

> 플러그인으로 설치했다면 이 절은 건너뛰세요. 플러그인의 `hooks/hooks.json` 이 훅을 자동으로 등록합니다.
> 플러그인과 수동 훅을 함께 두면 **알림이 두 번 갑니다.**

수동 설치 시에는 `~/.claude/settings.json` 을 다음과 같이 수정하세요:

```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.local/bin/claude-notify"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.local/bin/claude-notify"
          }
        ]
      }
    ]
  }
}
```

그러면 Claude Code에서 다음 이벤트 발생 시 자동으로 `claude-notify`가 실행됩니다:

| 이벤트 | 발생 시점 |
|--------|----------|
| `Notification` | 권한 요청, 유휴 대기, 인증 성공, 사용자 입력 대화 |
| `Stop` | 세션 종료 |

## 사용 예시

### 1. 기본 사용 (Claude Code 자동 훅)

Claude Code의 훅으로 설정된 경우, 사용자가 개입할 필요 없이 자동으로 실행됩니다.

### 2. 수동 테스트

```bash
# Notification 이벤트 테스트
echo '{
  "hook_event_name": "Notification",
  "notification_type": "permission_prompt",
  "message": "API 권한이 필요합니다",
  "session_id": "session-123",
  "timestamp": "2025-02-03T10:00:00Z"
}' | claude-notify

# Stop 이벤트 테스트
echo '{
  "hook_event_name": "Stop",
  "session_id": "session-123",
  "stop_reason": "completed",
  "timestamp": "2025-02-03T10:05:00Z"
}' | claude-notify
```

### 3. 로깅 활성화로 디버깅

```bash
CLAUDE_NOTIFY_LOG=true CLAUDE_NOTIFY_LOG_LEVEL=debug echo '{...}' | claude-notify
cat ~/.config/claude-notify/notify.log
```

## 개발 가이드

### 개발 환경 구성

```bash
# 1. 저장소 클론 및 의존성 설치
git clone <repository>
cd claude-notify
bun install

# 2. 개발 모드 실행
bun run dev

# 3. 코드 테스트
echo '{...}' | bun run dev
```

### 사용 가능한 명령어

```bash
# Node 실행용 단일 파일 번들 (dist/claude-notify.mjs)
bun run build

# Bun 단일 실행 바이너리 (선택 — Node 없이 쓰고 싶을 때)
bun run build:binary

# 개발 모드 (핫 리로드 없음)
bun run dev

# 테스트 실행
bun test

# 린트 체크 (Biome)
bun run lint

# 자동 포맷팅 (Biome)
bun run fmt

# Makefile 명령어
make build          # dist/claude-notify.mjs 번들 생성
make build-binary   # Bun 단일 실행 바이너리
make install        # ~/.local/bin/claude-notify 로 설치
make plugin-sync    # 번들을 cc-marketplace 플러그인으로 복사
make test           # 테스트 실행
make clean          # 빌드 산출물 삭제
```

`make plugin-sync` 의 복사 위치는 `CC_MARKETPLACE` 로 바꿀 수 있습니다:

```bash
make plugin-sync CC_MARKETPLACE=~/some/other/cc-marketplace
```

### 프로젝트 구조

```
src/
├── index.ts                 # 엔트리포인트: stdin에서 JSON 읽고 이벤트 라우팅
├── types.ts                 # TypeScript 타입 정의 (HookInput, Config 등)
├── config.ts                # 설정 파일 로드 (기본값 머징 포함)
├── logger.ts                # 파일 로깅 (토글 가능)
├── handlers/
│   ├── notification.ts      # Notification 이벤트 처리 및 스마트 채널 선택
│   ├── stop.ts              # Stop 이벤트 처리
│   └── index.ts             # 핸들러 재공급(barrel export)
├── adapters/
│   ├── base.ts              # Adapter 인터페이스
│   ├── terminal-notifier.ts # macOS 네이티브 알림
│   ├── ntfy.ts              # ntfy.sh HTTP API 클라이언트
│   └── index.ts             # 어댑터 재공급(barrel export)
└── utils/
    ├── env.ts               # 환경변수 읽기, HOME fallback, 강제 모드 판정
    ├── exec.ts              # execFile 기반 외부 명령 실행 (셸 미경유)
    ├── channel-selector.ts  # 시스템 상태 → 알림 채널 결정
    ├── sanitize.ts          # 훅 입력 검증, 제어 문자 제거
    ├── state-detector.ts    # 화면 잠금/터미널 상태 감지
    ├── terminal-detector.ts # 터미널 앱 Bundle ID 관리
    └── index.ts             # 유틸리티 재공급(barrel export)
```

외부 명령은 모두 `utils/exec.ts` 의 `runCommand` 를 거칩니다. `execFile` 로 인자를 배열 전달하므로 셸을 경유하지 않고, 따라서 명령 주입이 성립하지 않습니다.

### 코딩 스타일

이 프로젝트는 다음 가이드라인을 따릅니다:

- **Early return**: 중첩 조건문 대신 조기 반환 사용
- **Immutability**: 불변 패턴 선호
- **Optional chaining**: `?.` 적극 활용
- **Nullish coalescing**: `??` 사용 (`||` 대신)
- **Path alias**: `@/` prefix를 사용한 절대 경로 임포트

Biome으로 자동 포맷팅:

```bash
bun run fmt
```

### 새로운 기능 추가

1. **타입 정의**: `src/types.ts`에 새로운 타입 추가
2. **구현**: 적절한 핸들러/어댑터 파일에 로직 구현
3. **테스트**: `tests/*.test.ts` 파일에 테스트 작성
4. **포맷 및 린트**: `bun run fmt && bun run lint`

## 트러블슈팅

플러그인으로 설치했다면 `/claude-notify:notify-doctor` 가 아래 항목을 한 번에 점검합니다.

### terminal-notifier가 설치되지 않음

```bash
# Homebrew로 설치
brew install terminal-notifier

# 설치 확인
which terminal-notifier
```

### ntfy 푸시 알림이 작동하지 않음

0. 토픽이 설정돼 있는지부터 확인하세요. 기본값이 없으므로 **토픽이 비어 있으면 ntfy 발송을 건너뜁니다.** 로그에 다음이 남습니다:

```
[WARN] Ntfy: 토픽이 설정되지 않아 발송을 건너뜁니다 (/notify-setup 또는 NTFY_TOPIC 설정)
```

1. ntfy 토픽이 유효한지 확인:

```bash
curl -d "test message" https://ntfy.sh/your-topic
```

2. 설정 파일의 토픽 이름 확인:

```bash
grep topic ~/.config/claude-notify/config.json
```

3. 로그 활성화하여 디버깅:

```bash
CLAUDE_NOTIFY_LOG=true CLAUDE_NOTIFY_LOG_LEVEL=debug echo '{...}' | claude-notify
tail -f ~/.config/claude-notify/notify.log
```

### 알림이 전혀 전송되지 않음

1. 설정이 정상적으로 로드되는지 확인:

```bash
CLAUDE_NOTIFY_LOG=true echo '{"hook_event_name":"Notification","notification_type":"permission_prompt","message":"test"}' | claude-notify
```

2. 터미널이 활성화되어 있지는 않은지 확인 (skip_when_active 확인):

```json
{
  "skip_when_active": false
}
```

3. 강제 모드로 라우팅 판정을 우회해 발송 자체가 되는지 확인:

```bash
echo '{"hook_event_name":"Notification","notification_type":"permission_prompt","message":"test"}' \
  | CLAUDE_NOTIFY_FORCE=true CLAUDE_NOTIFY_LOG=true CLAUDE_NOTIFY_LOG_LEVEL=debug claude-notify
```

4. 알림이 두 번 온다면 플러그인과 수동 훅이 함께 등록돼 있는지 확인:

```bash
grep -n "claude-notify" ~/.claude/settings.json
```

## 파일 위치

| 항목 | 경로 |
|------|------|
| 설정 파일 | `~/.config/claude-notify/config.json` |
| 로그 파일 | `~/.config/claude-notify/notify.log` |
| 빌드 산출물 | `dist/claude-notify.mjs` |
| 수동 설치 위치 | `~/.local/bin/claude-notify` |
| 플러그인 실행 파일 | `<플러그인 루트>/bin/claude-notify.mjs` |

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.