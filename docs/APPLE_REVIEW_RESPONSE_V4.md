# Apple App Store 審査対応計画（第4回）

> **作成日**: 2026-06-10
> **前回対応**: [APPLE_REVIEW_RESPONSE_V3.md](./APPLE_REVIEW_RESPONSE_V3.md)

## 審査状況サマリー

| 審査日 | Submission ID | ビルド | 結果 |
|--------|--------------|--------|------|
| 2026-03-03 | 9ae058dc-... | v1.0 | Guideline 2.1（ネットワークエラー）→ V3で修正 |
| 2026-06-07 | 9ae058dc-a078-4773-b5f6-fb4f27ecba5f | 1.0 (37) | **Guideline 2.1 - Information Needed** |

### 今回の指摘

**Guideline 2.1 - Information Needed**

> We were unable to sign in with the following demo account credentials:
> User name: gedozu@appmail.uk / Password: Pass1234
> Review Device: iPad Air 11-inch (M3)

V3 の env 修正でネットワークエラーは解消（ログイン画面まで到達）。
今回は**認証そのものが失敗**している。

---

## 根本原因

- アプリのログインは [packages/mobile/src/stores/auth.ts](../packages/mobile/src/stores/auth.ts) の
  `supabase.auth.signInWithPassword` 一本（メール/パスワードは Supabase Auth 直結）。
- 実機で `Invalid login credentials` が表示される。
- 本番 DB を確認したところ **`gedozu@appmail.uk` が存在しない**。
- `Invalid login credentials`（≠ `Email not confirmed`）= **Supabase Auth 側にもアカウントが無い**。

→ デモアカウントが本番環境に存在しないまま審査に提出されていた。
（DBリセット / 別 Supabase プロジェクトで作成 / 未作成 のいずれか）

ログイン認証は Supabase Auth の `auth.users` を見るため、
Prisma `User` テーブルにデータを入れるだけでは解決しない点に注意。

---

## 対応内容

### 1. 復旧スクリプトの追加（コード・適用済み）

[prisma/recover-demo-account.ts](../prisma/recover-demo-account.ts)

- `supabaseAdmin.auth.admin.createUser({ email_confirm: true })` で
  **メール確認済み**のデモアカウントを作成（既存ならパスワード再設定＋確認済み化）。
- Prisma `User` 行を upsert（`id = Auth uid`, `isOnboarded: true`, 仙台エリア, 興味カテゴリ）。
  → ログイン後にオンボーディングで止まらない。

### 2. 実行手順（**要人間操作・本番環境変数が必要**）

```bash
cd /Users/yuma/repos/products/machi-machi-matching

# 1) デモアカウントを Supabase Auth + DB に作成（確認済み）
SUPABASE_URL="https://<project>.supabase.co" \
SUPABASE_SECRET_KEY="<service-role-key>" \
DATABASE_URL="postgresql://..." \
npx ts-node prisma/recover-demo-account.ts

# 2) 募集・チャット等のデモデータを投入
DATABASE_URL="postgresql://..." \
npx ts-node prisma/seed-demo-account.ts
```

> **重要**: `SUPABASE_URL` は Build 37 が参照する EAS Secret
> (`EXPO_PUBLIC_SUPABASE_URL`) の値と**必ず一致**させること。
> `eas secret:list` で照合する。別プロジェクトに作っても審査では弾かれる。

### 3. TestFlight で実機ログイン確認（**要人間操作・必須**）

iPad Air 11-inch (M3) シミュレータ or 実機 + Build 37 で:

- [ ] `gedozu@appmail.uk` / `Pass1234` でログイン成功
- [ ] タブ画面に遷移（オンボで止まらない）
- [ ] 募集一覧・地図・グループチャット・通知が表示される

### 4. App Store Connect で返信・再提出（**要人間操作**）

下記返信文を ASC のメッセージに貼って返信。ビルド差し替え不要なら
同一ビルドのまま返信で再審査依頼が可能。

---

## 審査担当者への返信（ASC 貼付用）

```
=== English ===
Thank you for your review.

We confirmed that the demo account was missing from our production
authentication backend, which is why sign-in failed with "Invalid login
credentials". We have now created the demo account and verified that
login succeeds on iPad Air 11-inch (M3) via TestFlight.

Demo account (verified, email already confirmed):
  User name: gedozu@appmail.uk
  Password: Pass1234

How to sign in:
  1. Launch the app.
  2. On the login screen, enter the email and password above.
  3. Tap the "ログイン" (Login) button.
  4. You will be taken to the main tab screen with sample recruitments,
     a map, group chats, and notifications.

"Sign in with Apple" and Google sign-in are also available on the same
screen.

=== 日本語 ===
ご確認ありがとうございます。

デモアカウントが本番の認証バックエンドに存在しておらず、そのため
「Invalid login credentials」でログインに失敗していました。アカウントを
作成し、iPad Air 11-inch (M3) / TestFlight でログイン成功を確認しました。

デモアカウント（検証済み・メール確認済み）:
  ユーザー名: gedozu@appmail.uk
  パスワード: Pass1234

ログイン手順:
  1. アプリを起動
  2. ログイン画面で上記メール・パスワードを入力
  3. 「ログイン」ボタンをタップ
  4. 募集一覧・地図・グループチャット・通知が表示されるタブ画面に遷移

Sign in with Apple / Google ログインも同一画面で利用可能です。
```

---

## やらないこと（スコープ外）

- App Store Connect 上の操作（返信・再提出は人間）
- 本番 Supabase / DB への直接実行（人間が環境変数を渡して実行）
- 新ビルドの作成（認証データの問題のためビルド差し替えは原則不要）
