import fs from "fs-extra";
import path from "path";
import { logger } from "../utils/logger.js";
import { configExists, getDefaultConfig } from "../core/config.js";
import type { InitOptions } from "../types/index.js";

export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "ralph.config.json");

  // Check if config already exists
  if (await configExists(cwd)) {
    if (!options.force) {
      logger.warning("Configuration already exists. Use --force to overwrite.");
      return;
    }
    logger.info("Overwriting existing configuration...");
  }

  // Detect project name from package.json or directory name
  let projectName = path.basename(cwd);

  const packageJsonPath = path.join(cwd, "package.json");
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJSON(packageJsonPath);
      if (pkg.name) {
        projectName = pkg.name;
      }
    } catch {
      // Ignore errors reading package.json
    }
  }

  // Generate default config
  const config = getDefaultConfig(projectName);

  // Write config file
  await fs.writeJSON(configPath, config, { spaces: 2 });

  logger.success(`Created ralph.config.json`);
  logger.log("");
  logger.log("Next steps:");
  logger.log("  1. Edit ralph.config.json to configure your repositories");
  logger.log("  2. Run: ralph plan <feature>");
  logger.log("  3. Run: ralph prd");
  logger.log("  4. Run: ralph run");

  // Update .gitignore if it exists
  const gitignorePath = path.join(cwd, ".gitignore");
  if (await fs.pathExists(gitignorePath)) {
    const gitignore = await fs.readFile(gitignorePath, "utf-8");
    const entries = ["plan.md", "prd.json", "progress.txt", "archive/", ".last-project"];
    const toAdd = entries.filter((e) => !gitignore.includes(e));

    if (toAdd.length > 0) {
      const addition = `\n# Ralph\n${toAdd.join("\n")}\n`;
      await fs.appendFile(gitignorePath, addition);
      logger.info(`Added ${toAdd.length} entries to .gitignore`);
    }
  }
}
