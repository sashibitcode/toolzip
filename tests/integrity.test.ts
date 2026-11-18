import assert from 'node:assert';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toolsConfig, getToolBySlug, getToolsByCategory } from '../src/config/tools.config';
import { toolHandlers, getHandler } from '../src/server/handlers';
import { sanitizeFilename, createJobWorkspace, deleteJob } from '../src/server/utils/storage';
import { checkRateLimit } from '../src/server/utils/rateLimit';
import { jpgToPdfHandler } from '../src/server/handlers/jpgToPdf';
import { pdfToWordHandler } from '../src/server/handlers/pdfToWord';
import { editPdfHandler } from '../src/server/handlers/editPdf';
import { parsePdfForEditing } from '../src/server/utils/pdfParser';

test('1. Tool configuration integrity', () => {
  assert.strictEqual(toolsConfig.length, 27, 'Expected 27 tools in toolsConfig');

  const slugs = new Set<string>();
  const ids = new Set<string>();

  for (const tool of toolsConfig) {
    // Unique slug & id
    assert.ok(!slugs.has(tool.slug), `Duplicate slug found: ${tool.slug}`);
    assert.ok(!ids.has(tool.id), `Duplicate ID found: ${tool.id}`);
    slugs.add(tool.slug);
    ids.add(tool.id);

    // Valid category
    assert.ok(
      tool.category === 'to-pdf' ||
        tool.category === 'from-pdf' ||
        tool.category === 'organize' ||
        tool.category === 'optimize' ||
        tool.category === 'edit-sign',
      `Invalid category ${tool.category} for ${tool.title}`
    );

    // Matching handler exists
    const handler = getHandler(tool.handlerName);
    assert.ok(handler, `Handler '${tool.handlerName}' missing in handlers index for tool '${tool.title}'`);

    // Valid extensions
    for (const ext of tool.acceptedExtensions) {
      assert.ok(ext.startsWith('.'), `Extension ${ext} must start with dot in ${tool.title}`);
    }

    // SEO properties
    assert.ok(tool.seoTitle.length > 5, `Missing SEO title for ${tool.title}`);
    assert.ok(tool.seoDescription.length > 10, `Missing SEO description for ${tool.title}`);
  }

  // Categories helper
  assert.strictEqual(getToolsByCategory('to-pdf').length, 7);
  assert.strictEqual(getToolsByCategory('from-pdf').length, 6);
  assert.strictEqual(getToolsByCategory('organize').length, 6);
  assert.strictEqual(getToolsByCategory('optimize').length, 6);
  assert.strictEqual(getToolsByCategory('edit-sign').length, 2);
});

test('2. Security: filename sanitization & rate limiting', () => {
  // Test directory traversal prevention
  assert.strictEqual(sanitizeFilename('../../../secret/passwords.txt'), 'passwords.txt');
  assert.strictEqual(sanitizeFilename('..\\..\\windows\\system32\\cmd.exe'), 'cmd.exe');
  assert.strictEqual(sanitizeFilename('normal-file.pdf'), 'normal-file.pdf');

  // Test rate limiting
  const testIp = '192.168.1.100';
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(testIp, 5, 10000);
    assert.strictEqual(res.allowed, true);
  }
  const blockedRes = checkRateLimit(testIp, 5, 10000);
  assert.strictEqual(blockedRes.allowed, false, 'Should be rate limited on 6th attempt');
});

test('3. Workspace isolation and cleanup', () => {
  const workspace = createJobWorkspace();
  assert.ok(fs.existsSync(workspace.jobDir), 'Job dir must exist');
  assert.ok(fs.existsSync(workspace.inputDir), 'Input dir must exist');
  assert.ok(fs.existsSync(workspace.outputDir), 'Output dir must exist');

  // Clean up
  deleteJob(workspace.jobId);
  assert.ok(!fs.existsSync(workspace.jobDir), 'Job dir must be deleted');
});

test('4. End-to-end conversion: JPG to PDF Handler', async () => {
  const workspace = createJobWorkspace();

  // Create a minimal 1x1 valid PNG image buffer
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]);

  const testInputPath = path.join(workspace.inputDir, 'test_image.png');
  fs.writeFileSync(testInputPath, minimalPng);

  const result = await jpgToPdfHandler.convert({
    jobId: workspace.jobId,
    inputFiles: [
      {
        filepath: testInputPath,
        originalFilename: 'test_image.png',
        mimeType: 'image/png',
        size: minimalPng.length,
      },
    ],
    outputDir: workspace.outputDir,
  });

  assert.ok(fs.existsSync(result.outputPath), 'Output PDF must exist');
  assert.strictEqual(result.mimeType, 'application/pdf');

  const pdfBytes = fs.readFileSync(result.outputPath);
  const doc = await PDFDocument.load(pdfBytes);
  assert.strictEqual(doc.getPageCount(), 1, 'Should have 1 page in output PDF');

  deleteJob(workspace.jobId);
});

test('5. End-to-end conversion: PDF to Word (DOCX) Handler without LibreOffice', async () => {
  const workspace = createJobWorkspace();

  // Create a real PDF document
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([500, 300]);
  page.drawText('Sample Resume Content - Shashikant Raj', { x: 50, y: 250, size: 16, font, color: rgb(0, 0, 0) });
  page.drawText('Software Engineering & PDF Development', { x: 50, y: 200, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
  const pdfBytes = await pdfDoc.save();

  const testPdfPath = path.join(workspace.inputDir, 'resume_test.pdf');
  fs.writeFileSync(testPdfPath, pdfBytes);

  const result = await pdfToWordHandler.convert({
    jobId: workspace.jobId,
    inputFiles: [
      {
        filepath: testPdfPath,
        originalFilename: 'resume_test.pdf',
        mimeType: 'application/pdf',
        size: pdfBytes.length,
      },
    ],
    outputDir: workspace.outputDir,
  });

  assert.ok(fs.existsSync(result.outputPath), 'Output DOCX file must exist');
  assert.strictEqual(path.extname(result.outputFilename), '.docx');
  assert.ok(fs.statSync(result.outputPath).size > 1000, 'DOCX file must have non-empty size');

  deleteJob(workspace.jobId);
});

test('6. End-to-end PDF Text Parsing and In-Place Font/Color Replacement', async () => {
  const workspace = createJobWorkspace();

  // Create a PDF with specific colored text
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([600, 400]);
  // Red heading: rgb(0.9, 0.1, 0.2)
  page.drawText('TOOLZIP Direct Editor Title', { x: 50, y: 320, size: 20, font, color: rgb(0.9, 0.1, 0.2) });
  const pdfBytes = await pdfDoc.save();

  const testPdfPath = path.join(workspace.inputDir, 'editor_test.pdf');
  fs.writeFileSync(testPdfPath, pdfBytes);

  // 1. Test parsing: verify spans, font and color detection
  const parsed = await parsePdfForEditing(testPdfPath);
  assert.strictEqual(parsed.pageCount, 1);
  assert.ok(parsed.pages[0].spans.length > 0, 'Spans must be extracted');

  const titleSpan = parsed.pages[0].spans.find((s) => s.text.includes('TOOLZIP'));
  assert.ok(titleSpan, 'Title span must be found');
  assert.ok(titleSpan.colorHex.startsWith('#'), 'Color must be in hex format');
  assert.ok(titleSpan.size >= 18, 'Detected font size must be ~20pt');

  // 2. Test in-place replacement with matching font and color
  const editResult = await editPdfHandler.convert({
    jobId: workspace.jobId,
    inputFiles: [
      {
        filepath: testPdfPath,
        originalFilename: 'editor_test.pdf',
        mimeType: 'application/pdf',
        size: pdfBytes.length,
      },
    ],
    outputDir: workspace.outputDir,
    options: {
      edits: {
        replacedSpans: [
          {
            pageIndex: 0,
            bbox: titleSpan.bbox,
            origin: titleSpan.origin,
            originalText: titleSpan.text,
            newText: 'NEW UPDATED TITLE IN SAME COLOR',
            font: titleSpan.font,
            size: titleSpan.size,
            colorHex: titleSpan.colorHex,
          },
        ],
        addedTexts: [
          {
            pageIndex: 0,
            x: 50,
            y: 200,
            text: 'Newly Added Subtitle',
            font: 'Helvetica',
            size: 14,
            colorHex: '#000000',
          },
        ],
      },
    },
  });

  assert.ok(fs.existsSync(editResult.outputPath), 'Output edited PDF must exist');
  assert.strictEqual(editResult.mimeType, 'application/pdf');

  // Verify resulting PDF is valid
  const editedPdfBytes = fs.readFileSync(editResult.outputPath);
  const reloaded = await PDFDocument.load(editedPdfBytes);
  assert.strictEqual(reloaded.getPageCount(), 1);

  deleteJob(workspace.jobId);
});
