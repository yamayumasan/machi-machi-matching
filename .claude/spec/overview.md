# machi-machi-matching — アーキテクチャ概要

## システム概要

地域密着型活動マッチングサービス（iOS）。
募集をかけることも、募集待ちの状態にし誘いを待つこともできる、相互型マッチングアプリ。

## ユーザーストーリー概要

主要ペルソナと代表的なユーザーストーリーの要約。詳細は下記ディレクトリを参照:

- ペルソナ定義: `spec/user-stories/personas.md`
- ユーザーストーリー一覧: `spec/user-stories/stories.md`
- 個別US（必要に応じて）: `spec/user-stories/US-*.md`

(未記入 — `/dev-spec` で追加)

## 技術スタック

- **言語**: TypeScript
- **モノレポ**: pnpm workspace (pnpm@8.15.0, Node >=20)
- **API**: Hono (Jest+ESM テスト)
- **Mobile**: Expo Router (iOS), jest-expo
- **DB / ORM**: Prisma 5.22 (`prisma/schema.prisma`)
- **共通**: Zod スキーマ, 共有型定義
- **デプロイ**: Railway / Nixpacks

## ディレクトリ構成

```
packages/
├── api/src/           # Hono API サーバー
│   ├── routes/        # ルート定義
│   ├── services/      # ビジネスロジック
│   ├── middlewares/   # ミドルウェア
│   ├── lib/           # ユーティリティ
│   └── __tests__/     # テスト
├── mobile/app/        # Expo Router ページ
│   ├── (tabs)/        # タブナビゲーション
│   ├── auth/          # 認証画面
│   ├── recruitment/   # 募集関連画面
│   └── group/         # グループ関連画面
├── shared/src/        # 共通コード
│   ├── types/
│   └── schemas/
└── prisma/            # DBスキーマ・マイグレーション
```

## 主要コンポーネント

(未記入)

## データフロー

(未記入)

## API設計方針

(未記入)

## 外部連携

(未記入)

## デプロイ・インフラ

- Railway (Nixpacks) で API デプロイ
- Mobile は EAS (Expo Application Services) でビルド・iOS 配布
