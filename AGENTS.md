# AGENTS.md - AI Agent Guide

> AI 에이전트가 이 프로젝트를 효과적으로 이해하고 작업할 수 있도록 작성된 가이드입니다.

## 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **이름** | claude-notify |
| **목적** | Claude Code 알림 훅 시스템 (macOS) |
| **언어** | TypeScript (ES2022) |
| **런타임** | Bun |
| **린터/포매터** | Biome |

### 핵심 기능

- 시스템 상태(터미널 foreground, 화면 잠금 등)에 따라 알림 채널 자동 선택
- terminal-notifier(로컬)와 ntfy(모바일) 어댑터 지원
- JSON 설정 파일로 알림 타입별 커스터마이징

---

## 디렉토리 구조

```
src/
├── index.ts                 # 엔트리포인트: stdin에서 JSON 읽고 이벤트 라우팅
├── types.ts                 # HookInput, Config 등 타입 정의
├── config.ts                # ~/.config/claude-notify/config.json 로드
├── logger.ts                # 토글 가능한 파일 로깅
├── handlers/
│   ├── notification.ts      # Notification 이벤트 + 스마트 알림 결정
│   └── stop.ts              # Stop 이벤트 처리
├── adapters/
│   ├── base.ts              # Adapter 인터페이스
│   ├── terminal-notifier.ts # macOS 네이티브 알림
│   └── ntfy.ts              # ntfy.sh HTTP API
└── utils/
    ├── env.ts               # HOME 환경변수 fallback
    ├── state-detector.ts    # 화면 잠금/터미널 상태 감지
    └── terminal-detector.ts # 터미널 앱 Bundle ID 관리
```

---

## 빌드 및 테스트 명령어

```bash
bun install           # 의존성 설치
bun run build         # 바이너리 컴파일 (./claude-notify 생성)
bun run dev           # 개발 모드 실행
bun test              # 테스트 실행
bun run lint          # Biome 린트
bun run fmt           # Biome 포맷
```

**Makefile:**
```bash
make build            # 바이너리 빌드
make install          # ~/.local/bin에 설치
make test             # 테스트 실행
make clean            # 빌드 산출물 삭제
```

---

## 아키텍처

### 스마트 알림 흐름

```
1. stdin으로 Claude Code Hook JSON 수신
2. 시스템 상태 감지 (터미널 foreground? 화면 잠금?)
3. 알림 결정:
   - terminal_active → 스킵 (이미 터미널 보고 있음)
   - screen_locked → ntfy만 (모바일 푸시)
   - away_from_terminal → terminal-notifier (로컬)
```

### Claude Code Hook 이벤트

| Event | 용도 |
|-------|------|
| `Notification` | permission_prompt, idle_prompt, auth_success, elicitation_dialog |
| `Stop` | 세션 종료 알림 |

### 어댑터 패턴

- `Adapter` 인터페이스 (`src/adapters/base.ts`)
- `TerminalNotifierAdapter` - macOS 네이티브 알림
- `NtfyAdapter` - ntfy.sh HTTP API를 통한 모바일 푸시

---

## 설정

**설정 파일:** `~/.config/claude-notify/config.json`
**로그 파일:** `~/.config/claude-notify/notify.log`
**바이너리:** `~/.local/bin/claude-notify`

**환경변수 오버라이드:**
- `NTFY_SERVER`, `NTFY_TOPIC`, `NTFY_TOKEN`
- `CLAUDE_NOTIFY_LOG=true`, `CLAUDE_NOTIFY_LOG_LEVEL=debug`

---

## 코딩 스타일

자세한 내용은 `.claude/rules/coding-style.md` 참조.

### 핵심 원칙

- **Early return**: 중첩 조건문 대신 조기 반환 사용
- **빈 줄 추가**: 변수 선언과 제어문/함수 호출 사이에 빈 줄 추가
- **Immutability**: 불변 패턴 선호
- **Single responsibility**: 함수는 단일 책임 원칙 준수

### TypeScript 규칙

- Nullish coalescing `??` 사용
- Optional chaining `?.` 적극 활용
- `any` 사용 지양

### Biome 설정

- Single quotes, semicolons, trailing commas
- 들여쓰기: 2 spaces
- 줄 너비: 100자

---

## AI 응답 가이드라인

### 언어

- 모든 응답은 **한국어**로 작성
- Git 커밋 메시지도 **한국어**로 작성
- 영어와 한국어 혼용 시 **띄어쓰기 추가** (예: "Makefile 에서")

### 타겟 환경

- **macOS** 사용자 대상
- Homebrew, XDG Base Directory 사용 가정
- Shell: zsh

### 작업 위임

| 작업 유형 | 권장 에이전트 | 모델 |
|-----------|--------------|------|
| TypeScript 코드 수정 | `executor` | sonnet |
| 설정 파일 추가 | `executor-low` | haiku |
| 문서 작성 | `writer` | haiku |
| 구조 분석 | `explore` | haiku |
| 복잡한 디버깅 | `architect` | opus |

---

## 테스트 예시

```bash
# 통합 테스트 예시
echo '{"hook_event_name":"Notification","notification_type":"permission_prompt","message":"test"}' | bun run dev

# 로깅 활성화 테스트
CLAUDE_NOTIFY_LOG=true bun run dev < test-input.json
```

---

## 검증 체크리스트

작업 완료 전 반드시 확인:

- [ ] `bun run lint` 통과
- [ ] `bun run build` 성공
- [ ] 기존 기능 영향 없음
- [ ] 새 파일/디렉토리 올바른 위치에 생성
