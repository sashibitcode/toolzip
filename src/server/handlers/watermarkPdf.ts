import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const watermarkPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for watermarking');
    }

    const watermarkText = options?.text || 'CONFIDENTIAL';
    const angle = Number(options?.angle ?? 45);
    const opacity = Number(options?.opacity ?? 0.28);
    const fontSize = Number(options?.fontSize ?? 48);

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(watermarkText, {
        x: width / 2 - textWidth / 2,
        y: height / 2 - textHeight / 4,
        size: fontSize,
        font,
        color: rgb(0.55, 0.15, 0.2), // Deep crimson tone watermark
        opacity,
        rotate: degrees(angle),
      });
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `${baseName}_watermarked.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
