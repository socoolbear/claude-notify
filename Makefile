.PHONY: build build-binary install uninstall plugin-sync test lint fmt clean dev

# cc-marketplace 로컬 체크아웃 (플러그인 번들을 복사할 위치)
CC_MARKETPLACE ?= $(HOME)/code/portfolio/cc-marketplace
PLUGIN_BIN := $(CC_MARKETPLACE)/plugins/claude-notify/bin

# 기본 타겟
all: build

# Node 실행용 단일 파일 번들 (dist/claude-notify.mjs)
build:
	bun run build

# Bun 단일 실행 바이너리 (선택 — Node 없이 쓰고 싶을 때)
build-binary:
	bun run build:binary

# ~/.local/bin에 설치 (수동 설치 경로. 플러그인을 쓰면 불필요)
install: build
	mkdir -p ~/.local/bin
	cp dist/claude-notify.mjs ~/.local/bin/claude-notify
	chmod +x ~/.local/bin/claude-notify

# 번들을 cc-marketplace 플러그인으로 복사
plugin-sync: build
	@[ -d "$(PLUGIN_BIN)" ] || { echo "ERROR: $(PLUGIN_BIN) 가 없습니다. CC_MARKETPLACE 를 확인하세요."; exit 1; }
	cp dist/claude-notify.mjs $(PLUGIN_BIN)/claude-notify.mjs
	@echo "==> $(PLUGIN_BIN)/claude-notify.mjs 갱신 완료"

# 개발 모드
dev:
	bun run dev

# 테스트
test:
	bun test

# 린트
lint:
	bun run lint

# 포맷
fmt:
	bun run fmt

# 설치 제거
uninstall:
	rm -f ~/.local/bin/claude-notify

# 정리
clean:
	rm -rf dist
