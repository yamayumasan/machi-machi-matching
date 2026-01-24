# ストア配信チェックリスト

## 1. ビルド前の準備

### 共通設定
- [x] app.json の設定完了
  - [x] アプリ名: マチマチマッチング
  - [x] バンドルID: com.machimachi.matching
  - [x] バージョン: 0.1.0
  - [x] scheme: machi-machi (OAuth用)

### アセット
- [ ] アプリアイコン (1024x1024)
  - iOS: `assets/icon.png`
  - Android: `assets/adaptive-icon.png`
- [ ] スプラッシュ画像
  - `assets/splash-icon.png`
- [ ] スクリーンショット準備
  - iOS: 6.7" (1290x2796), 6.5" (1242x2688), 5.5" (1242x2208)
  - Android: 電話 (16:9), タブレット7" (16:9), タブレット10" (16:9)

---

## 2. App Store (iOS)

### Apple Developer Program
- [x] Apple Developer Program 登録済み
- [x] App Store Connect でアプリ作成済み (ASC App ID: 6757920707)
- [x] Team ID: LCQWNFZZ3R

### 必要情報
- [ ] アプリ説明文 (4000文字以内)
- [ ] キーワード (100文字以内)
- [ ] サポートURL
- [x] プライバシーポリシーURL (アプリ内実装済み)
- [ ] カテゴリ選択
  - メイン: ソーシャルネットワーキング
  - サブ: ライフスタイル
- [ ] 年齢レーティング設定

### ビルド & 提出
```bash
# Production ビルド
cd packages/mobile
eas build --platform ios --profile production

# App Store Connect に提出
eas submit --platform ios --profile production
```

---

## 3. Google Play (Android)

### Google Play Console
- [ ] Google Play Console 登録 ($25)
- [ ] アプリ作成
- [ ] 署名キー設定 (EAS管理)

### 必要情報
- [ ] アプリ説明文 (短: 80文字, 長: 4000文字)
- [ ] フィーチャーグラフィック (1024x500)
- [ ] サポートメールアドレス
- [x] プライバシーポリシーURL
- [ ] コンテンツレーティング申請
- [ ] データセーフティ設定

### ビルド & 提出
```bash
# Production ビルド (AAB)
cd packages/mobile
eas build --platform android --profile production

# Google Play に提出
eas submit --platform android --profile production
```

---

## 4. 環境変数・シークレット

### 本番環境用の環境変数
```
API_URL=https://api.machimachi-matching.com
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
```

### EAS シークレット設定
```bash
# シークレット設定 (CI/CD用)
eas secret:create --name API_URL --value "https://api.machimachi-matching.com"
eas secret:create --name SUPABASE_URL --value "https://xxxxx.supabase.co"
eas secret:create --name SUPABASE_ANON_KEY --value "xxxxx"
```

---

## 5. Google OAuth 設定

### Google Cloud Console
- [ ] OAuth 同意画面設定
- [ ] OAuth クライアントID作成
  - iOS: バンドルID `com.machimachi.matching`
  - Android: パッケージ名 + SHA-1 フィンガープリント

### Supabase Dashboard
- [ ] Google Provider 有効化
- [ ] Client ID / Client Secret 設定
- [ ] Redirect URL 設定: `https://xxxxx.supabase.co/auth/v1/callback`

---

## 6. プッシュ通知設定

### iOS (APNs)
- [ ] Apple Push Notification Service 証明書作成
- [ ] EAS にアップロード

### Android (FCM)
- [ ] Firebase プロジェクト作成
- [ ] google-services.json 取得
- [ ] FCM サーバーキー設定

---

## 7. リリース前最終確認

### 動作確認
- [ ] メール認証ログイン
- [ ] Google ログイン
- [ ] オンボーディングフロー
- [ ] 募集作成・編集・削除
- [ ] 申請・オファーフロー
- [ ] グループチャット
- [ ] プッシュ通知受信
- [ ] 位置情報取得

### パフォーマンス
- [ ] 起動時間 (3秒以内)
- [ ] 画面遷移のスムーズさ
- [ ] メモリリークなし

### セキュリティ
- [ ] API通信がHTTPS
- [ ] トークンがSecure Storeに保存
- [ ] 入力値バリデーション

---

## コマンドまとめ

```bash
# 開発ビルド (Expo Go用)
npx expo start

# Preview ビルド (内部テスト用)
eas build --platform all --profile preview

# Production ビルド
eas build --platform all --profile production

# ストア提出
eas submit --platform ios --profile production
eas submit --platform android --profile production

# バージョン更新
# app.json の version と ios.buildNumber / android.versionCode を更新
```
