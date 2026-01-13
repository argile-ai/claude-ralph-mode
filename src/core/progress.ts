import fs from "fs-extra";
import path from "path";

const PROGRESS_FILE = "progress.txt";

export async function initProgressFile(
  projectName: string,
  cwd: string = process.cwd()
): Promise<void> {
  const progressPath = path.join(cwd, PROGRESS_FILE);

  if (await fs.pathExists(progressPath)) {
    return;
  }

  const content = `# Ralph Progress Log

Project: ${projectName}
Started: ${new Date().toISOString()}

## Codebase Patterns

(Add discovered patterns here as you work)

---

`;

  await fs.writeFile(progressPath, content);
}

export async function progressExists(cwd: string = process.cwd()): Promise<boolean> {
  const progressPath = path.join(cwd, PROGRESS_FILE);
  return fs.pathExists(progressPath);
}

export async function appendProgress(
  entry: string,
  cwd: string = process.cwd()
): Promise<void> {
  const progressPath = path.join(cwd, PROGRESS_FILE);
  await fs.appendFile(progressPath, entry + "\n");
}

export async function readProgress(cwd: string = process.cwd()): Promise<string> {
  const progressPath = path.join(cwd, PROGRESS_FILE);

  if (!(await fs.pathExists(progressPath))) {
    return "";
  }

  return fs.readFile(progressPath, "utf-8");
}

export async function getRecentProgress(
  lines: number = 50,
  cwd: string = process.cwd()
): Promise<string> {
  const content = await readProgress(cwd);
  const allLines = content.split("\n");
  return allLines.slice(-lines).join("\n");
}
