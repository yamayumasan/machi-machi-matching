# API設計

## 概要

本ドキュメントはREST APIのエンドポイント設計を定義します。

---

## 基本設計

### ベースURL

```
開発環境: http://localhost:3000/api
本番環境: https://api.machi-machi.com/api
```

### 認証

- Supabase Authによる認証
- JWTトークンをAuthorizationヘッダーで送信

```
Authorization: Bearer <JWT_TOKEN>
```

### レスポンス形式

```typescript
// 成功時
{
  "success": true,
  "data": { ... }
}

// エラー時
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}

// ページネーション
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 201 | 作成成功 |
| 204 | 削除成功（No Content） |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 403 | 権限エラー |
| 404 | リソース不存在 |
| 409 | コンフリクト（重複等） |
| 422 | バリデーションエラー |
| 500 | サーバーエラー |

---

## エンドポイント一覧

### 認証 (Auth)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/auth/signup` | メールで新規登録 | 不要 |
| POST | `/auth/signin` | メールでログイン | 不要 |
| POST | `/auth/signout` | ログアウト | 必要 |
| GET | `/auth/me` | 現在のユーザー情報 | 必要 |
| POST | `/auth/refresh` | トークンリフレッシュ | 必要 |

### ユーザー (Users)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/users/me` | 自分のプロフィール | 必要 |
| PUT | `/users/me` | プロフィール更新 | 必要 |
| POST | `/users/me/avatar` | アバター画像アップロード | 必要 |
| DELETE | `/users/me/avatar` | アバター画像削除 | 必要 |
| GET | `/users/me/categories` | 自分の興味カテゴリ | 必要 |
| PUT | `/users/me/categories` | 興味カテゴリ更新 | 必要 |
| GET | `/users/:id` | 他ユーザーのプロフィール | 必要 |

### カテゴリ (Categories)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/categories` | カテゴリ一覧 | 不要 |

### やりたいこと表明 (WantToDos)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/want-to-dos` | 自分の表明一覧 | 必要 |
| POST | `/want-to-dos` | 表明作成 | 必要 |
| GET | `/want-to-dos/:id` | 表明詳細 | 必要 |
| PUT | `/want-to-dos/:id` | 表明更新 | 必要 |
| DELETE | `/want-to-dos/:id` | 表明削除 | 必要 |
| POST | `/want-to-dos/:id/extend` | 期限延長 | 必要 |

### 募集 (Recruitments)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/recruitments` | 募集一覧 | 必要 |
| POST | `/recruitments` | 募集作成 | 必要 |
| GET | `/recruitments/me` | 自分の募集一覧 | 必要 |
| GET | `/recruitments/:id` | 募集詳細 | 必要 |
| PUT | `/recruitments/:id` | 募集更新 | 必要 |
| DELETE | `/recruitments/:id` | 募集削除 | 必要 |
| POST | `/recruitments/:id/close` | 募集締め切り | 必要 |
| GET | `/recruitments/:id/suggestions` | ユーザー提案 | 必要 |
| GET | `/recruitments/:id/applications` | 申請一覧（募集者用） | 必要 |

### 参加申請 (Applications)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/applications` | 自分の申請一覧 | 必要 |
| POST | `/applications` | 申請送信 | 必要 |
| GET | `/applications/:id` | 申請詳細 | 必要 |
| POST | `/applications/:id/approve` | 申請承認（募集者） | 必要 |
| POST | `/applications/:id/reject` | 申請却下（募集者） | 必要 |
| POST | `/applications/:id/cancel` | 申請キャンセル（申請者） | 必要 |

### オファー (Offers)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/offers` | 受信オファー一覧 | 必要 |
| GET | `/offers/sent` | 送信オファー一覧 | 必要 |
| POST | `/offers` | オファー送信 | 必要 |
| GET | `/offers/:id` | オファー詳細 | 必要 |
| POST | `/offers/:id/accept` | オファー承諾 | 必要 |
| POST | `/offers/:id/decline` | オファー辞退 | 必要 |

### グループ (Groups)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/groups` | 参加グループ一覧 | 必要 |
| GET | `/groups/:id` | グループ詳細 | 必要 |
| GET | `/groups/:id/members` | メンバー一覧 | 必要 |
| GET | `/groups/:id/messages` | メッセージ一覧 | 必要 |
| POST | `/groups/:id/messages` | メッセージ送信 | 必要 |

### 通知 (Notifications)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/notifications` | 通知一覧 | 必要 |
| GET | `/notifications/unread-count` | 未読数取得 | 必要 |
| POST | `/notifications/:id/read` | 既読にする | 必要 |
| POST | `/notifications/read-all` | 全て既読にする | 必要 |

---

## 詳細仕様

### POST /auth/signup

メールアドレスで新規登録

**リクエスト**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cuid",
      "email": "user@example.com"
    },
    "session": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

---

### PUT /users/me

プロフィール更新

**リクエスト**
```json
{
  "nickname": "ユーザー名",
  "bio": "自己紹介文",
  "area": "TOKYO"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "email": "user@example.com",
    "nickname": "ユーザー名",
    "bio": "自己紹介文",
    "avatarUrl": "https://...",
    "area": "TOKYO",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### GET /recruitments

募集一覧取得

**クエリパラメータ**
| パラメータ | 型 | 説明 |
|-----------|-----|------|
| page | number | ページ番号（デフォルト: 1） |
| limit | number | 取得件数（デフォルト: 20） |
| area | string | エリア（TOKYO / SENDAI） |
| categoryId | string | カテゴリID |
| status | string | ステータス（デフォルト: OPEN） |

**レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid",
      "title": "ボドゲ会やりませんか？",
      "category": {
        "id": "cuid",
        "name": "ボードゲーム",
        "icon": "🎲"
      },
      "creator": {
        "id": "cuid",
        "nickname": "Aさん",
        "avatarUrl": "https://..."
      },
      "datetime": "2024-01-15T14:00:00Z",
      "datetimeFlex": "来週末のどこか",
      "area": "SENDAI",
      "location": "仙台駅周辺",
      "minPeople": 2,
      "maxPeople": 5,
      "currentPeople": 2,
      "status": "OPEN",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### POST /recruitments

募集作成

**リクエスト**
```json
{
  "title": "ボドゲ会やりませんか？",
  "categoryId": "cuid",
  "description": "初心者歓迎！カタンや人狼をやりたいです。",
  "datetime": "2024-01-15T14:00:00Z",
  "datetimeFlex": "来週末のどこか",
  "area": "SENDAI",
  "location": "仙台駅周辺",
  "minPeople": 2,
  "maxPeople": 5
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "title": "ボドゲ会やりませんか？",
    ...
  }
}
```

---

### GET /recruitments/:id/suggestions

ユーザー提案（マッチング）

**レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "user": {
        "id": "cuid",
        "nickname": "Aさん",
        "avatarUrl": "https://...",
        "bio": "ボドゲ好きです"
      },
      "score": 90,
      "hasActiveWantToDo": true,
      "wantToDo": {
        "id": "cuid",
        "comment": "カタンやってみたい！",
        "timing": "THIS_WEEK"
      },
      "matchedCategories": ["ボードゲーム"]
    }
  ]
}
```

---

### POST /applications

参加申請送信

**リクエスト**
```json
{
  "recruitmentId": "cuid",
  "message": "参加したいです！初心者ですがよろしくお願いします。"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "recruitmentId": "cuid",
    "applicantId": "cuid",
    "status": "PENDING",
    "message": "参加したいです！...",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### POST /offers

オファー送信

**リクエスト**
```json
{
  "recruitmentId": "cuid",
  "receiverId": "cuid",
  "message": "ぜひ参加しませんか？"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "recruitmentId": "cuid",
    "senderId": "cuid",
    "receiverId": "cuid",
    "status": "PENDING",
    "message": "ぜひ参加しませんか？",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

## WebSocket (Socket.io)

### 接続

```typescript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'JWT_TOKEN'
  }
});
```

### イベント

#### クライアント → サーバー

| イベント | 説明 | ペイロード |
|---------|------|-----------|
| `join-group` | グループに参加 | `{ groupId: string }` |
| `leave-group` | グループを離脱 | `{ groupId: string }` |
| `send-message` | メッセージ送信 | `{ groupId: string, content: string }` |
| `typing-start` | 入力開始 | `{ groupId: string }` |
| `typing-end` | 入力終了 | `{ groupId: string }` |

#### サーバー → クライアント

| イベント | 説明 | ペイロード |
|---------|------|-----------|
| `new-message` | 新しいメッセージ | `{ message: Message }` |
| `user-typing` | ユーザーが入力中 | `{ userId: string, nickname: string }` |
| `member-joined` | メンバー参加 | `{ member: GroupMember }` |
| `new-notification` | 新しい通知 | `{ notification: Notification }` |

---

## エラーコード

| コード | 説明 |
|--------|------|
| `AUTH_REQUIRED` | 認証が必要 |
| `INVALID_CREDENTIALS` | 認証情報が不正 |
| `USER_NOT_FOUND` | ユーザーが見つからない |
| `RECRUITMENT_NOT_FOUND` | 募集が見つからない |
| `RECRUITMENT_CLOSED` | 募集は締め切り済み |
| `ALREADY_APPLIED` | すでに申請済み |
| `ALREADY_MEMBER` | すでにメンバー |
| `NOT_AUTHORIZED` | 権限がない |
| `VALIDATION_ERROR` | バリデーションエラー |
| `INTERNAL_ERROR` | サーバー内部エラー |
