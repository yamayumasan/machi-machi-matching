# Apple App Store 審査対応

## 概要

- **提出日**: 2026年2月
- **審査日**: 2026年2月3日
- **審査デバイス**: iPad Air (5th generation)
- **バージョン**: 1.0
- **Submission ID**: 9ae058dc-a078-4773-b5f6-fb4f27ecba5f

初回提出に対して5つのガイドライン違反が指摘された。

---

## 指摘事項サマリー

| # | ガイドライン | 問題 | 重要度 | ステータス |
|---|-------------|------|--------|-----------|
| 1 | 4.8 Login Services | Sign in with Apple が必要 | 🔴 必須 | ⬜ 未着手 |
| 2 | 5.1.1 Privacy | カメラ/写真の目的説明が不十分 | 🟡 軽微 | ✅ 完了 |
| 3 | 5.1.1(v) Account Deletion | アカウント削除機能がない | 🔴 必須 | ✅ 完了 |
| 4 | 2.1 Information Needed | 審査用デモアカウントが必要 | 🟡 対応のみ | ✅ 完了 |
| 5 | 1.2 User-Generated Content | UGCモデレーション機能が不足 | 🔴 必須 | ⬜ 未着手 |

---

## 対応フェーズ

### Phase 1: 軽微な対応（即時対応可能）

#### 1-1. 目的説明文の改善（Guideline 5.1.1）

**問題点**:
カメラとフォトライブラリのパーミッション説明が具体的でない。
「なぜこの権限が必要か」「どのように使用されるか」の具体例が必要。

**対応内容**:
- [x] `packages/mobile/app.json` の `NSCameraUsageDescription` を具体的に記載
- [x] `packages/mobile/app.json` の `NSPhotoLibraryUsageDescription` を具体的に記載
- [x] `expo-image-picker` プラグインに `cameraPermission` と `photosPermission` を追加

**改善内容**:
```
NSCameraUsageDescription: "プロフィール写真を撮影するためにカメラを使用します。撮影した写真はあなたのプロフィール画像として他のユーザーに表示されます。"
NSPhotoLibraryUsageDescription: "プロフィール写真を選択するためにフォトライブラリにアクセスします。選択した写真はあなたのプロフィール画像として他のユーザーに表示されます。"
```

**ステータス**: ✅ 完了（2026-02-07）

#### 1-2. 審査用デモアカウント準備（Guideline 2.1）

**問題点**:
審査員がアプリの全機能を確認できない。事前にコンテンツが入ったデモアカウントが必要。

**対応内容**:
- [x] デモ用ユーザーアカウントを本番環境に作成（gedozu@appmail.uk）
- [x] 以下のデモデータを事前投入:
  - [x] 募集データ（5件）
  - [x] やりたいこと表明（2件）
  - [x] グループ（チャット履歴付き、2件）
  - [x] 通知データ（4件）
- [ ] App Store Connect にデモアカウント情報を登録
  - メールアドレス: gedozu@appmail.uk
  - パスワード: （設定済みのパスワード）
  - 操作手順の説明

##### セットアップ手順

**Step 1: デモアカウントの作成**

1. 本番環境の Supabase Dashboard にアクセス
2. Authentication > Users > Add User で新規ユーザー作成
   - Email: `demo-reviewer@machimachi.app`（または任意）
   - Password: 強力なパスワードを設定
   - Auto Confirm User: ON

**Step 2: デモデータの投入**

既存の seed スクリプトを活用してデモデータを投入:

```bash
# 本番DBに接続して実行
cd packages/api
SEED_USER_EMAIL=demo-reviewer@machimachi.app pnpm prisma db seed
```

または、以下を手動で実施:
1. アプリにログイン
2. オンボーディングを完了（ニックネーム、エリア、カテゴリ設定）
3. 募集を2-3件作成
4. 「やりたいこと」を1-2件表明
5. 他のユーザーの募集に申請
6. グループチャットで数件メッセージを送信

**Step 3: App Store Connect への登録**

1. App Store Connect > アプリ > App Review Information
2. 「Sign-In Information」セクション:
   - User name: `demo-reviewer@machimachi.app`
   - Password: （設定したパスワード）
3. 「Notes」セクションに操作手順を記載:

```
【デモアカウント情報】
メール: demo-reviewer@machimachi.app
パスワード: ********

【確認可能な機能】
1. ホーム画面: 募集一覧の確認
2. 探索タブ: 地図上で募集・やりたいことを表示
3. グループタブ: 参加中のグループチャット
4. プロフィールタブ: プロフィール編集

【操作手順】
1. アプリ起動後、上記メールアドレスでログイン
2. ホームタブで募集一覧を確認
3. 探索タブで地図表示を確認
4. グループタブでチャット機能を確認
5. プロフィールタブでプロフィール編集を確認
```

**ステータス**: ✅ 完了（2026-02-07）

**投入済みデータ** (gedozu@appmail.uk):
- 募集（自分作成）: 3件（ボードゲーム会、カフェ巡り、フットサル）
- 募集（他者作成）: 2件（映画、朝ラン）
- やりたいこと: 2件
- グループチャット: 2件（計18件のメッセージ）
- 通知: 4件（未読・既読混在）
- 参加申請: 2件（承認待ち）

---

### Phase 2: 必須機能実装

#### 2-1. アカウント削除機能（Guideline 5.1.1(v)）

**問題点**:
アカウント作成機能はあるが、削除機能がない。ユーザーが自分のデータを管理する権利を保証する必要がある。

**要件**:
- 一時的な無効化ではなく、完全削除が必要
- Webサイトでの削除が必要な場合は直接リンクを提供
- 誤操作防止の確認ステップは許可される

**対応内容**:

##### フロントエンド
- [x] プロフィール画面に「アカウントを削除」ボタン追加
- [x] 削除確認モーダル実装（2段階確認）
  - 1段階目: 「本当に削除しますか？この操作は取り消せません」
  - 2段階目: 最終確認ダイアログ
- [x] 削除完了後、ログイン画面にリダイレクト

##### バックエンド
- [x] `DELETE /api/users/me` エンドポイント実装
- [x] 削除時の処理:
  - [x] ユーザーの募集を全てクローズ
  - [x] グループからの退出処理
  - [x] 関連データの削除 or 匿名化
  - [x] Supabase Auth からユーザー削除

**ステータス**: ✅ 完了（2026-02-08）

##### データ処理方針
| データ種別 | 処理 |
|-----------|------|
| User | 削除 |
| UserCategory | 削除 |
| WantToDo | 削除 |
| Recruitment | ステータスをCLOSEDに変更、作成者を匿名化 |
| Application | 削除 |
| Offer | 削除 |
| GroupMember | 削除（グループからの退出） |
| Message | 送信者を匿名化（「退会済みユーザー」） |
| Notification | 削除 |

#### 2-2. Sign in with Apple（Guideline 4.8）

**問題点**:
サードパーティログイン（Google OAuth）を提供している場合、Sign in with Apple も同等のオプションとして必須。

**要件**:
- データ収集を名前とメールアドレスに限定
- メールアドレスを非公開にするオプション（Apple の Hide My Email）
- 広告目的でのインタラクション収集をしない

**対応内容**:

##### Apple Developer Console
- [ ] App ID で Sign in with Apple を有効化
- [ ] Service ID の設定（Supabase用）

##### Supabase
- [ ] Apple OAuth プロバイダーの設定
- [ ] コールバックURLの設定

##### フロントエンド
- [ ] `expo-apple-authentication` パッケージ追加
- [ ] ログイン画面に「Appleでサインイン」ボタン追加
- [ ] Apple認証フローの実装
- [ ] 既存アカウントとのリンク処理（同一メールの場合）

##### バックエンド
- [ ] Apple IDでのユーザー作成/ログイン処理
- [ ] Apple の `user_identifier` の保存

---

### Phase 3: UGCモデレーション機能（Guideline 1.2）

**問題点**:
ユーザー生成コンテンツ（募集、チャット等）があるが、安全対策が不十分。

**必須要件**:
1. EULA（利用規約）への同意
2. 不適切コンテンツのフィルタリング
3. 報告機能
4. ブロック機能（即時フィード非表示 + 開発者通知）
5. 24時間以内の対応体制

#### 3-1. EULA同意フロー

**対応内容**:
- [ ] 利用規約に不適切コンテンツ・悪質ユーザーへの対応を明記
- [ ] 新規登録時に利用規約への同意を必須化
- [ ] 同意日時をユーザーレコードに記録
- [ ] 利用規約更新時の再同意フロー

#### 3-2. コンテンツフィルタリング

**対応内容**:
- [ ] NGワードリストの作成・管理
- [ ] 募集タイトル・説明のフィルタリング
- [ ] チャットメッセージのフィルタリング
- [ ] フィルタリングされた場合のユーザーへの通知

#### 3-3. 報告機能

**対応内容**:

##### フロントエンド
- [ ] 募集詳細画面に「報告」ボタン追加
- [ ] ユーザープロフィールに「報告」ボタン追加
- [ ] チャットメッセージの長押しで「報告」オプション
- [ ] 報告理由の選択UI
  - スパム
  - 不適切なコンテンツ
  - ハラスメント
  - 詐欺・なりすまし
  - その他

##### バックエンド
- [ ] `Report` モデル追加（Prisma）
- [ ] `POST /api/reports` エンドポイント
- [ ] 報告時の管理者通知（メール or Slack）

#### 3-4. ブロック機能

**対応内容**:

##### フロントエンド
- [ ] ユーザープロフィールに「ブロック」ボタン追加
- [ ] ブロック確認モーダル
- [ ] ブロックリスト管理画面（設定内）
- [ ] ブロック解除機能

##### バックエンド
- [ ] `UserBlock` モデル追加（Prisma）
- [ ] `POST /api/users/:id/block` エンドポイント
- [ ] `DELETE /api/users/:id/block` エンドポイント
- [ ] ブロック時の処理:
  - [ ] 相手の募集をフィードから非表示
  - [ ] 相手のやりたいことを非表示
  - [ ] 共有グループからの通知を非表示
  - [ ] 新規マッチングの防止

##### クエリ修正
- [ ] 募集一覧クエリにブロックフィルター追加
- [ ] やりたいこと一覧にブロックフィルター追加
- [ ] 近隣検索にブロックフィルター追加

#### 3-5. 管理者対応体制

**対応内容**:
- [ ] 報告一覧の管理画面（Web or 内部ツール）
- [ ] 報告への対応ステータス管理
- [ ] コンテンツ削除機能
- [ ] ユーザーBAN機能
- [ ] 24時間以内対応のオペレーション体制構築
- [ ] 対応履歴の記録

---

## データベース変更（Phase 3）

### 新規テーブル

```prisma
// 報告
model Report {
  id          String   @id @default(cuid())
  reporterId  String
  reporter    User     @relation("ReportsMade", fields: [reporterId], references: [id])

  // 報告対象（いずれか1つ）
  targetUserId       String?
  targetUser         User?        @relation("ReportsReceived", fields: [targetUserId], references: [id])
  targetRecruitmentId String?
  targetRecruitment   Recruitment? @relation(fields: [targetRecruitmentId], references: [id])
  targetMessageId    String?
  targetMessage      Message?     @relation(fields: [targetMessageId], references: [id])

  reason      ReportReason
  description String?
  status      ReportStatus @default(PENDING)

  createdAt   DateTime @default(now())
  resolvedAt  DateTime?
  resolvedBy  String?
  resolution  String?
}

enum ReportReason {
  SPAM
  INAPPROPRIATE_CONTENT
  HARASSMENT
  FRAUD
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWING
  RESOLVED
  DISMISSED
}

// ユーザーブロック
model UserBlock {
  id          String   @id @default(cuid())
  blockerId   String
  blocker     User     @relation("BlocksMade", fields: [blockerId], references: [id])
  blockedId   String
  blocked     User     @relation("BlocksReceived", fields: [blockedId], references: [id])
  createdAt   DateTime @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
}
```

### User テーブル追加フィールド

```prisma
model User {
  // 既存フィールド...

  termsAcceptedAt  DateTime?  // 利用規約同意日時
  termsVersion     String?    // 同意した利用規約バージョン
  isBanned         Boolean    @default(false)
  bannedAt         DateTime?
  bannedReason     String?
}
```

---

## 再提出チェックリスト

### 提出前確認事項
- [ ] Phase 1〜3 の全タスク完了
- [ ] 本番環境にデプロイ済み
- [ ] デモアカウントで全機能動作確認
- [ ] App Store Connect にデモアカウント情報登録
- [ ] スクリーンショット更新（必要に応じて）
- [ ] アプリ説明文更新（新機能について記載）

### App Store Connect 更新事項
- [ ] デモアカウント情報
- [ ] 審査メモ（対応内容の説明）

---

## 参考リンク

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [Account Deletion Requirements](https://developer.apple.com/support/offering-account-deletion-in-your-app/)
- [User-Generated Content Guidelines](https://developer.apple.com/app-store/review/guidelines/#user-generated-content)
