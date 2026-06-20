# Apple App Store 審査対応計画（第5回）

> **作成日**: 2026-06-14
> **前回対応**: [APPLE_REVIEW_RESPONSE_V4.md](./APPLE_REVIEW_RESPONSE_V4.md)

## 審査状況サマリー

| 審査日 | Submission ID | ビルド | 結果 |
|--------|--------------|--------|------|
| 2026-06-13 | 9ae058dc-a078-4773-b5f6-fb4f27ecba5f | 1.0 (37) | **Guideline 2.1 ×2** |

### 今回の指摘（2件）

#### Issue 1: Guideline 2.1 - Information Needed（デモアカウントにコンテンツがない）

> We were able to sign in, however there was no user-generated content with the provided credentials.

- ログインは成功 ✅（V4 のリカバリースクリプトが効いた）
- だが demo account `gedozu@appmail.uk` のDB上のコンテンツが空 → 機能の全貌を見せられない

#### Issue 2: Guideline 2.1 - Information Needed（ATTダイアログが出ない）

> The app uses the AppTrackingTransparency framework, but we are unable to locate the App Tracking Transparency permission request when reviewed on iPadOS 26.5 and iOS 26.5.

- `app.json` のATT plugin / `NSUserTrackingUsageDescription` は設定済み
- 実装は `_layout.tsx` で `requestTrackingPermissionsAsync()` を呼んでいた
- ただし**スプラッシュ表示中**（=`UIApplicationStateInactive`）に呼んでいたため、iOSが prompt を抑制

---

## 対応内容

### A. デモアカウントへのコンテンツ投入

[prisma/seed-demo-account.ts](../prisma/seed-demo-account.ts) を本番DATABASE_URLで実行。

投入内容:
- 自分の募集 3件（ボドゲ会・カフェ巡り・フットサル）
- やりたいこと 2件
- 他者の募集 2件（自分が参加可能）
- グループ 2件（オーナー1件 + メンバー1件、計18メッセージ）
- 通知 4件、申請 2件
- ダミーユーザー 5名（チャット相手）

**実行は人間操作・1回のみ**:
```bash
DATABASE_URL="<production-database-url>" \
  npx ts-node prisma/seed-demo-account.ts
```

### B. ATT呼出タイミング修正 → Build 38

[packages/mobile/app/_layout.tsx](../packages/mobile/app/_layout.tsx)

- 旧: `prepare()` 内（スプラッシュ表示中）で `requestTrackingPermissionsAsync()`
- 新: スプラッシュ消去後、別 useEffect で実行。`AppState` が `active` になってから呼ぶ
- 既に判定済み（`status !== 'undetermined'`）なら何もしない（再度ダイアログを出さない）

**Build 38** をTestFlight提出 → 実機 (iPad Air 11-inch M3) で:
- アプリ起動 → スプラッシュ消える → ATT ダイアログ表示
- "Allow"/"Don't Allow" どちらでも進行可
- ATT は1回しか出ないため、検証時は「Settings > マチマチマッチング > Tracking」または OS の「Settings > Privacy > Tracking > Reset App Tracking Permissions」で初期化が必要

### C. スクリーンレコーディング（**要人間操作**）

Apple指定により、ATTダイアログ動作を**実機で**撮影:

1. **撮影端末**: 物理 iPad または iPhone（シミュレータ不可）
2. **準備**: Settings > General > Reset > Reset Location & Privacy → トラッキング許可を初期化
3. **撮影内容**:
   - クリーンインストールまたはリセット後の初回起動
   - スプラッシュ表示
   - **ATT ダイアログが表示される瞬間**（"Allow Tracking" / "Ask App Not to Track"）
   - ダイアログを選択した後のフロー（タブ画面へ遷移）
4. **保存**: .mov または .mp4、20MB以下が望ましい（ASCの添付制限）
5. **添付場所**: App Store Connect > App Review Information > Attachment

---

## 審査担当者への返信（ASC 貼付用）

```
=== English ===
Thank you for your review.

We have addressed both items.

[1] User-generated content for the demo account
We have seeded the demo account with full sample data so all features are
visible after sign-in:
  - 5 nearby recruitments (3 created by the demo user, 2 by other users)
  - 2 "want-to-do" items
  - 2 group chats (one as owner, one as a member) with 18 sample messages
  - 4 notifications and 2 join applications

Demo account (verified, email already confirmed):
  Email:    gedozu@appmail.uk
  Password: Pass1234

How to verify:
  1. Launch the app.
  2. Sign in with the demo account.
  3. On the Home tab you will see the recruitment list and the map populated.
  4. Open the Groups tab to see two active chats with message history.
  5. Open the Notifications tab to see unread/read notifications.

[2] App Tracking Transparency
The ATT permission request was being issued during the splash screen
window, when iOS holds the app in UIApplicationStateInactive, so the
system silently dismissed it. We moved the request to fire after the
splash screen is hidden, gated by an AppState=='active' check, and only
when the previous status is 'undetermined'.

This is fixed in Build 38, attached to this submission. A screen
recording on a physical iPad showing the ATT dialog appearing at first
launch is attached in the App Review Information section.

To re-trigger the ATT dialog on a device that has previously responded:
Settings > Privacy & Security > Tracking > Reset App Tracking Permissions.

=== 日本語 ===
ご確認ありがとうございます。2点いずれも対応しました。

[1] デモアカウントのユーザーコンテンツ
デモアカウントにサンプルデータを投入し、ログイン後すべての機能が確認
できる状態にしました:
  - 周辺の募集 5件（デモユーザー作成3件、他ユーザー作成2件）
  - やりたいこと 2件
  - グループチャット 2件（オーナー1件、メンバー1件、メッセージ計18件）
  - 通知 4件、参加申請 2件

デモアカウント（メール確認済み）:
  メール:      gedozu@appmail.uk
  パスワード:  Pass1234

確認手順:
  1. アプリを起動
  2. デモアカウントでログイン
  3. ホームタブで募集一覧と地図にコンテンツが表示されます
  4. グループタブで2つのチャット（メッセージ履歴あり）を確認できます
  5. 通知タブで未読・既読の通知を確認できます

[2] App Tracking Transparency
ATT ダイアログをスプラッシュスクリーン表示中に呼び出していたため、
iOS が `UIApplicationStateInactive` 中はダイアログを抑制する仕様により
表示されていませんでした。スプラッシュ解除後、`AppState == 'active'`
で、かつ前回判定が 'undetermined' の場合のみリクエストを行うように
修正しました。

Build 38 で修正済みです。初回起動時に ATT ダイアログが表示される
スクリーンレコーディング（物理iPad）を App Review Information に
添付しています。

過去に応答済みの端末でダイアログを再表示するには:
設定 > プライバシーとセキュリティ > トラッキング > App のトラッキング許可をリセット
```

---

## やらないこと（このストーリーのスコープ外）

- App Store Connect 上の操作・返信・スクリーンレコ撮影 → **人間が実施**
- 本番DBへの直接実行 → **人間が環境変数を渡して実行**
