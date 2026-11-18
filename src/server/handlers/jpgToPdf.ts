import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const jpgToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input image files provided');
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of inputFiles) {
      const bytes = fs.readFileSync(file.filepath);
      const ext = path.extname(file.originalFilename).toLowerCase();

      let embeddedImage;
      try {
        if (ext === '.png') {
          embeddedImage = await pdfDoc.embedPng(bytes);
        } else {
          // Default to JPG embedding
          embeddedImage = await pdfDoc.embedJpg(bytes);
        }
      } catch (err: any) {
        // If png failed, try jpg or vice versa in case extension was mismatched
        try {
          embeddedImage = await pdfDoc.embedJpg(bytes);
        } catch {
          embeddedImage = await pdfDoc.embedPng(bytes);
        }
      }

      // Add page with matching dimensions
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
