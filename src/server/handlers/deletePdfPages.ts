import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { parsePageRanges } from '../utils/pageRange';

export const deletePdfPagesHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const srcDoc = await PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('The uploaded PDF has 0 pages.');
    }

    const pagesToDeleteStr = options?.pagesToDelete || options?.pages || '';
    if (!pagesToDeleteStr.trim()) {
      throw new Error('Please specify the page number(s) to remove (e.g. "2" or "2, 4-6").');
    }

    const deleteIndicesSet = new Set(parsePageRanges(pagesToDeleteStr, totalPages));

    if (deleteIndicesSet.size === 0) {
      throw new Error(`No matching pages to delete in range "${pagesToDeleteStr}". Document has ${totalPages} page(s).`);
    }

    if (deleteIndicesSet.size >= totalPages) {
      throw new Error('Cannot delete all pages. At least one page must remain in the PDF.');
    }

    const keepIndices = Array.from({ length: totalPages }, (_, i) => i).filter(
      (idx) => !deleteIndicesSet.has(idx)
    );

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, keepIndices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    const newBytes = await newDoc.save();
    const outputFilename = `${baseName}_pages_removed.pdf`;
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, newBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
