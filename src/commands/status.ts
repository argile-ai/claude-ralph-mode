import path from 'node:path';
import chalk from 'chalk';
import { ConfigNotFoundError, loadConfig } from '../core/config.js';
import { getCurrentBranch } from '../core/git.js';
import {
  getCompletionStats,
  getPendingStories,
  getStoriesByRepo,
  loadPrd,
  prdExists,
} from '../core/prd.js';
import { getRecentProgress, progressExists } from '../core/progress.js';
import type { StatusOptions } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function statusCommand(options: StatusOptions = {}): Promise<void> {
  const cwd = process.cwd();

  logger.header('Ralph - Status');

  // Load config
  let config;
  try {
    config = await loadConfig(cwd);
    logger.keyValue('Project', config.project);
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      logger.warning("No configuration found. Run 'ralph init' first.");
      return;
    }
    throw error;
  }

  // Check PRD
  if (!(await prdExists(cwd))) {
    logger.warning("No PRD found. Run 'ralph plan <feature>' and 'ralph prd' first.");
    return;
  }

  const prd = await loadPrd(cwd);

  // Show completion stats
  const stats = getCompletionStats(prd);
  logger.log('');
  logger.log(chalk.bold('Progress:'));

  const progressBar = createProgressBar(stats.percentage);
  logger.log(`  ${progressBar} ${stats.percentage}%`);
  logger.log(
    `  ${chalk.green(stats.completed.toString())} completed / ${chalk.yellow(stats.pending.toString())} pending / ${stats.total} total`,
  );

  // Show repositories
  logger.log('');
  logger.log(chalk.bold('Repositories:'));

  for (const [repoKey, repoConfig] of Object.entries(config.repositories)) {
    const repoPath = path.resolve(cwd, repoConfig.path);
    const branch = await getCurrentBranch(repoPath);
    const branchInfo = branch ? chalk.cyan(branch) : chalk.gray('(not a git repo)');
    const prdBranch = prd.repositories[repoKey]?.branchName;

    let branchDisplay = branchInfo;
    if (prdBranch && branch && branch !== prdBranch) {
      branchDisplay = `${branchInfo} ${chalk.yellow(`(expected: ${prdBranch})`)}`;
    }

    logger.log(`  ${chalk.bold(repoKey)}: ${repoConfig.path} [${branchDisplay}]`);
  }

  // Show pending stories
  const pending = getPendingStories(prd);
  if (pending.length > 0) {
    logger.log('');
    logger.log(chalk.bold('Pending Stories:'));

    for (const story of pending) {
      const forkTag = story.fork ? chalk.magenta(' [FORK]') : '';
      logger.log(`  ${chalk.yellow(story.id)} [${story.repo}]${forkTag}: ${story.title}`);
    }
  } else {
    logger.log('');
    logger.success('All stories completed!');
  }

  // Show stories by repo
  if (options.verbose) {
    const byRepo = getStoriesByRepo(prd);
    logger.log('');
    logger.log(chalk.bold('Stories by Repository:'));

    for (const [repo, stories] of Object.entries(byRepo)) {
      const completed = stories.filter((s) => s.passes).length;
      logger.log(`  ${chalk.bold(repo)}: ${completed}/${stories.length} completed`);

      for (const story of stories) {
        const status = story.passes ? chalk.green('✓') : chalk.yellow('○');
        logger.log(`    ${status} ${story.id}: ${story.title}`);
      }
    }
  }

  // Show recent progress
  if (options.verbose && (await progressExists(cwd))) {
    const recent = await getRecentProgress(10, cwd);
    if (recent.trim()) {
      logger.log('');
      logger.log(chalk.bold('Recent Progress:'));
      logger.log(chalk.gray(recent));
    }
  }
}

function createProgressBar(percentage: number, width = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `[${bar}]`;
}
