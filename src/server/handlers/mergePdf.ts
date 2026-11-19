import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const mergePdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF files provided for merging');
    }

    const mergedDoc = await PDFDocument.create();

    for (const file of inputFiles) {
      const bytes = fs.readFileSync(file.filepath);
      let srcDoc: PDFDocument;
      try {
        srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch (loadErr: any) {
        throw new Error(
          `Unable to open "${file.originalFilename}". The file may be password-protected or corrupted.`
        );
      }
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    const mergedBytes = await mergedDoc.save();
    const outputFilename = 'merged.pdf';
    const outputPath = path.join(outputDir, outputFilename);

    fs.writeFileSync(outputPath, mergedBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
