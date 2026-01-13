import { execa } from "execa";
import { isCommandAvailable } from "../utils/shell.js";

export class ClaudeNotFoundError extends Error {
  constructor() {
    super(
      "Claude Code CLI not found. Install it from: https://claude.ai/code"
    );
    this.name = "ClaudeNotFoundError";
  }
}

export interface ClaudeOptions {
  print?: boolean;
  skipPermissions?: boolean;
  ultrathink?: boolean;
  cwd?: string;
  timeout?: number;
}

export function isClaudeInstalled(): boolean {
  return isCommandAvailable("claude");
}

export function checkClaudeInstalled(): void {
  if (!isClaudeInstalled()) {
    throw new ClaudeNotFoundError();
  }
}

export async function invokeClaude(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  checkClaudeInstalled();

  const args: string[] = [];

  if (options.print) {
    args.push("--print");
  }

  if (options.skipPermissions) {
    args.push("--dangerously-skip-permissions");
  }

  if (options.ultrathink) {
    args.push("--ultrathink");
  }

  args.push(prompt);

  const result = await execa("claude", args, {
    cwd: options.cwd,
    timeout: options.timeout ? options.timeout * 1000 : undefined,
    stdout: "pipe",
    stderr: "inherit",
    reject: false,
  });

  return result.stdout;
}

export async function invokeClaudeStreaming(
  prompt: string,
  options: ClaudeOptions = {}
): Promise<string> {
  checkClaudeInstalled();

  const args: string[] = [];

  if (options.print) {
    args.push("--print");
  }

  if (options.skipPermissions) {
    args.push("--dangerously-skip-permissions");
  }

  if (options.ultrathink) {
    args.push("--ultrathink");
  }

  args.push(prompt);

  // Stream output to stderr while capturing stdout
  const subprocess = execa("claude", args, {
    cwd: options.cwd,
    timeout: options.timeout ? options.timeout * 1000 : undefined,
    reject: false,
  });

  // Pipe stderr to process stderr for real-time output
  subprocess.stderr?.pipe(process.stderr);

  const result = await subprocess;
  return result.stdout;
}
