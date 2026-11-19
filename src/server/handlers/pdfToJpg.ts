import '../utils/nodePolyfill';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const pdfToJpgHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const isPdftoppmAvailable = await hasBinary('pdftoppm');
    const isGsAvailable =
      (await hasBinary('gs')) || (await hasBinary('gswin64c')) || (await hasBinary('gswin32c'));
    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));

    let rendered = false;

    if (isPdftoppmAvailable) {
      try {
        const outputPrefix = path.join(outputDir, 'page');
        await execSafe('pdftoppm', ['-jpeg', '-r', '150', inputFile.filepath, outputPrefix], {
          timeoutMs: 60000,
        });
        rendered = true;
      } catch (e) {
        console.warn('pdftoppm failed, trying fallback:', e);
      }
    }

    if (!rendered && isGsAvailable) {
      try {
        const gsBin = (await hasBinary('gs'))
          ? 'gs'
          : (await hasBinary('gswin64c'))
          ? 'gswin64c'
          : 'gswin32c';

        const outputPattern = path.join(outputDir, 'page-%d.jpg');
        await execSafe(
          gsBin,
          [
            '-sDEVICE=jpeg',
            '-dJPEGQ=90',
            '-r150',
            `-sOutputFile=${outputPattern}`,
            '-dNOPAUSE',
            '-dBATCH',
            inputFile.filepath,
          ],
          { timeoutMs: 60000 }
        );
        rendered = true;
      } catch (e) {
        console.warn('Ghostscript failed, trying fallback:', e);
      }
    }

    if (!rendered && hasPython) {
      try {
        const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
        const pyRenderScript = `
import sys
try:
    import pymupdf as fitz
except ImportError:
    import fitz

doc = fitz.open(sys.argv[1])
out_dir = sys.argv[2]
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    pix.save(f"{out_dir}/page-{i+1}.jpg")
doc.close()
`;
        await execSafe(pythonBin, ['-c', pyRenderScript, inputFile.filepath, outputDir], {
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
          fs.writeFileSync(path.join(outputDir, `page-${p.pageNumber}.jpg`), p.data);
        }
      } finally {
        try {
          await parser.destroy();
        } catch {}
      }
    }

    // Inspect generated JPGs
    const generatedJpgs = fs
      .readdirSync(outputDir)
      .filter((f) => f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'));

    if (generatedJpgs.length === 0) {
      throw new Error('No images were extracted from the PDF.');
    }

    // If single page, return single JPG directly
    if (generatedJpgs.length === 1) {
      const singleJpgPath = path.join(outputDir, generatedJpgs[0]);
      const targetFilename = `${baseName}.jpg`;
      const targetPath = path.join(outputDir, targetFilename);
      if (singleJpgPath !== targetPath) {
        fs.renameSync(singleJpgPath, targetPath);
      }
      return {
        outputPath: targetPath,
        outputFilename: targetFilename,
        mimeType: 'image/jpeg',
      };
    }

    // Multiple pages: package into a ZIP archive
    const zipFilename = `${baseName}_images.zip`;
    const zipPath = path.join(outputDir, zipFilename);
    const outputStream = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise<void>((resolve, reject) => {
      outputStream.on('close', () => resolve());
      archive.on('error', (err) => reject(err));
      archive.pipe(outputStream);

      for (const jpg of generatedJpgs) {
        const fullPath = path.join(outputDir, jpg);
        archive.file(fullPath, { name: jpg });
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
