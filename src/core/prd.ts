import fs from "fs-extra";
import path from "path";
import { PrdSchema, type Prd, type UserStory } from "../types/index.js";

export class PrdNotFoundError extends Error {
  constructor(filePath: string) {
    super(
      `PRD file not found: ${filePath}\nRun 'ralph plan <feature>' and 'ralph prd' to generate one.`
    );
    this.name = "PrdNotFoundError";
  }
}

export class PrdValidationError extends Error {
  constructor(message: string) {
    super(`Invalid PRD: ${message}`);
    this.name = "PrdValidationError";
  }
}

export async function loadPrd(cwd: string = process.cwd()): Promise<Prd> {
  const prdPath = path.join(cwd, "prd.json");

  if (!(await fs.pathExists(prdPath))) {
    throw new PrdNotFoundError(prdPath);
  }

  const content = await fs.readJSON(prdPath);
  const parsed = PrdSchema.safeParse(content);

  if (!parsed.success) {
    throw new PrdValidationError(parsed.error.message);
  }

  return parsed.data;
}

export async function savePrd(prd: Prd, cwd: string = process.cwd()): Promise<void> {
  const prdPath = path.join(cwd, "prd.json");
  await fs.writeJSON(prdPath, prd, { spaces: 2 });
}

export async function prdExists(cwd: string = process.cwd()): Promise<boolean> {
  const prdPath = path.join(cwd, "prd.json");
  return fs.pathExists(prdPath);
}

export function getPendingStories(prd: Prd): UserStory[] {
  return prd.userStories
    .filter((story) => !story.passes)
    .sort((a, b) => a.priority - b.priority);
}

export function getCompletedStories(prd: Prd): UserStory[] {
  return prd.userStories.filter((story) => story.passes);
}

export function getNextStory(prd: Prd): UserStory | undefined {
  const pending = getPendingStories(prd);
  return pending[0];
}

export function isAllComplete(prd: Prd): boolean {
  return prd.userStories.every((story) => story.passes);
}

export function getStoriesByRepo(prd: Prd): Record<string, UserStory[]> {
  const byRepo: Record<string, UserStory[]> = {};

  for (const story of prd.userStories) {
    if (!byRepo[story.repo]) {
      byRepo[story.repo] = [];
    }
    byRepo[story.repo].push(story);
  }

  return byRepo;
}

export function getCompletionStats(prd: Prd): {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
} {
  const total = prd.userStories.length;
  const completed = prd.userStories.filter((s) => s.passes).length;
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, pending, percentage };
}
