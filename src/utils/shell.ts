import { execa, type Options as ExecaOptions } from "execa";

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function run(
  command: string,
  args: string[] = [],
  options: ExecaOptions = {}
): Promise<ShellResult> {
  const result = await execa(command, args, {
    reject: false,
    ...options,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

export async function runCommand(
  command: string,
  options: ExecaOptions = {}
): Promise<ShellResult> {
  const result = await execa(command, {
    shell: true,
    reject: false,
    ...options,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  };
}

export function isCommandAvailable(command: string): boolean {
  try {
    const result = execa.sync("which", [command], { reject: false });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}
