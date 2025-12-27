# 技術スタック

## 概要

TypeScriptフルスタック構成で、Vue 3をフロントエンド、Node.js + Fastify + tRPCをバックエンドとして採用。

---

## 技術選定

### フロントエンド

| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| **Vue 3** | 3.x | Composition API、TypeScriptとの親和性、学習目的 |
| **TypeScript** | 5.x | 型安全性、tRPCとの連携 |
| **Pinia** | 2.x | Vue 3公式推奨の状態管理、シンプルなAPI |
| **Vue Router** | 4.x | SPA routing |
| **Tailwind CSS** | 3.x | ユーティリティファースト、高速なUI開発 |
| **Vite** | 5.x | 高速なHMR、モダンなビルドツール |

### バックエンド

| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| **Node.js** | 20.x LTS | 安定版、TypeScript対応 |
| **Fastify** | 4.x | 高速、型安全、プラグインエコシステム |
| **tRPC** | 11.x | End-to-end型安全、APIスキーマ自動生成 |
| **Zod** | 3.x | ランタイムバリデーション、tRPCとの連携 |

### データベース

| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| **PostgreSQL** | 15.x | 信頼性、JSON対応、フルテキスト検索 |
| **Prisma** | 5.x | 型安全なORM、マイグレーション管理 |

### リアルタイム通信

| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| **Socket.io** | 4.x | WebSocketの抽象化、フォールバック対応 |

### 認証

| 技術 | 選定理由 |
|------|---------|
| **Supabase Auth** | OAuth対応（Google/LINE）、無料枠あり、PostgreSQL統合 |

### ホスティング・インフラ

| サービス | 用途 | 選定理由 |
|---------|------|---------|
| **Vercel** | フロントエンド | 無料枠、自動デプロイ、Edge Functions |
| **Railway** or **Render** | バックエンド | Node.js対応、PostgreSQL統合 |
| **Supabase** | DB・Auth・Storage | オールインワン、無料枠 |

---

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                        クライアント                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Vue 3 + TypeScript + Pinia + Tailwind CSS          │   │
│  │  (Vite でビルド)                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                    tRPC Client / Socket.io                  │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        API サーバー                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Fastify + tRPC + Socket.io                         │   │
│  │  (Node.js + TypeScript)                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                         Prisma ORM                          │
└──────────────────────────────┼──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       データストア                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │  PostgreSQL   │  │ Supabase Auth │  │ Supabase      │  │
│  │  (Supabase)   │  │               │  │ Storage       │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## ディレクトリ構成（予定）

```
machi-machi-matching/
├── README.md
├── docs/                      # ドキュメント
│   ├── CONCEPT.md
│   ├── FEATURES.md
│   ├── USER_FLOW.md
│   ├── TECH_STACK.md
│   ├── DB_DESIGN.md
│   ├── SCREEN_LIST.md
│   └── ROADMAP.md
│
├── packages/
│   ├── web/                   # フロントエンド（Vue 3）
│   │   ├── src/
│   │   │   ├── components/    # UIコンポーネント
│   │   │   ├── composables/   # Composition API
│   │   │   ├── pages/         # ページコンポーネント
│   │   │   ├── stores/        # Pinia ストア
│   │   │   ├── router/        # Vue Router
│   │   │   ├── utils/         # ユーティリティ
│   │   │   └── App.vue
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   ├── api/                   # バックエンド（Fastify + tRPC）
│   │   ├── src/
│   │   │   ├── routers/       # tRPC routers
│   │   │   ├── services/      # ビジネスロジック
│   │   │   ├── middlewares/   # Fastify middlewares
│   │   │   ├── utils/         # ユーティリティ
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                # 共有コード
│       ├── src/
│       │   ├── types/         # 共有型定義
│       │   ├── schemas/       # Zodスキーマ
│       │   └── constants/     # 定数
│       ├── package.json
│       └── tsconfig.json
│
├── prisma/
│   ├── schema.prisma          # DBスキーマ
│   └── migrations/            # マイグレーション
│
├── package.json               # ルートpackage.json（pnpm workspace）
├── pnpm-workspace.yaml
├── tsconfig.json              # ルートtsconfig
└── .gitignore
```

---

## 技術的な学習要素

### フロントエンド

| 技術要素 | 学習内容 |
|---------|---------|
| Vue 3 Composition API | `setup()`, `ref`, `reactive`, `computed`, `watch` |
| Pinia | グローバル状態管理、永続化 |
| Vue Router | 動的ルーティング、ナビゲーションガード |
| TypeScript | 型定義、ジェネリクス、型推論 |
| Tailwind CSS | ユーティリティクラス、レスポンシブデザイン |
| WebSocket | Socket.io クライアント、リアルタイム更新 |

### バックエンド

| 技術要素 | 学習内容 |
|---------|---------|
| tRPC | End-to-end型安全、Procedure定義 |
| Fastify | プラグイン、フック、バリデーション |
| Prisma | スキーマ定義、リレーション、トランザクション |
| Socket.io | サーバーサイドWebSocket、Room管理 |
| 認証 | OAuth 2.0、JWT、セッション管理 |

### インフラ・DevOps

| 技術要素 | 学習内容 |
|---------|---------|
| Git/GitHub | ブランチ戦略、PR、CI/CD |
| Docker | 開発環境構築（Phase 2） |
| Vercel/Railway | デプロイ、環境変数管理 |
| Supabase | BaaS活用、Row Level Security |

---

## 開発ツール

| ツール | 用途 |
|-------|------|
| **pnpm** | パッケージマネージャー（monorepo対応） |
| **ESLint** | Linter |
| **Prettier** | Formatter |
| **Vitest** | ユニットテスト |
| **Playwright** | E2Eテスト（Phase 2） |

---

## 外部API・サービス

| サービス | 用途 | 料金 |
|---------|------|------|
| **Supabase** | DB、Auth、Storage | 無料枠で開始 |
| **Vercel** | フロントエンドホスティング | 無料枠 |
| **Railway** | バックエンドホスティング | 無料枠あり |
| **Firebase Cloud Messaging** | プッシュ通知（Phase 2） | 無料 |

---

## セキュリティ考慮事項

| 項目 | 対策 |
|------|------|
| 認証 | Supabase Auth + JWT |
| 認可 | Row Level Security (RLS) |
| 入力検証 | Zod によるバリデーション |
| XSS | Vue 3のデフォルトエスケープ |
| CSRF | SameSite Cookie |
| レート制限 | Fastify rate-limit plugin |
