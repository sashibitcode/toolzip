import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import { compressPdfHandler } from '../src/server/handlers/compressPdf';
import { protectPdfHandler } from '../src/server/handlers/protectPdf';
import { unlockPdfHandler } from '../src/server/handlers/unlockPdf';
import { watermarkPdfHandler } from '../src/server/handlers/watermarkPdf';
import { numberPagesHandler } from '../src/server/handlers/numberPages';
import { flattenPdfHandler } from '../src/server/handlers/flattenPdf';
import { txtToPdfHandler } from '../src/server/handlers/txtToPdf';
import { pngToPdfHandler } from '../src/server/handlers/pngToPdf';
import { pdfToPngHandler } from '../src/server/handlers/pdfToPng';
import { signPdfHandler } from '../src/server/handlers/signPdf';

const TEST_DIR = path.join(process.cwd(), 'storage', 'test-suite-expansion');

async function createSamplePdf(numPages = 2): Promise<string> {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }

  const doc = await PDFDocument.create();
  for (let i = 1; i <= numPages; i++) {
    const page = doc.addPage([500, 700]);
    page.drawText(`Test Document - Page ${i}`, {
      x: 50,
      y: 650,
      size: 18,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  const bytes = await doc.save();
  const filePath = path.join(TEST_DIR, `sample_${numPages}p.pdf`);
  fs.writeFileSync(filePath, bytes);
  return filePath;
}

test('1. Compress PDF Handler: compresses document without error', async () => {
  const pdfPath = await createSamplePdf(3);
  const result = await compressPdfHandler.convert({
    jobId: 'test-compress',
    inputFiles: [{ filepath: pdfPath, originalFilename: 'sample.pdf', mimeType: 'application/pdf', size: 5000 }],
    outputDir: TEST_DIR,
    options: { level: 'recommended' },
  });

  assert.ok(fs.existsSync(result.outputPath));
  assert.ok(fs.statSync(result.outputPath).size > 0);
});

test('2. Protect PDF & Unlock PDF Handlers: AES-256 round-trip encryption', async () => {
  const pdfPath = await createSamplePdf(1);
  const password = 'SecretPassword123!';

  // Protect
  const protectResult = await protectPdfHandler.convert({
    jobId: 'test-protect',
    inputFiles: [{ filepath: pdfPath, originalFilename: 'open.pdf', mimeType: 'application/pdf', size: 2000 }],
    outputDir: TEST_DIR,
    options: { password },
  });

  assert.ok(fs.existsSync(protectResult.outputPath));

  // Unlock
  const unlockResult = await unlockPdfHandler.convert({
    jobId: 'test-unlock',
    inputFiles: [
      {
        filepath: protectResult.outputPath,
        originalFilename: protectResult.outputFilename,
        mimeType: 'application/pdf',
        size: fs.statSync(protectResult.outputPath).size,
      },
    ],
    outputDir: TEST_DIR,
    options: { password },
  });

  assert.ok(fs.existsSync(unlockResult.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(unlockResult.outputPath));
  assert.equal(doc.getPageCount(), 1);
});

test('3. Watermark PDF Handler: stamps watermark text across pages', async () => {
  const pdfPath = await createSamplePdf(2);
  const result = await watermarkPdfHandler.convert({
    jobId: 'test-watermark',
    inputFiles: [{ filepath: pdfPath, originalFilename: 'doc.pdf', mimeType: 'application/pdf', size: 3000 }],
    outputDir: TEST_DIR,
    options: { text: 'CONFIDENTIAL', angle: 45, opacity: 0.3 },
  });

  assert.ok(fs.existsSync(result.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.equal(doc.getPageCount(), 2);
});

test('4. Number Pages Handler: stamps page numbering on all pages', async () => {
  const pdfPath = await createSamplePdf(3);
  const result = await numberPagesHandler.convert({
    jobId: 'test-number',
    inputFiles: [{ filepath: pdfPath, originalFilename: 'doc.pdf', mimeType: 'application/pdf', size: 3000 }],
    outputDir: TEST_DIR,
    options: { position: 'bottom-center', format: 'page-of-total' },
  });

  assert.ok(fs.existsSync(result.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.equal(doc.getPageCount(), 3);
});

test('5. Flatten PDF Handler: flattens form fields and annotations', async () => {
  const pdfPath = await createSamplePdf(2);
  const result = await flattenPdfHandler.convert({
    jobId: 'test-flatten',
    inputFiles: [{ filepath: pdfPath, originalFilename: 'doc.pdf', mimeType: 'application/pdf', size: 3000 }],
    outputDir: TEST_DIR,
  });

  assert.ok(fs.existsSync(result.outputPath));
});

test('6. TXT to PDF Handler: converts raw text into paginated PDF', async () => {
  const txtPath = path.join(TEST_DIR, 'sample.txt');
  fs.writeFileSync(txtPath, 'Hello Toolzip!\nThis is a clean plain text to PDF document test with multiple lines.\nDocument is paginated automatically.');

  const result = await txtToPdfHandler.convert({
    jobId: 'test-txt-pdf',
    inputFiles: [{ filepath: txtPath, originalFilename: 'sample.txt', mimeType: 'text/plain', size: 200 }],
    outputDir: TEST_DIR,
  });

  assert.ok(fs.existsSync(result.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.ok(doc.getPageCount() >= 1);
});

test('7. Sign PDF Handler: stamps digital signature and verification on PDF', async () => {
  const pdfPath = await createSamplePdf(1);
  const result = await signPdfHandler.convert({
    jobId: 'test-sign',
    inputFiles: [{ filepath: pdfPath, originalFilename: 'doc.pdf', mimeType: 'application/pdf', size: 3000 }],
    outputDir: TEST_DIR,
    options: { signerName: 'John Doe', signerDate: '2026-11-18' },
  });

  assert.ok(fs.existsSync(result.outputPath));
  const doc = await PDFDocument.load(fs.readFileSync(result.outputPath));
  assert.equal(doc.getPageCount(), 1);
});
