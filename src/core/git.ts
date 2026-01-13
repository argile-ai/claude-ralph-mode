import { run } from "../utils/shell.js";
import fs from "fs-extra";
import path from "path";

export async function isGitRepo(dir: string): Promise<boolean> {
  const gitDir = path.join(dir, ".git");
  return fs.pathExists(gitDir);
}

export async function getCurrentBranch(cwd: string): Promise<string | null> {
  if (!(await isGitRepo(cwd))) {
    return null;
  }

  const result = await run("git", ["branch", "--show-current"], { cwd });

  if (result.exitCode !== 0) {
    return null;
  }

  return result.stdout.trim() || "detached";
}

export async function branchExists(
  branchName: string,
  cwd: string
): Promise<boolean> {
  const result = await run("git", ["branch", "--list", branchName], { cwd });
  return result.stdout.trim().length > 0;
}

export async function checkout(
  branchName: string,
  cwd: string,
  create = false
): Promise<boolean> {
  const args = create
    ? ["checkout", "-b", branchName]
    : ["checkout", branchName];

  const result = await run("git", args, { cwd });
  return result.exitCode === 0;
}

export async function getExistingForkBranches(
  baseBranch: string,
  cwd: string
): Promise<string[]> {
  const result = await run("git", ["branch", "--list", `${baseBranch}-*`], {
    cwd,
  });

  if (result.exitCode !== 0 || !result.stdout.trim()) {
    return [];
  }

  return result.stdout
    .split("\n")
    .map((b) => b.trim().replace(/^\*?\s*/, ""))
    .filter((b) => b.length > 0);
}

export async function getNextForkBranch(
  baseBranch: string,
  cwd: string
): Promise<string> {
  const existing = await getExistingForkBranches(baseBranch, cwd);

  if (existing.length === 0) {
    return `${baseBranch}-1`;
  }

  const numbers = existing
    .map((b) => {
      const match = b.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);

  const maxNumber = Math.max(0, ...numbers);
  return `${baseBranch}-${maxNumber + 1}`;
}

export async function getRepoStatus(cwd: string): Promise<{
  isRepo: boolean;
  branch: string | null;
  hasChanges: boolean;
}> {
  const isRepo = await isGitRepo(cwd);

  if (!isRepo) {
    return { isRepo: false, branch: null, hasChanges: false };
  }

  const branch = await getCurrentBranch(cwd);
  const statusResult = await run("git", ["status", "--porcelain"], { cwd });
  const hasChanges = statusResult.stdout.trim().length > 0;

  return { isRepo, branch, hasChanges };
}
