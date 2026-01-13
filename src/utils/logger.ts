import chalk from "chalk";

export const logger = {
  info(message: string): void {
    console.log(chalk.blue("[INFO]"), message);
  },

  success(message: string): void {
    console.log(chalk.green("[SUCCESS]"), message);
  },

  warning(message: string): void {
    console.log(chalk.yellow("[WARNING]"), message);
  },

  error(message: string): void {
    console.log(chalk.red("[ERROR]"), message);
  },

  log(message: string): void {
    console.log(message);
  },

  header(title: string): void {
    console.log("");
    console.log(chalk.bold("========================================"));
    console.log(chalk.bold(`  ${title}`));
    console.log(chalk.bold("========================================"));
    console.log("");
  },

  divider(): void {
    console.log(chalk.gray("----------------------------------------"));
  },

  list(items: string[], indent = 2): void {
    const prefix = " ".repeat(indent) + "- ";
    for (const item of items) {
      console.log(prefix + item);
    }
  },

  keyValue(key: string, value: string): void {
    console.log(`  ${chalk.cyan(key)}: ${value}`);
  },
};
