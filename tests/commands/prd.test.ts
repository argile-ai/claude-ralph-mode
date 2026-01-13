import { describe, it, expect } from "vitest";

// Test the plan parsing logic extracted from prd command
// We'll test the parsing function directly

describe("plan parsing", () => {
  // Helper function to parse plan content (extracted from prd.ts)
  function parsePlanContent(content: string) {
    // Extract project name from H1
    const h1Match = content.match(/^#\s+(.+)$/m);
    const projectName = h1Match ? h1Match[1].trim() : "Unknown";

    // Extract description (first paragraph after H1)
    const descMatch = content.match(/^#\s+.+\n\n(.+?)(?:\n\n|---)/s);
    const description = descMatch ? descMatch[1].trim() : "";

    // Generate branch name from project
    const branchSlug = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .substring(0, 50);
    const branchName = `feature/${branchSlug}`;

    // Parse user stories
    interface Story {
      id: string;
      title: string;
      repo: string;
      description: string;
      acceptanceCriteria: string[];
      priority: number;
      fork: boolean;
    }

    const stories: Story[] = [];
    const storyRegex = /####\s+(US-\d+):\s*(.+?)(?:\n|$)/g;
    let match;
    let priority = 1;

    while ((match = storyRegex.exec(content)) !== null) {
      const id = match[1];
      const title = match[2].trim();

      // Find story details
      const storyStart = match.index;
      const nextStoryMatch = content
        .slice(storyStart + match[0].length)
        .match(/####\s+US-\d+/);
      const storyEnd = nextStoryMatch
        ? storyStart + match[0].length + nextStoryMatch.index!
        : content.length;
      const storyContent = content.slice(storyStart, storyEnd);

      // Extract repository
      const repoMatch = storyContent.match(/\*\*Repository:\*\*\s*`?(\w+)`?/);
      const repo = repoMatch ? repoMatch[1] : "main";

      // Extract description
      const storyDescMatch = storyContent.match(
        /\*\*Description:\*\*\s*(.+?)(?:\n\n|\*\*)/s
      );
      const storyDesc = storyDescMatch ? storyDescMatch[1].trim() : title;

      // Extract acceptance criteria
      const criteriaMatch = storyContent.match(
        /\*\*Acceptance Criteria:\*\*\s*([\s\S]*?)(?:\n\n---|\n\n####|$)/
      );
      const criteria: string[] = [];

      if (criteriaMatch) {
        const criteriaLines = criteriaMatch[1].split("\n");
        for (const line of criteriaLines) {
          const item = line
            .replace(/^-\s*\[.\]\s*/, "")
            .replace(/^-\s*/, "")
            .trim();
          if (item) {
            criteria.push(item);
          }
        }
      }

      // Check if it's a fork story
      const isFork =
        storyContent.toLowerCase().includes("experimental") ||
        storyContent.toLowerCase().includes("fork");

      stories.push({
        id,
        title,
        repo,
        description: storyDesc,
        acceptanceCriteria:
          criteria.length > 0 ? criteria : ["Implementation complete"],
        priority: priority++,
        fork: isFork,
      });
    }

    return { projectName, description, branchName, stories };
  }

  describe("project name extraction", () => {
    it("should extract project name from H1", () => {
      const content = `# MyApp - User Authentication

This is the description.
`;
      const result = parsePlanContent(content);
      expect(result.projectName).toBe("MyApp - User Authentication");
    });

    it("should handle project name with special characters", () => {
      const content = `# My App (v2.0) - Feature

Description here.
`;
      const result = parsePlanContent(content);
      expect(result.projectName).toBe("My App (v2.0) - Feature");
    });
  });

  describe("description extraction", () => {
    it("should extract description paragraph", () => {
      const content = `# Project Name

This is the project description that explains what we're building.

## Summary
`;
      const result = parsePlanContent(content);
      expect(result.description).toBe(
        "This is the project description that explains what we're building."
      );
    });

    it("should handle description before separator", () => {
      const content = `# Project Name

Short description here.

---
`;
      const result = parsePlanContent(content);
      expect(result.description).toBe("Short description here.");
    });
  });

  describe("branch name generation", () => {
    it("should generate kebab-case branch name", () => {
      const content = `# User Authentication Feature

Desc
`;
      const result = parsePlanContent(content);
      expect(result.branchName).toBe("feature/user-authentication-feature");
    });

    it("should remove special characters", () => {
      const content = `# My App (v2.0) - New Feature!

Desc
`;
      const result = parsePlanContent(content);
      expect(result.branchName).toBe("feature/my-app-v20-new-feature");
    });

    it("should truncate long names", () => {
      const longName =
        "# " + "A".repeat(100) + "\n\nDesc";
      const result = parsePlanContent(longName);
      expect(result.branchName.length).toBeLessThanOrEqual(58); // "feature/" + 50 chars
    });
  });

  describe("user story parsing", () => {
    const planWithStories = `# Test Project

Description

---

## User Stories

### Backend Stories

#### US-001: Add User Model
**Repository:** \`backend\`
**Description:** As a developer, I need a user model.

**Acceptance Criteria:**
- [ ] User model created
- [ ] Migration generated
- [ ] Tests pass

---

#### US-002: Add API Endpoint
**Repository:** \`backend\`
**Description:** Create the REST endpoint.

**Acceptance Criteria:**
- [ ] POST /users works
- [ ] Tests pass

---

### Frontend Stories

#### US-003: Create Login Form (experimental)
**Repository:** \`frontend\`
**Description:** Build the login UI.

**Acceptance Criteria:**
- [ ] Form renders
- [ ] Build passes
`;

    it("should parse all user stories", () => {
      const result = parsePlanContent(planWithStories);
      expect(result.stories).toHaveLength(3);
    });

    it("should extract story IDs and titles", () => {
      const result = parsePlanContent(planWithStories);

      expect(result.stories[0].id).toBe("US-001");
      expect(result.stories[0].title).toBe("Add User Model");
      expect(result.stories[1].id).toBe("US-002");
      expect(result.stories[2].id).toBe("US-003");
    });

    it("should extract repository names", () => {
      const result = parsePlanContent(planWithStories);

      expect(result.stories[0].repo).toBe("backend");
      expect(result.stories[1].repo).toBe("backend");
      expect(result.stories[2].repo).toBe("frontend");
    });

    it("should extract acceptance criteria", () => {
      const result = parsePlanContent(planWithStories);

      expect(result.stories[0].acceptanceCriteria).toEqual([
        "User model created",
        "Migration generated",
        "Tests pass",
      ]);
    });

    it("should assign priorities in order", () => {
      const result = parsePlanContent(planWithStories);

      expect(result.stories[0].priority).toBe(1);
      expect(result.stories[1].priority).toBe(2);
      expect(result.stories[2].priority).toBe(3);
    });

    it("should detect fork stories", () => {
      const result = parsePlanContent(planWithStories);

      expect(result.stories[0].fork).toBe(false);
      expect(result.stories[1].fork).toBe(false);
      expect(result.stories[2].fork).toBe(true); // Has "experimental" in title
    });
  });

  describe("edge cases", () => {
    it("should handle plan with no stories", () => {
      const content = `# Empty Project

Just a description, no stories.
`;
      const result = parsePlanContent(content);
      expect(result.stories).toHaveLength(0);
    });

    it("should handle stories without acceptance criteria", () => {
      const content = `# Project

Desc

#### US-001: Simple Story
**Repository:** \`main\`
**Description:** Do something.

---
`;
      const result = parsePlanContent(content);
      expect(result.stories[0].acceptanceCriteria).toEqual([
        "Implementation complete",
      ]);
    });

    it("should default repo to main when not specified", () => {
      const content = `# Project

Desc

#### US-001: Story Without Repo
**Description:** Something.

`;
      const result = parsePlanContent(content);
      expect(result.stories[0].repo).toBe("main");
    });
  });
});
