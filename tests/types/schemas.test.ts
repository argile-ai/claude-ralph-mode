import { describe, it, expect } from "vitest";
import {
  RalphConfigSchema,
  PrdSchema,
  UserStorySchema,
} from "../../src/types/index.js";

describe("schemas", () => {
  describe("RalphConfigSchema", () => {
    it("should validate a minimal config", () => {
      const config = {
        project: "Test",
        repositories: {
          main: {
            path: ".",
          },
        },
      };

      const result = RalphConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should validate a full config", () => {
      const config = {
        $schema: "https://example.com/schema.json",
        version: "1.0",
        project: "Test",
        description: "Test project",
        repositories: {
          backend: {
            path: "./backend",
            defaultBranch: "main",
            checks: ["pytest", "mypy ."],
          },
          frontend: {
            path: "./frontend",
            defaultBranch: "develop",
            checks: ["npm run build"],
          },
        },
        agent: {
          maxIterations: 100,
          timeout: 1200,
        },
      };

      const result = RalphConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const config = {
        project: "Test",
        repositories: {
          main: { path: "." },
        },
      };

      const result = RalphConfigSchema.parse(config);

      expect(result.repositories.main.defaultBranch).toBe("main");
      expect(result.repositories.main.checks).toEqual([]);
      expect(result.agent.maxIterations).toBe(50);
      expect(result.agent.timeout).toBe(600);
    });

    it("should reject config without project", () => {
      const config = {
        repositories: {
          main: { path: "." },
        },
      };

      const result = RalphConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject config without repositories", () => {
      const config = {
        project: "Test",
      };

      const result = RalphConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe("UserStorySchema", () => {
    it("should validate a complete user story", () => {
      const story = {
        id: "US-001",
        title: "Add feature",
        repo: "backend",
        description: "As a user...",
        acceptanceCriteria: ["Tests pass", "Code reviewed"],
        priority: 1,
        passes: false,
        fork: false,
        notes: "",
      };

      const result = UserStorySchema.safeParse(story);
      expect(result.success).toBe(true);
    });

    it("should apply defaults for optional fields", () => {
      const story = {
        id: "US-001",
        title: "Add feature",
        repo: "backend",
        description: "As a user...",
        acceptanceCriteria: ["Tests pass"],
        priority: 1,
      };

      const result = UserStorySchema.parse(story);

      expect(result.passes).toBe(false);
      expect(result.fork).toBe(false);
      expect(result.notes).toBe("");
    });

    it("should reject story without required fields", () => {
      const story = {
        id: "US-001",
        // Missing title, repo, description, etc.
      };

      const result = UserStorySchema.safeParse(story);
      expect(result.success).toBe(false);
    });
  });

  describe("PrdSchema", () => {
    it("should validate a complete PRD", () => {
      const prd = {
        project: "Test Project",
        description: "Description",
        repositories: {
          backend: { branchName: "feature/test" },
        },
        userStories: [
          {
            id: "US-001",
            title: "Story",
            repo: "backend",
            description: "Description",
            acceptanceCriteria: ["Done"],
            priority: 1,
            passes: false,
            fork: false,
            notes: "",
          },
        ],
      };

      const result = PrdSchema.safeParse(prd);
      expect(result.success).toBe(true);
    });

    it("should validate PRD with empty stories", () => {
      const prd = {
        project: "Test Project",
        repositories: {
          main: { branchName: "feature/test" },
        },
        userStories: [],
      };

      const result = PrdSchema.safeParse(prd);
      expect(result.success).toBe(true);
    });

    it("should reject PRD without project", () => {
      const prd = {
        repositories: {},
        userStories: [],
      };

      const result = PrdSchema.safeParse(prd);
      expect(result.success).toBe(false);
    });
  });
});
