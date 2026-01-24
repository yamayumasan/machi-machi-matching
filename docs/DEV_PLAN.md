# 開発計画

## 概要

本ドキュメントはMVP開発のタスク分解と開発順序を定義します。

---

## 開発フェーズ

```
Phase 1: 環境構築・基盤整備
Phase 2: 認証・ユーザー管理
Phase 3: やりたいこと表明機能
Phase 4: 募集機能
Phase 5: 参加申請・オファー機能
Phase 6: グループ・チャット機能
Phase 7: 通知・仕上げ
```

---

## Phase 1: 環境構築・基盤整備

### 目標
- monorepo環境の構築
- Frontend / Backend の初期設定
- データベース接続確認

### タスク

| # | タスク | 詳細 |
|---|--------|------|
| 1-1 | monorepo構築 | pnpm workspace設定 |
| 1-2 | 共有パッケージ作成 | `packages/shared`（型定義、定数） |
| 1-3 | Mobile初期化 | React Native (Expo) + TypeScript |
| 1-4 | Backend初期化 | Express + TypeScript |
| 1-5 | ESLint/Prettier設定 | 共通の設定ファイル |
| 1-6 | Supabaseプロジェクト作成 | DB、Auth、Storage設定 |
| 1-7 | Prismaセットアップ | schema.prisma作成、接続確認 |
| 1-8 | 初期マイグレーション | 全テーブル作成 |
| 1-9 | カテゴリSeed作成 | 初期カテゴリデータ投入 |
| 1-10 | 疎通確認 | Frontend → Backend → DB |

### 成果物
- [ ] 動作する開発環境
- [ ] DBスキーマ完成
- [ ] Frontend ↔ Backend の疎通確認

---

## Phase 2: 認証・ユーザー管理

### 目標
- ユーザー登録・ログイン機能
- プロフィール設定
- オンボーディングフロー

### タスク

| # | タスク | 詳細 |
|---|--------|------|
| 2-1 | Supabase Auth設定 | メール認証、Google OAuth設定 |
| 2-2 | 認証API実装 | `/api/auth/*` エンドポイント |
| 2-3 | 認証ミドルウェア | JWT検証、req.userへの設定 |
| 2-4 | ログイン画面実装 | メール/Googleログイン |
| 2-5 | 新規登録画面実装 | メールアドレス登録 |
| 2-6 | 認証状態管理 | Zustand authStore |
| 2-7 | プロフィール設定画面 | ニックネーム、自己紹介入力 |
| 2-8 | 画像アップロード | Supabase Storage連携 |
| 2-9 | カテゴリ選択画面 | 複数選択UI |
| 2-10 | エリア選択画面 | 東京/仙台選択 |
| 2-11 | オンボーディングフロー | Step形式の初期設定 |
| 2-12 | ユーザーAPI実装 | CRUD エンドポイント |
| 2-13 | マイページ実装 | プロフィール表示 |
| 2-14 | プロフィール編集画面 | 設定変更 |

### 成果物
- [ ] メール/Googleでログイン可能
- [ ] 初期設定フロー完成
- [ ] マイページ表示

---

## Phase 3: やりたいこと表明機能

### 目標
- 「やりたいこと」の作成・管理
- 表明の自動期限切れ処理

### タスク

| # | タスク | 詳細 |
|---|--------|------|
| 3-1 | WantToDo API実装 | CRUD エンドポイント |
| 3-2 | 表明作成モーダル | カテゴリ、時期、ひとこと |
| 3-3 | 表明一覧画面 | 自分の表明リスト |
| 3-4 | 期限延長機能 | +7日延長 |
| 3-5 | 削除機能 | 手動削除 |
| 3-6 | ホーム画面表示 | 今やりたいこと表示 |
| 3-7 | 期限切れ処理 | バッチ処理 or トリガー |
| 3-8 | バリデーション | Zodスキーマ |

### 成果物
- [ ] やりたいこと表明の作成・表示・削除
- [ ] ホーム画面に表示
- [ ] 期限切れの自動処理

---

## Phase 4: 募集機能

### 目標
- 募集の作成・一覧・詳細表示
- 募集の締め切り制御

### タスク

| # | タスク | 詳細 |
|---|--------|------|
| 4-1 | Recruitment API実装 | CRUD エンドポイント |
| 4-2 | 募集作成画面 | フォーム実装 |
| 4-3 | 募集一覧画面 | カード形式リスト |
| 4-4 | フィルタリング | カテゴリ、エリア |
| 4-5 | 募集詳細画面 | 詳細表示 |
| 4-6 | 募集編集機能 | 自分の募集の編集 |
| 4-7 | 募集削除機能 | 自分の募集の削除 |
| 4-8 | 手動締め切り | ステータス変更 |
| 4-9 | 自動締め切り | 人数到達時 |
| 4-10 | おすすめ募集表示 | ホーム画面に表示 |

### 成果物
- [ ] 募集の作成・一覧・詳細
- [ ] カテゴリ・エリアでフィルタ
- [ ] 募集の締め切り

---

## Phase 5: 参加申請・オファー機能

### 目標
- 双方向のマッチングフロー
- マッチングアルゴリズム実装

### タスク

| # | タスク | 詳細 |
|---|--------|------|
| 5-1 | Application API実装 | 参加申請 CRUD |
| 5-2 | 参加申請送信UI | 募集詳細から申請 |
| 5-3 | 申請一覧（募集者側） | 受信した申請リスト |
| 5-4 | 申請承認/却下 | ステータス更新 |
| 5-5 | 申請状態確認UI | 申請者側の状態表示 |
| 5-6 | マッチングアルゴリズム | スコア計算ロジック |
| 5-7 | ユーザー提案API | スコア順でユーザー取得 |
| 5-8 | ユーザー提案画面 | 募集作成後に表示 |
| 5-9 | Offer API実装 | オファー CRUD |
| 5-10 | オファー送信UI | ワンタップ送信 |
| 5-11 | オファー受信一覧 | ホーム画面に表示 |
| 5-12 | オファー応答UI | 参加/パス選択 |

### 成果物
- [ ] 参加申請フロー完成
- [ ] 募集作成後にユーザー提案
- [ ] オファー送受信

---

## Phase 6: グループ・チャット機能

### 目標
- グループ自動作成
- リアルタイムチャット

### タスク

| # | タスク | 詳細 |
|---|--------|------|
| 6-1 | Group API実装 | CRUD エンドポイント |
| 6-2 | グループ自動作成ロジック | 参加確定時にグループ作成/追加 |
| 6-3 | グループ一覧画面 | 参加中グループ |
| 6-4 | グループ詳細（メンバー表示） | メンバーリスト |
| 6-5 | Socket.io設定（サーバー） | Express + Socket.io |
| 6-6 | Socket.io設定（クライアント） | React Native + Socket.io |
| 6-7 | Message API実装 | 送信・取得 |
| 6-8 | チャットUI実装 | メッセージ表示 |
| 6-9 | メッセージ送信 | リアルタイム送信 |
| 6-10 | 未読管理 | 未読カウント表示 |

### 成果物
- [ ] 参加確定でグループ作成
- [ ] リアルタイムチャット動作

---

## Phase 7: 通知・仕上げ

### 目標
- アプリ内通知機能
- UIの最終調整

### タスク

| # | タスク | 詳細 |
|---|--------|------|
| 7-1 | Notification API実装 | CRUD エンドポイント |
| 7-2 | 通知作成ロジック | 各イベント時に通知作成 |
| 7-3 | 通知一覧画面 | 通知リスト表示 |
| 7-4 | 通知ベル | ヘッダーに未読数表示 |
| 7-5 | 既読処理 | 一括既読、個別既読 |
| 7-6 | 募集マッチ通知 | 表明にマッチする募集の通知 |
| 7-7 | レスポンシブ対応 | モバイル最適化 |
| 7-8 | エラーハンドリング | ユーザーフレンドリーなエラー表示 |
| 7-9 | ローディング状態 | スケルトンUI等 |
| 7-10 | 最終テスト | 全機能の動作確認 |

### 成果物
- [ ] アプリ内通知動作
- [ ] レスポンシブ対応完了
- [ ] MVP完成

---

## ディレクトリ構成

```
machi-machi-matching/
├── README.md
├── docs/                         # ドキュメント
│   ├── CONCEPT.md
│   ├── FEATURES.md
│   ├── USER_FLOW.md
│   ├── TECH_STACK.md
│   ├── DB_DESIGN.md
│   ├── SCREEN_LIST.md
│   ├── ROADMAP.md
│   ├── MVP_SPEC.md              # NEW
│   ├── DEV_PLAN.md              # NEW
│   └── API_DESIGN.md            # NEW
│
├── packages/
│   ├── mobile/                   # モバイルアプリ（React Native + Expo）
│   │   ├── app/                  # Expo Router（ファイルベースルーティング）
│   │   ├── src/
│   │   │   ├── components/       # UIコンポーネント
│   │   │   ├── hooks/            # カスタムフック
│   │   │   ├── stores/           # Zustand ストア
│   │   │   ├── services/         # APIクライアント
│   │   │   ├── constants/        # 定数
│   │   │   └── utils/            # ユーティリティ
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── api/                      # バックエンド（Express）
│   │   ├── src/
│   │   │   ├── routes/           # Express routes
│   │   │   ├── controllers/      # コントローラー
│   │   │   ├── services/         # ビジネスロジック
│   │   │   ├── middlewares/      # ミドルウェア
│   │   │   ├── utils/            # ユーティリティ
│   │   │   ├── socket/           # Socket.io handlers
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                   # 共有コード
│       ├── src/
│       │   ├── types/            # 共有型定義
│       │   ├── schemas/          # Zodスキーマ
│       │   └── constants/        # 定数
│       ├── package.json
│       └── tsconfig.json
│
├── prisma/
│   ├── schema.prisma             # DBスキーマ
│   ├── migrations/               # マイグレーション
│   └── seed.ts                   # シードデータ
│
├── package.json                  # ルートpackage.json（pnpm workspace）
├── pnpm-workspace.yaml
├── tsconfig.json                 # ルートtsconfig
└── .gitignore
```

---

## 依存関係

### Mobile (packages/mobile)

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.x",
    "@supabase/supabase-js": "^2.39",
    "zustand": "^4.5",
    "socket.io-client": "^4.7",
    "axios": "^1.6"
  },
  "devDependencies": {
    "typescript": "^5.3",
    "@types/react": "~18.3.0"
  }
}
```

### Backend (packages/api)

```json
{
  "dependencies": {
    "express": "^4.18",
    "cors": "^2.8",
    "helmet": "^7.1",
    "express-rate-limit": "^7.1",
    "@prisma/client": "^5.8",
    "@supabase/supabase-js": "^2.39",
    "socket.io": "^4.7",
    "zod": "^3.22",
    "express-validator": "^7.0"
  },
  "devDependencies": {
    "typescript": "^5.3",
    "tsx": "^4.7",
    "prisma": "^5.8",
    "@types/express": "^4.17",
    "@types/cors": "^2.8",
    "@types/node": "^20"
  }
}
```

---

## 開発の進め方

### Git運用

```
main        ← 本番ブランチ
  └── develop    ← 開発ブランチ
        └── feature/*    ← 機能ブランチ
```

### ブランチ命名規則

```
feature/phase1-setup          # Phase 1: 環境構築
feature/phase2-auth           # Phase 2: 認証
feature/phase3-want-to-do     # Phase 3: やりたいこと表明
feature/phase4-recruitment    # Phase 4: 募集
feature/phase5-matching       # Phase 5: 参加申請・オファー
feature/phase6-group-chat     # Phase 6: グループ・チャット
feature/phase7-notification   # Phase 7: 通知・仕上げ
```

### コミットメッセージ規約

```
feat: 新機能
fix: バグ修正
docs: ドキュメント
style: フォーマット
refactor: リファクタリング
test: テスト
chore: その他
```

---

## 次のアクション

1. **Phase 1を開始**: monorepo環境構築から始める
2. **Supabaseプロジェクト作成**: DB、Auth、Storage設定
3. **Prismaスキーマ作成**: DB設計に基づいてschema.prisma作成
