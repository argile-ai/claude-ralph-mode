# Contributing to Ralph

Thank you for your interest in contributing to Ralph! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch (`git checkout -b feature/my-feature`)
4. Make your changes
5. Test your changes
6. Commit with a clear message (`git commit -m "feat: Add new feature"`)
7. Push to your fork (`git push origin feature/my-feature`)
8. Open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ralph.git
cd ralph

# Ensure prerequisites are installed
command -v claude || echo "Install Claude Code CLI"
command -v jq || echo "Install jq"
```

## Code Style

### Shell Scripts
- Use `#!/bin/bash` shebang
- Use `set -e` for error handling
- Use meaningful variable names in UPPER_CASE
- Add comments for complex logic
- Use functions for reusable code

### Markdown Files
- Use clear, descriptive headers
- Include code examples where helpful
- Keep lines under 100 characters when possible

### JSON Files
- Use 2-space indentation
- Include comments via description fields where supported

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: Add support for custom branch naming
fix: Handle missing config file gracefully
docs: Update README with new configuration options
```

## Pull Request Process

1. Update the README.md if your change affects usage
2. Update the example configuration if adding new options
3. Test with both single-repo and multi-repo configurations
4. Ensure the script runs without errors
5. Request review from maintainers

## Testing Your Changes

Before submitting:

```bash
# Test the script syntax
bash -n ralph.sh

# Test with a sample project
./ralph.sh 1  # Run one iteration
```

## Feature Requests

Open an issue with:
- Clear description of the feature
- Use case / motivation
- Example of how it would work

## Bug Reports

Open an issue with:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Claude Code version)

## Questions?

Open a discussion or issue with the `question` label.

## Code of Conduct

Be respectful and constructive. We're all here to build something useful together.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
