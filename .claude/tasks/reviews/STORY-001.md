# STORY-001: 本番ビルドのログイン時ネットワークエラー解消（Apple審査却下対応）

## Meta
- **project**: machi-machi-matching
- **status**: review
- **created**: 2026-04-29
- **priority**: high

## Project
- **branch**: story/STORY-001
- **base**: main
- **related-user-stories**:

## Description

Apple App Review（2026-03-03、Submission ID: 9ae058dc-a078-4773-b5f6-fb4f27ecba5f, ビルド version 1.0）にて
**Guideline 2.1 - Performance: App Completeness** で却下。

> Bug description: Your app displayed a network error when we tried to log in.
> Review Device: iPad Air 11-inch (M3) / iPadOS 26.2.1

V2 計画（[docs/APPLE_REVIEW_RESPONSE_V2.md](/Users/yuma/Projects/machi-machi-matching/docs/APPLE_REVIEW_RESPONSE_V2.md)）で `supportsTablet: true` 化により iPad での審査が走り、本番ビルド固有の通信問題が顕在化したと推測。

### 根本原因の最有力仮説

[eas.json](/Users/yuma/Projects/machi-machi-matching/eas.json) の `build.production` に **`env` キーが存在しない**。
[packages/mobile/src/config/env.ts:18-20](/Users/yuma/Projects/machi-machi-matching/packages/mobile/src/config/env.ts#L18-L20) では:

```ts
supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
```

`EXPO_PUBLIC_*` 系は **EAS ビルド時に env として注入されない限りバンドルに焼き付かない**。
結果、本番ビルドでは Supabase URL/Key が空文字のまま `supabase.auth.signInWithPassword(...)` が呼ばれ、
不正な URL でのリクエスト失敗（"ネットワークエラー"）として現出する。

API URL も同様だが [config/env.ts:14-16](/Users/yuma/Projects/machi-machi-matching/packages/mobile/src/config/env.ts#L14-L16) には
Railway URL のハードコードフォールバックがあるためメール/パスワードログインの初段（Supabase auth）で先に失敗する。

### 副次的に確認したい事項

- iPad で `Platform.OS === 'ios'` & `usesAppleSignIn: true` の状態で Apple ボタンが表示されているか
- iPad で Google OAuth リダイレクトが期待どおり動くか
- ATS（App Transport Security）で許可されない通信先がないか

## Acceptance Criteria

- [ ] **本番ビルドで Supabase URL/anon key が正しくバンドルされる**: 実機 or TestFlight ビルドで `console.log(config.supabaseUrl)` が空でないこと
- [ ] **本番ビルドでメール/パスワードログインが成功する**: TestFlight ビルドで test_user_0 等の有効アカウントでログインできること
- [ ] **iPad（iPad Air 11-inch M3 シミュレータ または実機）でログイン画面が正しく表示される**: メール/Google/Apple の3導線すべてが iPad レイアウトで操作可能
- [ ] **iPad でメール/パスワードログインが成功する**
- [ ] **iPad で Sign in with Apple ボタンが表示され、認証が成功する**
- [ ] **TestFlight でデモアカウント（審査用）でのログインを目視確認できる**
- [ ] eas.json の production / preview に env が定義され、必要キー（`EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`）が網羅されている
- [ ] 本番ビルド向けの簡易な「環境設定健全性チェック」（起動時に必須env欠損を検出してログ出力）が追加されている
- [ ] 審査ノート（App Store Connect）に修正内容が追記されている
- [ ] 新ビルドが EAS で生成され、TestFlight 配布可能な状態になる（再申請の最終承認は人間操作）

## Implementation Notes

### 1. eas.json の修正（最優先）

`build.production` および `build.preview` に `env` セクションを追加:

```json
"production": {
  "extends": "base",
  "channel": "production",
  "ios": { "resourceClass": "m-medium" },
  "env": {
    "EXPO_PUBLIC_API_URL": "https://machiapi-production.up.railway.app/api",
    "EXPO_PUBLIC_SUPABASE_URL": "<supabase project url>",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "<anon key>"
  }
}
```

ANON KEY は public なクライアント鍵だがコミット前に EAS Secrets への移行も検討する
（`eas secret:create` → `env: { "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EAS_SECRET_..." }` 参照）。

### 2. ランタイム健全性チェック追加

[packages/mobile/src/config/env.ts](/Users/yuma/Projects/machi-machi-matching/packages/mobile/src/config/env.ts) に
本番モード時の必須env欠損検出を追加。欠損時は `console.error` + 画面上に簡易バナー表示など、
「審査担当者の画面で何が起きているか」を可視化する。

### 3. iPad 動作確認

- iPad Air 11-inch (M3) シミュレータでログイン画面のレイアウト崩れがないか
- Apple サインインボタンが表示されるか（[app/(auth)/login.tsx:147-163](/Users/yuma/Projects/machi-machi-matching/packages/mobile/app/(auth)/login.tsx#L147-L163) は `Platform.OS === 'ios'` のみ条件、iPad でも該当）
- 「supportsTablet: true」が iPad 専用レイアウトを必要としないか確認

### 4. 審査ノート更新

[docs/APPLE_REVIEW_RESPONSE_V2.md](/Users/yuma/Projects/machi-machi-matching/docs/APPLE_REVIEW_RESPONSE_V2.md) に追記または V3 を新規作成し、
今回の env injection 修正内容と検証手順を記録する。

### 5. やらないこと

- API（Hono）側の修正は不要（モバイルのビルド設定問題のため）
- App Store Connect 上のメタデータ操作（人間タスク）
- 新ビルド作成・TestFlight 配布・審査再提出（人間タスク。Implementation 完了後にユーザーが実施）

### 検証手順

1. `eas build -p ios --profile preview` で TestFlight 想定ビルドを作成
2. インストール直後、起動ログで `[ENV] API URL`, `[ENV] Supabase URL` が正しいか確認
3. iPad シミュレータ または実機 iPad でメール/Google/Apple ログインを試行
4. 全導線でログイン成功 → onboarding or tabs 画面に遷移することを目視確認

## Notes

- **Quality Gates**: `pnpm --filter @machi/mobile typecheck`, `pnpm --filter @machi/mobile test` を必ず通す
- 本番 Supabase URL / anon key の実値はコミットしない。EAS Secrets での管理を最終形とする
- `develop` ブランチ未作成のため base は `main`
- 着手時は `tasks/active/STORY-001.md` に移動
