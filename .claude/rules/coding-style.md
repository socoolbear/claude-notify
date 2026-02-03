# Coding Style Rules

## General Principles

- **Early return**: 중첩 조건문 대신 조기 반환 사용
- **빈 줄 추가**: 변수 선언과 제어문/함수 호출 사이에 빈 줄 추가
- **Immutability**: 가변 객체/클래스 사용 지양, 불변 패턴 선호
- **Single responsibility**: 함수는 단일 책임 원칙 준수

## Naming Conventions

- **함수명**: 동사 사용 (예: `createUser`, `sendNotification`, `detectSystemState`)
- **변수명**: 명사 사용 (예: `config`, `hookInput`, `systemState`)

## TypeScript Specific

- Nullish coalescing: `??` 사용 (`||` 대신)
- Optional chaining: `?.` 적극 활용
- Type 정의는 `interface` 우선
- `any` 사용 지양

## Bun Specific

- `Bun.stdin.text()` 사용 (stdin 읽기)
- `$` 태그 사용 (shell 명령 실행)
- `Bun.file()` 사용 (파일 I/O)

## Biome Formatting

- Single quotes 사용
- Semicolons 사용
- Trailing commas 사용
- 들여쓰기: 2 spaces
- 줄 너비: 100자
