# 新ビルド作成・TestFlight確認・審査提出

## タスク概要
Apple審査対応の変更を反映した新しいビルドを作成し、TestFlightで動作確認後、App Store Connectに審査提出する。

## 背景
以下の対応を完了したため、新しいビルドを作成して審査に再提出する：
1. `supportsTablet: true` に変更
2. NGワードフィルタリング実装
3. UGCモデレーション機能（報告、メール通知、ブロック）実装
4. 年齢レーティング修正（App Store Connect）
5. 審査ノート更新（App Store Connect）
6. Railway環境変数設定（RESEND_API_KEY、DEVELOPER_EMAIL）

## 実施手順

### 1. ビルド番号のインクリメント

#### app.jsonの確認と更新
```bash
cd /Users/yuma/Projects/machi-machi-matching/packages/mobile
```

現在のapp.json:
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "18"
    }
  }
}
```

更新内容:
```json
{
  "expo": {
    "version": "1.0.0",
    "ios": {
      "buildNumber": "19"
    }
  }
}
```

### 2. ビルド作成

```bash
# モバイルディレクトリに移動
cd /Users/yuma/Projects/machi-machi-matching/packages/mobile

# iOSビルドを作成（Production）
eas build --platform ios --profile production

# ビルド完了まで待機（通常10-20分）
# ビルドログを確認し、エラーがないことを確認
```

### 3. TestFlight確認

ビルド完了後、TestFlightで以下を確認：

#### 基本動作確認
- [ ] アプリが正常に起動する
- [ ] ログイン機能が動作する（Sign in with Apple、メール/電話番号）
- [ ] 主要機能が正常に動作する（募集作成、グループ作成、チャットなど）

#### 新機能確認
- [ ] NGワードフィルタリング
  - 募集作成時にNGワードを含むタイトル/説明を入力
  - エラーメッセージが表示されることを確認

- [ ] 報告機能
  - 任意の投稿を報告
  - 報告が正常に送信されることを確認
  - 開発者メールに通知が届くことを確認

- [ ] ブロック機能
  - 他のユーザーをブロック
  - ブロックしたユーザーのコンテンツが非表示になることを確認

#### iPad対応確認（supportsTablet: true）
- [ ] iPadでアプリをインストール
- [ ] レイアウトが正常に表示される
- [ ] 主要機能が動作する

#### ATTダイアログ確認
- [ ] アプリ初回起動時にATTダイアログが表示される
- [ ] 「許可」「許可しない」どちらを選択してもアプリが正常に動作する

### 4. App Store Connect審査提出

TestFlight確認が完了したら、App Store Connectで審査提出：

1. https://appstoreconnect.apple.com/ にログイン
2. 対象アプリ（まちまちマッチング）を選択
3. **App Store** タブに移動
4. 新しいバージョンを作成（または既存のバージョンを編集）
5. **Build** セクションで新しいビルド（19）を選択
6. **App Review Information** の **Notes** を更新（審査ノート更新タスクの内容）
7. **Age Rating** が正しく設定されていることを確認
8. **Submit for Review** をクリック

### 5. 審査状況の確認

- App Store Connectで審査状況を定期的に確認
- 審査チームからの質問や要求があれば迅速に対応
- 審査通過後、リリース設定を確認

## 受け入れ基準

### ビルド作成
- [ ] app.jsonのbuildNumberが19に更新されている
- [ ] `eas build --platform ios` が成功している
- [ ] ビルドログにエラーがない

### TestFlight確認
- [ ] 基本動作確認が完了している
- [ ] NGワードフィルタリングが動作している
- [ ] 報告機能が動作し、メール通知が届いている
- [ ] ブロック機能が動作している
- [ ] iPad対応が確認できている
- [ ] ATTダイアログが正常に表示されている

### 審査提出
- [ ] App Store Connectで新しいビルド（19）が選択されている
- [ ] 審査ノートが更新されている
- [ ] Age Ratingが正しく設定されている
- [ ] Submit for Reviewが完了している

## トラブルシューティング

### ビルドエラーが発生した場合
1. エラーメッセージを確認
2. `eas build:list` で過去のビルドログを確認
3. 依存関係の問題がある場合は `pnpm install` を実行
4. キャッシュをクリアして再ビルド: `eas build --platform ios --clear-cache`

### TestFlightでクラッシュが発生した場合
1. Xcode Organizer でクラッシュログを確認
2. Sentryでエラーログを確認（設定済みの場合）
3. 原因を特定し、修正後に再ビルド

### 審査リジェクトされた場合
1. リジェクト理由を確認
2. 必要な対応を実施
3. Resolution Centerで対応内容を説明
4. 新しいビルドを提出（必要な場合）

## 関連リソース

### ドキュメント
- Apple審査対応: `/Users/yuma/Projects/machi-machi-matching/docs/APPLE_REVIEW_RESPONSE_V2.md`
- app.json: `/Users/yuma/Projects/machi-machi-matching/packages/mobile/app.json`

### 実装ファイル
- NGワードフィルタ: `/Users/yuma/Projects/machi-machi-matching/packages/api/src/lib/contentFilter.ts`
- メール通知: `/Users/yuma/Projects/machi-machi-matching/packages/api/src/services/emailService.ts`
- モデレーション: `/Users/yuma/Projects/machi-machi-matching/packages/api/src/routes/moderation.ts`

### 外部リンク
- App Store Connect: https://appstoreconnect.apple.com/
- Expo EAS: https://expo.dev/
- TestFlight: https://testflight.apple.com/

## チェックリスト

作業前に以下を確認：
- [ ] 前述のすべてのタスクが完了している
  - [ ] 年齢レーティング修正
  - [ ] 審査ノート更新
  - [ ] Railway環境変数設定
- [ ] ローカル環境でビルドが通ることを確認
- [ ] Git作業ブランチがクリーンであることを確認
- [ ] すべての変更がコミット・プッシュされている

作業後に以下を確認：
- [ ] TestFlightでの動作確認が完了している
- [ ] 審査提出が完了している
- [ ] チーム内で審査状況を共有している
