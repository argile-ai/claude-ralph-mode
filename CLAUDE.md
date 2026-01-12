# Ralph - Claude Code Plugin

## Overview

Ralph is an autonomous AI agent loop that runs Claude Code repeatedly until all PRD items are complete. Each iteration is a fresh Claude Code instance with clean context.

## Commands

### `/ralph <feature>`
Generate a structured implementation plan from a feature description.

### `/prd`
Convert `plan.md` into `prd.json` for execution.

### `./ralph.sh [max_iterations]`
Run the autonomous execution loop.

## Key Files

| File | Purpose |
|------|---------|
| `ralph.config.json` | Project configuration (repos, checks) |
| `plan.md` | Generated plan (from /ralph) |
| `prd.json` | Executable PRD (from /prd) |
| `prompt.md` | Instructions for each iteration |
| `progress.txt` | Accumulated learnings |
| `ralph.sh` | Execution script |

## Workflow

1. User runs `/ralph <feature>` to generate a plan
2. User reviews/edits `plan.md`
3. User runs `/prd` to convert to JSON
4. User runs `./ralph.sh` to execute autonomously

## Patterns

- Each iteration spawns a fresh Claude Code instance
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Backend stories should come before frontend stories
- Always update CLAUDE.md in target repos with discovered patterns

## Configuration

Edit `ralph.config.json` to define:
- Repository paths
- Quality checks per repository
- Max iterations
