import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import {
  initProgressFile,
  progressExists,
  appendProgress,
  readProgress,
  getRecentProgress,
} from "../../src/core/progress.js";

describe("progress", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-progress-test-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  describe("initProgressFile", () => {
    it("should create a new progress file", async () => {
      await initProgressFile("TestProject", tempDir);

      const exists = await fs.pathExists(path.join(tempDir, "progress.txt"));
      expect(exists).toBe(true);

      const content = await fs.readFile(
        path.join(tempDir, "progress.txt"),
        "utf-8"
      );
      expect(content).toContain("# Ralph Progress Log");
      expect(content).toContain("Project: TestProject");
    });

    it("should not overwrite existing progress file", async () => {
      const existingContent = "Existing progress";
      await fs.writeFile(path.join(tempDir, "progress.txt"), existingContent);

      await initProgressFile("NewProject", tempDir);

      const content = await fs.readFile(
        path.join(tempDir, "progress.txt"),
        "utf-8"
      );
      expect(content).toBe(existingContent);
    });
  });

  describe("progressExists", () => {
    it("should return true when progress file exists", async () => {
      await fs.writeFile(path.join(tempDir, "progress.txt"), "content");
      expect(await progressExists(tempDir)).toBe(true);
    });

    it("should return false when progress file doesn't exist", async () => {
      expect(await progressExists(tempDir)).toBe(false);
    });
  });

  describe("appendProgress", () => {
    it("should append content to progress file", async () => {
      await fs.writeFile(path.join(tempDir, "progress.txt"), "Initial\n");

      await appendProgress("New entry", tempDir);

      const content = await fs.readFile(
        path.join(tempDir, "progress.txt"),
        "utf-8"
      );
      expect(content).toBe("Initial\nNew entry\n");
    });
  });

  describe("readProgress", () => {
    it("should read progress file content", async () => {
      const expected = "Progress content";
      await fs.writeFile(path.join(tempDir, "progress.txt"), expected);

      const content = await readProgress(tempDir);
      expect(content).toBe(expected);
    });

    it("should return empty string when file doesn't exist", async () => {
      const content = await readProgress(tempDir);
      expect(content).toBe("");
    });
  });

  describe("getRecentProgress", () => {
    it("should return last N lines", async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join(
        "\n"
      );
      await fs.writeFile(path.join(tempDir, "progress.txt"), lines);

      const recent = await getRecentProgress(10, tempDir);
      const recentLines = recent.split("\n").filter((l) => l);

      expect(recentLines).toHaveLength(10);
      expect(recentLines[0]).toBe("Line 91");
      expect(recentLines[9]).toBe("Line 100");
    });
  });
});
