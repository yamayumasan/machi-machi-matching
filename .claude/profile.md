# Project: machi-machi-matching

## Meta
- **path**: ~/Projects/machi-machi-matching
- **repo**: https://github.com/yamayumasan/machi-machi-matching.git
- **stack**: TypeScript monorepo (pnpm workspace) — Hono API + Expo (iOS) Mobile + Prisma + Shared types
- **package-manager**: pnpm@8.15.0
- **pr-template**: (none)

## Branches
- **default**: main
- **development**: main

## Commands
- **dev**: pnpm dev
- **build**: pnpm build
- **test**: pnpm test
- **typecheck**: pnpm --filter @machi/api exec tsc --noEmit && pnpm --filter @machi/mobile typecheck
- **lint**: pnpm lint

## Quality Gates
- build: must pass
- typecheck: must pass
- test: must pass

## Architecture Notes

地域密着型活動マッチングサービス（iOS）。pnpm workspace モノレポで以下3パッケージ:
- `packages/api` — Hono API サーバー (Prisma ORM, Jest+ESM テスト)
- `packages/mobile` — Expo Router ベースの iOS アプリ (jest-expo)
- `packages/shared` — 共通型定義・Zod スキーマ

DB は Prisma（`prisma/schema.prisma`）。デプロイは Railway / Nixpacks。

## Special Instructions

- `.env`, `.env.*` は変更しない
- `prisma/schema.prisma` 変更後は `pnpm prisma generate` を必ず実行
- デザインは `.claude/rules/design-guidelines.md` に従う
- App Store Connect / Railway の環境変数操作は人間タスク（自律実装スキップ）
- 既存の `TASK_PROGRESS.md` ベースのループとは独立。task-level story は `.claude/tasks/` で管理
- `develop` ブランチは未作成のため `development` も `main` を指す。必要になったら更新
