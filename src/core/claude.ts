import { execa } from 'execa';
import { isCommandAvailable } from '../utils/shell.js';

export class ClaudeNotFoundError extends Error {
  constructor() {
    super('Claude Code CLI not found. Install it from: https://claude.ai/code');
    this.name = 'ClaudeNotFoundError';
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
  return isCommandAvailable('claude');
}

export function checkClaudeInstalled(): void {
  if (!isClaudeInstalled()) {
    throw new ClaudeNotFoundError();
  }
}

export async function invokeClaude(prompt: string, options: ClaudeOptions = {}): Promise<string> {
  checkClaudeInstalled();

  const args: string[] = [];

  if (options.print) {
    args.push('--print');
  }

  if (options.skipPermissions) {
    args.push('--dangerously-skip-permissions');
  }

  // Prefix prompt with "ultrathink" keyword to enable extended thinking mode
  const finalPrompt = options.ultrathink ? `ultrathink ${prompt}` : prompt;
  args.push(finalPrompt);

  const result = await execa('claude', args, {
    cwd: options.cwd,
    timeout: options.timeout ? options.timeout * 1000 : undefined,
    stdout: 'pipe',
    stderr: 'inherit',
    reject: false,
  });

  return result.stdout;
}

export async function invokeClaudeStreaming(
  prompt: string,
  options: ClaudeOptions = {},
): Promise<string> {
  checkClaudeInstalled();

  const args: string[] = [];

  // --print only prints output without executing tools
  // For autonomous mode, we need to pass prompt via stdin without --print
  if (options.print) {
    args.push('--print');
  }

  if (options.skipPermissions) {
    args.push('--dangerously-skip-permissions');
  }

  // Prefix prompt with "ultrathink" keyword to enable extended thinking mode
  const finalPrompt = options.ultrathink ? `ultrathink ${prompt}` : prompt;

  // If not in print mode, pass prompt via stdin to allow tool execution
  // If in print mode, pass as argument (text-only response)
  if (options.print) {
    args.push(finalPrompt);
  }

  // Stream output to stderr while capturing stdout
  const subprocess = execa('claude', args, {
    cwd: options.cwd,
    timeout: options.timeout ? options.timeout * 1000 : undefined,
    reject: false,
    input: options.print ? undefined : finalPrompt,
  });

  // Pipe stderr to process stderr for real-time output
  subprocess.stderr?.pipe(process.stderr);

  const result = await subprocess;
  return result.stdout;
}
