# DB設計

## ER図

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │       │   WantToDo   │       │  Recruitment │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id visibleId)│──┐    │ id           │       │ id           │
│ email        │  │    │ visibleId    │       │ visibleId    │
│ name         │  │    │ userId       │──┐    │ creatorId    │──┐
│ nickname     │  │    │ categoryId   │  │    │ categoryId   │  │
│ avatarUrl    │  │    │ timing       │  │    │ title        │  │
│ bio          │  └───→│ comment      │  │    │ description  │  │
│ area         │       │ expiresAt    │  │    │ datetime     │  │
│ createdAt    │       │ status       │  │    │ datetimeFlex │  │
│ updatedAt    │       │ createdAt    │  │    │ area         │  │
└──────────────┘       │ updatedAt    │  │    │ location     │  │
       │               └──────────────┘  │    │ minPeople    │  │
       │                                 │    │ maxPeople    │  │
       │               ┌──────────────┐  │    │ status       │  │
       │               │   Category   │  │    │ createdAt    │  │
       │               ├──────────────┤  │    │ updatedAt    │  │
       │               │ id           │←─┴────│ closedAt     │  │
       │               │ name         │       └──────────────┘  │
       │               │ icon         │              │          │
       │               │ sortOrder    │              │          │
       │               └──────────────┘              │          │
       │                                             │          │
       │  ┌──────────────┐                           │          │
       │  │UserCategory  │                           │          │
       │  ├──────────────┤                           │          │
       └─→│ userId       │                           │          │
          │ categoryId   │                           │          │
          └──────────────┘                           │          │
                                                     │          │
       ┌─────────────────────────────────────────────┘          │
       │                                                        │
       │               ┌──────────────┐       ┌──────────────┐  │
       │               │    Offer     │       │    Group     │  │
       │               ├──────────────┤       ├──────────────┤  │
       │               │ id           │       │ id           │  │
       └──────────────→│ recruitmentId│──────→│ recruitmentId│←─┘
                       │ senderId     │       │ name         │
                       │ receiverId   │       │ createdAt    │
                       │ status       │       │ updatedAt    │
                       │ message      │       └──────────────┘
                       │ createdAt    │              │
                       │ respondedAt  │              │
                       └──────────────┘              │
                                                     │
                       ┌──────────────┐       ┌──────────────┐
                       │ GroupMember  │       │   Message    │
                       ├──────────────┤       ├──────────────┤
                       │ id           │       │ id           │
                       │ groupId      │←──────│ groupId      │
                       │ userId       │       │ senderId     │
                       │ role         │       │ content      │
                       │ joinedAt     │       │ createdAt    │
                       └──────────────┘       └──────────────┘

                       ┌──────────────┐
                       │ Application  │  ← 参加申請（ユーザー→募集者）
                       ├──────────────┤
                       │ id           │
                       │ recruitmentId│
                       │ applicantId  │
                       │ status       │
                       │ message      │
                       │ createdAt    │
                       │ respondedAt  │
                       └──────────────┘

                       ┌──────────────┐
                       │ Notification │
                       ├──────────────┤
                       │ id           │
                       │ userId       │
                       │ type         │
                       │ title        │
                       │ body         │
                       │ data         │
                       │ isRead       │
                       │ createdAt    │
                       └──────────────┘
```

---

## Prisma スキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ユーザー
// ============================================

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  nickname  String
  avatarUrl String?
  bio       String?
  area      Area     @default(TOKYO)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  categories     UserCategory[]
  wantToDos      WantToDo[]
  recruitments   Recruitment[]    @relation("Creator")
  applications   Application[]    @relation("Applicant")
  sentOffers     Offer[]          @relation("Sender")
  receivedOffers Offer[]          @relation("Receiver")
  groupMembers   GroupMember[]
  messages       Message[]
  notifications  Notification[]
}

model UserCategory {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@unique([userId, categoryId])
}

// ============================================
// カテゴリ
// ============================================

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  icon      String   // emoji or icon name
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  // Relations
  userCategories UserCategory[]
  wantToDos      WantToDo[]
  recruitments   Recruitment[]
}

// ============================================
// やりたいこと表明
// ============================================

model WantToDo {
  id         String       @id @default(cuid())
  userId     String
  categoryId String
  timing     Timing       @default(ANYTIME)
  comment    String?
  status     WantToDoStatus @default(ACTIVE)
  expiresAt  DateTime
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([categoryId])
  @@index([status, expiresAt])
}

// ============================================
// 募集
// ============================================

model Recruitment {
  id           String            @id @default(cuid())
  creatorId    String
  categoryId   String
  title        String
  description  String?
  datetime     DateTime?
  datetimeFlex String?           // "来週末のどこか" など
  area         Area
  location     String?           // "仙台駅周辺" など
  minPeople    Int               @default(1)
  maxPeople    Int               @default(10)
  status       RecruitmentStatus @default(OPEN)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt
  closedAt     DateTime?

  creator  User     @relation("Creator", fields: [creatorId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  // Relations
  offers       Offer[]
  applications Application[]
  group        Group?

  @@index([creatorId])
  @@index([categoryId])
  @@index([area, status])
}

// ============================================
// 参加申請（ユーザー → 募集者）
// ============================================

model Application {
  id            String            @id @default(cuid())
  recruitmentId String
  applicantId   String
  status        ApplicationStatus @default(PENDING)
  message       String?
  createdAt     DateTime          @default(now())
  respondedAt   DateTime?

  recruitment Recruitment @relation(fields: [recruitmentId], references: [id], onDelete: Cascade)
  applicant   User        @relation("Applicant", fields: [applicantId], references: [id], onDelete: Cascade)

  @@unique([recruitmentId, applicantId])
  @@index([applicantId, status])
}

// ============================================
// オファー（募集者 → ユーザー）
// ============================================

model Offer {
  id            String      @id @default(cuid())
  recruitmentId String
  senderId      String
  receiverId    String
  status        OfferStatus @default(PENDING)
  message       String?
  createdAt     DateTime    @default(now())
  respondedAt   DateTime?

  recruitment Recruitment @relation(fields: [recruitmentId], references: [id], onDelete: Cascade)
  sender      User        @relation("Sender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver    User        @relation("Receiver", fields: [receiverId], references: [id], onDelete: Cascade)

  @@unique([recruitmentId, receiverId])
  @@index([receiverId, status])
}

// ============================================
// グループ
// ============================================

model Group {
  id            String   @id @default(cuid())
  recruitmentId String   @unique
  name          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  recruitment Recruitment   @relation(fields: [recruitmentId], references: [id], onDelete: Cascade)
  members     GroupMember[]
  messages    Message[]
}

model GroupMember {
  id       String          @id @default(cuid())
  groupId  String
  userId   String
  role     GroupMemberRole @default(MEMBER)
  joinedAt DateTime        @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

// ============================================
// メッセージ
// ============================================

model Message {
  id        String   @id @default(cuid())
  groupId   String
  senderId  String
  content   String
  createdAt DateTime @default(now())

  group  Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  sender User  @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([groupId, createdAt])
}

// ============================================
// 通知
// ============================================

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  body      String
  data      Json?            // 追加データ（リンク先など）
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt])
}

// ============================================
// Enums
// ============================================

enum Area {
  TOKYO
  SENDAI
}

enum Timing {
  THIS_WEEK
  NEXT_WEEK
  THIS_MONTH
  ANYTIME
}

enum WantToDoStatus {
  ACTIVE
  EXPIRED
  DELETED
}

enum RecruitmentStatus {
  DRAFT
  OPEN
  CLOSED
  COMPLETED
  CANCELLED
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum OfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

enum GroupMemberRole {
  OWNER
  MEMBER
}

enum NotificationType {
  APPLICATION_RECEIVED  // 参加申請を受信（募集者向け）
  APPLICATION_APPROVED  // 参加申請が承認された（申請者向け）
  APPLICATION_REJECTED  // 参加申請が却下された（申請者向け）
  OFFER_RECEIVED        // オファーを受信
  OFFER_ACCEPTED        // オファーが承諾された
  OFFER_DECLINED        // オファーが辞退された
  RECRUITMENT_MATCH     // 表明にマッチする募集
  GROUP_CREATED         // グループが作成された
  NEW_MESSAGE           // 新しいメッセージ
  MEMBER_JOINED         // メンバーが参加
}
```

---

## テーブル定義詳細

### User（ユーザー）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| email | String | メールアドレス（ユニーク） |
| name | String? | 本名（任意） |
| nickname | String | ニックネーム（表示名） |
| avatarUrl | String? | アバター画像URL |
| bio | String? | 自己紹介 |
| area | Area | 活動エリア（TOKYO/SENDAI） |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### Category（カテゴリ）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| name | String | カテゴリ名（ユニーク） |
| icon | String | アイコン（絵文字） |
| sortOrder | Int | 表示順 |

**初期データ例**:
- 🎲 ボードゲーム
- ☕ カフェ
- 🍺 飲み会
- ⚽ スポーツ
- 🎮 ゲーム
- 🎬 映画
- 📚 読書
- 🎵 音楽
- 🏃 ランニング
- 🏋️ 筋トレ
- 🧘 ヨガ
- 📷 カメラ
- 🎨 アート
- 💻 プログラミング
- 🗣️ 勉強会

### WantToDo（やりたいこと表明）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| userId | String | ユーザーID（FK） |
| categoryId | String | カテゴリID（FK） |
| timing | Timing | 時期（今週/来週/今月/いつでも） |
| comment | String? | ひとこと |
| status | WantToDoStatus | ステータス |
| expiresAt | DateTime | 有効期限 |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### Recruitment（募集）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| creatorId | String | 作成者ID（FK） |
| categoryId | String | カテゴリID（FK） |
| title | String | タイトル |
| description | String? | 詳細説明 |
| datetime | DateTime? | 日時（確定している場合） |
| datetimeFlex | String? | 日時（ゆるい表現） |
| area | Area | エリア |
| location | String? | 場所（詳細） |
| minPeople | Int | 最小人数 |
| maxPeople | Int | 最大人数 |
| status | RecruitmentStatus | ステータス |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |
| closedAt | DateTime? | 締め切り日時 |

### Application（参加申請）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| recruitmentId | String | 募集ID（FK） |
| applicantId | String | 申請者ID（FK） |
| status | ApplicationStatus | ステータス（PENDING/APPROVED/REJECTED/CANCELLED） |
| message | String? | メッセージ |
| createdAt | DateTime | 作成日時 |
| respondedAt | DateTime? | 応答日時 |

### Offer（オファー）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| recruitmentId | String | 募集ID（FK） |
| senderId | String | 送信者ID（FK） |
| receiverId | String | 受信者ID（FK） |
| status | OfferStatus | ステータス |
| message | String? | メッセージ |
| createdAt | DateTime | 作成日時 |
| respondedAt | DateTime? | 応答日時 |

### Group（グループ）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| recruitmentId | String | 募集ID（FK、1:1） |
| name | String | グループ名 |
| createdAt | DateTime | 作成日時 |
| updatedAt | DateTime | 更新日時 |

### GroupMember（グループメンバー）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| groupId | String | グループID（FK） |
| userId | String | ユーザーID（FK） |
| role | GroupMemberRole | 役割（OWNER/MEMBER） |
| joinedAt | DateTime | 参加日時 |

### Message（メッセージ）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| groupId | String | グループID（FK） |
| senderId | String | 送信者ID（FK） |
| content | String | メッセージ内容 |
| createdAt | DateTime | 作成日時 |

### Notification（通知）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | String (CUID) | 主キー |
| userId | String | ユーザーID（FK） |
| type | NotificationType | 通知タイプ |
| title | String | タイトル |
| body | String | 本文 |
| data | Json? | 追加データ |
| isRead | Boolean | 既読フラグ |
| createdAt | DateTime | 作成日時 |

---

## インデックス設計

| テーブル | インデックス | 用途 |
|---------|-------------|------|
| WantToDo | (userId) | ユーザーの表明一覧取得 |
| WantToDo | (categoryId) | カテゴリ別表明取得 |
| WantToDo | (status, expiresAt) | 有効な表明の取得 |
| Recruitment | (creatorId) | ユーザーの募集一覧取得 |
| Recruitment | (categoryId) | カテゴリ別募集取得 |
| Recruitment | (area, status) | エリア別募集一覧取得 |
| Application | (applicantId, status) | 自分の申請一覧取得 |
| Offer | (receiverId, status) | 受信オファー一覧取得 |
| Message | (groupId, createdAt) | グループのメッセージ取得 |
| Notification | (userId, isRead, createdAt) | 未読通知取得 |
