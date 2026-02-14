# Railway環境変数設定

## タスク概要
Railwayの本番環境に、UGCモデレーション用のメール通知機能で必要な環境変数を設定する。

## 背景
UGCモデレーション機能の実装により、報告があった際に開発者へメール通知を送信する仕組みを導入した。この機能を本番環境で動作させるため、Resend APIキーと開発者メールアドレスの環境変数設定が必要。

## 必要な環境変数

### 1. RESEND_API_KEY
- **説明**: Resend APIの認証キー
- **取得方法**:
  1. https://resend.com/ にログイン
  2. API Keys セクションに移動
  3. 新しいAPIキーを作成（権限: Send emails）
  4. 生成されたキーをコピー
- **形式**: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. DEVELOPER_EMAIL
- **説明**: 報告通知を受け取る開発者のメールアドレス
- **推奨値**: `your-email@example.com`（プロジェクト管理者のメールアドレス）
- **形式**: 有効なメールアドレス

## 設定手順

### Railway Dashboard
1. https://railway.app/ にログイン
2. プロジェクト「machi-machi-matching」を選択
3. 本番環境（Production）のAPIサービスを選択
4. **Variables** タブに移動
5. **New Variable** をクリック
6. 以下を追加：
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
   DEVELOPER_EMAIL=your-email@example.com
   ```
7. **Save** をクリック
8. サービスが自動的に再デプロイされることを確認

### CLI経由（オプション）
```bash
# Railway CLIをインストール（未インストールの場合）
npm i -g @railway/cli

# ログイン
railway login

# プロジェクトにリンク
railway link

# 環境変数を設定
railway variables set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
railway variables set DEVELOPER_EMAIL=your-email@example.com
```

## 動作確認

設定後、以下の方法で動作確認を行う：

1. **テスト報告の送信**
   - アプリから任意のコンテンツを報告
   - 開発者メールアドレスに通知メールが届くことを確認

2. **ログ確認**
   - Railway Dashboardの **Deployments** → **Logs** で確認
   - エラーがないことを確認

3. **環境変数確認**
   ```bash
   railway variables
   ```

## 受け入れ基準
- [ ] RESEND_API_KEYがRailwayに設定されている
- [ ] DEVELOPER_EMAILがRailwayに設定されている
- [ ] 環境変数設定後、サービスが正常に再デプロイされている
- [ ] テスト報告送信時にメール通知が届く
- [ ] ログにエラーが出ていない

## トラブルシューティング

### メールが届かない場合
1. RESEND_API_KEYが正しいか確認
2. Resendダッシュボードで送信ログを確認
3. DEVELOPER_EMAILのスペルミスがないか確認
4. Resendのドメイン認証が完了しているか確認

### 環境変数が反映されない場合
1. 変更を保存したか確認
2. サービスが再デプロイされているか確認
3. Railway CLIで `railway variables` を実行して設定値を確認

## 関連リソース
- 実装ファイル: `/Users/yuma/Projects/machi-machi-matching/packages/api/src/services/emailService.ts`
- Resend API: https://resend.com/
- Railway Dashboard: https://railway.app/
- Apple審査対応ドキュメント: `/Users/yuma/Projects/machi-machi-matching/docs/APPLE_REVIEW_RESPONSE_V2.md`

## セキュリティ注意事項
- APIキーは絶対にコードにハードコーディングしない
- APIキーをGitにコミットしない
- 環境変数は必ずRailway Dashboardまたは安全な方法で設定する
- 定期的にAPIキーをローテーションすることを推奨
