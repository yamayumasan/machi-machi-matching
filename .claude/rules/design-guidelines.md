# デザインガイドライン v3 - マチマチマッチング

## コンセプト
- **ナチュラル＆落ち着き**: Hinge風の大人っぽい雰囲気
- **安心感＆温もり**: セージグリーン（自然・穏やか）× テラコッタ（温もり・地に足がついた）
- **余白重視**: ゆとりのあるレイアウト、呼吸感のあるデザイン
- **微細なディテール**: 繊細なシャドウ、滑らかなトランジション
- **アースカラー**: 自然由来の落ち着いた色合いで心地よいUX

---

## カラーパレット

### プライマリ（セージグリーン系）
自然、穏やか、安心感を演出

| Token | Hex | 用途 |
|-------|-----|------|
| primary-50 | #F0F5F0 | セクション背景、軽いハイライト |
| primary-100 | #E1EBE1 | カード背景、ホバー |
| primary-200 | #C3D7C3 | ボーダー、区切り線 |
| primary-300 | #A5C3A5 | disabled状態 |
| primary-400 | #87AF87 | アイコン（非アクティブ） |
| primary-500 | #6B8E6B | リンク、セカンダリアクション（メインカラー） |
| primary-600 | #5A7A5A | **プライマリCTA**、メインアクション |
| primary-700 | #4A664A | ホバー・押下時 |
| primary-800 | #3A523A | 強調テキスト |
| primary-900 | #2A3E2A | 見出し |
| primary-950 | #1A2A1A | 最も濃い |

### アクセント（テラコッタ系）
温もり、地に足がついた印象を演出

| Token | Hex | 用途 |
|-------|-----|------|
| accent-50 | #FDF5F0 | 通知バッジ背景 |
| accent-100 | #FBEADE | ハイライト |
| accent-200 | #F7D5BD | 軽いアクセント |
| accent-300 | #F0B896 | バッジ |
| accent-400 | #E69B70 | アイコンアクセント |
| accent-500 | #CD8B62 | 強調（メインアクセントカラー） |
| accent-600 | #B87A54 | セカンダリCTA |
| accent-700 | #9A6647 | ホバー時 |

### ニュートラル（ナチュラルグレー系）
テキスト、ボーダー、背景に使用

| Token | Hex | 用途 |
|-------|-----|------|
| neutral-50 | #FDFCFB | カード背景（薄）、クリーム |
| neutral-100 | #F8F6F4 | セクション背景 |
| neutral-200 | #EBE7E4 | ボーダー、区切り線 |
| neutral-300 | #D9D3CE | disabled状態 |
| neutral-400 | #AEA6A0 | プレースホルダー |
| neutral-500 | #7D756E | サブテキスト |
| neutral-600 | #5C554F | 本文テキスト |
| neutral-700 | #45403B | 強調テキスト |
| neutral-800 | #2E2A27 | 見出し |
| neutral-900 | #1C1A18 | 最も濃い |

### ステータスカラー（ナチュラルトーンに調整）
| 状態 | 背景 | テキスト/アイコン |
|------|-----|-----|
| 成功 | #E8F5E8 | #4A8A4A |
| 警告 | #FEF5E7 | #C2902E |
| エラー | #FDEDED | #C24A4A |
| 情報 | #E8F2F8 | #4A7DA3 |

---

## 背景

### メイン背景
- `background: #FDFCFB` (クリーム)

### カード/サーフェス背景
- `background: #F8F6F4` (neutral-100)

### セクション背景
- `background: #F8F6F4` (neutral-100)

### オーバーレイ
- `background: rgba(46, 42, 39, 0.6)` (neutral-800 @ 60%)
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
- 見出し: `text-neutral-800` (#2E2A27)
- 本文: `text-neutral-600` (#5C554F)
- サブテキスト: `text-neutral-500` (#7D756E)
- プレースホルダー: `text-neutral-400` (#AEA6A0)
- リンク: `text-primary-600` (#5A7A5A)

### iOSズーム防止
入力フィールドは必ず `font-size: 16px` 以上を使用すること。

---

## コンポーネント

### ボタン
- **プライマリCTA**:
  - `bg-primary-600` (#5A7A5A)
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
  - `bg-accent-600` (#B87A54)
  - `hover:bg-accent-700`, `text-white`

### カード
- `background: #FFFFFF`
- `border: 1px solid #EBE7E4` (neutral-200)
- `border-radius: 16px`
- `shadow: 0 1px 3px rgb(46 42 39 / 0.06)`
- ホバー: `shadow: 0 4px 12px rgb(46 42 39 / 0.08)`

### 入力フィールド
- `background: #FFFFFF`
- `border: 1.5px solid #EBE7E4` (neutral-200)
- `border-radius: 12px`
- `padding: 14px 16px`
- `font-size: 16px` (iOS対応)
- フォーカス時:
  - `border-color: #5A7A5A` (primary-600)
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
background: rgba(46, 42, 39, 0.6);
backdrop-filter: blur(8px);
```

### モーダル本体
```css
background: #FFFFFF;
box-shadow: 0 25px 50px -12px rgb(46 42 39 / 0.2);
border-radius: 20px;
```

---

## チャット

### 自分のメッセージ
- `background: #5A7A5A` (primary-600)
- `color: white`
- `border-radius: 20px 20px 4px 20px`

### 相手のメッセージ
- `background: #F8F6F4` (neutral-100)
- `color: #5C554F` (neutral-600)
- `border-radius: 20px 20px 20px 4px`

---

## マップマーカー
- **募集**: テラコッタ `#CD8B62` (視認性重視)
- **やりたいこと**: セージグリーン `#6B8E6B` (プライマリ)
- **選択中**: ホワイト背景 + プライマリボーダー

---

## シャドウ
| Token | 値 | 用途 |
|-------|-----|------|
| shadow-xs | 0 1px 2px rgb(46 42 39 / 0.04) | 微細な立体感 |
| shadow-sm | 0 1px 3px rgb(46 42 39 / 0.06) | カード |
| shadow-md | 0 4px 12px rgb(46 42 39 / 0.08) | ホバー時 |
| shadow-lg | 0 8px 24px rgb(46 42 39 / 0.1) | ドロップダウン |
| shadow-xl | 0 16px 48px rgb(46 42 39 / 0.12) | モーダル |

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
2. **グリーンで安心感**: CTAはprimary-600で統一
3. **テラコッタは控えめに**: アクセントとして使用、メインにしない
4. **ナチュラルグレーで構造化**: ボーダーと背景はニュートラル系
5. **シャドウは繊細に**: 重いシャドウは避け、軽い立体感を演出
6. **コントラスト確保**: WCAG AA 4.5:1以上を維持
7. **一貫性**: 同じコンポーネントは同じスタイルで
8. **アースカラーで落ち着き**: 自然由来の色合いで大人っぽいUXを実現
