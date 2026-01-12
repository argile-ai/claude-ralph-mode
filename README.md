# Ralph

Ralph is an autonomous AI agent loop that runs [Claude Code](https://claude.ai/code) repeatedly until all PRD items are complete. Each iteration is a fresh Claude Code instance with clean context.

Based on [Geoffrey Huntley's Ralph pattern](https://ghuntley.com/ralph/).

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     Ralph Workflow                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. /ralph <feature>     Generate a structured plan        │
│         ↓                                                   │
│  2. plan.md              Review and edit the plan          │
│         ↓                                                   │
│  3. /prd                 Convert plan to prd.json          │
│         ↓                                                   │
│  4. ./ralph.sh           Execute stories autonomously      │
│         ↓                                                   │
│  5. Commits + PRD        Each story committed separately   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Copy Ralph to Your Project

```bash
# Clone or copy the ralph folder to your project
git clone https://github.com/anthropics/ralph.git my-project/ralph
# Or as a submodule
git submodule add https://github.com/anthropics/ralph.git ralph
```

### 2. Configure Your Project

Edit `ralph/ralph.config.json`:

```json
{
  "project": "MyProject",
  "description": "My awesome project",
  "repositories": {
    "backend": {
      "path": "./backend",
      "checks": ["pytest", "mypy ."]
    },
    "frontend": {
      "path": "./frontend",
      "checks": ["npm run build", "npm run lint"]
    }
  }
}
```

**Single repository?** Just use one entry:

```json
{
  "project": "MyProject",
  "repositories": {
    "main": {
      "path": ".",
      "checks": ["npm run build", "npm test"]
    }
  }
}
```

### 3. Generate a Plan

Start Claude Code and run:

```
/ralph Add user authentication with OAuth support
```

Claude will:
1. Ask 3-5 clarifying questions
2. Generate `ralph/plan.md` with structured user stories
3. Ask for validation

### 4. Review and Validate

Edit `ralph/plan.md` if needed, then:

```
/prd
```

This converts the plan to `ralph/prd.json`.

### 5. Run Ralph

```bash
./ralph/ralph.sh
```

Ralph will:
1. Pick the highest priority story with `passes: false`
2. Navigate to the correct repository
3. Create/checkout the feature branch
4. Implement the story
5. Run quality checks
6. Commit if checks pass
7. Update `prd.json` and repeat

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- `jq` installed (`brew install jq` on macOS or `apt install jq` on Linux)

## Project Structure

```
your-project/
├── ralph/                    # Ralph configuration
│   ├── .claude/
│   │   └── commands/
│   │       ├── ralph.md     # /ralph command
│   │       └── prd.md       # /prd command
│   ├── ralph.sh             # Execution script
│   ├── ralph.config.json    # Your project config
│   ├── prompt.md            # Instructions for each iteration
│   ├── plan.md              # Generated plan (after /ralph)
│   ├── prd.json             # Generated PRD (after /prd)
│   └── progress.txt         # Accumulated learnings
├── backend/                  # Your backend (example)
└── frontend/                 # Your frontend (example)
```

## Configuration Reference

### ralph.config.json

```json
{
  "$schema": "https://raw.githubusercontent.com/anthropics/ralph/main/schema/ralph.config.schema.json",
  "version": "1.0",
  "project": "MyProject",
  "description": "Optional project description",
  "repositories": {
    "repo-key": {
      "path": "./relative/path",
      "defaultBranch": "main",
      "checks": [
        "command1",
        "command2"
      ]
    }
  },
  "agent": {
    "maxIterations": 50,
    "timeout": 600
  }
}
```

### prd.json

```json
{
  "project": "Feature Name",
  "description": "What this feature does",
  "repositories": {
    "backend": { "branchName": "feature/my-feature" },
    "frontend": { "branchName": "feature/my-feature" }
  },
  "userStories": [
    {
      "id": "US-001",
      "title": "Add user model",
      "repo": "backend",
      "description": "As a developer, I need a user model...",
      "acceptanceCriteria": [
        "User model created with email, password fields",
        "Migration generated",
        "Tests pass"
      ],
      "priority": 1,
      "passes": false,
      "fork": false,
      "notes": ""
    }
  ]
}
```

## Commands

### `/ralph <feature description>`

Generate a structured implementation plan.

**Example:**
```
/ralph Add a notification system with email and push support
```

### `/prd`

Convert `plan.md` to `prd.json`.

### `./ralph.sh [max_iterations]`

Run the autonomous loop.

**Options:**
- `max_iterations`: Maximum iterations before stopping (default: 50)

**Example:**
```bash
./ralph.sh 10  # Run max 10 iterations
```

## Story Guidelines

### Size
- Each story must be completable in ONE Claude Code iteration
- If it can't be described in 2-3 sentences, split it
- One story = One focused change in ONE repository

### Order
1. Database/schema changes first
2. API/backend logic second
3. Frontend components third
4. Integration/polish last

### Acceptance Criteria
- Must be objectively verifiable
- Backend stories: Include "Tests pass"
- Frontend stories: Include "Build passes" AND "Verify in browser"

## Branch Forking

For significant direction changes, use `fork: true` in a story:

```json
{
  "id": "US-005",
  "title": "Refactor auth system",
  "fork": true,
  "passes": false
}
```

Ralph will create a new branch (e.g., `feature/auth-2`) from the current one.

## Debugging

```bash
# View pending stories
cat ralph/prd.json | jq '.userStories[] | select(.passes == false) | {id, repo, title}'

# View progress
cat ralph/progress.txt

# Check branches
git branch -a
```

## Archiving

Ralph automatically archives previous runs when you start a new project. Archives are saved in `ralph/archive/YYYY-MM-DD-project-name/`.

## References

- [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)

## License

MIT License - see [LICENSE](LICENSE)
