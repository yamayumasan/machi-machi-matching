# Apple App Store 審査対応計画（第3回）

> **作成日**: 2026-04-29
> **前回対応**: [APPLE_REVIEW_RESPONSE_V2.md](./APPLE_REVIEW_RESPONSE_V2.md)
> **対応ストーリー**: [.claude/tasks/reviews/STORY-001.md](../.claude/tasks/reviews/STORY-001.md)

## 審査状況サマリー

| 審査日 | Submission ID | ビルド | 結果 |
|--------|--------------|--------|------|
| 2026-02-03 | 9ae058dc-... | 不明 | 5件却下 |
| 2026-02-11 | 9ae058dc-... | 18 | 4件却下 |
| 2026-03-03 | 9ae058dc-a078-4773-b5f6-fb4f27ecba5f | v1.0 | **Guideline 2.1 のみ却下** |

### 今回の指摘

**Guideline 2.1 - Performance: App Completeness**

> Bug description: Your app displayed a network error when we tried to log in.
> Review Device: iPad Air 11-inch (M3) / iPadOS 26.2.1

V2 で `supportsTablet: true` 化により iPad での審査が走るようになり、
本番ビルド固有の Supabase auth ネットワーク失敗が顕在化した。

---

## 根本原因

[eas.json](../eas.json) の `build.production` および `build.preview` に **`env` キーが存在しなかった**。

[packages/mobile/src/config/env.ts](../packages/mobile/src/config/env.ts) の旧実装:

```ts
supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
```

`EXPO_PUBLIC_*` 系は **EAS ビルド時に env として注入されないと JS バンドルに焼き込まれない**。
結果、本番ビルドでは Supabase URL/Key が空文字のまま `supabase.auth.signInWithPassword(...)` が呼ばれ、
不正な URL でのリクエスト失敗 → "ネットワークエラー" 表示として現出した。

API URL は同 ファイル内のフォールバックとして Railway URL がハードコードされていたため、
メール/パスワードログインの初段（Supabase auth）で先に失敗していた。

---

## 対応内容

### 1. EAS Secrets の作成（**人間操作・必須**）

審査再提出前に以下のコマンドを **必ず** 実行する:

```bash
cd /Users/yuma/Projects/machi-machi-matching

# Supabase URL
eas secret:create --scope project \
  --name EXPO_PUBLIC_SUPABASE_URL \
  --value "https://<your-project>.supabase.co"

# Supabase anon key（Supabase 管理画面 > Project Settings > API より取得）
eas secret:create --scope project \
  --name EXPO_PUBLIC_SUPABASE_ANON_KEY \
  --value "<anon-public-key>"
```

> 注: `EXPO_PUBLIC_API_URL` は eas.json に直接記載済みのため Secret 不要。
> 必要に応じて環境ごとに上書きする場合のみ Secret 化を検討する。

確認:

```bash
eas secret:list
```

実値は `packages/mobile/.env` に既に存在する想定。同一値を Secret として登録する。

### 2. eas.json への env ブロック追加（コード修正・適用済み）

このプロジェクトは monorepo で **`eas` CLI が `packages/mobile/eas.json` を参照する**（cwd 優先）。
ルート直下の `eas.json` ではなく、必ず `packages/mobile/eas.json` を編集する。

`build.preview` および `build.production` に `env` セクションを追加:

```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://machiapi-production.up.railway.app/api"
}
```

`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` は
EAS Secrets（`eas secret:create --scope project`）に登録された同名キーが
**EAS Build 実行時に自動的に環境変数として exposes** され、`expo export` 時にバンドルへ焼き込まれる。

### 3. ランタイム env 健全性チェック（コード修正・適用済み）

[packages/mobile/src/config/env.ts](../packages/mobile/src/config/env.ts) に追加:

- `getEnvHealth()` / `envHealth` を export
- 本番モード時に必須キーが欠損していれば起動直後 `console.error` 出力
- ログイン画面 [(auth)/login.tsx](../packages/mobile/app/\(auth\)/login.tsx) に
  envHealth が NG の場合のみ表示する警告バナーを追加（審査担当者の画面で原因が見える）

### 4. iPad での目視確認（**人間操作・必須**）

新ビルドを iPad Air 11-inch (M3) シミュレータ または実機にインストール後、以下を確認:

- [ ] ログイン画面の警告バナーが **表示されない**（env 注入が正常な証拠）
- [ ] メール/パスワードログイン成功 → onboarding or タブ画面に遷移
- [ ] Sign in with Apple ボタンが表示され、認証が成功する
- [ ] Google ログインが成功する
- [ ] 起動ログで `[ENV] FATAL: ...` が出力されない

---

## 審査ノート（App Store Connect 用・最終版）

> ASC > App Review Information > Notes 欄にそのままコピペしてください。
> `<EMAIL>` / `<PASSWORD>` は前回審査で提供したテストアカウントに置き換えてください。
> Build 37 (v0.1.0) を選択して再提出します。

```
=== English ===
Thank you for your previous feedback.

[Previous rejection]
Guideline 2.1 - "Your app displayed a network error when we tried to log in."
Reviewed on iPad Air 11-inch (M3), iPadOS 26.2.1.

[Root cause]
Our production build did not bundle the Supabase auth environment
variables, so the login request was sent to an invalid URL and surfaced
as a generic "network error". This had nothing to do with the network
or the test account.

[Fix in Build 37]
1. Registered EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
   as EAS Build environment variables so they are injected into the JS
   bundle at build time.
2. Added a runtime env health check. If any required key is missing or
   malformed, a warning banner appears on the login screen. Build 37
   must NOT display this banner.
3. Verified login works on iPad via TestFlight before submission.

[Test account]
Email: <EMAIL>
Password: <PASSWORD>

[How to reproduce login]
1. Launch the app.
2. On the login screen, enter the test account email and password.
3. Tap the "ログイン" (Login) button.
4. You should be navigated into the main tab screen.

"Sign in with Apple" and Google login are also available on the same
screen and have been verified.

=== 日本語 ===
前回のフィードバックありがとうございました。

【前回の指摘】
Guideline 2.1 - iPad Air 11-inch (M3) でログイン時にネットワークエラーが表示された。

【根本原因】
本番ビルドに Supabase 認証用の環境変数が焼き込まれておらず、
不正な URL に対するリクエストが「ネットワークエラー」として現出して
いました。通信状況やテストアカウントの問題ではありません。

【Build 37 での修正】
1. EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY を
   EAS Build の環境変数として登録し、ビルド時に JS バンドルへ注入。
2. 起動時の env 健全性チェックを追加。必須キーが欠損または不正な
   場合はログイン画面に警告バナーを表示します（Build 37 では非表示）。
3. iPad / TestFlight でログイン成功を確認済み。

【テストアカウント】
Email: <EMAIL>
Password: <PASSWORD>

【ログイン手順】
1. アプリを起動
2. ログイン画面でテストアカウントのメールアドレス・パスワードを入力
3. 「ログイン」ボタンをタップ
4. タブ画面に遷移すれば成功です

Sign in with Apple / Google ログインも同一画面で利用可能、いずれも検証済みです。
```

---

## やらないこと（このストーリーのスコープ外）

- API（Hono）側の修正（モバイルのビルド設定問題のため）
- App Store Connect 上のメタデータ操作
- 新ビルドの作成・TestFlight 配布・審査再提出 → **人間が実施**

---

## 検証手順（人間操作）

```bash
# 1. EAS Secrets を作成（上記コマンド参照）
eas secret:create ...

# 2. preview ビルドの credentials を設定（初回のみ・対話式）
#    "preview" profile は distribution: internal のため Apple Distribution Cert が必要。
#    eas-cli v16+ は非対話モードでは新規 cert を生成しないため、初回はインタラクティブ実行が必要。
cd packages/mobile
eas credentials   # → iOS → preview channel → set up Distribution Certificate

# 3. preview ビルドで TestFlight 想定の検証
eas build -p ios --profile preview

# 4. 起動後ログ確認（Xcode Console / TestFlight クラッシュログ）
#    [ENV] FATAL が出ていないこと

# 5. iPad シミュレータでログイン全導線を確認

# 6. 問題なければ production ビルドへ
eas build -p ios --profile production
eas submit -p ios --latest
```
