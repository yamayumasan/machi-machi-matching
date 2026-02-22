#!/bin/bash
# =============================================================================
# protect-files.sh — ファイル保護フック
# =============================================================================
#
# PreToolUse (Edit|Write) で呼び出される
# 標準入力からJSONを受け取り、保護対象ファイルへの書き込みをブロック
#
# 使い方:
#   .claude/settings.local.json の hooks.PreToolUse に設定
#
# =============================================================================

set -euo pipefail

# =============================================================================
# 保護設定（プロジェクトに合わせて編集）
# =============================================================================

# 保護対象: 変更をブロック
PROTECTED_PATTERNS=(
  "^\.env$"
  "^\.env\."
  "/\.env$"
  "/\.env\."
)

# 警告対象: ブロックしないが警告を出す
WARNING_PATTERNS=(
  "package\.json$"
  "package-lock\.json$"
  "pnpm-lock\.yaml$"
  "yarn\.lock$"
)

# =============================================================================
# メイン処理
# =============================================================================

# 標準入力からJSONを読み取り
INPUT=$(cat)

# ファイルパスを抽出
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# 保護対象チェック
for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if echo "$FILE_PATH" | grep -qE "$pattern"; then
    echo "ブロック: $FILE_PATH は保護対象です。変更できません。" >&2
    exit 2
  fi
done

# 警告対象チェック
for pattern in "${WARNING_PATTERNS[@]}"; do
  if echo "$FILE_PATH" | grep -qE "$pattern"; then
    echo "警告: $FILE_PATH は重要なファイルです。慎重に確認してください。" >&2
  fi
done

exit 0
