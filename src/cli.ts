import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { planCommand } from "./commands/plan.js";
import { prdCommand } from "./commands/prd.js";
import { runCommand } from "./commands/run.js";
import { statusCommand } from "./commands/status.js";

const program = new Command();

program
  .name("ralph")
  .description("Autonomous AI agent loop for Claude Code")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize Ralph configuration in the current directory")
  .option("-f, --force", "Overwrite existing configuration")
  .action(async (options) => {
    await initCommand(options);
  });

program
  .command("plan <feature>")
  .description("Generate a structured implementation plan")
  .option("-o, --output <path>", "Output path for plan.md")
  .action(async (feature, options) => {
    await planCommand(feature, options);
  });

program
  .command("prd")
  .description("Convert plan.md into prd.json")
  .option("-i, --input <path>", "Input path for plan.md")
  .option("-o, --output <path>", "Output path for prd.json")
  .action(async (options) => {
    await prdCommand(options);
  });

program
  .command("run")
  .description("Run the autonomous agent loop")
  .option("-m, --max-iterations <number>", "Maximum number of iterations", parseInt)
  .action(async (options) => {
    await runCommand({
      maxIterations: options.maxIterations,
    });
  });

program
  .command("status")
  .description("Show current progress and status")
  .option("-v, --verbose", "Show detailed information")
  .action(async (options) => {
    await statusCommand(options);
  });

program.parse();
