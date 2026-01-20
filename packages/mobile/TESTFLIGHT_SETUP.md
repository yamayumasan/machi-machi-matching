# TestFlight セットアップガイド

このガイドでは、EAS Build を使用して iOS アプリを TestFlight にデプロイする手順を説明します。

## 前提条件

- Apple Developer Program（年額 $99）に登録済み
- Expo アカウントを持っている
- Node.js がインストールされている

## セットアップ手順

### 1. EAS CLI のインストール

```bash
npm install -g eas-cli
```

### 2. Expo / EAS にログイン

```bash
eas login
```

Expo アカウントでログインします。アカウントがない場合は https://expo.dev で作成してください。

### 3. EAS プロジェクトの初期化

```bash
cd packages/mobile
eas init
```

このコマンドで以下が行われます：
- Expo プロジェクトが EAS に登録される
- `app.json` の `extra.eas.projectId` に Project ID が設定される

### 4. Apple Developer 情報の設定

`eas.json` の `submit.production.ios` セクションを更新：

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "XXXXXXXXXX"
      }
    }
  }
}
```

**各項目の取得方法：**

| 項目 | 取得方法 |
|------|---------|
| `appleId` | Apple ID のメールアドレス |
| `ascAppId` | App Store Connect → アプリ詳細 → 一般情報 → Apple ID |
| `appleTeamId` | Apple Developer Portal → Membership → Team ID |

### 5. App Store Connect でアプリを作成

1. [App Store Connect](https://appstoreconnect.apple.com) にログイン
2. 「マイApp」→「+」→「新規App」
3. 以下を入力：
   - プラットフォーム: iOS
   - 名前: マチマチマッチング
   - プライマリ言語: 日本語
   - Bundle ID: `com.machimachi.matching`
   - SKU: `machimachi-matching`

4. アプリが作成されたら、Apple ID（数字）をメモして `eas.json` に設定

## ビルド & 提出

### 開発ビルド（内部テスト用）

```bash
cd packages/mobile
eas build --platform ios --profile preview
```

- 初回は Apple Developer の認証情報を求められます
- EAS が証明書とプロビジョニングプロファイルを自動管理

### 本番ビルド & TestFlight 提出

```bash
# ビルド
eas build --platform ios --profile production

# App Store Connect に提出
eas submit --platform ios --latest
```

または一括で：

```bash
eas build --platform ios --profile production --auto-submit
```

## TestFlight でテスターを追加

1. App Store Connect → TestFlight
2. 「内部テスト」または「外部テスト」グループを作成
3. テスターのメールアドレスを追加
4. テスターは TestFlight アプリから招待を承認

### 内部テスト vs 外部テスト

| 項目 | 内部テスト | 外部テスト |
|------|-----------|-----------|
| テスター数 | 最大 100 人 | 最大 10,000 人 |
| Apple 審査 | 不要 | 初回のみ必要 |
| 対象 | チームメンバー | 誰でも可 |

## 環境変数の設定

本番用の API URL を設定するため、EAS Secrets を使用：

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://api.machimachi.com/api" --scope project
```

## トラブルシューティング

### ビルドエラー: 証明書関連

```bash
eas credentials
```

で証明書の状態を確認。必要に応じて再生成。

### 提出エラー: Apple ID 認証

App 用パスワードが必要な場合：
1. https://appleid.apple.com → セキュリティ → App 用パスワード
2. パスワードを生成
3. `eas submit` 時に入力

## バージョン管理

新しいビルドを提出する前に、`app.json` を更新：

```json
{
  "expo": {
    "version": "0.1.1",
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

- `version`: ユーザーに表示されるバージョン
- `buildNumber`: 同じバージョンでの再ビルド時にインクリメント

## 無料枠の制限

EAS 無料プランでは：
- iOS ビルド: 月 30 回まで
- ビルドキュー: 優先度低

本番運用時は有料プラン（$29/月〜）を検討してください。
