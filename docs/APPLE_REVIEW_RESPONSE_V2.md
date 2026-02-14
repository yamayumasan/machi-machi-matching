# Apple App Store 審査対応計画（第2回）

> **作成日**: 2026-02-14
> **前回対応**: [APPLE_REVIEW_RESPONSE.md](./APPLE_REVIEW_RESPONSE.md)

## 審査状況サマリー

| 審査日 | Submission ID | ビルド | 結果 |
|--------|--------------|--------|------|
| 2026-02-03 | 9ae058dc-... | 不明 | 5件却下 |
| 2026-02-11 | 9ae058dc-... | 18 | 4件却下 |

### 前回→今回の変化

| ガイドライン | 前回 | 今回 | 状態 |
|-------------|------|------|------|
| 5.1.1 | カメラ/写真説明 | - | ✅ 解決 |
| 5.1.1(v) | アカウント削除 | - | ✅ 解決 |
| 2.1 | デモアカウント | ATT未検出 | 🔄 別問題 |
| 4.8 | Sign in with Apple | Sign in with Apple | ⚠️ 継続 |
| 1.2 | UGC（EULA+5項目） | UGC（4項目） | ⚠️ 一部解決 |
| 2.3.6 | - | 年齢レーティング | ❌ 新規 |

---

## 対応タスク

### 1. Sign in with Apple（Guideline 4.8）

**根本原因の可能性**:
- `packages/mobile/app.json` の `supportsTablet: false` がiPadでの表示を阻害

**対応**:
1. `supportsTablet: true` に変更
2. 審査ノートにAppleサインインボタンの場所を明記

**ファイル**:
- `packages/mobile/app.json`

---

### 2. UGCモデレーション（Guideline 1.2）

**現状実装済み**:
- ✅ EULA同意フロー（オンボーディング）
- ✅ 報告機能（ReportModal）
- ✅ ブロック機能（API + フィードから即時削除）

**未実装**:
- ❌ コンテンツフィルタリング（NGワード）
- ❌ 開発者への通知（報告/ブロック時）

#### 2-1. NGワードフィルタリング

**実装内容**:
- NGワードリスト作成
- 募集作成時のバリデーション
- メッセージ送信時のバリデーション
- フィルタリング時のエラーメッセージ

**ファイル**:
- `packages/api/src/lib/contentFilter.ts` （新規）
- `packages/api/src/routes/recruitments.ts` （更新）
- `packages/api/src/routes/groups.ts` （メッセージ送信部分更新）

#### 2-2. 開発者メール通知（Resend使用）

**実装内容**:
- Resendパッケージインストール (`resend`)
- メール送信サービス作成
- 報告作成時に開発者へメール通知
- ブロック時に開発者へメール通知

**メール内容**:
- 報告者情報
- 報告対象（ユーザー/募集/メッセージ）
- 報告理由
- 報告日時

**ファイル**:
- `packages/api/src/services/emailService.ts` （新規）
- `packages/api/src/routes/moderation.ts` （更新）
- `.env` に以下を追加:
  - `DEVELOPER_EMAIL` - 通知先メールアドレス
  - `RESEND_API_KEY` - Resend APIキー

---

### 3. 年齢レーティング（Guideline 2.3.6）

**対応**:
App Store Connect で設定変更（コード不要）
- App Information → Age Rating
- 「Parental Controls」→ **None**
- 「Age Assurance」→ **None**

---

### 4. ATT（Guideline 2.1）

**現状**:
実装済み（`_layout.tsx` で `requestTrackingPermissionsAsync()` を呼び出し）

**対応**:
- 審査ノートでATTダイアログの表示タイミングを説明

**確認ファイル**:
- `packages/mobile/app/_layout.tsx`

---

## 審査ノート（App Store Connect用）

```
【対応内容】
1. Sign in with Apple: ログイン画面下部の黒いAppleボタン
2. UGCモデレーション: 報告・ブロック・コンテンツフィルタリング実装済み
3. ATT: アプリ起動時に許可ダイアログ表示（iOS 14.5+）
4. アカウント削除: プロフィール画面下部

【Sign in with Appleの場所】
ログイン画面 → 「または」区切り線の下 → Googleログインの下の黒いボタン

【ATTダイアログ】
アプリ初回起動時に自動表示されます。
一度応答すると再表示されません。
```

---

## 環境変数設定

Resendメール通知を有効にするため、以下の環境変数を設定:

```bash
# .env
RESEND_API_KEY=re_xxxxxxxxxx  # Resend APIキー
DEVELOPER_EMAIL=admin@example.com  # 通知先メールアドレス
FROM_EMAIL=noreply@machimachi-matching.com  # 送信元メールアドレス（オプション）
```

---

## 実装順序

1. **即時対応（App Store Connect）**
   - [ ] 年齢レーティング設定変更

2. **コード変更**
   - [x] `supportsTablet: true` に変更
   - [x] NGワードフィルター実装
   - [x] 開発者メール通知実装（Resend）

3. **ビルド・提出**
   - [ ] 新ビルド作成
   - [ ] TestFlight確認
   - [ ] 審査ノート更新
   - [ ] 審査提出

---

## 検証方法

1. **Sign in with Apple**
   - iPadシミュレータでログイン画面を確認
   - Appleボタンが表示されることを確認

2. **NGワードフィルター**
   - NGワードを含む募集作成を試行
   - エラーメッセージが表示されることを確認

3. **開発者通知**
   - 報告を送信
   - 開発者メールアドレスにメールが届くことを確認

4. **ビルド**
   - `pnpm build` でAPIビルド成功
   - `eas build` でモバイルビルド成功
