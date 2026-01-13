<div align="center">

# 🤖 Ralph + 🧠 Claude

<img src="assets/ralph-wiggum.png" alt="Ralph" width="120" />
<img src="assets/plus.png" alt="+" width="50" />
<img src="assets/claude-code-logo.jpg" alt="Claude Code" width="120" />

**Autonomous AI Agent Loop for Claude Code**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/anthropics/ralph/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-purple.svg)](https://claude.ai/code)

*Run Claude Code repeatedly until all PRD items are complete. Each iteration is a fresh instance with clean context.*

Based on [Geoffrey Huntley's Ralph pattern](https://ghuntley.com/ralph/) 🎩

</div>

---

## 📑 Table of Contents

- [🚀 How It Works](#-how-it-works)
- [📦 Installation](#-installation)
- [⚡ Quick Start](#-quick-start)
- [💻 CLI Commands](#-cli-commands)
- [📋 Prerequisites](#-prerequisites)
- [⚙️ Configuration Reference](#️-configuration-reference)
- [📝 Story Guidelines](#-story-guidelines)
- [🔀 Branch Forking](#-branch-forking)
- [📁 Archiving](#-archiving)
- [🛠️ Development](#️-development)
- [📚 References](#-references)
- [📄 License](#-license)

---

## 🚀 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     🔄 Ralph Workflow                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ralph init             🎯 Initialize configuration      │
│         ↓                                                   │
│  2. ralph plan <feature>   📝 Generate a structured plan    │
│         ↓                                                   │
│  3. ralph prd              🔧 Convert plan to prd.json      │
│         ↓                                                   │
│  4. ralph run              🤖 Execute stories autonomously  │
│         ↓                                                   │
│  5. Commits + PRD          ✅ Each story committed          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

```bash
npm install -g claude-ralph
```

Or use npx without installing:

```bash
npx claude-ralph <command>
```

---

## ⚡ Quick Start

### 1️⃣ Initialize Ralph in Your Project

```bash
cd your-project
ralph init
```

This creates `ralph.config.json` with your project settings.

### 2️⃣ Configure Your Project

Edit `ralph.config.json`:

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

### 3️⃣ Generate a Plan

```bash
ralph plan "Add user authentication with OAuth support"
```

Claude will:
1. 🤔 Ask 3-5 clarifying questions
2. 📄 Generate `plan.md` with structured user stories
3. ✅ Ask for validation

### 4️⃣ Convert to PRD

Review and edit `plan.md` if needed, then:

```bash
ralph prd
```

This converts the plan to `prd.json`.

### 5️⃣ Run Ralph

```bash
ralph run
```

Ralph will:
1. 🎯 Pick the highest priority story with `passes: false`
2. 📂 Navigate to the correct repository
3. 🌿 Create/checkout the feature branch
4. 💻 Implement the story
5. 🧪 Run quality checks
6. ✅ Commit if checks pass
7. 🔄 Update `prd.json` and repeat

### 6️⃣ Check Status

```bash
ralph status
ralph status --verbose
```

---

## 💻 CLI Commands

| Command | Description |
|---------|-------------|
| `ralph init` | 🎯 Initialize Ralph configuration |
| `ralph plan <feature>` | 📝 Generate a structured implementation plan |
| `ralph prd` | 🔧 Convert `plan.md` to `prd.json` |
| `ralph run` | 🤖 Run the autonomous agent loop |
| `ralph status` | 📊 Show current progress and status |

### `ralph init`

Initialize Ralph configuration in the current directory.

```bash
ralph init
ralph init --force  # Overwrite existing config
```

### `ralph plan <feature>`

Generate a structured implementation plan.

```bash
ralph plan "Add a notification system with email and push support"
ralph plan "Refactor the auth module" --output custom-plan.md
```

### `ralph prd`

Convert `plan.md` to `prd.json`.

```bash
ralph prd
ralph prd --input custom-plan.md --output custom-prd.json
```

### `ralph run`

Run the autonomous agent loop.

```bash
ralph run
ralph run --max-iterations 10  # Limit iterations
```

### `ralph status`

Show current progress and status.

```bash
ralph status
ralph status --verbose  # Show detailed information
```

---

## 📋 Prerequisites

- 🧠 [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- 📦 Node.js 18 or later

---

## ⚙️ Configuration Reference

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

Configuration can also be stored in:
- `.ralphrc`
- `.ralphrc.json`
- `.ralphrc.yaml`
- `package.json` under the `"ralph"` key

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

---

## 📝 Story Guidelines

### 📏 Size
- Each story must be completable in **ONE** Claude Code iteration
- If it can't be described in 2-3 sentences, split it
- One story = One focused change in ONE repository

### 📊 Order
1. 🗄️ Database/schema changes first
2. ⚙️ API/backend logic second
3. 🎨 Frontend components third
4. 🔗 Integration/polish last

### ✅ Acceptance Criteria
- Must be objectively verifiable
- Backend stories: Include "Tests pass"
- Frontend stories: Include "Build passes" AND "Verify in browser"

---

## 🔀 Branch Forking

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

---

## 📁 Archiving

Ralph automatically archives previous runs when you start a new project. Archives are saved in `archive/YYYY-MM-DD-project-name/`.

---

## 🛠️ Development

To build from source:

```bash
git clone https://github.com/anthropics/ralph.git
cd ralph
npm install
npm run build
npm link  # Makes 'ralph' command available globally
```

---

## 📚 References

- 🎩 [Geoffrey Huntley's Ralph article](https://ghuntley.com/ralph/)
- 🧠 [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code)

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

<div align="center">

Made with 💜 by the community

</div>
