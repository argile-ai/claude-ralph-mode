import fs from "fs-extra";
import path from "path";
import { logger } from "../utils/logger.js";
import { loadConfig, ConfigNotFoundError } from "../core/config.js";
import { checkClaudeInstalled } from "../core/claude.js";
import { RALPH_SKILL } from "../templates/embedded/index.js";
import type { PlanOptions } from "../types/index.js";

export async function planCommand(
  feature: string,
  options: PlanOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const outputPath = options.output ?? path.join(cwd, "plan.md");

  // Check prerequisites
  checkClaudeInstalled();

  // Load config
  let config;
  try {
    config = await loadConfig(cwd);
  } catch (error) {
    if (error instanceof ConfigNotFoundError) {
      logger.warning("No configuration found. Run 'ralph init' first, or create ralph.config.json manually.");
      logger.info("Continuing without configuration...");
      config = null;
    } else {
      throw error;
    }
  }

  logger.header("Ralph - Plan Generator");
  logger.keyValue("Feature", feature);
  if (config) {
    logger.keyValue("Project", config.project);
  }
  logger.log("");

  // Build prompt
  let prompt = RALPH_SKILL;

  if (config) {
    prompt += `\n\n## Current Configuration\n\n\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``;
  }

  prompt += `\n\n## Feature Request\n\n${feature}`;

  logger.info("Starting interactive plan generation...");
  logger.info("Claude will ask clarifying questions. Please respond in the terminal.");
  logger.log("");

  // Invoke Claude interactively (without --print to allow interaction)
  // Note: This runs claude in interactive mode for Q&A with ultrathink enabled for better planning
  const { execa } = await import("execa");

  // Prefix prompt with "ultrathink" keyword to enable extended thinking mode
  // Use --dangerously-skip-permissions to bypass permission prompts
  const subprocess = execa("claude", ["--dangerously-skip-permissions", `ultrathink ${prompt}`], {
    cwd,
    stdio: "inherit",
    reject: false,
  });

  await subprocess;

  // Check if plan.md was created
  if (await fs.pathExists(outputPath)) {
    logger.log("");
    logger.success(`Plan generated: ${outputPath}`);
    logger.log("");
    logger.log("Next steps:");
    logger.log("  1. Review and edit plan.md if needed");
    logger.log("  2. Run: ralph prd");
    logger.log("  3. Run: ralph run");
  } else {
    logger.warning("Plan file was not created. You may need to re-run the command.");
  }
}
