# Ralph - Open Source Roadmap

This document outlines the work needed to transform Ralph into a generic, open-source tool usable for any project type.

---

## High Priority

### Configuration System
- [ ] Create `ralph.config.json` schema for project configuration
- [ ] Support arbitrary repository definitions (not just argile-lib-python/remi-web-ui)
- [ ] Make quality checks configurable per repository
- [ ] Support single-repo projects (not just multi-repo)
- [ ] Add environment variable support for sensitive config

### Documentation
- [ ] Translate README.md to English (keep French version as README.fr.md)
- [ ] Write comprehensive "Getting Started" guide
- [ ] Add architecture diagram explaining the loop
- [ ] Document all configuration options
- [ ] Add troubleshooting section

### Legal & Community
- [ ] Add LICENSE file (MIT or Apache 2.0 recommended)
- [ ] Create CONTRIBUTING.md with contribution guidelines
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Create issue templates (bug report, feature request)
- [ ] Create pull request template

---

## Medium Priority

### PRD Templates
- [ ] Create template for Python-only projects
- [ ] Create template for JavaScript/TypeScript projects
- [ ] Create template for monorepo projects
- [ ] Create template for microservices architecture
- [ ] Add template selection to `/prd` command

### CLI Improvements
- [ ] Refactor ralph.sh into a proper CLI (Python or Node.js)
- [ ] Add `ralph init` command to initialize a new project
- [ ] Add `ralph run [--max-iterations N]` command
- [ ] Add `ralph status` command to display PRD state
- [ ] Add `ralph archive` command for manual archiving
- [ ] Add `ralph validate` command to check PRD format
- [ ] Add colored output and progress indicators

### Error Handling & Resilience
- [ ] Add automatic retry on transient failures
- [ ] Implement rollback mechanism for failed stories
- [ ] Add timeout configuration per story
- [ ] Log detailed error information for debugging
- [ ] Add `--dry-run` mode for testing

### Testing
- [ ] Add unit tests for PRD parsing logic
- [ ] Add integration tests for the main loop
- [ ] Add tests for branch forking logic
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add test coverage reporting

---

## Low Priority

### LLM Abstraction
- [ ] Create adapter interface for different AI agents
- [ ] Add support for Claude Code (current)
- [ ] Add support for Cursor Agent
- [ ] Add support for Aider
- [ ] Add support for custom agents via plugins

### Notifications & Integrations
- [ ] Add webhook support for story completion
- [ ] Add Slack integration
- [ ] Add Discord integration
- [ ] Add email notifications
- [ ] Add GitHub/GitLab issue integration

### Advanced Features
- [ ] Add parallel story execution (independent stories)
- [ ] Add story dependency graph visualization
- [ ] Add cost estimation based on token usage
- [ ] Add time tracking per story
- [ ] Add dashboard web UI for monitoring
- [ ] Support for story templates/snippets

---

## Proposed Configuration Schema

```json
{
  "$schema": "https://ralph.dev/schema/v1",
  "version": "1.0",
  "project": "my-project",
  "repositories": {
    "backend": {
      "path": "./backend",
      "remote": "git@github.com:user/backend.git",
      "defaultBranch": "main",
      "checks": [
        { "name": "test", "command": "pytest" },
        { "name": "lint", "command": "ruff check ." },
        { "name": "types", "command": "mypy ." }
      ]
    },
    "frontend": {
      "path": "./frontend",
      "remote": "git@github.com:user/frontend.git",
      "defaultBranch": "main",
      "checks": [
        { "name": "build", "command": "npm run build" },
        { "name": "lint", "command": "npm run lint" },
        { "name": "test", "command": "npm test" }
      ]
    }
  },
  "agent": {
    "type": "claude-code",
    "maxIterations": 50,
    "timeout": 600
  },
  "notifications": {
    "onComplete": [],
    "onFailure": []
  }
}
```

---

## Proposed CLI Commands

```bash
# Initialize a new Ralph project
ralph init [--template <template-name>]

# Run the autonomous loop
ralph run [--max-iterations N] [--story <story-id>]

# Check PRD status
ralph status [--json]

# Validate PRD format
ralph validate [prd-file]

# Archive current project
ralph archive [--name <archive-name>]

# Generate a new PRD
ralph prd <description-file>

# Convert PRD markdown to JSON
ralph convert <prd-markdown-file>
```

---

## Migration Path

For existing users of the current Ralph implementation:

1. **v1.0**: Current functionality with config file support
2. **v1.1**: CLI rewrite with backward compatibility
3. **v2.0**: LLM abstraction and plugin system

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (to be created)

---

*Last updated: 2026-01-11*
