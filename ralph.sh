#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop for Claude Code
# Usage: ./ralph/ralph.sh [max_iterations]
# Run from argile-app/ directory
#
# This version supports multiple git repositories:
# - argile-lib-python/ (separate git repo)
# - remi-web-ui/ (separate git repo)

set -e

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_PROJECT_FILE="$SCRIPT_DIR/.last-project"

# Ensure we're in the project directory
cd "$PROJECT_DIR"
echo "Working directory: $PROJECT_DIR"

# Archive previous run if project changed
if [ -f "$PRD_FILE" ] && [ -f "$LAST_PROJECT_FILE" ]; then
  CURRENT_PROJECT=$(jq -r '.project // empty' "$PRD_FILE" 2>/dev/null || echo "")
  LAST_PROJECT=$(cat "$LAST_PROJECT_FILE" 2>/dev/null || echo "")

  if [ -n "$CURRENT_PROJECT" ] && [ -n "$LAST_PROJECT" ] && [ "$CURRENT_PROJECT" != "$LAST_PROJECT" ]; then
    # Archive the previous run
    DATE=$(date +%Y-%m-%d)
    FOLDER_NAME=$(echo "$LAST_PROJECT" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_PROJECT"
    mkdir -p "$ARCHIVE_FOLDER"
    [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/"
    [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/"
    echo "   Archived to: $ARCHIVE_FOLDER"

    # Reset progress file for new run
    echo "# Ralph Progress Log" > "$PROGRESS_FILE"
    echo "Project: $CURRENT_PROJECT" >> "$PROGRESS_FILE"
    echo "Started: $(date)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "## Codebase Patterns" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "### argile-lib-python" >> "$PROGRESS_FILE"
    echo "(Add patterns here)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "### remi-web-ui" >> "$PROGRESS_FILE"
    echo "(Add patterns here)" >> "$PROGRESS_FILE"
    echo "" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
  fi
fi

# Track current project
if [ -f "$PRD_FILE" ]; then
  CURRENT_PROJECT=$(jq -r '.project // empty' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$CURRENT_PROJECT" ]; then
    echo "$CURRENT_PROJECT" > "$LAST_PROJECT_FILE"
  fi
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"
  echo "## Codebase Patterns" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"
  echo "### argile-lib-python" >> "$PROGRESS_FILE"
  echo "(Add patterns here)" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"
  echo "### remi-web-ui" >> "$PROGRESS_FILE"
  echo "(Add patterns here)" >> "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

# Show current status
echo ""
echo "Starting Ralph - Max iterations: $MAX_ITERATIONS"
echo "PRD: $PRD_FILE"
echo "Progress: $PROGRESS_FILE"
echo ""
echo "Repositories:"
echo "  - argile-lib-python/  ($(cd argile-lib-python && git branch --show-current 2>/dev/null || echo 'not on branch'))"
echo "  - remi-web-ui/        ($(cd remi-web-ui && git branch --show-current 2>/dev/null || echo 'not on branch'))"
echo ""

# Show pending stories (with FORK indicator if applicable)
if [ -f "$PRD_FILE" ]; then
  PENDING=$(jq -r '.userStories[] | select(.passes == false) | "\(.id) [\(.repo)]\(if .fork == true then " (FORK)" else "" end): \(.title)"' "$PRD_FILE" 2>/dev/null || echo "")
  if [ -n "$PENDING" ]; then
    echo "Pending stories:"
    echo "$PENDING" | while read -r line; do echo "  - $line"; done
    echo ""
  fi
fi

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════════════════"

  # Read prompt from file
  PROMPT=$(cat "$SCRIPT_DIR/prompt.md")

  # Run Claude Code from the project directory with the ralph prompt
  # --print outputs the response without interactive mode
  # --dangerously-skip-permissions allows autonomous operation (use with caution)
  OUTPUT=$(claude --print --dangerously-skip-permissions "$PROMPT" 2>&1 | tee /dev/stderr) || true

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "  Ralph completed all tasks!"
    echo "  Completed at iteration $i of $MAX_ITERATIONS"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "Final branch status:"
    echo "  - argile-lib-python: $(cd argile-lib-python && git branch --show-current)"
    echo "  - remi-web-ui: $(cd remi-web-ui && git branch --show-current)"
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."
echo ""
echo "Remaining stories:"
jq -r '.userStories[] | select(.passes == false) | "  - \(.id) [\(.repo)]\(if .fork == true then " (FORK)" else "" end): \(.title)"' "$PRD_FILE" 2>/dev/null || echo "  (could not read PRD)"
exit 1
