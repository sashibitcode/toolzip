import fs from 'fs';
import path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const numberPagesHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for numbering');
    }

    const position = options?.position || 'bottom-center';
    const format = options?.format || 'page-of-total';
    const fontSize = Number(options?.fontSize ?? 10);

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();
      const pageNum = i + 1;

      let text = `Page ${pageNum} of ${totalPages}`;
      if (format === 'slash') {
        text = `${pageNum} / ${totalPages}`;
      } else if (format === 'number-only') {
        text = `${pageNum}`;
      }

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      let x = width / 2 - textWidth / 2;
      let y = 25;

      if (position === 'bottom-right') {
        x = width - textWidth - 40;
        y = 25;
      } else if (position === 'bottom-left') {
        x = 40;
        y = 25;
      } else if (position === 'top-center') {
        x = width / 2 - textWidth / 2;
        y = height - 35;
      } else if (position === 'top-right') {
        x = width - textWidth - 40;
        y = height - 35;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.25, 0.2, 0.22),
      });
    }

    const outputBytes = await pdfDoc.save();
    const outputFilename = `${baseName}_numbered.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, outputBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
