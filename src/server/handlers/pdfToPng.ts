import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const pdfToPngHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for PNG conversion');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;

    const hasPdftoppm = await hasBinary('pdftoppm');
    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));

    let rendered = false;

    if (hasPdftoppm) {
      try {
        const outputPrefix = path.join(outputDir, 'page');
        await execSafe('pdftoppm', ['-png', '-r', '150', inputFile.filepath, outputPrefix], {
          timeoutMs: 60000,
        });
        rendered = true;
      } catch (e) {
        console.warn('pdftoppm failed, trying fallback:', e);
      }
    }

    if (!rendered && hasPython) {
      try {
        const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
        const script = `
import sys
try:
    import pymupdf as fitz
except ImportError:
    import fitz

doc = fitz.open(sys.argv[1])
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    pix.save(f"{sys.argv[2]}/page_{i+1}.png")
doc.close()
`;
        await execSafe(pythonBin, ['-c', script, inputFile.filepath, outputDir], {
          timeoutMs: 60000,
        });
        rendered = true;
      } catch (e) {
        console.warn('Python render failed, trying pure Node fallback:', e);
      }
    }

    // Pure Node.js fallback via pdf-parse screenshot engine (100% Vercel compatible)
    if (!rendered) {
      const pdfBytes = fs.readFileSync(inputFile.filepath);
      const { PDFParse } = await import('pdf-parse');
      const parser = new (PDFParse as any)({ data: new Uint8Array(pdfBytes) });
      try {
        const screenshot = await parser.getScreenshot({ scale: 2 });
        for (const p of screenshot.pages) {
          fs.writeFileSync(path.join(outputDir, `page_${p.pageNumber}.png`), p.data);
        }
      } finally {
        try {
          await parser.destroy();
        } catch {}
      }
    }

    const generatedPngs = fs
      .readdirSync(outputDir)
      .filter((f) => f.toLowerCase().endsWith('.png'));

    if (generatedPngs.length === 0) {
      throw new Error('No PNG images were generated from the PDF.');
    }

    // Single page: return PNG directly
    if (generatedPngs.length === 1) {
      const singlePngPath = path.join(outputDir, generatedPngs[0]);
      const targetFilename = `${baseName}.png`;
      const targetPath = path.join(outputDir, targetFilename);
      if (singlePngPath !== targetPath) {
        fs.renameSync(singlePngPath, targetPath);
      }
      return {
        outputPath: targetPath,
        outputFilename: targetFilename,
        mimeType: 'image/png',
      };
    }

    // Multiple pages: package into ZIP
    const zipFilename = `${baseName}_pages.zip`;
    const zipPath = path.join(outputDir, zipFilename);
    const outputStream = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise<void>((resolve, reject) => {
      outputStream.on('close', () => resolve());
      archive.on('error', (err) => reject(err));
      archive.pipe(outputStream);

      for (const png of generatedPngs) {
        const fullPath = path.join(outputDir, png);
        archive.file(fullPath, { name: png });
      }

      archive.finalize();
    });

    return {
      outputPath: zipPath,
      outputFilename: zipFilename,
      mimeType: 'application/zip',
    };
  },
};
