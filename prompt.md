# Ralph Agent Instructions

You are an autonomous coding agent working on the argile-app project which contains TWO SEPARATE GIT REPOSITORIES:
- `argile-lib-python/` - Backend FastAPI (Python) - **separate git repo**
- `remi-web-ui/` - Frontend NextJS (TypeScript) - **separate git repo**

**Important:** Each repository has its own git history. Commits must be made in the correct repository.

## Your Task

1. Read the PRD at `ralph/prd.json`
2. Read the progress log at `ralph/progress.txt` (check Codebase Patterns section first)
3. Pick the **highest priority** user story where `passes: false`
4. Note which `repo` the story targets
5. Ensure you're on the correct branch in that repo (check `repositories` section in PRD)
6. Implement that single user story in the target repo
7. Run quality checks for that repo
8. Update CLAUDE.md files if you discover reusable patterns
9. If checks pass, commit changes **in the target repo** with message: `feat: [Story ID] - [Story Title]`
10. Update the PRD to set `passes: true` for the completed story
11. Append your progress to `ralph/progress.txt`

## Project Structure

```
argile-app/
├── argile-lib-python/      # Backend - FastAPI, Python (SEPARATE GIT REPO)
│   ├── .git/
│   └── CLAUDE.md
├── remi-web-ui/            # Frontend - NextJS, TypeScript (SEPARATE GIT REPO)
│   ├── .git/
│   └── CLAUDE.md
├── ralph/                  # Agent configuration (in its own repo)
│   ├── prd.json
│   └── progress.txt
└── CLAUDE.md
```

## Branch Management (CRITICAL)

Each story specifies a `repo` field. Before implementing:

1. **Check the story's `repo` field** (e.g., `"repo": "argile-lib-python"`)
2. **Navigate to that repo** and check/create the branch:
   ```bash
   cd argile-lib-python
   git checkout -b feature/my-feature  # or checkout existing branch
   ```
3. **After implementing, commit in that repo:**
   ```bash
   cd argile-lib-python
   git add .
   git commit -m "feat: US-001 - Add status field"
   ```

The PRD contains a `repositories` section with branch names for each repo:
```json
{
  "repositories": {
    "argile-lib-python": { "branchName": "feature/task-status" },
    "remi-web-ui": { "branchName": "feature/task-status" }
  }
}
```

## Branch Forking

Some user stories may request a "fork" - creating a new branch from the current one before implementing.

### When to Fork

Check the story's `fork` field:
- `"fork": true` - Create a new branch before implementing
- `"fork": false` or not specified - Use the existing branch

### Fork Algorithm

If `fork: true` for the current story:

1. **Check if already forked** (for resume scenarios):
   - If `repositories[repo].activeBranch` exists and differs from `branchName`, the fork already happened
   - In that case, just checkout `activeBranch` and continue

2. **Detect next branch number:**
   ```bash
   cd <repo>
   CURRENT_BRANCH=$(git branch --show-current)
   BASE_BRANCH=$(jq -r '.repositories["<repo>"].branchName' ralph/prd.json)

   # List existing fork branches
   EXISTING=$(git branch --list "${BASE_BRANCH}-*" | tr -d ' *')

   # Find max number
   MAX_NUM=0
   for branch in $EXISTING; do
     NUM=$(echo "$branch" | grep -oE '[0-9]+$')
     if [ -n "$NUM" ] && [ "$NUM" -gt "$MAX_NUM" ]; then
       MAX_NUM=$NUM
     fi
   done
   NEXT_NUM=$((MAX_NUM + 1))
   NEW_BRANCH="${BASE_BRANCH}-${NEXT_NUM}"
   ```

3. **Create and checkout new branch:**
   ```bash
   git checkout -b "$NEW_BRANCH"
   ```

4. **Update PRD** to reflect the new active branch:
   - Update `repositories[repo].activeBranch` in `ralph/prd.json` to the new branch name
   - This allows future iterations to know which branch to use

### Which Branch to Use

When starting work on a story:
1. Check if `repositories[repo].activeBranch` exists in the PRD
2. If yes, use `activeBranch` (this is the forked branch)
3. If no, use `branchName` (the original branch)

### Important Notes

- Fork happens ONCE at the start of a story, not per iteration
- If the story already has `passes: true`, do not fork
- Always commit changes to the forked branch after forking
- The `activeBranch` field is updated in the PRD to track the current working branch

## Quality Requirements

### For argile-lib-python stories:
```bash
cd argile-lib-python
python -m pytest                    # Run tests
python -m mypy .                    # Type checking (if configured)
ruff check .                        # Linting (if configured)
```

### For remi-web-ui stories:
```bash
cd remi-web-ui
npm run build                       # Type checking & build
npm run lint                        # Linting
npm test                            # Tests (if available)
```

**General:**
- ALL commits must pass quality checks for the target repo
- Do NOT commit broken code
- Keep changes focused and minimal
- Follow existing code patterns

## Progress Report Format

APPEND to ralph/progress.txt (never replace, always append):
```
## [Date/Time] - [Story ID] ([repo])
- What was implemented
- Files changed in [repo]
- Commit: [commit hash]
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
---
```

## Consolidate Patterns

If you discover a **reusable pattern**, add it to the `## Codebase Patterns` section at the TOP of ralph/progress.txt:

```
## Codebase Patterns

### argile-lib-python
- Example: Use Pydantic models for request/response
- Example: Routes are in `routers/` directory

### remi-web-ui
- Example: Use shadcn/ui components
- Example: API calls go through `lib/api.ts`
```

## Update CLAUDE.md Files

Before committing, check if learnings should be added to:
- `argile-lib-python/CLAUDE.md` for backend patterns
- `remi-web-ui/CLAUDE.md` for frontend patterns

## Browser Testing (For remi-web-ui Stories)

For any story that changes UI:

1. Start the dev server: `cd remi-web-ui && npm run dev`
2. Navigate to the relevant page
3. Verify the UI changes work as expected
4. A frontend story is NOT complete until browser verification passes

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally (another iteration will pick up the next story).

## Important

- Work on ONE story per iteration
- Each story targets ONE repository - commit only in that repo
- Read the story's `repo` field to know which repo to work in
- Use the correct branch for each repo (from PRD `repositories` section)
- Read the Codebase Patterns section in ralph/progress.txt before starting
- Read the relevant CLAUDE.md for the target repo
