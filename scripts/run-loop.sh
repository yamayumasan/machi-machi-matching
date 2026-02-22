#!/bin/bash
# =============================================================================
# run-loop.sh — 自律開発ループ（最小構成）
# =============================================================================
#
# 使い方:
#   chmod +x scripts/run-loop.sh
#   ./scripts/run-loop.sh
#
# 環境変数で設定を上書き可能:
#   MAX_ITERATIONS=5 MAX_TURNS=20 ./scripts/run-loop.sh
#
# 前提:
#   - claude CLI がインストール済み
#   - プロジェクトルートに CLAUDE.md と TASK_PROGRESS.md が存在
#   - git リポジトリが初期化済み
#
# =============================================================================

set -euo pipefail

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# =============================================================================
# 設定
# =============================================================================

MAX_ITERATIONS=${MAX_ITERATIONS:-10}       # 最大イテレーション数
MAX_TURNS=${MAX_TURNS:-30}                 # 1セッションの最大ターン数
SLEEP_BETWEEN=${SLEEP_BETWEEN:-5}          # イテレーション間の待機秒数
LOG_DIR="${LOG_DIR:-./logs/auto-dev}"

# 許可するツール（プロジェクトに合わせて調整）
ALLOWED_TOOLS="${ALLOWED_TOOLS:-Read,Write,Edit,Grep,Glob,Bash(git *),Bash(npm *),Bash(pnpm *),Bash(yarn *),Bash(npx *),Bash(make *),Bash(cargo *),Bash(go *),Bash(python *),Bash(pytest *),Bash(ls *),Bash(mkdir *),Bash(cat *)}"

# =============================================================================
# 初期化
# =============================================================================

mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/loop-$TIMESTAMP.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# =============================================================================
# 前提条件チェック
# =============================================================================

if ! command -v claude &> /dev/null; then
  echo "エラー: claude CLI がインストールされていません"
  exit 1
fi

if [ ! -f "CLAUDE.md" ]; then
  echo "エラー: CLAUDE.md が見つかりません"
  exit 1
fi

if [ ! -f "TASK_PROGRESS.md" ]; then
  echo "エラー: TASK_PROGRESS.md が見つかりません"
  exit 1
fi

# =============================================================================
# メインループ
# =============================================================================

log "=== 自律開発ループ開始 ==="
log "設定: 最大${MAX_ITERATIONS}イテレーション, ${MAX_TURNS}ターン/セッション"
log "ログ: $LOG_FILE"

ITERATION=0

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  log "--- イテレーション $ITERATION / $MAX_ITERATIONS ---"

  # Claude Codeをheadlessモードで実行
  claude -p \
    "TASK_PROGRESS.mdを読んで、次の未完了タスクに取り組んでください。

作業手順:
1. TASK_PROGRESS.mdから「進行中」または「未着手」のタスクを確認
2. 「要人間操作」とマークされたタスクはスキップ
3. タスクを実装
4. テスト・型チェック等で動作確認
5. git add && git commit（Conventional Commits形式）
6. TASK_PROGRESS.mdのステータスと引き継ぎメモを更新

全タスクが完了、または「要人間操作」のみ残っている場合:
「ALL_TASKS_COMPLETE」と出力してください。" \
    --allowedTools "$ALLOWED_TOOLS" \
    --max-turns "$MAX_TURNS" \
    2>&1 | tee -a "$LOG_FILE"

  EXIT_CODE=${PIPESTATUS[0]}

  # 未コミット変更のセーフティネット
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    log "未コミットの変更を自動コミット"
    git add -A
    git commit -m "auto: iteration $ITERATION checkpoint" --no-verify || true
  fi

  # 全タスク完了チェック
  if grep -q "ALL_TASKS_COMPLETE" "$LOG_FILE" 2>/dev/null; then
    log "✅ 全タスク完了"
    break
  fi

  # エラーログ
  if [ $EXIT_CODE -ne 0 ]; then
    log "⚠️ Claude終了コード: $EXIT_CODE"
  fi

  log "イテレーション $ITERATION 完了。${SLEEP_BETWEEN}秒待機..."
  sleep "$SLEEP_BETWEEN"
done

log "=== ループ終了（${ITERATION}イテレーション実行） ==="
