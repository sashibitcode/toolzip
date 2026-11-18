import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import { parsePageRanges, parsePageSequence } from '../src/server/utils/pageRange';
import { mergePdfHandler } from '../src/server/handlers/mergePdf';
import { splitPdfHandler } from '../src/server/handlers/splitPdf';
import { rotatePdfHandler } from '../src/server/handlers/rotatePdf';
import { deletePdfPagesHandler } from '../src/server/handlers/deletePdfPages';
import { extractPdfPagesHandler } from '../src/server/handlers/extractPdfPages';
import { organizePdfHandler } from '../src/server/handlers/organizePdf';

const TEST_STORAGE = path.join(process.cwd(), 'storage', 'test-organize-sandbox');

async function createSamplePdf(numPages: number, label: string): Promise<string> {
  if (!fs.existsSync(TEST_STORAGE)) {
    fs.mkdirSync(TEST_STORAGE, { recursive: true });
  }

  const doc = await PDFDocument.create();
  for (let i = 1; i <= numPages; i++) {
    const page = doc.addPage([400, 600]);
    page.drawText(`${label} - Page ${i}`, {
      x: 50,
      y: 550,
      size: 20,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  const bytes = await doc.save();
  const filePath = path.join(TEST_STORAGE, `${label}_${numPages}p.pdf`);
  fs.writeFileSync(filePath, bytes);
  return filePath;
}

test('1. Page Range Utility parsing and validation', () => {
  const parsed1 = parsePageRanges('1-3, 5', 5);
  assert.deepEqual(parsed1, [0, 1, 2, 4]);

  const parsedAll = parsePageRanges('all', 4);
  assert.deepEqual(parsedAll, [0, 1, 2, 3]);

  const parsedRev = parsePageRanges('reverse', 3);
  assert.deepEqual(parsedRev, [2, 1, 0]);

  const parsedSeq = parsePageSequence('3, 1, 2', 3);
  assert.deepEqual(parsedSeq, [2, 0, 1]);
});

test('2. Merge PDF Handler: combines 2 PDFs into 1 unified document', async () => {
  const pdf1 = await createSamplePdf(2, 'doc1');
  const pdf2 = await createSamplePdf(3, 'doc2');

  const result = await mergePdfHandler.convert({
    jobId: 'test-merge',
    inputFiles: [
      { filepath: pdf1, originalFilename: 'doc1.pdf', mimeType: 'application/pdf', size: 1000 },
      { filepath: pdf2, originalFilename: 'doc2.pdf', mimeType: 'application/pdf', size: 1000 },
    ],
    outputDir: TEST_STORAGE,
  });

  assert.ok(fs.existsSync(result.outputPath));
  const mergedBytes = fs.readFileSync(result.outputPath);
  const mergedDoc = await PDFDocument.load(mergedBytes);
  assert.equal(mergedDoc.getPageCount(), 5);
});

test('3. Split PDF Handler: custom range to PDF and all pages to ZIP', async () => {
  const pdf = await createSamplePdf(3, 'doc-split');

  // Test custom range
  const rangeResult = await splitPdfHandler.convert({
    jobId: 'test-split-range',
    inputFiles: [{ filepath: pdf, originalFilename: 'split.pdf', mimeType: 'application/pdf', size: 1000 }],
    outputDir: TEST_STORAGE,
    options: { mode: 'range', range: '1-2' },
  });

  assert.ok(fs.existsSync(rangeResult.outputPath));
  const rangeDoc = await PDFDocument.load(fs.readFileSync(rangeResult.outputPath));
  assert.equal(rangeDoc.getPageCount(), 2);

  // Test all pages to ZIP
  const allResult = await splitPdfHandler.convert({
    jobId: 'test-split-all',
    inputFiles: [{ filepath: pdf, originalFilename: 'split.pdf', mimeType: 'application/pdf', size: 1000 }],
    outputDir: TEST_STORAGE,
    options: { mode: 'all' },
  });

  assert.ok(fs.existsSync(allResult.outputPath));
  assert.equal(allResult.mimeType, 'application/zip');
});

test('4. Rotate PDF Handler: rotates pages by 90 degrees', async () => {
  const pdf = await createSamplePdf(2, 'doc-rotate');

  const result = await rotatePdfHandler.convert({
    jobId: 'test-rotate',
    inputFiles: [{ filepath: pdf, originalFilename: 'rotate.pdf', mimeType: 'application/pdf', size: 1000 }],
    outputDir: TEST_STORAGE,
    options: { angle: 90, pages: 'all' },
  });

  assert.ok(fs.existsSync(result.outputPath));
  const rotatedDoc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.equal(rotatedDoc.getPage(0).getRotation().angle, 90);
  assert.equal(rotatedDoc.getPage(1).getRotation().angle, 90);
});

test('5. Delete PDF Pages Handler: deletes page 2 from 3-page document', async () => {
  const pdf = await createSamplePdf(3, 'doc-delete');

  const result = await deletePdfPagesHandler.convert({
    jobId: 'test-delete',
    inputFiles: [{ filepath: pdf, originalFilename: 'delete.pdf', mimeType: 'application/pdf', size: 1000 }],
    outputDir: TEST_STORAGE,
    options: { pagesToDelete: '2' },
  });

  assert.ok(fs.existsSync(result.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.equal(doc.getPageCount(), 2);
});

test('6. Extract PDF Pages Handler: extracts pages 1 and 3 from 3-page document', async () => {
  const pdf = await createSamplePdf(3, 'doc-extract');

  const result = await extractPdfPagesHandler.convert({
    jobId: 'test-extract',
    inputFiles: [{ filepath: pdf, originalFilename: 'extract.pdf', mimeType: 'application/pdf', size: 1000 }],
    outputDir: TEST_STORAGE,
    options: { pagesToExtract: '1, 3' },
  });

  assert.ok(fs.existsSync(result.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.equal(doc.getPageCount(), 2);
});

test('7. Organize PDF Handler: reorders pages in custom sequence', async () => {
  const pdf = await createSamplePdf(3, 'doc-organize');

  const result = await organizePdfHandler.convert({
    jobId: 'test-organize',
    inputFiles: [{ filepath: pdf, originalFilename: 'organize.pdf', mimeType: 'application/pdf', size: 1000 }],
    outputDir: TEST_STORAGE,
    options: { pageOrder: 'reverse' },
  });

  assert.ok(fs.existsSync(result.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.equal(doc.getPageCount(), 3);
});
