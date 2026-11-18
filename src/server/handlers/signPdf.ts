import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const signPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for signing');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPages();

    if (pages.length === 0) {
      throw new Error('PDF document has no pages.');
    }

    // Default to last page for signing
    const targetPageIndex = typeof options?.page === 'number' ? Math.min(options.page - 1, pages.length - 1) : pages.length - 1;
    const page = pages[Math.max(0, targetPageIndex)];
    const { width, height } = page.getSize();

    const signatureDataUrl = options?.signatureDataUrl;
    const signerName = options?.signerName || 'Digital Signature';
    const signerDate = options?.signerDate || new Date().toISOString().split('T')[0];

    // If canvas PNG drawing provided
    if (signatureDataUrl && signatureDataUrl.startsWith('data:image/png;base64,')) {
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      const embeddedSig = await pdfDoc.embedPng(imageBuffer);

      const sigWidth = 150;
      const sigHeight = (embeddedSig.height / embeddedSig.width) * sigWidth;
      const posX = options?.x ?? (width - sigWidth - 50);
      const posY = options?.y ?? 60;

      page.drawImage(embeddedSig, {
        x: posX,
        y: posY,
        width: sigWidth,
        height: sigHeight,
      });

      // Add signer date under signature
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      page.drawText(`Signed on ${signerDate}`, {
        x: posX,
        y: Math.max(20, posY - 14),
        size: 9,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    } else {
      // Typed signature fallback
      const italicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const posX = options?.x ?? (width - 180);
      const posY = options?.y ?? 70;

      page.drawText(signerName, {
        x: posX,
        y: posY,
        size: 22,
        font: italicFont,
        color: rgb(0.12, 0.22, 0.45), // Royal ink tone
      });

      page.drawText(`Digitally verified: ${signerDate}`, {
        x: posX,
        y: posY - 14,
        size: 8,
        font: regularFont,
        color: rgb(0.45, 0.4, 0.42),
      });
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `${baseName}_signed.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
