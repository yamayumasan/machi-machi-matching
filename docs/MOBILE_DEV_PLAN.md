# iOS アプリ開発計画

## 概要

既存の Web 版「マチマチマッチング」を React Native (Expo) で iOS アプリ化する。
バックエンド API は既存のものをそのまま利用し、UI 層のみを React Native で再実装する。

---

## 技術選定

### 採用技術

| 技術 | バージョン | 選定理由 |
|------|-----------|---------|
| **React Native** | 0.76.x | クロスプラットフォーム、豊富なエコシステム |
| **Expo** | SDK 52 | 開発効率、EAS Build、OTA アップデート |
| **TypeScript** | 5.x | 既存プロジェクトとの統一、型安全性 |
| **Zustand** | 5.x | Pinia に似た軽量な状態管理、シンプルな API |
| **React Navigation** | 7.x | 標準的なナビゲーション、Stack/Tab 対応 |
| **react-native-maps** | 1.x | iOS ネイティブ地図（Apple Maps） |
| **Socket.io-client** | 4.x | 既存 API との互換性 |
| **@supabase/supabase-js** | 2.x | 既存認証との互換性 |
| **Axios** | 1.x | HTTP クライアント、既存 API 互換 |
| **expo-secure-store** | - | セキュアなトークン保存 |
| **expo-notifications** | - | プッシュ通知 |
| **expo-location** | - | 位置情報取得 |

### 再利用する既存資産

| 資産 | 再利用方法 |
|------|-----------|
| **API サーバー** | そのまま利用（変更なし） |
| **shared パッケージ** | 型定義・Zod スキーマ・定数を import |
| **PostgreSQL DB** | そのまま利用（変更なし） |
| **Supabase Auth** | React Native SDK で接続 |
| **Socket.io サーバー** | そのまま利用（変更なし） |

---

## プロジェクト構成

```
machi-machi-matching/
├── packages/
│   ├── web/              # 既存（変更なし）
│   ├── api/              # 既存（変更なし）
│   ├── shared/           # 既存（mobile からも参照）
│   └── mobile/           # 新規: Expo プロジェクト
│       ├── app/          # Expo Router（ファイルベースルーティング）
│       │   ├── (auth)/   # 認証前の画面
│       │   │   ├── login.tsx
│       │   │   ├── register.tsx
│       │   │   └── _layout.tsx
│       │   ├── (tabs)/   # メインタブ画面
│       │   │   ├── index.tsx       # ホーム
│       │   │   ├── explore.tsx     # 探す（地図）
│       │   │   ├── groups.tsx      # グループ一覧
│       │   │   ├── profile.tsx     # プロフィール
│       │   │   └── _layout.tsx
│       │   ├── onboarding/
│       │   │   └── index.tsx
│       │   ├── recruitment/
│       │   │   ├── [id].tsx        # 募集詳細
│       │   │   ├── create.tsx      # 募集作成
│       │   │   └── [id]/
│       │   │       └── applications.tsx
│       │   ├── group/
│       │   │   └── [id].tsx        # グループチャット
│       │   ├── notifications.tsx
│       │   ├── _layout.tsx
│       │   └── +not-found.tsx
│       ├── src/
│       │   ├── components/         # UI コンポーネント
│       │   │   ├── ui/             # 基本 UI（Button, Input, Card...）
│       │   │   ├── recruitment/    # 募集関連
│       │   │   ├── wantToDo/       # やりたいこと関連
│       │   │   ├── chat/           # チャット関連
│       │   │   └── map/            # 地図関連
│       │   ├── stores/             # Zustand ストア
│       │   │   ├── auth.ts
│       │   │   ├── nearby.ts
│       │   │   ├── recruitment.ts
│       │   │   ├── group.ts
│       │   │   ├── wantToDo.ts
│       │   │   └── notification.ts
│       │   ├── hooks/              # カスタムフック
│       │   │   ├── useAuth.ts
│       │   │   ├── useSocket.ts
│       │   │   ├── useLocation.ts
│       │   │   └── useNotifications.ts
│       │   ├── services/           # API クライアント
│       │   │   ├── api.ts          # Axios インスタンス
│       │   │   ├── auth.ts
│       │   │   ├── recruitment.ts
│       │   │   ├── wantToDo.ts
│       │   │   ├── group.ts
│       │   │   └── notification.ts
│       │   ├── utils/              # ユーティリティ
│       │   │   ├── storage.ts      # SecureStore ラッパー
│       │   │   └── format.ts
│       │   └── constants/          # 定数（shared から re-export）
│       ├── assets/                 # 画像・フォント
│       ├── app.json                # Expo 設定
│       ├── eas.json                # EAS Build 設定
│       ├── package.json
│       └── tsconfig.json
├── pnpm-workspace.yaml            # mobile を追加
└── ...
```

---

## 画面一覧（iOS 版）

既存 Web 版と同等の 17 画面を実装。

### Phase 1: 認証・基本機能

| 画面 | ルート | 優先度 |
|------|--------|--------|
| スプラッシュ | - (Expo SplashScreen) | P0 |
| ログイン | `/login` | P0 |
| 新規登録 | `/register` | P0 |
| オンボーディング | `/onboarding` | P0 |
| ホーム | `/(tabs)/` | P0 |
| プロフィール | `/(tabs)/profile` | P0 |

### Phase 2: コア機能

| 画面 | ルート | 優先度 |
|------|--------|--------|
| やりたいこと作成 | Modal | P1 |
| やりたいこと一覧 | ホーム内セクション | P1 |
| 募集一覧（地図） | `/(tabs)/explore` | P1 |
| 募集詳細 | `/recruitment/[id]` | P1 |
| 募集作成 | `/recruitment/create` | P1 |

### Phase 3: マッチング・コミュニケーション

| 画面 | ルート | 優先度 |
|------|--------|--------|
| ユーザー提案 | 募集作成後 Modal | P2 |
| 応募管理 | `/recruitment/[id]/applications` | P2 |
| グループ一覧 | `/(tabs)/groups` | P2 |
| グループチャット | `/group/[id]` | P2 |
| 通知 | `/notifications` | P2 |

---

## 実装フェーズ

### Phase 0: プロジェクト初期設定

**期間目安: 基盤構築**

- [ ] Expo プロジェクト作成 (`npx create-expo-app`)
- [ ] pnpm workspace に mobile 追加
- [ ] TypeScript 設定
- [ ] shared パッケージの参照設定
- [ ] ESLint / Prettier 設定
- [ ] 基本的なフォルダ構成作成
- [ ] Expo Router 設定
- [ ] 環境変数設定 (`.env`)

### Phase 1: 認証フロー

**期間目安: 認証完成まで**

- [ ] Supabase Auth 接続
- [ ] SecureStore によるトークン管理
- [ ] ログイン画面
- [ ] 新規登録画面
- [ ] OAuth (Google) 設定
- [ ] オンボーディング画面（3 ステップ）
- [ ] 認証状態による画面制御
- [ ] API クライアント（Axios + 認証ヘッダー）

### Phase 2: ホーム・基本機能

**期間目安: 基本画面完成まで**

- [ ] タブナビゲーション設定
- [ ] ホーム画面レイアウト
- [ ] やりたいこと表示・作成
- [ ] プロフィール画面
- [ ] プロフィール編集
- [ ] 基本 UI コンポーネント作成
  - [ ] Button, Input, Card, Modal
  - [ ] Avatar, Badge, Chip
  - [ ] List, LoadingSpinner

### Phase 3: 地図・募集機能

**期間目安: 募集機能完成まで**

- [ ] react-native-maps 設定
- [ ] 地図画面（探す）
- [ ] マーカー表示・クラスタリング
- [ ] 募集一覧表示
- [ ] 募集詳細画面
- [ ] 募集作成画面
- [ ] 位置情報取得 (expo-location)
- [ ] 場所選択ピッカー

### Phase 4: マッチング機能

**期間目安: マッチング完成まで**

- [ ] 応募機能
- [ ] 応募管理画面
- [ ] オファー送信機能
- [ ] オファー受信・承諾/辞退
- [ ] ユーザー提案表示

### Phase 5: リアルタイム・通知

**期間目安: リアルタイム機能完成まで**

- [ ] Socket.io 接続
- [ ] グループ一覧画面
- [ ] グループチャット画面
- [ ] リアルタイムメッセージ
- [ ] 通知画面
- [ ] プッシュ通知設定 (expo-notifications)
- [ ] バッジ更新

### Phase 6: 最終調整・リリース準備

**期間目安: リリース準備**

- [ ] UI/UX 調整
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化
- [ ] アプリアイコン・スプラッシュ画面
- [ ] App Store 用スクリーンショット
- [ ] EAS Build 設定
- [ ] TestFlight 配布
- [ ] App Store 申請

---

## 状態管理設計 (Zustand)

### ストア構成

```typescript
// stores/auth.ts
interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  isOnboarded: boolean

  // Actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  completeOnboarding: (data: OnboardingData) => Promise<void>
}

// stores/nearby.ts
interface NearbyState {
  recruitments: Recruitment[]
  wantToDos: WantToDo[]
  selectedItem: Recruitment | WantToDo | null
  filters: NearbyFilters
  mapRegion: Region
  isLoading: boolean

  // Actions
  fetchNearby: (bounds: Bounds) => Promise<void>
  setFilters: (filters: Partial<NearbyFilters>) => void
  setSelectedItem: (item: Recruitment | WantToDo | null) => void
  setMapRegion: (region: Region) => void
}

// stores/group.ts
interface GroupState {
  groups: Group[]
  currentGroup: Group | null
  messages: Message[]
  unreadCounts: Record<string, number>
  isLoading: boolean

  // Actions
  fetchGroups: () => Promise<void>
  fetchMessages: (groupId: string) => Promise<void>
  sendMessage: (groupId: string, content: string) => Promise<void>
  markAsRead: (groupId: string) => void
}
```

---

## API クライアント設計

```typescript
// services/api.ts
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// リクエストインターセプター: 認証ヘッダー追加
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// レスポンスインターセプター: トークンリフレッシュ
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // トークンリフレッシュ処理
    }
    return Promise.reject(error)
  }
)
```

---

## UI コンポーネント設計

### デザインシステム

Web 版の Tailwind CSS スタイルを NativeWind または StyleSheet で再現。

```typescript
// テーマカラー（Web版と統一）
export const colors = {
  primary: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',  // メインカラー
    600: '#dc2626',
    700: '#b91c1c',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827',
  },
}

// 共通スタイル
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
}
```

---

## 環境変数

```bash
# packages/mobile/.env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxx
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=xxx
```

---

## テスト戦略

| レイヤー | ツール | 対象 |
|---------|--------|------|
| Unit | Jest | Zustand ストア、ユーティリティ |
| Component | React Native Testing Library | UI コンポーネント |
| E2E | Maestro | 主要フロー |

---

## リスクと対策

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 地図パフォーマンス | 高 | マーカークラスタリング、遅延読み込み |
| OAuth 設定の複雑さ | 中 | Expo AuthSession 活用、ドキュメント参照 |
| shared パッケージの互換性 | 中 | React Native 非対応コードの分離 |
| App Store 審査リジェクト | 中 | Apple ガイドライン確認、事前テスト |
| リアルタイム通信の安定性 | 中 | 再接続ロジック、オフライン対応 |

---

## 参考リンク

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)
- [Supabase React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)

---

## 次のステップ

1. **Phase 0 開始**: Expo プロジェクトの初期化
2. shared パッケージを mobile から参照できるように設定
3. 認証フローから実装開始
