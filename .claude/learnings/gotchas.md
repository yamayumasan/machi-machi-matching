# machi-machi-matching — Gotchas

実装中に遭遇したハマりポイントとワークアラウンド。dev-executor が実装前に参照して同じ罠を回避するための記録。

## Format

各エントリは以下の構造で記載する:

### YYYY-MM-DD: 短いタイトル

- **問題**: 観測された現象
- **原因**: 根本原因（推測の場合は明記）
- **対処**: 解決策・ワークアラウンド
- **影響範囲**: 関連するファイル/モジュール
- **関連story**: STORY-NNN（あれば）

---

<!-- 以下、新規エントリを追加 -->

### 2026-04-29: EXPO_PUBLIC_* 系env が EAS 本番ビルドで空になる

- **問題**: TestFlight / production ビルドでログイン時に "ネットワークエラー"。Apple 審査でも却下（Guideline 2.1, iPad Air 11-inch M3）
- **原因**: `EXPO_PUBLIC_*` 系env は **ビルド時に JS バンドルへ焼き込まれる**。eas.json に `env` セクションがなく、かつ EAS Secrets も未設定だと `process.env.EXPO_PUBLIC_SUPABASE_URL` が `undefined` → `'' (空文字)` になり Supabase auth が不正URLを叩く
- **対処**:
  1. 共通値（API URL 等）は eas.json の build profile 内 `env` ブロックに直接書く
  2. クライアント露出して問題ないが管理したい値（Supabase anon key 等）は `eas secret:create --scope project --name EXPO_PUBLIC_*` で登録 → ビルド時に自動 expose
  3. ランタイムで必須env欠損を `console.error` で気づける仕組みを入れる（[packages/mobile/src/config/env.ts](../../packages/mobile/src/config/env.ts) の `getEnvHealth()` 参照）
- **影響範囲**: `packages/mobile/src/config/env.ts`, `eas.json`, EAS Secrets 設定
- **関連story**: STORY-001

