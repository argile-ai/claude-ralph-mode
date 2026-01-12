#!/bin/bash
# Ralph - Autonomous AI Agent Loop for Claude Code
# Usage: ./ralph.sh [max_iterations]
#
# Ralph executes user stories from prd.json one at a time,
# spawning fresh Claude Code instances for each iteration.
#
# Based on Geoffrey Huntley's Ralph pattern: https://ghuntley.com/ralph/

set -e

# Configuration
MAX_ITERATIONS=${1:-50}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/ralph.config.json"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_PROJECT_FILE="$SCRIPT_DIR/.last-project"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
  if ! command -v claude &> /dev/null; then
    log_error "Claude Code CLI not found. Install it from: https://claude.ai/code"
    exit 1
  fi

  if ! command -v jq &> /dev/null; then
    log_error "jq not found. Install with: brew install jq (macOS) or apt install jq (Linux)"
    exit 1
  fi

  if [ ! -f "$PRD_FILE" ]; then
    log_error "PRD file not found: $PRD_FILE"
    log_info "Run /ralph <feature> and /prd to generate the PRD first."
    exit 1
  fi

  if [ ! -f "$CONFIG_FILE" ]; then
    log_warning "Config file not found: $CONFIG_FILE"
    log_info "Using default configuration."
  fi
}

# Read configuration
read_config() {
  if [ -f "$CONFIG_FILE" ]; then
    PROJECT_NAME=$(jq -r '.project // "Unknown"' "$CONFIG_FILE")
    MAX_ITER_CONFIG=$(jq -r '.agent.maxIterations // 50' "$CONFIG_FILE")

    # Use config max iterations if not overridden by CLI
    if [ "$MAX_ITERATIONS" -eq 50 ] && [ "$MAX_ITER_CONFIG" != "50" ]; then
      MAX_ITERATIONS=$MAX_ITER_CONFIG
    fi
  else
    PROJECT_NAME="Unknown"
  fi
}

# Get repositories from config
get_repositories() {
  if [ -f "$CONFIG_FILE" ]; then
    jq -r '.repositories | keys[]' "$CONFIG_FILE" 2>/dev/null || echo ""
  fi
}

# Get repository path
get_repo_path() {
  local repo_key="$1"
  if [ -f "$CONFIG_FILE" ]; then
    jq -r ".repositories[\"$repo_key\"].path // \".\"" "$CONFIG_FILE"
  else
    echo "."
  fi
}

# Archive previous run if project changed
archive_previous_run() {
  if [ -f "$PRD_FILE" ] && [ -f "$LAST_PROJECT_FILE" ]; then
    local current_project=$(jq -r '.project // empty' "$PRD_FILE" 2>/dev/null || echo "")
    local last_project=$(cat "$LAST_PROJECT_FILE" 2>/dev/null || echo "")

    if [ -n "$current_project" ] && [ -n "$last_project" ] && [ "$current_project" != "$last_project" ]; then
      local date=$(date +%Y-%m-%d)
      local folder_name=$(echo "$last_project" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd '[:alnum:]-')
      local archive_folder="$ARCHIVE_DIR/$date-$folder_name"

      log_info "Archiving previous run: $last_project"
      mkdir -p "$archive_folder"
      [ -f "$PRD_FILE" ] && cp "$PRD_FILE" "$archive_folder/"
      [ -f "$PROGRESS_FILE" ] && cp "$PROGRESS_FILE" "$archive_folder/"
      log_success "Archived to: $archive_folder"

      # Reset progress file
      init_progress_file "$current_project"
    fi
  fi

  # Track current project
  if [ -f "$PRD_FILE" ]; then
    local current_project=$(jq -r '.project // empty' "$PRD_FILE" 2>/dev/null || echo "")
    if [ -n "$current_project" ]; then
      echo "$current_project" > "$LAST_PROJECT_FILE"
    fi
  fi
}

# Initialize progress file
init_progress_file() {
  local project_name="${1:-Unknown}"

  if [ ! -f "$PROGRESS_FILE" ]; then
    cat > "$PROGRESS_FILE" << EOF
# Ralph Progress Log

Project: $project_name
Started: $(date)

## Codebase Patterns

(Add discovered patterns here as you work)

---

EOF
    log_info "Created progress file: $PROGRESS_FILE"
  fi
}

# Show current status
show_status() {
  echo ""
  echo "========================================"
  echo "  Ralph - Autonomous Agent Loop"
  echo "========================================"
  echo ""
  log_info "Max iterations: $MAX_ITERATIONS"
  log_info "PRD: $PRD_FILE"
  log_info "Progress: $PROGRESS_FILE"
  echo ""

  # Show repositories if config exists
  if [ -f "$CONFIG_FILE" ]; then
    echo "Repositories:"
    for repo in $(get_repositories); do
      local path=$(get_repo_path "$repo")
      local branch="(not a git repo)"
      if [ -d "$path/.git" ]; then
        branch=$(cd "$path" && git branch --show-current 2>/dev/null || echo "detached")
      fi
      echo "  - $repo: $path ($branch)"
    done
    echo ""
  fi

  # Show pending stories
  if [ -f "$PRD_FILE" ]; then
    local pending=$(jq -r '.userStories[] | select(.passes == false) | "\(.id) [\(.repo)]\(if .fork == true then " (FORK)" else "" end): \(.title)"' "$PRD_FILE" 2>/dev/null || echo "")
    if [ -n "$pending" ]; then
      echo "Pending stories:"
      echo "$pending" | while read -r line; do echo "  - $line"; done
      echo ""
    else
      log_success "All stories completed!"
      exit 0
    fi
  fi
}

# Run main loop
run_loop() {
  for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo "========================================"
    echo "  Iteration $i of $MAX_ITERATIONS"
    echo "========================================"

    # Read prompt from file
    local prompt_file="$SCRIPT_DIR/prompt.md"
    if [ ! -f "$prompt_file" ]; then
      log_error "Prompt file not found: $prompt_file"
      exit 1
    fi

    local prompt=$(cat "$prompt_file")

    # Run Claude Code with autonomous permissions
    log_info "Starting Claude Code iteration..."
    local output
    output=$(claude --print --dangerously-skip-permissions "$prompt" 2>&1 | tee /dev/stderr) || true

    # Check for completion signal
    if echo "$output" | grep -q "<promise>COMPLETE</promise>"; then
      echo ""
      echo "========================================"
      log_success "Ralph completed all tasks!"
      echo "  Completed at iteration $i of $MAX_ITERATIONS"
      echo "========================================"
      echo ""

      # Show final branch status
      if [ -f "$CONFIG_FILE" ]; then
        echo "Final branch status:"
        for repo in $(get_repositories); do
          local path=$(get_repo_path "$repo")
          if [ -d "$path/.git" ]; then
            echo "  - $repo: $(cd "$path" && git branch --show-current)"
          fi
        done
      fi
      exit 0
    fi

    log_info "Iteration $i complete. Continuing..."
    sleep 2
  done

  echo ""
  log_warning "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
  log_info "Check $PROGRESS_FILE for status."
  echo ""
  echo "Remaining stories:"
  jq -r '.userStories[] | select(.passes == false) | "  - \(.id) [\(.repo)]\(if .fork == true then " (FORK)" else "" end): \(.title)"' "$PRD_FILE" 2>/dev/null || echo "  (could not read PRD)"
  exit 1
}

# Main execution
main() {
  check_prerequisites
  read_config
  archive_previous_run
  init_progress_file "$PROJECT_NAME"
  show_status
  run_loop
}

main
