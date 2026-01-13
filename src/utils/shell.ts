import { execa, execaSync, type Options as ExecaOptions } from "execa";

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
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
    exitCode: result.exitCode ?? 1,
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
    stdout: String(result.stdout ?? ""),
    stderr: String(result.stderr ?? ""),
    exitCode: result.exitCode ?? 1,
  };
}

export function isCommandAvailable(command: string): boolean {
  try {
    const result = execaSync("which", [command], { reject: false });
    return result.exitCode === 0;
  } catch {
    return false;
  }
}
