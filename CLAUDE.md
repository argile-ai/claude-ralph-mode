# Ralph - Claude Code CLI

## Overview

Ralph is an autonomous AI agent loop that runs Claude Code repeatedly until all PRD items are complete. Each iteration is a fresh Claude Code instance with clean context.

## Installation

```bash
npm install -g claude-ralph
```

## Commands

| Command | Description |
|---------|-------------|
| `ralph init` | Initialize configuration in current directory |
| `ralph plan <feature>` | Generate a structured implementation plan |
| `ralph prd` | Convert `plan.md` into `prd.json` |
| `ralph run` | Run the autonomous execution loop |
| `ralph status` | Show current progress and status |

## Key Files

| File | Purpose |
|------|---------|
| `ralph.config.json` | Project configuration (repos, checks) |
| `plan.md` | Generated plan (from `ralph plan`) |
| `prd.json` | Executable PRD (from `ralph prd`) |
| `progress.txt` | Accumulated learnings |

## Workflow

1. User runs `ralph init` to create configuration
2. User runs `ralph plan <feature>` to generate a plan
3. User reviews/edits `plan.md`
4. User runs `ralph prd` to convert to JSON
5. User runs `ralph run` to execute autonomously

## Configuration

Edit `ralph.config.json` to define:
- Repository paths
- Quality checks per repository
- Max iterations

Configuration can also be stored in:
- `.ralphrc`
- `.ralphrc.json`
- `.ralphrc.yaml`
- `package.json` under `"ralph"` key

## Patterns

- Each iteration spawns a fresh Claude Code instance
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Backend stories should come before frontend stories
- Always update CLAUDE.md in target repos with discovered patterns
