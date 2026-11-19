import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const FILE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL

/**
 * Get writable base storage directory:
 * - On Vercel / AWS Lambda / Serverless, process.cwd() is read-only; os.tmpdir() is used.
 * - On local environments / Docker, standard storage directory is used.
 */
export function getBaseStorageDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'toolzip_storage');
  }

  try {
    const localDir = path.join(process.cwd(), 'storage');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    return path.join(os.tmpdir(), 'toolzip_storage');
  }
}

export function getJobsDir(): string {
  return path.join(getBaseStorageDir(), 'jobs');
}

/**
 * Ensure storage directories exist
 */
export function initStorage(): void {
  const baseDir = getBaseStorageDir();
  const jobsDir = getJobsDir();
  try {
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    if (!fs.existsSync(jobsDir)) {
      fs.mkdirSync(jobsDir, { recursive: true });
    }
  } catch (err) {
    console.warn('Storage directory initialization warning:', err);
  }
}

/**
 * Sanitize filename to prevent directory traversal or invalid characters
 */
export function sanitizeFilename(filename: string): string {
  const basename = path.basename(filename);
  const cleaned = basename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\.{2,}/g, '.') // remove double dots
    .trim();

  return cleaned || `file_${Date.now()}`;
}

export interface JobPaths {
  jobId: string;
  jobDir: string;
  inputDir: string;
  outputDir: string;
}

/**
 * Create an isolated directory structure for a specific conversion job
 */
export function createJobWorkspace(): JobPaths {
  initStorage();
  const jobId = uuidv4();
  const jobDir = path.join(getJobsDir(), jobId);
  const inputDir = path.join(jobDir, 'inputs');
  const outputDir = path.join(jobDir, 'output');

  fs.mkdirSync(inputDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  return { jobId, jobDir, inputDir, outputDir };
}

/**
 * Get paths for an existing job ID
 */
export function getJobPaths(jobId: string): JobPaths | null {
  if (!/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    return null;
  }

  const jobDir = path.join(getJobsDir(), jobId);
  if (!fs.existsSync(jobDir)) {
    // If not in primary storage, check fallback /tmp directory
    const tmpJobDir = path.join(os.tmpdir(), 'toolzip_storage', 'jobs', jobId);
    if (fs.existsSync(tmpJobDir)) {
      return {
        jobId,
        jobDir: tmpJobDir,
        inputDir: path.join(tmpJobDir, 'inputs'),
        outputDir: path.join(tmpJobDir, 'output'),
      };
    }
    return null;
  }

  return {
    jobId,
    jobDir,
    inputDir: path.join(jobDir, 'inputs'),
    outputDir: path.join(jobDir, 'output'),
  };
}

/**
 * Find output file in job directory
 */
export function getJobOutputFile(jobId: string): { filepath: string; filename: string } | null {
  const paths = getJobPaths(jobId);
  if (!paths || !fs.existsSync(paths.outputDir)) return null;

  const files = fs.readdirSync(paths.outputDir);
  if (files.length === 0) return null;

  const filename = files[0];
  const filepath = path.join(paths.outputDir, filename);

  return { filepath, filename };
}

/**
 * Remove entire job folder
 */
export function deleteJob(jobId: string): void {
  const paths = getJobPaths(jobId);
  if (paths && fs.existsSync(paths.jobDir)) {
    try {
      fs.rmSync(paths.jobDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}

/**
 * Clean up files older than 30 minutes
 */
export function cleanupExpiredJobs(): { cleanedCount: number } {
  let cleanedCount = 0;
  const jobsDir = getJobsDir();
  try {
    if (!fs.existsSync(jobsDir)) return { cleanedCount };
    const now = Date.now();
    const jobFolders = fs.readdirSync(jobsDir);
    for (const folder of jobFolders) {
      const folderPath = path.join(jobsDir, folder);
      try {
        const stats = fs.statSync(folderPath);
        if (now - stats.mtimeMs > FILE_TTL_MS) {
          fs.rmSync(folderPath, { recursive: true, force: true });
          cleanedCount++;
        }
      } catch {
        // Individual folder cleanup failure, proceed
      }
    }
  } catch {
    // Top level dir error
  }

  return { cleanedCount };
}

// Background cleaner: runs every 5 minutes on long-lived servers (disabled on serverless)
let cleanupIntervalStarted = false;
export function startAutoCleanup(): void {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  if (cleanupIntervalStarted) return;
  cleanupIntervalStarted = true;

  // Run on startup
  cleanupExpiredJobs();

  // Run periodically
  setInterval(() => {
    cleanupExpiredJobs();
  }, 5 * 60 * 1000);
}
