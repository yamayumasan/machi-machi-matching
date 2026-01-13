# デザインガイドライン - マチマチマッチング

## コンセプト
- **白基調**: クリーンで明るい白ベースの配色
- **ミニマリスティック**: 不要な装飾を排除したシンプルなUI
- **軽やかさ**: 余白を活かした開放的なデザイン
- **アクセント**: 緑で適度なポイントカラー

---

## カラーパレット

### プライマリ（グレースケール）
| Token | Hex | 用途 |
|-------|-----|------|
| primary-50 | #fafafa | セクション背景 |
| primary-100 | #f5f5f5 | カード背景、ホバー |
| primary-200 | #e5e5e5 | ボーダー、区切り線 |
| primary-300 | #d4d4d4 | disabled状態 |
| primary-400 | #a3a3a3 | プレースホルダー |
| primary-500 | #737373 | セカンダリテキスト |
| primary-600 | #525252 | サブテキスト |
| primary-700 | #404040 | メインテキスト |
| primary-800 | #262626 | 強調テキスト |
| primary-900 | #171717 | 見出し |

### アクセント（緑）
| Token | Hex | 用途 |
|-------|-----|------|
| accent-50 | #f0fdf4 | 成功バッジ背景 |
| accent-100 | #dcfce7 | 軽いハイライト |
| accent-500 | #22c55e | アイコン、リンク |
| accent-600 | #16a34a | **プライマリCTA**、自分のチャット吹き出し |
| accent-700 | #15803d | ホバー時 |

### ステータスカラー
| 状態 | 色 |
|------|-----|
| 成功/オープン | 緑系（accent） |
| 警告/保留 | 黄色系 |
| エラー/拒否 | 赤系 |

---

## 背景

### メイン背景
- `background: #ffffff` (白)

### セクション背景
- `background: #fafafa` (primary-50)

---

## タイポグラフィ

### フォントファミリー
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont,
  'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
```

### テキストカラー
- 見出し: `text-primary-900` (#171717)
- 本文: `text-primary-700` (#404040)
- サブテキスト: `text-primary-500` (#737373)

### iOSズーム防止
入力フィールドは必ず `font-size: 16px` 以上を使用すること。

---

## コンポーネント

### ボタン
- **プライマリCTA**: `bg-accent-600` (#16a34a), `hover:bg-accent-700`, `text-white`, `rounded-lg`
- **セカンダリ**: `bg-white`, `border: 1px solid #e5e5e5`, `text-primary-700`, `hover:bg-primary-50`
- **ゴースト**: `bg-transparent`, `text-primary-600`, `hover:bg-primary-100`

### カード
- `background: #ffffff`
- `border: 1px solid #e5e5e5`
- `border-radius: 12px`
- ホバー: `border-color: #d4d4d4`

### リスト区切り
- `border-bottom: 1px solid #f5f5f5`

### 入力フィールド
- `background: #ffffff`
- `border: 1px solid #e5e5e5`
- `border-radius: 8px`
- `font-size: 16px` (iOS対応)
- フォーカス時: `border-color: #16a34a`, `ring: accent-500/20`

---

## モーダル

### オーバーレイ
```css
background: rgba(0, 0, 0, 0.4);
backdrop-filter: blur(4px);
```

### モーダル本体
```css
background: #ffffff;
box-shadow: 0 8px 32px -8px rgb(0 0 0 / 0.15);
border-radius: 16px;
```

---

## チャット

### 自分のメッセージ
- `background: #16a34a` (accent-600)
- `color: white`
- `border-radius: 16px 16px 4px 16px`

### 相手のメッセージ
- `background: #f5f5f5` (primary-100)
- `color: #404040` (primary-700)
- `border-radius: 16px 16px 16px 4px`

---

## マップマーカー
現状維持（募集: オレンジ系、やりたいこと: 緑系）

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

1. **白を基調に**: 背景は白、セクション区切りにprimary-50
2. **緑でアクション**: CTAボタンはaccent-600（緑）
3. **軽いボーダー**: シャドウよりボーダーで区切りを表現
4. **余白を大切に**: パディングは十分に確保
5. **コントラスト控えめ**: 黒(#000)は使わず、primary-900(#171717)まで
