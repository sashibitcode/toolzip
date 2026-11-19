import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';

import { editPdfHandler } from '../src/server/handlers/editPdf';
import { parsePdfForEditing } from '../src/server/utils/pdfParser';
import { protectPdfHandler } from '../src/server/handlers/protectPdf';
import { unlockPdfHandler } from '../src/server/handlers/unlockPdf';
import { pdfToPngHandler } from '../src/server/handlers/pdfToPng';
import { pdfToJpgHandler } from '../src/server/handlers/pdfToJpg';
import { pdfToWordHandler } from '../src/server/handlers/pdfToWord';
import { pdfToExcelHandler } from '../src/server/handlers/pdfToExcel';
import { pdfToPowerpointHandler } from '../src/server/handlers/pdfToPowerpoint';
import { wordToPdfHandler } from '../src/server/handlers/wordToPdf';
import { excelToPdfHandler } from '../src/server/handlers/excelToPdf';
import { powerpointToPdfHandler } from '../src/server/handlers/powerpointToPdf';
import { htmlToPdfHandler } from '../src/server/handlers/htmlToPdf';

function createTempDir(): string {
  const dir = path.join(os.tmpdir(), `toolzip_test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

test('Vercel Zero-Dependency Suite Verification', async (t) => {
  const tempDir = createTempDir();

  // Helper to create a base sample PDF
  async function createSamplePdf(filename: string): Promise<string> {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const p1 = doc.addPage([500, 400]);
    p1.drawText('Sample Document Title', { x: 50, y: 350, size: 20, font, color: rgb(0.5, 0.1, 0.1) });
    p1.drawText('Paragraph content for testing pure Node conversion.', { x: 50, y: 300, size: 12, font });

    const p2 = doc.addPage([500, 400]);
    p2.drawText('Page 2 Column1    Column2    100.50', { x: 50, y: 350, size: 12, font });

    const bytes = await doc.save();
    const filePath = path.join(tempDir, filename);
    fs.writeFileSync(filePath, bytes);
    return filePath;
  }

  await t.test('1. parsePdfForEditing: parses pages and extracts text without Python', async () => {
    const pdfPath = await createSamplePdf('sample_for_parse.pdf');
    const parsed = await parsePdfForEditing(pdfPath);

    assert.equal(parsed.pageCount, 2);
    assert.ok(parsed.pages.length === 2);
    assert.ok(parsed.pages[0].imageBase64.startsWith('data:image/'));
    assert.ok(parsed.pages[0].spans.length > 0);
    const titleSpan = parsed.pages[0].spans.find((s) => s.text.includes('Sample Document Title'));
    assert.ok(titleSpan, 'Should detect title text span');
  });

  await t.test('2. editPdfHandler: saves vector replacements and whiteouts in pure Node', async () => {
    const pdfPath = await createSamplePdf('sample_for_edit.pdf');
    const result = await editPdfHandler.convert({
      jobId: 'test_edit_job',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_for_edit.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: tempDir,
      options: {
        edits: {
          replacedSpans: [
            {
              pageIndex: 0,
              bbox: [50, 30, 250, 55],
              origin: [50, 50],
              originalText: 'Sample Document Title',
              newText: 'Modified Document Title',
              font: 'Helvetica',
              size: 20,
              colorHex: '#7A1F2B',
            },
          ],
          addedTexts: [{ pageIndex: 0, x: 50, y: 150, text: 'Newly added text', font: 'Helvetica', size: 14, colorHex: '#000000' }],
          whiteouts: [{ pageIndex: 0, bbox: [50, 200, 200, 230], fillHex: '#ffffff' }],
        },
      },
    });

    assert.ok(fs.existsSync(result.outputPath));
    assert.ok(fs.statSync(result.outputPath).size > 500);
  });

  await t.test('3. protectPdf & unlockPdf: pure Node AES-256 round trip', async () => {
    const pdfPath = await createSamplePdf('sample_for_crypto.pdf');
    const password = 'TestSecretPassword_123';

    // Protect
    const protectResult = await protectPdfHandler.convert({
      jobId: 'test_protect_job',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_for_crypto.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: tempDir,
      options: { password },
    });
    assert.ok(fs.existsSync(protectResult.outputPath));

    // Unlock
    const unlockResult = await unlockPdfHandler.convert({
      jobId: 'test_unlock_job',
      inputFiles: [{ filepath: protectResult.outputPath, originalFilename: 'sample_for_crypto_protected.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: tempDir,
      options: { password },
    });
    assert.ok(fs.existsSync(unlockResult.outputPath));

    // Wrong password should fail with user-friendly error
    await assert.rejects(
      async () => {
        await unlockPdfHandler.convert({
          jobId: 'test_wrong_unlock',
          inputFiles: [{ filepath: protectResult.outputPath, originalFilename: 'sample_for_crypto_protected.pdf', mimeType: 'application/pdf', size: 1000 }],
          outputDir: tempDir,
          options: { password: 'WrongPassword' },
        });
      },
      (err: any) => err.message.includes('Incorrect password')
    );
  });

  await t.test('4. pdfToPng & pdfToJpg: pure Node page rendering', async () => {
    const pdfPath = await createSamplePdf('sample_for_images.pdf');
    const pngDir = path.join(tempDir, 'png_out');
    fs.mkdirSync(pngDir, { recursive: true });

    const pngResult = await pdfToPngHandler.convert({
      jobId: 'test_png_job',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_for_images.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: pngDir,
    });
    assert.ok(fs.existsSync(pngResult.outputPath));

    const jpgDir = path.join(tempDir, 'jpg_out');
    fs.mkdirSync(jpgDir, { recursive: true });

    const jpgResult = await pdfToJpgHandler.convert({
      jobId: 'test_jpg_job',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_for_images.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: jpgDir,
    });
    assert.ok(fs.existsSync(jpgResult.outputPath));
  });

  await t.test('5. pdfToWord & pdfToExcel & pdfToPowerpoint: pure Node extraction', async () => {
    const pdfPath = await createSamplePdf('sample_for_office.pdf');

    // PDF to Word
    const wordResult = await pdfToWordHandler.convert({
      jobId: 'test_p2w_job',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_for_office.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: tempDir,
    });
    assert.ok(fs.existsSync(wordResult.outputPath));
    assert.ok(wordResult.outputFilename.endsWith('.docx'));

    // PDF to Excel
    const excelResult = await pdfToExcelHandler.convert({
      jobId: 'test_p2e_job',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_for_office.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: tempDir,
    });
    assert.ok(fs.existsSync(excelResult.outputPath));
    assert.ok(excelResult.outputFilename.endsWith('.xlsx'));

    // PDF to PowerPoint
    const pptxResult = await pdfToPowerpointHandler.convert({
      jobId: 'test_p2p_job',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_for_office.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: tempDir,
    });
    assert.ok(fs.existsSync(pptxResult.outputPath));
    assert.ok(pptxResult.outputFilename.endsWith('.pptx'));
  });

  await t.test('6. wordToPdf & excelToPdf & powerpointToPdf: pure Node conversion', async () => {
    // Excel to PDF
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Invoice No', 'Amount'], ['INV-001', '500.00']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Summary');
    const xlsxPath = path.join(tempDir, 'test_sheet.xlsx');
    XLSX.writeFile(wb, xlsxPath);

    const e2pResult = await excelToPdfHandler.convert({
      jobId: 'test_e2p_job',
      inputFiles: [{ filepath: xlsxPath, originalFilename: 'test_sheet.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1000 }],
      outputDir: tempDir,
    });
    assert.ok(fs.existsSync(e2pResult.outputPath));
    assert.ok(e2pResult.outputFilename.endsWith('.pdf'));

    // PowerPoint to PDF
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_16x9';
    const slide = pres.addSlide();
    slide.addText('Pure Node Slide Title', { x: 1, y: 1 });
    const pptxPath = path.join(tempDir, 'test_pres.pptx');
    await pres.writeFile({ fileName: pptxPath });

    const p2pdfResult = await powerpointToPdfHandler.convert({
      jobId: 'test_pp2pdf_job',
      inputFiles: [{ filepath: pptxPath, originalFilename: 'test_pres.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 1000 }],
      outputDir: tempDir,
    });
    assert.ok(fs.existsSync(p2pdfResult.outputPath));
    assert.ok(p2pdfResult.outputFilename.endsWith('.pdf'));
  });

  await t.test('7. htmlToPdf: pure Node conversion', async () => {
    const htmlPath = path.join(tempDir, 'test_page.html');
    fs.writeFileSync(htmlPath, '<html><head><title>Toolzip Test</title></head><body><h1>Welcome</h1><p>Sample HTML converted to PDF.</p></body></html>');

    const htmlResult = await htmlToPdfHandler.convert({
      jobId: 'test_html_job',
      inputFiles: [{ filepath: htmlPath, originalFilename: 'test_page.html', mimeType: 'text/html', size: 200 }],
      outputDir: tempDir,
    });
    assert.ok(fs.existsSync(htmlResult.outputPath));
    assert.ok(htmlResult.outputFilename.endsWith('.pdf'));
  });

  await t.test('8. Protected PDF to Word graceful handling: DOMMatrix defined and clean user error', async () => {
    assert.ok(typeof (globalThis as any).DOMMatrix !== 'undefined', 'DOMMatrix must be polyfilled globally');
    assert.ok(typeof (globalThis as any).Path2D !== 'undefined', 'Path2D must be polyfilled globally');

    const pdfPath = await createSamplePdf('sample_encrypted_for_word.pdf');
    const protectResult = await protectPdfHandler.convert({
      jobId: 'test_protect_for_word',
      inputFiles: [{ filepath: pdfPath, originalFilename: 'sample_encrypted_for_word.pdf', mimeType: 'application/pdf', size: 1000 }],
      outputDir: tempDir,
      options: { password: 'SecretPassword99' },
    });

    await assert.rejects(
      async () => {
        await pdfToWordHandler.convert({
          jobId: 'test_word_from_protected',
          inputFiles: [{ filepath: protectResult.outputPath, originalFilename: 'sample_encrypted_for_word_protected.pdf', mimeType: 'application/pdf', size: 1000 }],
          outputDir: tempDir,
        });
      },
      (err: any) => {
        // Must NOT be "DOMMatrix is not defined"
        assert.ok(!err.message.includes('DOMMatrix'));
        assert.ok(err.message.includes('password-protected'));
        return true;
      }
    );
  });

  // Cleanup temp dir
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}
});
