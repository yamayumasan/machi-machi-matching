# 年齢レーティング修正

## タスク概要
App Store Connectで年齢レーティング設定を修正し、Appleの審査指摘事項に対応する。

## 背景
Apple審査チームから以下の指摘を受けた：
> We noticed that your app or its metadata contains irrelevant age rating or misleading descriptions.
>
> Next Steps:
> To resolve this issue, please revise your app's age rating in App Store Connect to ensure it reflects the app's content and functionality.

## 修正内容

### App Store Connect設定手順
1. App Store Connect にログイン
2. 対象アプリ（まちまちマッチング）を選択
3. **App Information** セクションに移動
4. **Age Rating** を編集
5. 以下の項目を修正：
   - **Parental Controls**: None （現在設定されている場合は解除）
   - **Age Assurance**: None （現在設定されている場合は解除）
6. 変更を保存

## 受け入れ基準
- [ ] App Store ConnectのAge Rating設定で不要な制限が解除されている
- [ ] 変更が正常に保存されている
- [ ] アプリの実際の内容（地域コミュニティマッチング）に適した年齢レーティングになっている

## 関連リソース
- Apple審査フィードバック: `/Users/yuma/Projects/machi-machi-matching/docs/APPLE_REVIEW_RESPONSE_V2.md`
- App Store Connect: https://appstoreconnect.apple.com/

## 注意事項
- この作業は手動でApp Store Connectから実施する必要がある
- 変更後は次回ビルド提出時に反映される
