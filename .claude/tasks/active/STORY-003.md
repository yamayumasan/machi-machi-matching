# STORY-003: チャット/ボトムシートUI改善

## Meta
- **project**: machi-machi-matching
- **status**: active
- **created**: 2026-06-01
- **priority**: medium

## Project
- **branch**: story/STORY-003
- **base**: story/STORY-001（env修正を引き継ぐため）
- **related-user-stories**: [STORY-001](../reviews/STORY-001.md)

## Description

ユーザーから3件のUI課題が報告された。STORY-001（Apple審査再提出）とは独立して修正する。

### 課題1: マップのボトムシートPEEK時の表示が中途半端

[app/(tabs)/index.tsx](../../../packages/mobile/app/(tabs)/index.tsx) の `SNAP_POINTS.PEEK` が `SCREEN_HEIGHT * 0.15`（固定割合）。
画面高に応じて変動するため、デバイスによってはハンドル+FilterTabs+QuickCategoryFilter+リスト先頭が
**半端な位置で見切れる**状態になっていた。

### 課題2: 自分のチャットが左に表示される（LINEだと右）

[app/group/[id].tsx](../../../packages/mobile/app/group/[id].tsx) の `renderMessage` で
`ownMessageContainer: justifyContent: 'flex-end'` は適用されていたが、
`messageContent` 側に `alignItems: 'flex-end'` がなく、内部のバブル/時刻表示が
コンテナ内で左揃えのままで、視覚的に**右寄せが不完全**だった。

### 課題3: 入力欄がスマホのキーボードに半分隠れる

`KeyboardAvoidingView` の `keyboardVerticalOffset` が `90` でハードコード。
ナビゲーションヘッダー高さ + safe area top を想定した値だが、デバイス依存で
ずれが生じ、入力中のテキストボックスが**キーボードと重なる**ケースがあった。

## Acceptance Criteria

- [x] **UI-1**: PEEK時にカテゴリフィルター/リストが中途半端に見切れない（ハンドル+FilterTabsまでに留まる）
- [x] **UI-2**: 自分のチャットが右側に表示される（LINE風）
- [x] **UI-3**: チャット入力中、テキストボックスがキーボードと重ならない（端末非依存）
- [x] `pnpm --filter @machi/mobile typecheck` がパス
- [ ] iPhone / iPad シミュレータ または実機での目視確認（人間タスク）

## Implementation Notes

### UI-1: ボトムシートPEEK改善
- `PEEK_HEIGHT = 96`（固定ピクセル）に変更
- `PEEK_THRESHOLD = PEEK_HEIGHT + 40` を導入
- `isPeekMode` state を追加し、PEEK時は `QuickCategoryFilter` を非表示
- `bottomList` に `overflow: 'hidden'` を追加してアニメーション中のはみ出しをクリップ

### UI-2: チャット右寄せ
- `styles.ownMessageContent: { alignItems: 'flex-end' }` を追加
- `isOwnMessage` 時に `messageContent` に重ねて適用

### UI-3: キーボード回避
- `@react-navigation/elements` を direct dependency に追加（pnpm strict mode 対応）
- `useHeaderHeight()` でヘッダー高さを動的取得
- `keyboardVerticalOffset` を動的値に
- Android向けに `behavior='height'` を明示

### 検証手順（人間タスク）
1. `eas build -p ios --profile preview`（または production）でビルド
2. iPhone と iPad で:
   - マップ画面でボトムシートをPEEK状態にし、半端な見切れがないこと
   - 既存グループのチャット画面で自分の送信メッセージが右寄せされていること
   - チャット入力中、入力欄がキーボード上に正しく表示されること
3. 問題なければ main にマージ

## やらないこと

- ボトムシートの3段階を2段階に削減する大きな構造変更（別途検討）
- チャット入力中のメッセージリストの自動スクロール挙動の変更（既存ロジック流用）
- 他画面のキーボード回避修正（必要であれば別ストーリー）
