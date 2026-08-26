# AGENTS.md - AI Agent Guide

> AI 에이전트가 이 프로젝트를 효과적으로 이해하고 작업할 수 있도록 작성된 가이드입니다.

## 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **이름** | claude-notify |
| **목적** | Claude Code 알림 훅 시스템 (macOS) |
| **언어** | TypeScript (ES2022) |
| **런타임** | Node 18+ (배포·훅 실행) / Bun (개발·빌드·테스트) |
| **린터/포매터** | Biome |

### 핵심 기능

- 시스템 상태(터미널 foreground, 화면 잠금 등)에 따라 알림 채널 자동 선택
- terminal-notifier(로컬)와 ntfy(모바일) 어댑터 지원
- JSON 설정 파일로 알림 타입별 커스터마이징
- cc-marketplace 의 `claude-notify` 플러그인으로 배포 (훅 자동 등록)

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
    ├── env.ts               # 환경변수 읽기, HOME fallback, 강제 모드 판정
    ├── exec.ts              # execFile 기반 외부 명령 실행 (셸 미경유)
    ├── channel-selector.ts  # 시스템 상태 → 알림 채널 결정
    ├── sanitize.ts          # 훅 입력 검증, 제어 문자 제거
    ├── state-detector.ts    # 화면 잠금/터미널 상태 감지
    └── terminal-detector.ts # 터미널 앱 Bundle ID 관리
```

**소스는 Bun API 를 쓰지 않습니다.** 외부 명령은 `utils/exec.ts` 의 `runCommand` (`node:child_process.execFile`), 파일 읽기는 `node:fs/promises`, stdin 은 `process.stdin` 비동기 순회를 씁니다. Bun 은 빌드(`bun build`)와 테스트(`bun:test`)에만 씁니다 — 새 코드에 `Bun.*` 나 bun `$` 를 도입하지 마세요. 번들이 Node 로 실행되지 않게 됩니다.

---

## 빌드 및 테스트 명령어

```bash
bun install           # 의존성 설치
bun run build         # Node 실행용 단일 파일 번들 (dist/claude-notify.mjs)
bun run build:binary  # Bun 단일 실행 바이너리 (선택)
bun run dev           # 개발 모드 실행
bun test              # 테스트 실행
bun run lint          # Biome 린트
bun run fmt           # Biome 포맷
```

**Makefile:**
```bash
make build            # dist/claude-notify.mjs 번들 생성
make build-binary     # Bun 단일 실행 바이너리
make install          # ~/.local/bin/claude-notify 로 설치
make plugin-sync      # 번들을 cc-marketplace 플러그인으로 복사 (CC_MARKETPLACE 로 경로 지정)
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

### 배포 경로

| 경로 | 대상 | 훅 등록 |
|------|------|---------|
| cc-marketplace 플러그인 (권장) | `/plugin install claude-notify@socoolbear-cc-marketplace` | 플러그인의 `hooks/hooks.json` 이 자동 등록 |
| 수동 설치 | `make install` | `~/.claude/settings.json` 직접 편집 |

플러그인 번들 갱신은 `make plugin-sync` 로 합니다. 소스를 고쳤으면 이 명령으로 cc-marketplace 쪽 `plugins/claude-notify/bin/claude-notify.mjs` 를 다시 만들어야 반영됩니다.

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
- `CLAUDE_NOTIFY_FORCE=true` — 터미널 활성 스킵과 채널 축소를 무시하고 설정된 모든 채널로 발송 (동작 확인용)

**ntfy 토픽에는 기본값이 없습니다.** 잘 알려진 토픽명을 기본값으로 두면 설정하지 않은 사용자의 알림이 공개 토픽으로 새어나갑니다. 토픽이 비어 있으면 ntfy 발송을 건너뜁니다 — 이 동작을 되돌리지 마세요.

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

- [ ] `bun test` 통과
- [ ] `bun run lint` 통과
- [ ] `bun run build` 성공
- [ ] 번들이 Node 로 실행되는지 확인 (`echo '{...}' | node dist/claude-notify.mjs`)
- [ ] 기존 기능 영향 없음
- [ ] 새 파일/디렉토리 올바른 위치에 생성
