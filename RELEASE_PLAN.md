# iOS リリース計画

## 現在の構成

| コンポーネント | 開発環境 | 本番環境（必要） |
|---------------|---------|-----------------|
| **データベース** | ローカル PostgreSQL | Supabase PostgreSQL (既存プロジェクト利用可) |
| **認証** | Supabase Auth | 同じ Supabase プロジェクト |
| **API サーバー** | localhost:3000 | クラウドホスティング必要 |
| **モバイルアプリ** | Expo Go | EAS Build → App Store |

---

## フェーズ 1: 本番インフラ構築

### 1.1 データベース（Supabase PostgreSQL）

**現状**: Supabase プロジェクトは既に存在（認証用）

**作業内容**:
1. Supabase Dashboard → Database → Connection String 取得
2. Prisma スキーマを Supabase にマイグレーション

```bash
# 本番DB接続文字列を設定
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# マイグレーション実行
cd packages/api
pnpm prisma:migrate
pnpm prisma:seed  # カテゴリなどの初期データ
```

### 1.2 API サーバーホスティング

**推奨オプション**:

| サービス | 無料枠 | 特徴 |
|---------|-------|------|
| **Railway** | $5/月クレジット | 簡単、自動デプロイ |
| **Render** | 750時間/月 | スリープあり（無料枠） |
| **Fly.io** | 3 shared-cpu VMs | 高速、グローバル |

**Railway での設定例**:
1. https://railway.app でプロジェクト作成
2. GitHub リポジトリ連携
3. 環境変数設定:
   ```
   DATABASE_URL=postgresql://...
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SECRET_KEY=xxx
   JWT_SECRET=xxx
   PORT=3000
   FRONTEND_URL=*
   ```
4. ビルドコマンド: `cd packages/api && pnpm install && pnpm build`
5. 起動コマンド: `cd packages/api && pnpm start`

### 1.3 環境変数まとめ

**API サーバー (Railway/Render)**:
```env
DATABASE_URL=postgresql://postgres.[ref]:[pass]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_SECRET_KEY=sbp_xxx (Service Role Key)
JWT_SECRET=ランダムな長い文字列
PORT=3000
FRONTEND_URL=*
NODE_ENV=production
```

**モバイルアプリ (EAS Secrets)**:
```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://your-api.railway.app/api"
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxx.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJxxx..."
```

---

## フェーズ 2: 本番ビルド・テスト

### 2.1 本番環境での動作確認

1. API サーバーがデプロイされたら、エンドポイント確認
   ```bash
   curl https://your-api.railway.app/api/health
   ```

2. モバイルアプリの環境変数を本番に切り替えてテスト
   ```bash
   # packages/mobile/.env を本番URLに更新
   EXPO_PUBLIC_API_URL=https://your-api.railway.app/api
   ```

3. Expo Go で動作確認
   - ログイン（メール・Google）
   - 募集作成・閲覧
   - 申請・オファー
   - チャット

### 2.2 iOS ビルド

```bash
cd packages/mobile

# Production ビルド
eas build --platform ios --profile production
```

### 2.3 TestFlight テスト

```bash
# App Store Connect に提出
eas submit --platform ios --profile production
```

1. TestFlight でインストール
2. 全機能の動作確認
3. 複数デバイスでテスト

---

## フェーズ 3: App Store 提出

### 3.1 App Store Connect 準備

**必須情報**:
- [ ] アプリ名: マチマチマッチング
- [ ] サブタイトル: 街で、待ちで、マッチング
- [ ] 説明文（4000文字以内）
- [ ] キーワード（100文字以内）
- [ ] サポートURL
- [ ] プライバシーポリシーURL（アプリ内で作成済み → Web公開必要）
- [ ] カテゴリ: ソーシャルネットワーキング
- [ ] 年齢レーティング

**スクリーンショット**:
- [ ] 6.7インチ用 (1290 x 2796) × 3-10枚
- [ ] 6.5インチ用 (1242 x 2688) × 3-10枚

### 3.2 審査提出

1. TestFlight ビルドを審査に提出
2. App Review ガイドライン確認
3. 審査完了後、リリース

---

## タスク一覧（優先順位順）

### 必須タスク

| # | タスク | 詳細 |
|---|-------|------|
| 1 | API サーバーデプロイ | Railway/Render でホスティング |
| 2 | 本番DB マイグレーション | Supabase PostgreSQL にスキーマ反映 |
| 3 | 環境変数設定 | API + EAS Secrets |
| 4 | 本番環境テスト | Expo Go で全機能確認 |
| 5 | プライバシーポリシー Web公開 | 静的ページとして公開 |
| 6 | iOS Production ビルド | eas build |
| 7 | TestFlight テスト | 実機での動作確認 |
| 8 | スクリーンショット作成 | 各画面サイズ用 |
| 9 | App Store Connect 入力 | メタデータ・説明文 |
| 10 | 審査提出 | eas submit |

### 任意タスク（後でもOK）

- プッシュ通知本番設定（APNs証明書）
- Google Play リリース
- アプリアイコンの改善

---

## 推奨スケジュール

| 日 | 作業内容 |
|----|---------|
| Day 1 | API デプロイ + DB マイグレーション + 環境変数設定 |
| Day 2 | 本番環境テスト + バグ修正 |
| Day 3 | iOS ビルド + TestFlight + スクリーンショット |
| Day 4 | App Store Connect 入力 + 審査提出 |
| Day 5-7 | 審査待ち（通常1-3日） |

---

## 次のアクション

**今すぐ始めること**: API サーバーのデプロイ

Railway を使う場合:
1. https://railway.app にアクセス
2. GitHub でログイン
3. 「New Project」→「Deploy from GitHub repo」
4. machi-machi-matching リポジトリを選択
