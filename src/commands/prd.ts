import path from 'node:path';
import chalk from 'chalk';
import fs from 'fs-extra';
import { ConfigNotFoundError, loadConfig } from '../core/config.js';
import { getStoriesByRepo, savePrd } from '../core/prd.js';
import type { Prd, PrdOptions, UserStory } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function prdCommand(options: PrdOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const inputPath = options.input ?? path.join(cwd, 'plan.md');
  const outputDir = options.output ? path.dirname(options.output) : cwd;

  // Check plan.md exists
  if (!(await fs.pathExists(inputPath))) {
    logger.error(`Plan file not found: ${inputPath}`);
    logger.info("Run 'ralph plan <feature>' to generate a plan first.");
    process.exit(1);
  }

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

  logger.header('Ralph - PRD Generator');

  // Read and parse plan.md
  const planContent = await fs.readFile(inputPath, 'utf-8');

  logger.info('Parsing plan.md...');

  const prd = parsePlanToPrd(planContent, config);

  // Save PRD
  await savePrd(prd, outputDir);

  // Display summary
  logger.log('');
  logger.success('PRD Generated Successfully!');
  logger.log('');
  logger.keyValue('Project', prd.project);
  logger.keyValue('Stories', prd.userStories.length.toString());

  const byRepo = getStoriesByRepo(prd);
  for (const [repo, stories] of Object.entries(byRepo)) {
    logger.log(`  - ${repo}: ${stories.length} stories`);
  }

  logger.log('');
  logger.log('Repositories:');
  for (const [repo, info] of Object.entries(prd.repositories)) {
    logger.log(`  - ${repo}: ${chalk.cyan(info.branchName)}`);
  }

  logger.log('');
  logger.log('Next steps:');
  logger.log('  1. Review prd.json if needed');
  logger.log('  2. Run: ralph run');
}

function parsePlanToPrd(content: string, config: Awaited<ReturnType<typeof loadConfig>>): Prd {
  // Extract project name from H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  const projectName = h1Match ? h1Match[1].trim() : config.project;

  // Extract description (first paragraph after H1)
  const descMatch = content.match(/^#\s+.+\n\n(.+?)(?:\n\n|---)/s);
  const description = descMatch ? descMatch[1].trim() : '';

  // Generate branch name from project
  const branchSlug = projectName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
  const branchName = `feature/${branchSlug}`;

  // Parse user stories
  const stories: UserStory[] = [];
  const storyRegex = /####\s+(US-\d+):\s*(.+?)(?:\n|$)/g;
  let match;
  let priority = 1;

  while ((match = storyRegex.exec(content)) !== null) {
    const id = match[1];
    const title = match[2].trim();

    // Find story details
    const storyStart = match.index;
    const nextStoryMatch = content.slice(storyStart + match[0].length).match(/####\s+US-\d+/);
    const storyEnd = nextStoryMatch
      ? storyStart + match[0].length + nextStoryMatch.index!
      : content.length;
    const storyContent = content.slice(storyStart, storyEnd);

    // Extract repository
    const repoMatch = storyContent.match(/\*\*Repository:\*\*\s*`?(\w+)`?/);
    const repo = repoMatch ? repoMatch[1] : 'main';

    // Extract description
    const descMatch = storyContent.match(/\*\*Description:\*\*\s*(.+?)(?:\n\n|\*\*)/s);
    const storyDesc = descMatch ? descMatch[1].trim() : title;

    // Extract acceptance criteria
    const criteriaMatch = storyContent.match(
      /\*\*Acceptance Criteria:\*\*\s*([\s\S]*?)(?:\n\n---|\n\n####|$)/,
    );
    const criteria: string[] = [];

    if (criteriaMatch) {
      const criteriaLines = criteriaMatch[1].split('\n');
      for (const line of criteriaLines) {
        const item = line
          .replace(/^-\s*\[.\]\s*/, '')
          .replace(/^-\s*/, '')
          .trim();
        if (item) {
          criteria.push(item);
        }
      }
    }

    // Check if it's a fork story
    const isFork =
      storyContent.toLowerCase().includes('experimental') ||
      storyContent.toLowerCase().includes('fork');

    stories.push({
      id,
      title,
      repo,
      description: storyDesc,
      acceptanceCriteria: criteria.length > 0 ? criteria : ['Implementation complete'],
      priority: priority++,
      passes: false,
      fork: isFork,
      notes: '',
    });
  }

  // Build repositories map
  const repositories: Prd['repositories'] = {};
  const repoKeys = new Set(stories.map((s) => s.repo));

  for (const repoKey of repoKeys) {
    repositories[repoKey] = { branchName };
  }

  // Ensure all config repos are included
  for (const repoKey of Object.keys(config.repositories)) {
    if (!repositories[repoKey]) {
      repositories[repoKey] = { branchName };
    }
  }

  return {
    project: projectName,
    description,
    repositories,
    userStories: stories,
  };
}
