# Ralph Agent Instructions

## Overview

Ralph is an autonomous AI agent loop that runs Claude Code repeatedly until all PRD items are complete. Each iteration is a fresh Claude Code instance with clean context.

## Multi-Repository Setup

This project works with TWO SEPARATE git repositories:
- `argile-lib-python/` - Backend FastAPI (git@github.com:argile-ai/argile-lib-python.git)
- `remi-web-ui/` - Frontend NextJS (git@github.com:ai-remi/remi-web-ui.git)

Each story in `prd.json` specifies which repo it targets via the `repo` field.

## Commands

```bash
# Run Ralph (from argile-app/)
./ralph/ralph.sh [max_iterations]
```

## Key Files

- `ralph.sh` - The bash loop that spawns fresh Claude Code instances
- `prompt.md` - Instructions given to each Claude Code instance
- `prd.json` - User stories with repo targets and pass status
- `example-prd.json` - Example PRD format

## Patterns

- Each iteration spawns a fresh Claude Code instance with clean context
- Memory persists via git history (in each repo), `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Backend stories (argile-lib-python) should come before frontend stories (remi-web-ui)
- Always update CLAUDE.md in the target repo with discovered patterns
