import { cosmiconfig } from "cosmiconfig";
import { RalphConfigSchema, type RalphConfig } from "../types/index.js";

const MODULE_NAME = "ralph";

const explorer = cosmiconfig(MODULE_NAME, {
  searchPlaces: [
    "ralph.config.json",
    ".ralphrc",
    ".ralphrc.json",
    ".ralphrc.yaml",
    ".ralphrc.yml",
    "package.json",
  ],
});

export class ConfigNotFoundError extends Error {
  constructor(searchPath: string) {
    super(
      `No Ralph configuration found. Run 'ralph init' to create one, or create ralph.config.json manually.\nSearched from: ${searchPath}`
    );
    this.name = "ConfigNotFoundError";
  }
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = "ConfigValidationError";
  }
}

export async function loadConfig(cwd: string = process.cwd()): Promise<RalphConfig> {
  const result = await explorer.search(cwd);

  if (!result || !result.config) {
    throw new ConfigNotFoundError(cwd);
  }

  const parsed = RalphConfigSchema.safeParse(result.config);

  if (!parsed.success) {
    throw new ConfigValidationError(parsed.error.message);
  }

  return parsed.data;
}

export async function configExists(cwd: string = process.cwd()): Promise<boolean> {
  const result = await explorer.search(cwd);
  return result !== null && result.config !== undefined;
}

export function getDefaultConfig(projectName: string): RalphConfig {
  return {
    version: "1.0",
    project: projectName,
    description: "Project description",
    repositories: {
      main: {
        path: ".",
        defaultBranch: "main",
        checks: ["npm run build", "npm run lint", "npm test"],
      },
    },
    agent: {
      maxIterations: 50,
      timeout: 600,
    },
  };
}
