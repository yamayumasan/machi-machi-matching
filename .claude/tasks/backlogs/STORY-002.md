# STORY-002: API パッケージの TypeScript 型エラー 69 件を解消

## Meta
- **project**: machi-machi-matching
- **status**: backlog
- **created**: 2026-05-31
- **priority**: medium

## Project
- **branch**: story/STORY-002（未作成）
- **base**: main
- **related-user-stories**: [STORY-001](../reviews/STORY-001.md)

## Description

STORY-001（Apple 審査対応）の作業中、`packages/api` で `pnpm exec tsc --noEmit` を実行すると **69 件の型エラー** が出ることが判明した。Railway 上の本番 API は ts-node-esm / tsx で動いており実害は出ていないが、CI を入れた瞬間に red になる状態。STORY-001 のスコープ外として保留し、ここで独立ストーリー化する。

### 主な症状

```
src/lib/prisma.ts(1,10): error TS2305: Module '"@prisma/client"' has no exported member 'PrismaClient'.
src/__tests__/helpers/prisma.mock.ts(2,15): error TS2305: ... 'PrismaClient'.
src/routes/recruitments.ts(12,10): error TS2305: ... 'Area' / 'RecruitmentStatus' / 'ApplicationStatus' / 'OfferStatus'.
src/routes/auth.ts(138,42): error TS7006: Parameter 'i' implicitly has an 'any' type.   # ←ほぼ全ルートで多発
src/routes/recruitments.ts(1370,46): error TS2339: Property '_avg' does not exist on type '{}'.
```

エラー対象ファイル（11 件、合計 69 エラー）:

- `src/__tests__/helpers/prisma.mock.ts`
- `src/lib/blockFilter.ts`
- `src/lib/prisma.ts`
- `src/routes/auth.ts`
- `src/routes/groups.ts`
- `src/routes/moderation.ts`
- `src/routes/notifications.ts`
- `src/routes/recruitments.ts`
- `src/routes/users.ts`
- `src/routes/wantToDos.ts`
- `src/services/notificationService.ts`

### 根本原因の最有力仮説

1. **Prisma Client が再生成されていない**: `@prisma/client` v6 以降は `prisma generate` で `.prisma/client` 配下に型を吐く。これが古い / Workspace 解決ミスで `PrismaClient` 型が消えている → 型情報が `any` になり、配列メソッドのコールバック引数も `any` 推論される、という連鎖が起きている可能性。
2. **`tsconfig.json` の `strict` / `noImplicitAny` が後から有効化された**: 既存コードが暗黙 any 前提で書かれており、その後 strict 化された場合に多発する。
3. **`recruitments.ts:1370` の `_avg` / `_count` プロパティ欠落**: Prisma aggregate 結果の型が `{}` に推論されている = `prisma.recruitment.aggregate({ _avg: { ... } })` の型が解決されていない。これも Prisma Client 再生成で直る可能性が高い。

### 副次的に確認したい事項

- `pnpm prisma generate` を実行すれば `@prisma/client` の export 群が復活するか
- 復活後も残る implicit any はどの程度か
- `tsconfig.json` の strict 設定の差分（mobile vs api）
- CI で `pnpm typecheck` を回す前提条件としてどこまで直す必要があるか

## Acceptance Criteria

- [ ] `pnpm --filter @machi/api exec tsc --noEmit` がエラー 0 件で通る
- [ ] `pnpm --filter @machi/api test` が引き続き通る（実行時挙動を壊さない）
- [ ] Prisma 型の再生成手順を README または CLAUDE.md に明記（次回開発者が踏まない）
- [ ] CI（あれば）に typecheck ステップを追加（再発防止）

## やらないこと（スコープ外）

- 機能追加・リファクタリング
- Mobile パッケージ側の型エラー（別途確認）
- Prisma スキーマの変更

## 実装メモ

1. まず `pnpm prisma generate` を実行してエラー件数の変化を見る
2. それで `TS2305` 系（export なし）が消えれば、残りは純粋な implicit any → 各コールバック引数に型注釈を追加するだけ
3. 大量の `.map((x) => ...)` / `.filter((x) => ...)` は `Array.prototype.map` 等の型推論が効くはずだが、Prisma の戻り値型が解決されていないと連鎖して any になる。Prisma 修復が先。
4. `recruitments.ts:1370` の `_avg` / `_count` 問題は aggregate query の型推論。Prisma 修復後に再評価。

## 参考

- 検出ログ: 2026-05-31 STORY-001 作業中
- 関連: [packages/api/tsconfig.json](../../../packages/api/tsconfig.json), [packages/prisma/schema.prisma](../../../packages/prisma/schema.prisma)
