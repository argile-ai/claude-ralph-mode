import chalk from "chalk";
import path from "path";
import fs from "fs-extra";
import { logger } from "../utils/logger.js";
import { loadConfig, ConfigNotFoundError } from "../core/config.js";
import { loadPrd, prdExists, isAllComplete, getPendingStories } from "../core/prd.js";
import { initProgressFile } from "../core/progress.js";
import { checkClaudeInstalled, invokeClaudeStreaming } from "../core/claude.js";
import { getCurrentBranch } from "../core/git.js";
import { PROMPT_TEMPLATE } from "../templates/embedded/index.js";
import type { RunOptions } from "../types/index.js";

const COMPLETE_SIGNAL = "<promise>COMPLETE</promise>";
const ARCHIVE_DIR = "archive";
const LAST_PROJECT_FILE = ".last-project";

export async function runCommand(options: RunOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Check prerequisites
  checkClaudeInstalled();

  // Load config
  let config;
  try {
    config = await loadConfig(cwd);
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      logger.error("No configuration found. Run 'ralph init' first.");
      process.exit(1);
    }
    throw error;
  }

  // Check PRD exists
  if (!(await prdExists(cwd))) {
    logger.error("PRD file not found.");
    logger.info("Run 'ralph plan <feature>' and 'ralph prd' to generate one.");
    process.exit(1);
  }

  const prd = await loadPrd(cwd);
  const maxIterations = options.maxIterations ?? config.agent?.maxIterations ?? 50;

  // Handle project change archiving
  await handleProjectArchive(cwd, prd.project);

  // Initialize progress file
  await initProgressFile(prd.project, cwd);

  // Show status
  showStatus(config, prd, maxIterations, cwd);

  // Check if already complete
  if (isAllComplete(prd)) {
    logger.success("All stories already completed!");
    return;
  }

  // Run main loop
  await runLoop(maxIterations, cwd);
}

async function handleProjectArchive(cwd: string, currentProject: string): Promise<void> {
  const lastProjectPath = path.join(cwd, LAST_PROJECT_FILE);
  const prdPath = path.join(cwd, "prd.json");
  const progressPath = path.join(cwd, "progress.txt");

  if (await fs.pathExists(lastProjectPath)) {
    const lastProject = (await fs.readFile(lastProjectPath, "utf-8")).trim();

    if (lastProject && lastProject !== currentProject) {
      // Archive previous project
      const date = new Date().toISOString().split("T")[0];
      const folderName = lastProject.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const archivePath = path.join(cwd, ARCHIVE_DIR, `${date}-${folderName}`);

      logger.info(`Archiving previous run: ${lastProject}`);
      await fs.ensureDir(archivePath);

      if (await fs.pathExists(prdPath)) {
        await fs.copy(prdPath, path.join(archivePath, "prd.json"));
      }
      if (await fs.pathExists(progressPath)) {
        await fs.copy(progressPath, path.join(archivePath, "progress.txt"));
        // Reset progress file
        await fs.remove(progressPath);
      }

      logger.success(`Archived to: ${archivePath}`);
    }
  }

  // Track current project
  await fs.writeFile(lastProjectPath, currentProject);
}

async function showStatus(
  config: Awaited<ReturnType<typeof loadConfig>>,
  prd: Awaited<ReturnType<typeof loadPrd>>,
  maxIterations: number,
  cwd: string
): Promise<void> {
  logger.header("Ralph - Autonomous Agent Loop");

  logger.keyValue("Project", prd.project);
  logger.keyValue("Max iterations", maxIterations.toString());
  logger.log("");

  // Show repositories
  logger.log("Repositories:");
  for (const [repoKey, repoConfig] of Object.entries(config.repositories)) {
    const repoPath = path.resolve(cwd, repoConfig.path);
    const branch = await getCurrentBranch(repoPath);
    const branchInfo = branch ?? "(not a git repo)";
    logger.log(`  - ${repoKey}: ${repoConfig.path} (${branchInfo})`);
  }
  logger.log("");

  // Show pending stories
  const pending = getPendingStories(prd);
  if (pending.length > 0) {
    logger.log("Pending stories:");
    for (const story of pending) {
      const forkTag = story.fork ? " (FORK)" : "";
      logger.log(`  - ${story.id} [${story.repo}]${forkTag}: ${story.title}`);
    }
    logger.log("");
  }
}

async function runLoop(maxIterations: number, cwd: string): Promise<void> {
  for (let i = 1; i <= maxIterations; i++) {
    logger.log("");
    logger.log(chalk.bold("========================================"));
    logger.log(chalk.bold(`  Iteration ${i} of ${maxIterations}`));
    logger.log(chalk.bold("========================================"));

    // Run Claude Code with the prompt
    logger.info("Starting Claude Code iteration...");

    const output = await invokeClaudeStreaming(PROMPT_TEMPLATE, {
      print: false,  // Must be false to allow Claude to execute tools
      skipPermissions: true,
      cwd,
    });

    // Check for completion signal
    if (output.includes(COMPLETE_SIGNAL)) {
      logger.log("");
      logger.log(chalk.bold("========================================"));
      logger.success("Ralph completed all tasks!");
      logger.log(`  Completed at iteration ${i} of ${maxIterations}`);
      logger.log(chalk.bold("========================================"));
      logger.log("");

      await showFinalBranchStatus(cwd);
      return;
    }

    logger.info(`Iteration ${i} complete. Continuing...`);
    await sleep(2000);
  }

  // Max iterations reached
  logger.log("");
  logger.warning(`Ralph reached max iterations (${maxIterations}) without completing all tasks.`);
  logger.info("Check progress.txt for status.");

  // Show remaining stories
  const prd = await loadPrd(cwd);
  const pending = getPendingStories(prd);
  if (pending.length > 0) {
    logger.log("");
    logger.log("Remaining stories:");
    for (const story of pending) {
      const forkTag = story.fork ? " (FORK)" : "";
      logger.log(`  - ${story.id} [${story.repo}]${forkTag}: ${story.title}`);
    }
  }

  process.exit(1);
}

async function showFinalBranchStatus(cwd: string): Promise<void> {
  try {
    const config = await loadConfig(cwd);
    logger.log("Final branch status:");

    for (const [repoKey, repoConfig] of Object.entries(config.repositories)) {
      const repoPath = path.resolve(cwd, repoConfig.path);
      const branch = await getCurrentBranch(repoPath);
      if (branch) {
        logger.log(`  - ${repoKey}: ${branch}`);
      }
    }
  } catch {
    // Ignore errors
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
