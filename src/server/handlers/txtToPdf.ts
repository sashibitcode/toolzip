import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const txtToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input text file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const textContent = fs.readFileSync(inputFile.filepath, 'utf-8');

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28; // A4
    const pageHeight = 841.89; // A4
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const rawLines = textContent.replace(/\r\n/g, '\n').split('\n');
    const wrappedLines: string[] = [];

    for (const rawLine of rawLines) {
      if (rawLine.trim() === '') {
        wrappedLines.push('');
        continue;
      }
      const words = rawLine.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width <= contentWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) wrappedLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }

    const maxLinesPerPage = Math.floor(contentHeight / lineHeight);
    let lineIndex = 0;

    while (lineIndex < wrappedLines.length || wrappedLines.length === 0) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      for (let i = 0; i < maxLinesPerPage && lineIndex < wrappedLines.length; i++, lineIndex++) {
        const line = wrappedLines[lineIndex];
        if (line) {
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font,
            color: rgb(0.15, 0.12, 0.14),
          });
        }
        currentY -= lineHeight;
      }

      if (wrappedLines.length === 0) break;
    }

    const pdfBytes = await pdfDoc.save();
    const outputFilename = `${baseName}.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
