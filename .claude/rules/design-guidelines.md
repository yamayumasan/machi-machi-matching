# デザインガイドライン - マチマチマッチング

## コンセプト
- **フォレスト＆クリーム**: 自然を感じる深みのある緑と温かみのあるクリーム
- **ナチュラル＆トラスト**: 信頼感があり落ち着いた印象
- **クリーン**: 余白を活かした開放的なデザイン
- **アクセント**: ウォームベージュで適度な温かみ

---

## カラーパレット

### プライマリ（フォレストグリーン系）
| Token | Hex | 用途 |
|-------|-----|------|
| primary-50 | #F0F5F1 | セクション背景 |
| primary-100 | #D5E5D8 | カード背景、ホバー |
| primary-200 | #A8C9AE | ボーダー、区切り線 |
| primary-300 | #7BAD84 | disabled状態 |
| primary-400 | #5A9465 | プレースホルダー |
| primary-500 | #3D7A4A | セカンダリテキスト |
| primary-600 | #2D6A4F | **プライマリCTA**、メインアクション |
| primary-700 | #245A42 | ホバー時 |
| primary-800 | #1B4332 | 強調テキスト |
| primary-900 | #132D23 | 見出し |

### アクセント（ウォームベージュ系）
| Token | Hex | 用途 |
|-------|-----|------|
| accent-50 | #FEF9F3 | 軽いハイライト |
| accent-100 | #F9EED8 | バッジ背景 |
| accent-500 | #DDA15E | アイコン、リンク |
| accent-600 | #BC6C25 | セカンダリCTA |
| accent-700 | #9A5A1F | ホバー時 |

### ステータスカラー
| 状態 | 背景 | テキスト |
|------|-----|-----|
| 成功 | #D5E5D8 (primary-100) | #2D6A4F (primary-600) |
| 警告 | #FEF3C7 | #B45309 |
| エラー | #FEE2E2 | #DC2626 |

---

## 背景

### メイン背景
- `background: #FEFDFB` (ほぼ白のクリーム)

### カード/サーフェス背景
- `background: #FAF8F5` (わずかにクリーム)

### セクション背景
- `background: #F0F5F1` (primary-50)

---

## タイポグラフィ

### フォントファミリー
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont,
  'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
```

### テキストカラー
- 見出し: `text-primary-900` (#132D23)
- 本文: `text-primary-800` (#1B4332)
- サブテキスト: `text-primary-500` (#3D7A4A)
- プレースホルダー: `text-primary-400` (#5A9465)

### iOSズーム防止
入力フィールドは必ず `font-size: 16px` 以上を使用すること。

---

## コンポーネント

### ボタン
- **プライマリCTA**: `bg-primary-600` (#2D6A4F), `hover:bg-primary-700`, `text-white`, `rounded-lg`
- **セカンダリ**: `bg-white`, `border: 1px solid primary-200`, `text-primary-700`, `hover:bg-primary-50`
- **アクセント**: `bg-accent-600` (#BC6C25), `hover:bg-accent-700`, `text-white`
- **ゴースト**: `bg-transparent`, `text-primary-600`, `hover:bg-primary-100`

### カード
- `background: #FAF8F5`
- `border: 1px solid #A8C9AE` (primary-200)
- `border-radius: 12px`
- ホバー: `border-color: #7BAD84` (primary-300)

### リスト区切り
- `border-bottom: 1px solid #D5E5D8` (primary-100)

### 入力フィールド
- `background: #FEFDFB`
- `border: 1px solid #A8C9AE` (primary-200)
- `border-radius: 8px`
- `font-size: 16px` (iOS対応)
- フォーカス時: `border-color: #2D6A4F` (primary-600), `ring: primary-500/20`

---

## モーダル

### オーバーレイ
```css
background: rgba(19, 45, 35, 0.5);
backdrop-filter: blur(4px);
```

### モーダル本体
```css
background: #FEFDFB;
box-shadow: 0 8px 32px -8px rgb(0 0 0 / 0.15);
border-radius: 16px;
```

---

## チャット

### 自分のメッセージ
- `background: #2D6A4F` (primary-600)
- `color: white`
- `border-radius: 16px 16px 4px 16px`

### 相手のメッセージ
- `background: #D5E5D8` (primary-100)
- `color: #1B4332` (primary-800)
- `border-radius: 16px 16px 16px 4px`

---

## マップマーカー
- **募集**: オレンジ系 `#FF6B35` (視認性のため維持)
- **誘われ待ち**: プライマリ緑 `#2D6A4F`

---

## シャドウ（控えめに使用）
| Token | 値 | 用途 |
|-------|-----|------|
| shadow-subtle | 0 1px 2px rgb(0 0 0 / 0.04) | 微細な立体感 |
| shadow-soft | 0 2px 8px rgb(0 0 0 / 0.06) | ドロップダウン |
| shadow-card | 0 4px 16px rgb(0 0 0 / 0.08) | フローティングカード |
| shadow-elevated | 0 8px 32px rgb(0 0 0 / 0.12) | モーダル |

---

## border-radius
| Token | 値 | 用途 |
|-------|-----|------|
| rounded | 6px | 小さいボタン |
| rounded-md | 8px | 入力フィールド |
| rounded-lg | 12px | カード、大きいボタン |
| rounded-xl | 16px | モーダル |
| rounded-full | 9999px | アバター、FAB |

---

## 原則

1. **自然な緑を基調に**: プライマリカラーはフォレストグリーン
2. **温かみのある背景**: 純白ではなくクリーム系で柔らかく
3. **緑でアクション**: CTAボタンはprimary-600（深緑）
4. **軽いボーダー**: シャドウよりボーダーで区切りを表現
5. **余白を大切に**: パディングは十分に確保
6. **コントラスト確保**: WCAG 4.5:1以上を維持
