.PHONY: build install test lint fmt clean dev

# 기본 타겟
all: build

# 바이너리 빌드
build:
	bun run build

# ~/.local/bin에 설치
install: build
	mkdir -p ~/.local/bin
	cp claude-notify ~/.local/bin/
	chmod +x ~/.local/bin/claude-notify

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

# 정리
clean:
	rm -f claude-notify
