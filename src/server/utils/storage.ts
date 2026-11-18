import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Base directory for all temporary tool execution files
const BASE_STORAGE_DIR = path.join(process.cwd(), 'storage');
const JOBS_DIR = path.join(BASE_STORAGE_DIR, 'jobs');
const FILE_TTL_MS = 30 * 60 * 1000; // 30 minutes TTL

/**
 * Ensure storage directories exist
 */
export function initStorage(): void {
  if (!fs.existsSync(BASE_STORAGE_DIR)) {
    fs.mkdirSync(BASE_STORAGE_DIR, { recursive: true });
  }
  if (!fs.existsSync(JOBS_DIR)) {
    fs.mkdirSync(JOBS_DIR, { recursive: true });
  }
}

/**
 * Sanitize filename to prevent directory traversal or invalid characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and special control characters
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
  const jobDir = path.join(JOBS_DIR, jobId);
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
  // Validate that jobId contains only valid uuid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    return null;
  }

  const jobDir = path.join(JOBS_DIR, jobId);
  if (!fs.existsSync(jobDir)) {
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
  initStorage();
  let cleanedCount = 0;
  const now = Date.now();

  try {
    const jobFolders = fs.readdirSync(JOBS_DIR);
    for (const folder of jobFolders) {
      const folderPath = path.join(JOBS_DIR, folder);
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

// Background cleaner: runs every 5 minutes
let cleanupIntervalStarted = false;
export function startAutoCleanup(): void {
  if (cleanupIntervalStarted) return;
  cleanupIntervalStarted = true;

  // Run on startup
  cleanupExpiredJobs();

  // Run periodically
  setInterval(() => {
    cleanupExpiredJobs();
  }, 5 * 60 * 1000);
}
