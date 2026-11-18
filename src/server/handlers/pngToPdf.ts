import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const pngToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PNG images provided');
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of inputFiles) {
      const bytes = fs.readFileSync(file.filepath);
      let embeddedImage;
      try {
        embeddedImage = await pdfDoc.embedPng(bytes);
      } catch {
        embeddedImage = await pdfDoc.embedJpg(bytes);
      }

      const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const baseName = path.parse(inputFiles[0].originalFilename).name;
    const outputFilename = `${baseName}_converted.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, pdfBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
