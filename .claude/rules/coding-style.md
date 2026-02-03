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

## Import Rules (IDE Analysis 통과용)

- **Path alias 사용**: `@/` alias로 src 디렉토리 참조
- **Barrel exports 사용**: 디렉토리에 `index.ts` 생성하여 re-export
- **import 정렬**: Biome `organizeImports` 규칙 준수 (알파벳 순, `@/` 먼저)

```typescript
// ❌ Bad - 상대 경로 사용
import { getEnv } from './utils/env';
import { createNtfyAdapter } from '../adapters/ntfy';
import { debug } from '../logger';

// ✅ Good - path alias + barrel export 사용
import { debug } from '@/logger';
import { createNtfyAdapter } from '@/adapters';
import { getEnv } from '@/utils';
```

### tsconfig.json Path Alias 설정

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Barrel 파일 작성 규칙

```typescript
// src/utils/index.ts
export { getEnv, getBoolEnv, getHome } from './env';
export { detectSystemState } from './state-detector';
```

### throw 안티패턴 주의

```typescript
// ❌ Bad - try 블록 안에서 throw한 예외가 같은 catch에서 잡힘
try {
  if (!response.ok) {
    throw new Error('failed');  // IDE 경고: 'throw' of exception caught locally
  }
} catch (err) {
  throw err;
}

// ✅ Good - try-catch 없이 직접 throw
if (!response.ok) {
  throw new Error('failed');
}
```

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
- `biome check --fix` 로 import 정렬 자동 적용
