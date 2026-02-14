# 審査ノート更新

## タスク概要
App Store Connect審査提出時の「App Review Information」にある「Notes」を更新し、審査チームに必要な情報を明確に伝える。

## 背景
Apple審査チームから以下の指摘を受けた：
1. Sign in with Appleボタンの位置が不明確
2. ATT（App Tracking Transparency）ダイアログの表示タイミングが不明確
3. UGC（ユーザー生成コンテンツ）のモデレーション機能に関する情報不足

## 記載内容

### 1. Sign in with Appleの説明
```
【Sign in with Apple】
アプリ起動後、最初のログイン画面に「Appleでログイン」ボタンがあります。
画面下部の「その他のログイン方法」をタップすると、
Eメール/電話番号によるログイン画面が表示されます。

Location: Initial login screen → "Appleでログイン" button
Alternative login options: Tap "その他のログイン方法" at bottom
```

### 2. ATTダイアログの説明
```
【App Tracking Transparency】
ATTダイアログは以下のタイミングで表示されます：
1. ユーザーが初めてアプリを起動したとき
2. 位置情報許可ダイアログの後
3. アプリのメイン画面が表示される前

Purpose: AdMob広告配信のための広告識別子利用許可
Implementation: expo-tracking-transparency package
```

### 3. UGCモデレーションの説明
```
【ユーザー生成コンテンツのモデレーション】
当アプリでは以下のUGCモデレーション機能を実装しています：

1. 投稿時の自動フィルタリング
   - NGワード検出（性的表現、暴力表現、差別表現など）
   - 検出時は投稿を拒否し、ユーザーに修正を促す

2. 報告機能
   - 各投稿に「報告」ボタンを設置
   - 報告理由: 不適切なコンテンツ、スパム、ハラスメントなど

3. 管理者通知システム
   - 報告があった場合、開発者にメール通知
   - 通報内容を確認し、24時間以内に対応

4. ブロック機能
   - ユーザーが他のユーザーをブロック可能
   - ブロックしたユーザーのコンテンツは非表示

Implementation:
- Content filter: packages/api/src/lib/contentFilter.ts
- Email notification: packages/api/src/services/emailService.ts
- Moderation endpoints: packages/api/src/routes/moderation.ts
```

## 設定手順

1. App Store Connect にログイン
2. 対象アプリ（まちまちマッチング）を選択
3. バージョン選択（新規ビルド提出時）
4. **App Review Information** セクションに移動
5. **Notes** フィールドに上記内容を記載
6. 保存

## 受け入れ基準
- [ ] Sign in with Appleの位置とアクセス方法が明記されている
- [ ] ATTダイアログの表示タイミングと目的が説明されている
- [ ] UGCモデレーション機能の詳細（4つの機能）が記載されている
- [ ] 実装ファイルパスが記載されている
- [ ] 審査ノートが保存されている

## 関連リソース
- Apple審査フィードバック: `/Users/yuma/Projects/machi-machi-matching/docs/APPLE_REVIEW_RESPONSE_V2.md`
- 実装ファイル:
  - `/Users/yuma/Projects/machi-machi-matching/packages/api/src/lib/contentFilter.ts`
  - `/Users/yuma/Projects/machi-machi-matching/packages/api/src/services/emailService.ts`
  - `/Users/yuma/Projects/machi-machi-matching/packages/api/src/routes/moderation.ts`

## 注意事項
- 審査ノートは次回ビルド提出時に必ず更新すること
- 英語での記載も検討（審査チームが日本語を理解できない場合に備えて）
