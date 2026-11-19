import fs from 'fs';
import path from 'path';
import pptxgen from 'pptxgenjs';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const pdfToPowerpointHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}.pptx`;
    const outputPath = path.join(outputDir, outputFilename);

    // Method 1: Try LibreOffice impress import
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
      try {
        const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
        await execSafe(
          binary,
          [
            '--headless',
            '--infilter=impress_pdf_import',
            '--convert-to',
            'pptx',
            '--outdir',
            outputDir,
            inputFile.filepath,
          ],
          { timeoutMs: 90000 }
        );

        const generatedFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.pptx'));
        if (generatedFiles.length > 0) {
          return {
            outputPath: path.join(outputDir, generatedFiles[0]),
            outputFilename: generatedFiles[0],
            mimeType:
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          };
        }
      } catch (err: any) {
        console.warn('LibreOffice PPTX conversion failed, attempting fallback...', err?.message);
      }
    }

    // Method 2: Extract slide images via pdftoppm or Python PyMuPDF if present
    const isPdftoppm = await hasBinary('pdftoppm');
    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));

    if (isPdftoppm) {
      try {
        const tempImgPrefix = path.join(outputDir, 'ppt_slide');
        await execSafe('pdftoppm', ['-jpeg', '-r', '150', inputFile.filepath, tempImgPrefix], {
          timeoutMs: 60000,
        });
      } catch (e) {
        console.warn('pdftoppm failed:', e);
      }
    } else if (hasPython) {
      try {
        const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
        const pyScript = `
import sys
try:
    import pymupdf as fitz
except ImportError:
    import fitz

doc = fitz.open(sys.argv[1])
out_dir = sys.argv[2]
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    pix.save(f"{out_dir}/ppt_slide-{i+1}.jpg")
`;
        await execSafe(pythonBin, ['-c', pyScript, inputFile.filepath, outputDir], {
          timeoutMs: 60000,
        });
      } catch (e) {
        console.warn('Python render failed:', e);
      }
    }

    const slideImages = fs
      .readdirSync(outputDir)
      .filter((f) => f.startsWith('ppt_slide-') && f.endsWith('.jpg'));

    if (slideImages.length > 0) {
      slideImages.sort((a, b) => {
        const numA = parseInt(a.replace('ppt_slide-', '').replace('.jpg', ''), 10);
        const numB = parseInt(b.replace('ppt_slide-', '').replace('.jpg', ''), 10);
        return numA - numB;
      });

      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      for (const imgName of slideImages) {
        const imgPath = path.join(outputDir, imgName);
        const slide = pres.addSlide();
        slide.addImage({
          path: imgPath,
          x: 0,
          y: 0,
          w: '100%',
          h: '100%',
        });
      }

      await pres.writeFile({ fileName: outputPath });

      for (const imgName of slideImages) {
        try {
          fs.unlinkSync(path.join(outputDir, imgName));
        } catch {}
      }

      return {
        outputPath,
        outputFilename,
        mimeType:
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };
    }

    // Method 3: Pure Node.js fallback via pdf-parse & pptxgenjs (100% Vercel Serverless compatible)
    const inBytes = fs.readFileSync(inputFile.filepath);
    const { PDFParse } = await import('pdf-parse');
    const parser = new (PDFParse as any)({ data: new Uint8Array(inBytes) });

    try {
      const textObj = await parser.getText();
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_16x9';

      for (let i = 0; i < textObj.pages.length; i++) {
        const slide = pres.addSlide();
        const lines = (textObj.pages[i].text || '')
          .split(/\r?\n/)
          .filter((l: string) => l.trim().length > 0);

        const title = lines[0] || `Slide ${i + 1}`;
        const body = lines.slice(1, 10).join('\n') || 'Extracted document content';

        slide.addText(title, {
          x: 0.8,
          y: 0.8,
          w: '85%',
          h: 1,
          fontSize: 24,
          bold: true,
          color: '363636',
        });

        slide.addText(body, {
          x: 0.8,
          y: 2.0,
          w: '85%',
          h: 4.2,
          fontSize: 16,
          color: '555555',
        });
      }

      await pres.writeFile({ fileName: outputPath });

      return {
        outputPath,
        outputFilename,
        mimeType:
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      };
    } finally {
      try {
        await parser.destroy();
      } catch {}
    }
  },
};
