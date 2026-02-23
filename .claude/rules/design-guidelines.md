# デザインガイドライン v2 - マチマチマッチング

## コンセプト
- **モダン＆ミニマル**: Linear / Notion風のクリーンで洗練されたデザイン
- **やさしさ＆親しみやすさ**: ソフトパープル（親しみ）× ウォームピーチ（温かみ）の組み合わせ
- **余白重視**: ゆとりのあるレイアウト、呼吸感のあるデザイン
- **微細なディテール**: 繊細なシャドウ、滑らかなトランジション
- **パステル調**: 優しい色合いで心地よいUX

---

## カラーパレット

### プライマリ（ソフトパープル系）
マッチングアプリに適した親しみやすさと信頼感を演出

| Token | Hex | 用途 |
|-------|-----|------|
| primary-50 | #FAF5FF | セクション背景、軽いハイライト |
| primary-100 | #F3E8FF | カード背景、ホバー |
| primary-200 | #E9D5FF | ボーダー、区切り線 |
| primary-300 | #D8B4FE | disabled状態 |
| primary-400 | #C084FC | アイコン（非アクティブ） |
| primary-500 | #A855F7 | リンク、セカンダリアクション |
| primary-600 | #9333EA | **プライマリCTA**、メインアクション |
| primary-700 | #7E22CE | ホバー・押下時 |
| primary-800 | #6B21A8 | 強調テキスト |
| primary-900 | #581C87 | 見出し |
| primary-950 | #3B0764 | 最も濃い |

### アクセント（ウォームピーチ系）
温かみと親しみやすさを演出、CTAの補助やハイライトに

| Token | Hex | 用途 |
|-------|-----|------|
| accent-50 | #FFF7ED | 通知バッジ背景 |
| accent-100 | #FFEDD5 | ハイライト |
| accent-200 | #FED7AA | 軽いアクセント |
| accent-300 | #FDBA74 | バッジ |
| accent-400 | #FB923C | アイコンアクセント |
| accent-500 | #F97316 | 強調 |
| accent-600 | #EA580C | セカンダリCTA |
| accent-700 | #C2410C | ホバー時 |

### ニュートラル（ウォームグレー系）
テキスト、ボーダー、背景に使用

| Token | Hex | 用途 |
|-------|-----|------|
| neutral-50 | #FAFAF9 | カード背景（薄） |
| neutral-100 | #F5F5F4 | セクション背景 |
| neutral-200 | #E7E5E4 | ボーダー、区切り線 |
| neutral-300 | #D6D3D1 | disabled状態 |
| neutral-400 | #A8A29E | プレースホルダー |
| neutral-500 | #78716C | サブテキスト |
| neutral-600 | #57534E | 本文テキスト |
| neutral-700 | #44403C | 強調テキスト |
| neutral-800 | #292524 | 見出し |
| neutral-900 | #1C1917 | 最も濃い |

### ステータスカラー
| 状態 | 背景 | テキスト/アイコン |
|------|-----|-----|
| 成功 | #DCFCE7 | #16A34A |
| 警告 | #FEF3C7 | #D97706 |
| エラー | #FEE2E2 | #DC2626 |
| 情報 | #DBEAFE | #2563EB |

---

## 背景

### メイン背景
- `background: #FFFFFF` (ピュアホワイト)

### カード/サーフェス背景
- `background: #FAFAF9` (neutral-50)

### セクション背景
- `background: #F5F5F4` (neutral-100)

### オーバーレイ
- `background: rgba(28, 25, 23, 0.6)` (neutral-900 @ 60%)
- `backdrop-filter: blur(8px)`

---

## タイポグラフィ

### フォントファミリー
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont,
  'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
```

### フォントサイズスケール
| Token | サイズ | 行高 | 用途 |
|-------|--------|------|------|
| text-xs | 12px | 16px | キャプション、タグ |
| text-sm | 14px | 20px | サブテキスト、ラベル |
| text-base | 16px | 24px | 本文 |
| text-lg | 18px | 28px | 強調本文 |
| text-xl | 20px | 28px | 小見出し |
| text-2xl | 24px | 32px | セクション見出し |
| text-3xl | 30px | 36px | ページタイトル |
| text-4xl | 36px | 40px | ヒーロー |

### テキストカラー
- 見出し: `text-neutral-800` (#292524)
- 本文: `text-neutral-600` (#57534E)
- サブテキスト: `text-neutral-500` (#78716C)
- プレースホルダー: `text-neutral-400` (#A8A29E)
- リンク: `text-primary-600` (#9333EA)

### iOSズーム防止
入力フィールドは必ず `font-size: 16px` 以上を使用すること。

---

## コンポーネント

### ボタン
- **プライマリCTA**:
  - `bg-primary-600` (#9333EA)
  - `hover:bg-primary-700`, `active:bg-primary-800`
  - `text-white`, `rounded-xl` (12px)
  - 高さ: 48px（タップしやすいサイズ）

- **セカンダリ**:
  - `bg-white`, `border: 1.5px solid neutral-200`
  - `text-neutral-700`, `hover:bg-neutral-50`
  - `rounded-xl`

- **ゴースト**:
  - `bg-transparent`
  - `text-primary-600`, `hover:bg-primary-50`

- **デストラクティブ**:
  - `bg-accent-600` (#EA580C)
  - `hover:bg-accent-700`, `text-white`

### カード
- `background: #FFFFFF`
- `border: 1px solid #E7E5E4` (neutral-200)
- `border-radius: 16px`
- `shadow: 0 1px 3px rgb(0 0 0 / 0.05)`
- ホバー: `shadow: 0 4px 12px rgb(0 0 0 / 0.08)`

### 入力フィールド
- `background: #FFFFFF`
- `border: 1.5px solid #E7E5E4` (neutral-200)
- `border-radius: 12px`
- `padding: 14px 16px`
- `font-size: 16px` (iOS対応)
- フォーカス時:
  - `border-color: #9333EA` (primary-600)
  - `ring: 4px primary-100`

### タグ/バッジ
- デフォルト: `bg-neutral-100`, `text-neutral-600`, `rounded-full`
- プライマリ: `bg-primary-50`, `text-primary-600`
- アクセント: `bg-accent-50`, `text-accent-600`

### アバター
- サイズ: 32px / 40px / 48px / 64px
- `border-radius: 50%`
- ボーダー: `2px solid white` + シャドウ

---

## モーダル

### オーバーレイ
```css
background: rgba(15, 23, 42, 0.6);
backdrop-filter: blur(8px);
```

### モーダル本体
```css
background: #FFFFFF;
box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
border-radius: 20px;
```

---

## チャット

### 自分のメッセージ
- `background: #9333EA` (primary-600)
- `color: white`
- `border-radius: 20px 20px 4px 20px`

### 相手のメッセージ
- `background: #F5F5F4` (neutral-100)
- `color: #57534E` (neutral-600)
- `border-radius: 20px 20px 20px 4px`

---

## マップマーカー
- **募集**: ピーチオレンジ `#F97316` (視認性重視)
- **やりたいこと**: ソフトパープル `#9333EA` (プライマリ)
- **選択中**: ホワイト背景 + プライマリボーダー

---

## シャドウ
| Token | 値 | 用途 |
|-------|-----|------|
| shadow-xs | 0 1px 2px rgb(0 0 0 / 0.05) | 微細な立体感 |
| shadow-sm | 0 1px 3px rgb(0 0 0 / 0.08) | カード |
| shadow-md | 0 4px 12px rgb(0 0 0 / 0.1) | ホバー時 |
| shadow-lg | 0 8px 24px rgb(0 0 0 / 0.12) | ドロップダウン |
| shadow-xl | 0 16px 48px rgb(0 0 0 / 0.15) | モーダル |

---

## border-radius
| Token | 値 | 用途 |
|-------|-----|------|
| rounded-sm | 6px | 小さいバッジ |
| rounded | 8px | タグ |
| rounded-md | 10px | 小さいボタン |
| rounded-lg | 12px | 入力フィールド、ボタン |
| rounded-xl | 16px | カード |
| rounded-2xl | 20px | モーダル、大きいカード |
| rounded-full | 9999px | アバター、FAB、ピル型ボタン |

---

## スペーシング
| Token | 値 | 用途 |
|-------|-----|------|
| space-1 | 4px | アイコン間隔 |
| space-2 | 8px | 要素内余白（小） |
| space-3 | 12px | 要素内余白（中） |
| space-4 | 16px | 要素内余白（大）、カード内パディング |
| space-5 | 20px | セクション間 |
| space-6 | 24px | カード間 |
| space-8 | 32px | ブロック間 |
| space-10 | 40px | セクション間（大） |
| space-12 | 48px | ページ余白 |

---

## アニメーション

### トランジション
- デフォルト: `200ms ease-out`
- ボタンホバー: `150ms ease-in-out`
- モーダル表示: `300ms ease-out`
- カードホバー: `200ms ease-out`

### マイクロインタラクション
- ボタン押下: `scale(0.98)` + `150ms`
- カードホバー: `translateY(-2px)` + シャドウ増加
- アイコンホバー: `scale(1.1)`

---

## 原則

1. **Less is More**: 要素を最小限に、余白を最大限に
2. **パープルで親しみやすさ**: CTAはprimary-600で統一
3. **ピーチは控えめに**: アクセントとして使用、メインにしない
4. **ウォームグレーで構造化**: ボーダーと背景はニュートラル系
5. **シャドウは繊細に**: 重いシャドウは避け、軽い立体感を演出
6. **コントラスト確保**: WCAG AA 4.5:1以上を維持
7. **一貫性**: 同じコンポーネントは同じスタイルで
8. **やさしい色合い**: パステル調で心地よいUXを実現
