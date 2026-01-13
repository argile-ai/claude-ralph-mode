import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { execa } from "execa";
import {
  isGitRepo,
  getCurrentBranch,
  branchExists,
  getExistingForkBranches,
  getNextForkBranch,
  getRepoStatus,
} from "../../src/core/git.js";

describe("git", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ralph-git-test-"));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  async function initGitRepo(dir: string): Promise<void> {
    await execa("git", ["init"], { cwd: dir });
    await execa("git", ["config", "user.email", "test@test.com"], { cwd: dir });
    await execa("git", ["config", "user.name", "Test"], { cwd: dir });
    // Create initial commit
    await fs.writeFile(path.join(dir, "README.md"), "# Test");
    await execa("git", ["add", "."], { cwd: dir });
    await execa("git", ["commit", "-m", "Initial commit"], { cwd: dir });
  }

  describe("isGitRepo", () => {
    it("should return true for a git repository", async () => {
      await initGitRepo(tempDir);
      expect(await isGitRepo(tempDir)).toBe(true);
    });

    it("should return false for a non-git directory", async () => {
      expect(await isGitRepo(tempDir)).toBe(false);
    });
  });

  describe("getCurrentBranch", () => {
    it("should return the current branch name", async () => {
      await initGitRepo(tempDir);
      const branch = await getCurrentBranch(tempDir);
      // Git default branch can be 'main' or 'master' depending on config
      expect(branch).toMatch(/^(main|master)$/);
    });

    it("should return null for non-git directory", async () => {
      expect(await getCurrentBranch(tempDir)).toBeNull();
    });
  });

  describe("branchExists", () => {
    it("should return true for existing branch", async () => {
      await initGitRepo(tempDir);
      const currentBranch = await getCurrentBranch(tempDir);
      expect(await branchExists(currentBranch!, tempDir)).toBe(true);
    });

    it("should return false for non-existing branch", async () => {
      await initGitRepo(tempDir);
      expect(await branchExists("non-existent-branch", tempDir)).toBe(false);
    });
  });

  describe("getExistingForkBranches", () => {
    it("should return empty array when no fork branches exist", async () => {
      await initGitRepo(tempDir);
      const forks = await getExistingForkBranches("feature/test", tempDir);
      expect(forks).toEqual([]);
    });

    it("should return fork branches", async () => {
      await initGitRepo(tempDir);
      await execa("git", ["checkout", "-b", "feature/test-1"], { cwd: tempDir });
      await execa("git", ["checkout", "-b", "feature/test-2"], { cwd: tempDir });

      const forks = await getExistingForkBranches("feature/test", tempDir);
      expect(forks).toContain("feature/test-1");
      expect(forks).toContain("feature/test-2");
    });
  });

  describe("getNextForkBranch", () => {
    it("should return branch-1 when no forks exist", async () => {
      await initGitRepo(tempDir);
      const next = await getNextForkBranch("feature/test", tempDir);
      expect(next).toBe("feature/test-1");
    });

    it("should return next number", async () => {
      await initGitRepo(tempDir);
      await execa("git", ["checkout", "-b", "feature/test-1"], { cwd: tempDir });
      await execa("git", ["checkout", "-b", "feature/test-2"], { cwd: tempDir });

      const next = await getNextForkBranch("feature/test", tempDir);
      expect(next).toBe("feature/test-3");
    });
  });

  describe("getRepoStatus", () => {
    it("should return status for git repo", async () => {
      await initGitRepo(tempDir);
      const status = await getRepoStatus(tempDir);

      expect(status.isRepo).toBe(true);
      expect(status.branch).toMatch(/^(main|master)$/);
      expect(status.hasChanges).toBe(false);
    });

    it("should detect uncommitted changes", async () => {
      await initGitRepo(tempDir);
      await fs.writeFile(path.join(tempDir, "new-file.txt"), "content");

      const status = await getRepoStatus(tempDir);
      expect(status.hasChanges).toBe(true);
    });

    it("should return status for non-git directory", async () => {
      const status = await getRepoStatus(tempDir);

      expect(status.isRepo).toBe(false);
      expect(status.branch).toBeNull();
      expect(status.hasChanges).toBe(false);
    });
  });
});
