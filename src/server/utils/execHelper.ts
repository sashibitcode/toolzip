import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Checks if a binary command exists in PATH or common directories
 */
export async function hasBinary(binaryName: string): Promise<boolean> {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'where.exe' : 'which';
  
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, [binaryName]);
      child.on('error', () => resolve(false));
      child.on('close', (code) => resolve(code === 0));
    } catch {
      resolve(false);
    }
  });
}

/**
 * Executes a command with timeout and process kill safety
 */
export async function execSafe(
  command: string,
  args: string[],
  options: {
    timeoutMs?: number;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  } = {}
): Promise<ExecResult> {
  const timeoutMs = options.timeoutMs ?? 60000; // 60 seconds default

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let isSettled = false;

    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: false, // Prevent shell injection
    });

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          child.kill('SIGKILL');
        } catch {
          // ignore
        }
        reject(new Error(`Command '${command}' timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(err);
      }
    });

    child.on('close', (code) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        if (code === 0) {
          resolve({ stdout, stderr, exitCode: code ?? 0 });
        } else {
          reject(
            new Error(
              `Command '${command}' failed with exit code ${code}. Stderr: ${stderr || stdout}`
            )
          );
        }
      }
    });
  });
}
