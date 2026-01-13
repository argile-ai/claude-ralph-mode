# Ralph - Plan Generator

Generate a structured implementation plan from a feature description.

---

## The Job

1. Read the project configuration from `ralph.config.json`
2. Analyze the user's feature request
3. Ask 3-5 clarifying questions to understand scope
4. Generate a detailed plan in `plan.md`
5. Offer to validate or modify the plan

---

## Step 1: Read Configuration

First, read `ralph.config.json` to understand:
- Project name and description
- Available repositories and their paths
- Quality checks for each repository

If `ralph.config.json` doesn't exist, ask the user to create one or offer to generate a default configuration.

---

## Step 2: Clarifying Questions

Ask 3-5 essential questions to understand the feature. Format questions with lettered options:

```
1. What is the primary goal of this feature?
   A) Add new functionality
   B) Improve existing functionality
   C) Fix a bug
   D) Refactor/cleanup

2. Which parts of the codebase will be affected?
   A) Backend only
   B) Frontend only
   C) Both backend and frontend
   D) Other (specify)

3. Are there any external dependencies required?
   A) No new dependencies
   B) Yes (specify which)
```

Wait for the user to respond with format like "1A, 2C, 3A" before proceeding.

---

## Step 3: Generate Plan

Based on the answers, generate `plan.md` with this structure:

```markdown
# [Project Name] - [Feature Name]

[Brief description of the feature]

---

## Summary

[2-3 sentences explaining what this plan accomplishes]

---

## User Stories

### [Repository 1] Stories

#### US-001: [Title]
**Repository:** `repo-name`
**Description:** As a [role], I want [feature] so that [benefit].

**Acceptance Criteria:**
- [ ] Specific, verifiable criterion
- [ ] Another criterion
- [ ] Tests pass (pytest/npm test/etc.)

[Repeat for each story...]

---

## Technical Considerations

- [Architecture decisions]
- [Dependencies]
- [Breaking changes]

---

## Open Questions

- [Any unresolved questions]
```

---

## Step 4: Story Guidelines

### Story Size
- Each story must be completable in ONE Claude Code iteration
- If it can't be described in 2-3 sentences, split it
- Rule: One story = One focused change in ONE repository

### Story Order
Stories should be ordered by dependency:
1. Database/schema changes first
2. API/backend logic second
3. Frontend components third
4. Integration/polish last

### Acceptance Criteria Rules
- Must be objectively verifiable (not "works well" or "good UX")
- Backend stories MUST include: "Tests pass"
- Frontend stories MUST include: "Build passes" AND "Verify in browser"
- Include specific checks relevant to the change

---

## Step 5: Validation

After generating the plan, present it to the user and ask:

```
Plan generated and saved to `plan.md`.

Would you like to:
A) Validate and proceed to PRD generation (/prd)
B) Make modifications (describe what to change)
C) Start over with different requirements
```

If user chooses B, make the requested modifications and re-validate.

---

## Output

**File:** `plan.md`

The plan file will be used by the `/prd` command to generate the executable `prd.json`.

---

## Example Usage

User: `/ralph Add user authentication with OAuth`
