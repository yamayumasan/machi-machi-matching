# マチマチマッチング

募集をかけることも、募集待ちの状態にし誘いを待つこともできる、相互型マッチングアプリ（iOS）。
モノレポ構成（pnpm workspace）で API / Mobile / Shared の3パッケージ。

## コマンド

```bash
# 開発サーバー
pnpm dev                          # 全パッケージ
pnpm --filter @machi/api dev      # APIのみ

# 型チェック
pnpm --filter @machi/api exec tsc --noEmit
pnpm --filter @machi/mobile typecheck

# テスト
pnpm --filter @machi/api test     # API（Jest + ESM）
pnpm --filter @machi/mobile test  # Mobile（Jest + jest-expo）

# Prisma
pnpm prisma generate
pnpm prisma migrate dev
```

## ファイル構造

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
│   ├── types/         # 型定義
│   └── schemas/       # バリデーションスキーマ
└── prisma/            # DBスキーマ・マイグレーション
```

## 開発ルール

- コード変更後は必ず型チェックを実行
- Conventional Commits形式でコミット（feat:, fix:, refactor: など）
- .envファイルは変更しない
- `prisma/schema.prisma` を変更したら `pnpm prisma generate` を実行
- デザインは `.claude/rules/design-guidelines.md` に従う

---

# 自律開発ループ設定

## タスク管理

- **TASK_PROGRESS.md** を読んで次のタスクを確認
- 1イテレーションで1タスクに集中（複数同時にやらない）
- 完了したらTASK_PROGRESS.mdのステータスと引き継ぎメモを更新
- 作業内容を簡潔にgit commit

## 自律ループフロー

```
1. TASK_PROGRESS.mdを読み、引き継ぎメモを確認
2. **最初に** TASK_PROGRESS.mdの「最新イテレーション」日時を更新し、何をするか記録
3. 「要人間操作」タスクはスキップ
4. タスクを実装（下記「自律的なタスク進行」参照）
5. 型チェック実行
6. git add && git commit（Conventional Commits形式）
7. TASK_PROGRESS.mdのステータスと引き継ぎメモを更新（完了したこと、次にやること）
8. 全タスク完了なら「ALL_TASKS_COMPLETE」と出力
```

**重要**: イテレーション開始時（ステップ2）で必ずTASK_PROGRESS.mdを更新すること。
これにより進捗が記録され、サーキットブレーカーの誤作動を防ぐ。

## 自律的なタスク進行

フェーズタスクを進める際は以下のステップで自律的に進めること:

1. **調査**: 現状を把握し、必要な情報を収集
   - コードベースを読む
   - 既存の実装を理解する
   - 必要に応じてWeb検索で最新情報を取得

2. **計画**: 具体的なサブタスクを洗い出す
   - 引き継ぎメモに計画を記録
   - 優先順位を決める

3. **実装**: サブタスクを1つずつ実装
   - 1イテレーションで意味のある進捗を出す
   - 大きすぎる変更は分割する

4. **検証**: 動作確認
   - 型チェック
   - テスト実行（あれば）

5. **記録**: 引き継ぎメモを更新
   - 完了したこと
   - 次にやるべきこと
   - 注意事項

## 禁止事項

- .env, .env.* ファイルの変更
- rm -rf コマンドの実行
- 本番環境への直接操作
- APIキー・シークレットのハードコード

## 要人間操作タスク

以下はTASK_PROGRESS.mdで「要人間操作」とマークし、スキップ:

- App Store Connect / Google Play Console の操作
- Railway / Vercel 等の環境変数設定
- 外部サービスのAPIキー取得
- 本番デプロイの承認
