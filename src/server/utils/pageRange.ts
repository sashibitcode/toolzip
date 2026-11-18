/**
 * Utility for parsing and validating page numbers and page ranges
 * Handles formats like:
 * - "1-3, 5, 8-10"
 * - "2"
 * - "all"
 * - "reverse"
 * Inputs are 1-based (user facing), outputs are 0-based page indices.
 */

export function parsePageRanges(rangeStr: string | undefined, totalPages: number): number[] {
  if (totalPages <= 0) return [];
  if (!rangeStr || rangeStr.trim() === '' || rangeStr.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  if (rangeStr.toLowerCase() === 'reverse') {
    return Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i);
  }

  const resultIndices: number[] = [];
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          const idx = i - 1;
          if (!resultIndices.includes(idx)) {
            resultIndices.push(idx);
          }
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        const idx = pageNum - 1;
        if (!resultIndices.includes(idx)) {
          resultIndices.push(idx);
        }
      }
    }
  }

  return resultIndices;
}

/**
 * Parses an explicit page sequence (e.g. "3, 1, 2, 4") where order matters and duplicates can be allowed or deduplicated
 */
export function parsePageSequence(sequenceStr: string, totalPages: number): number[] {
  if (sequenceStr.toLowerCase() === 'reverse') {
    return Array.from({ length: totalPages }, (_, i) => totalPages - 1 - i);
  }

  const parts = sequenceStr.split(',').map((p) => p.trim()).filter(Boolean);
  const sequence: number[] = [];

  for (const part of parts) {
    const pageNum = parseInt(part, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      sequence.push(pageNum - 1);
    }
  }

  return sequence.length > 0 ? sequence : Array.from({ length: totalPages }, (_, i) => i);
}
