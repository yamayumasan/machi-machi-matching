#!/bin/bash
# =============================================================================
# run-loop-safe.sh — サーキットブレーカー付き自律開発ループ
# =============================================================================
#
# 使い方:
#   chmod +x scripts/run-loop-safe.sh
#   ./scripts/run-loop-safe.sh
#
# run-loop.sh との違い:
#   - 同一エラーの繰り返し検出 → 自動停止
#   - 進捗なし検出 → 自動停止
#   - クールダウン後の再試行
#
# =============================================================================

set -euo pipefail

# プロジェクトルートに移動
cd "$(dirname "$0")/.."

# =============================================================================
# 設定
# =============================================================================

MAX_ITERATIONS=${MAX_ITERATIONS:-20}
MAX_TURNS=${MAX_TURNS:-30}
SLEEP_BETWEEN=${SLEEP_BETWEEN:-5}
LOG_DIR="${LOG_DIR:-./logs/auto-dev}"

# サーキットブレーカー設定
CB_MAX_SAME_ERRORS=${CB_MAX_SAME_ERRORS:-3}         # 同一エラーN回で停止
CB_MAX_NO_PROGRESS=${CB_MAX_NO_PROGRESS:-3}          # 進捗なしN回で停止
CB_COOLDOWN_SECONDS=${CB_COOLDOWN_SECONDS:-300}      # クールダウン秒数（5分）
CB_MAX_COOLDOWNS=${CB_MAX_COOLDOWNS:-2}              # クールダウン最大回数

# 許可するツール
ALLOWED_TOOLS="${ALLOWED_TOOLS:-Read,Write,Edit,Grep,Glob,Bash(git *),Bash(npm *),Bash(pnpm *),Bash(yarn *),Bash(npx *),Bash(make *),Bash(cargo *),Bash(go *),Bash(python *),Bash(pytest *),Bash(ls *),Bash(mkdir *),Bash(cat *)}"

# =============================================================================
# 初期化
# =============================================================================

mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/loop-$TIMESTAMP.log"

# サーキットブレーカー状態
SAME_ERROR_COUNT=0
NO_PROGRESS_COUNT=0
COOLDOWN_COUNT=0
LAST_ERROR=""
LAST_TASK_HASH=""

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
# ユーティリティ関数
# =============================================================================

# TASK_PROGRESS.md のハッシュで進捗を検出
get_task_hash() {
  if [ -f "TASK_PROGRESS.md" ]; then
    # macOS: md5 -q, Linux: md5sum
    if command -v md5 &> /dev/null; then
      md5 -q "TASK_PROGRESS.md" 2>/dev/null || echo "no-hash"
    else
      md5sum "TASK_PROGRESS.md" 2>/dev/null | cut -d' ' -f1 || echo "no-hash"
    fi
  else
    echo "no-file"
  fi
}

# サーキットブレーカーチェック
check_circuit_breaker() {
  local reason=""

  if [ $SAME_ERROR_COUNT -ge $CB_MAX_SAME_ERRORS ]; then
    reason="同一エラーが${SAME_ERROR_COUNT}回繰り返されました"
  fi

  if [ $NO_PROGRESS_COUNT -ge $CB_MAX_NO_PROGRESS ]; then
    reason="進捗なしが${NO_PROGRESS_COUNT}回続きました"
  fi

  if [ -n "$reason" ]; then
    COOLDOWN_COUNT=$((COOLDOWN_COUNT + 1))

    if [ $COOLDOWN_COUNT -gt $CB_MAX_COOLDOWNS ]; then
      log "🛑 サーキットブレーカー: $reason"
      log "🛑 クールダウン上限（${CB_MAX_COOLDOWNS}回）に到達。完全停止します。"
      log "🛑 手動で状況を確認してください。"
      exit 1
    fi

    log "⚠️ サーキットブレーカー発動: $reason"
    log "⏳ ${CB_COOLDOWN_SECONDS}秒クールダウン（${COOLDOWN_COUNT}/${CB_MAX_COOLDOWNS}回目）"
    sleep "$CB_COOLDOWN_SECONDS"

    # カウンターリセット
    SAME_ERROR_COUNT=0
    NO_PROGRESS_COUNT=0
    log "🔄 クールダウン完了。再試行します。"
  fi
}

# =============================================================================
# メインループ
# =============================================================================

log "=== サーキットブレーカー付き自律開発ループ開始 ==="
log "設定: 最大${MAX_ITERATIONS}イテレーション"
log "サーキットブレーカー: エラー${CB_MAX_SAME_ERRORS}回 / 進捗なし${CB_MAX_NO_PROGRESS}回 で停止"
log "ログ: $LOG_FILE"

ITERATION=0
LAST_TASK_HASH=$(get_task_hash)

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  log "--- イテレーション $ITERATION / $MAX_ITERATIONS ---"

  # サーキットブレーカーチェック
  check_circuit_breaker

  # イテレーションログ
  ITER_LOG="$LOG_DIR/iter-$ITERATION-$TIMESTAMP.log"

  # Claude実行
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
    2>&1 | tee "$ITER_LOG" | tee -a "$LOG_FILE"

  EXIT_CODE=${PIPESTATUS[0]}

  # --- 全タスク完了チェック ---
  if grep -q "ALL_TASKS_COMPLETE" "$ITER_LOG" 2>/dev/null; then
    log "✅ 全タスク完了"
    break
  fi

  # --- 未コミット変更のセーフティネット ---
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    log "未コミットの変更を自動コミット"
    git add -A
    git commit -m "auto: iteration $ITERATION checkpoint" --no-verify || true
  fi

  # --- サーキットブレーカー: エラー検出 ---
  if [ $EXIT_CODE -ne 0 ]; then
    CURRENT_ERROR=$(tail -5 "$ITER_LOG" 2>/dev/null | head -1 || echo "unknown")

    if [ "$CURRENT_ERROR" = "$LAST_ERROR" ] && [ -n "$CURRENT_ERROR" ]; then
      SAME_ERROR_COUNT=$((SAME_ERROR_COUNT + 1))
      log "⚠️ 同一エラー検出 (${SAME_ERROR_COUNT}/${CB_MAX_SAME_ERRORS})"
    else
      SAME_ERROR_COUNT=1
      LAST_ERROR="$CURRENT_ERROR"
      log "⚠️ エラー発生: $CURRENT_ERROR"
    fi
  else
    SAME_ERROR_COUNT=0
    LAST_ERROR=""
  fi

  # --- サーキットブレーカー: 進捗なし検出 ---
  CURRENT_TASK_HASH=$(get_task_hash)

  if [ "$CURRENT_TASK_HASH" = "$LAST_TASK_HASH" ]; then
    # TASK_PROGRESS.mdに変更なし かつ gitにも新コミットなし
    RECENT_COMMITS=$(git log --oneline --since="5 minutes ago" 2>/dev/null | wc -l | tr -d ' ')
    if [ "$RECENT_COMMITS" -eq 0 ]; then
      NO_PROGRESS_COUNT=$((NO_PROGRESS_COUNT + 1))
      log "⚠️ 進捗なし検出 (${NO_PROGRESS_COUNT}/${CB_MAX_NO_PROGRESS})"
    else
      NO_PROGRESS_COUNT=0
    fi
  else
    NO_PROGRESS_COUNT=0
    LAST_TASK_HASH="$CURRENT_TASK_HASH"
  fi

  log "イテレーション $ITERATION 完了。${SLEEP_BETWEEN}秒待機..."
  sleep "$SLEEP_BETWEEN"
done

log "=== ループ終了（${ITERATION}イテレーション実行） ==="
log "統計: エラー停止${SAME_ERROR_COUNT}回, 進捗なし${NO_PROGRESS_COUNT}回, クールダウン${COOLDOWN_COUNT}回"
