import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  loadPrd,
  savePrd,
  prdExists,
  getPendingStories,
  getCompletedStories,
  getNextStory,
  isAllComplete,
  getStoriesByRepo,
  getCompletionStats,
  PrdNotFoundError,
  PrdValidationError,
} from "../../src/core/prd.js";
import type { Prd } from "../../src/types/index.js";

describe("prd", () => {
  let tempDir: string;

  const validPrd: Prd = {
    project: "Test Project",
    description: "A test project",
    repositories: {
      backend: { branchName: "feature/test" },
      frontend: { branchName: "feature/test" },
    },
    userStories: [
      {
        id: "US-001",
        title: "First story",
        repo: "backend",
        description: "First story description",
        acceptanceCriteria: ["Tests pass"],
        priority: 1,
        passes: false,
        fork: false,
        notes: "",
      },
      {
        id: "US-002",
        title: "Second story",
        repo: "backend",
        description: "Second story description",
        acceptanceCriteria: ["Tests pass"],
        priority: 2,
        passes: true,
        fork: false,
        notes: "",
      },
      {
        id: "US-003",
        title: "Third story",
        repo: "frontend",
        description: "Third story description",
        acceptanceCriteria: ["Build passes"],
        priority: 3,
        passes: false,
        fork: true,
        notes: "",
      },
    ],
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-test-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe("loadPrd", () => {
    it("should load a valid PRD file", async () => {
      await fs.writeJSON(path.join(tempDir, "prd.json"), validPrd);

      const loaded = await loadPrd(tempDir);

      expect(loaded.project).toBe("Test Project");
      expect(loaded.userStories).toHaveLength(3);
    });

    it("should throw PrdNotFoundError when file doesn't exist", async () => {
      await expect(loadPrd(tempDir)).rejects.toThrow(PrdNotFoundError);
    });

    it("should throw PrdValidationError for invalid PRD", async () => {
      const invalidPrd = {
        project: "Test",
        // Missing required fields
      };

      await fs.writeJSON(path.join(tempDir, "prd.json"), invalidPrd);

      await expect(loadPrd(tempDir)).rejects.toThrow(PrdValidationError);
    });
  });

  describe("savePrd", () => {
    it("should save PRD to file", async () => {
      await savePrd(validPrd, tempDir);

      const content = await fs.readJSON(path.join(tempDir, "prd.json"));
      expect(content.project).toBe("Test Project");
    });
  });

  describe("prdExists", () => {
    it("should return true when PRD exists", async () => {
      await fs.writeJSON(path.join(tempDir, "prd.json"), validPrd);
      expect(await prdExists(tempDir)).toBe(true);
    });

    it("should return false when PRD doesn't exist", async () => {
      expect(await prdExists(tempDir)).toBe(false);
    });
  });

  describe("getPendingStories", () => {
    it("should return stories with passes: false sorted by priority", () => {
      const pending = getPendingStories(validPrd);

      expect(pending).toHaveLength(2);
      expect(pending[0].id).toBe("US-001");
      expect(pending[1].id).toBe("US-003");
    });
  });

  describe("getCompletedStories", () => {
    it("should return stories with passes: true", () => {
      const completed = getCompletedStories(validPrd);

      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe("US-002");
    });
  });

  describe("getNextStory", () => {
    it("should return the highest priority pending story", () => {
      const next = getNextStory(validPrd);

      expect(next?.id).toBe("US-001");
    });

    it("should return undefined when all stories are complete", () => {
      const allComplete: Prd = {
        ...validPrd,
        userStories: validPrd.userStories.map((s) => ({ ...s, passes: true })),
      };

      expect(getNextStory(allComplete)).toBeUndefined();
    });
  });

  describe("isAllComplete", () => {
    it("should return false when some stories are pending", () => {
      expect(isAllComplete(validPrd)).toBe(false);
    });

    it("should return true when all stories are complete", () => {
      const allComplete: Prd = {
        ...validPrd,
        userStories: validPrd.userStories.map((s) => ({ ...s, passes: true })),
      };

      expect(isAllComplete(allComplete)).toBe(true);
    });
  });

  describe("getStoriesByRepo", () => {
    it("should group stories by repository", () => {
      const byRepo = getStoriesByRepo(validPrd);

      expect(Object.keys(byRepo)).toEqual(["backend", "frontend"]);
      expect(byRepo.backend).toHaveLength(2);
      expect(byRepo.frontend).toHaveLength(1);
    });
  });

  describe("getCompletionStats", () => {
    it("should return correct completion statistics", () => {
      const stats = getCompletionStats(validPrd);

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(2);
      expect(stats.percentage).toBe(33);
    });

    it("should handle empty PRD", () => {
      const emptyPrd: Prd = {
        ...validPrd,
        userStories: [],
      };

      const stats = getCompletionStats(emptyPrd);

      expect(stats.total).toBe(0);
      expect(stats.percentage).toBe(0);
    });
  });
});
