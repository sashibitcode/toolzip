import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const powerpointToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PowerPoint file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    // Method 1: Try LibreOffice if available
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));
    if (isSofficeAvailable) {
      try {
        const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
        await execSafe(
          binary,
          ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputFile.filepath],
          { timeoutMs: 60000 }
        );

        const generatedFiles = fs.readdirSync(outputDir).filter((f) => f.endsWith('.pdf'));
        if (generatedFiles.length > 0) {
          const actualOutputFile = path.join(outputDir, generatedFiles[0]);
          return {
            outputPath: actualOutputFile,
            outputFilename: generatedFiles[0],
            mimeType: 'application/pdf',
          };
        }
      } catch (err: any) {
        console.warn('LibreOffice PowerPoint-to-PDF failed, falling back...', err?.message);
      }
    }

    // Method 2: Pure Node.js fallback via JSZip & pdf-lib (100% Vercel Serverless compatible)
    const pptxBuf = fs.readFileSync(inputFile.filepath);
    const zip = await JSZip.loadAsync(pptxBuf);

    // Find and sort all slides: ppt/slides/slide1.xml, ppt/slides/slide2.xml, etc.
    const slideFileNames = Object.keys(zip.files).filter((f) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(f)
    );

    slideFileNames.sort((a, b) => {
      const numA = parseInt(a.replace('ppt/slides/slide', '').replace('.xml', ''), 10);
      const numB = parseInt(b.replace('ppt/slides/slide', '').replace('.xml', ''), 10);
      return numA - numB;
    });

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 16:9 Presentation Page Dimensions: 960 x 540
    const slideWidth = 960;
    const slideHeight = 540;

    if (slideFileNames.length === 0) {
      const page = pdfDoc.addPage([slideWidth, slideHeight]);
      page.drawText('Presentation Slide', {
        x: 80,
        y: slideHeight / 2,
        size: 24,
        font: fontBold,
      });
    }

    for (let sIdx = 0; sIdx < slideFileNames.length; sIdx++) {
      const slideFile = slideFileNames[sIdx];
      const xml = await zip.files[slideFile].async('text');

      // Extract text inside <a:t> tags
      const matches = Array.from(xml.matchAll(/<a:t[^>]*>(.*?)<\/a:t>/gs)).map((m) =>
        m[1].trim()
      );
      const textLines = matches.filter((t) => t.length > 0);

      const page = pdfDoc.addPage([slideWidth, slideHeight]);

      // Subtle warm background card
      page.drawRectangle({
        x: 35,
        y: 30,
        width: slideWidth - 70,
        height: slideHeight - 60,
        color: rgb(0.98, 0.97, 0.95),
        borderColor: rgb(0.88, 0.84, 0.78),
        borderWidth: 1,
      });

      // Top slide accent line
      page.drawRectangle({
        x: 35,
        y: slideHeight - 34,
        width: slideWidth - 70,
        height: 4,
        color: rgb(0.48, 0.12, 0.17), // Crimson accent
      });

      // Slide number badge
      page.drawText(`${sIdx + 1}`, {
        x: slideWidth - 65,
        y: 45,
        size: 11,
        font,
        color: rgb(0.5, 0.45, 0.45),
      });

      let currentY = slideHeight - 90;
      for (let i = 0; i < textLines.length; i++) {
        const isTitle = i === 0;
        const text = textLines[i];
        const fontSize = isTitle ? 24 : 15;
        const activeFont = isTitle ? fontBold : font;
        const textColor = isTitle ? rgb(0.24, 0.05, 0.08) : rgb(0.2, 0.2, 0.2);

        if (currentY < 70) break;

        page.drawText(text.length > 80 ? `${text.substring(0, 77)}...` : text, {
          x: 75,
          y: currentY,
          size: fontSize,
          font: activeFont,
          color: textColor,
        });

        currentY -= isTitle ? 42 : 26;
      }
    }

    const outputBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, outputBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
