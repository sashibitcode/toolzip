import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import archiver from 'archiver';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { parsePageRanges } from '../utils/pageRange';

export const splitPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for splitting');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const bytes = fs.readFileSync(inputFile.filepath);
    const srcDoc = await PDFDocument.load(bytes);
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      throw new Error('The uploaded PDF has 0 pages.');
    }

    const mode = options?.mode || (options?.range ? 'range' : 'all');
    const rangeStr = options?.range;

    // Mode 1: Custom page range extracted into a single PDF
    if (mode === 'range' && rangeStr) {
      const indices = parsePageRanges(rangeStr, totalPages);
      if (indices.length === 0) {
        throw new Error(`No valid pages matched the range "${rangeStr}". Document has ${totalPages} page(s).`);
      }

      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((p) => newDoc.addPage(p));

      const newBytes = await newDoc.save();
      const outputFilename = `${baseName}_split.pdf`;
      const outputPath = path.join(outputDir, outputFilename);
      fs.writeFileSync(outputPath, newBytes);

      return {
        outputPath,
        outputFilename,
        mimeType: 'application/pdf',
      };
    }

    // Mode 2: Split all pages into individual PDFs and package as ZIP
    const singlePdfFiles: string[] = [];
    for (let i = 0; i < totalPages; i++) {
      const pageDoc = await PDFDocument.create();
      const [copiedPage] = await pageDoc.copyPages(srcDoc, [i]);
      pageDoc.addPage(copiedPage);

      const pageBytes = await pageDoc.save();
      const filename = `${baseName}_page_${i + 1}.pdf`;
      const filePath = path.join(outputDir, filename);
      fs.writeFileSync(filePath, pageBytes);
      singlePdfFiles.push(filename);
    }

    const zipFilename = `${baseName}_split_pages.zip`;
    const zipPath = path.join(outputDir, zipFilename);
    const outputStream = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    await new Promise<void>((resolve, reject) => {
      outputStream.on('close', () => resolve());
      archive.on('error', (err) => reject(err));
      archive.pipe(outputStream);

      for (const pdfFile of singlePdfFiles) {
        const fullPath = path.join(outputDir, pdfFile);
        archive.file(fullPath, { name: pdfFile });
      }

      archive.finalize();
    });

    return {
      outputPath: zipPath,
      outputFilename: zipFilename,
      mimeType: 'application/zip',
    };
  },
};
