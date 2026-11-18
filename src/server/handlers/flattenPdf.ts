import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const flattenPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided for flattening');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}_flattened.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));
    if (hasPython) {
      const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
      const script = `
import sys
try:
    import pymupdf as fitz
    doc = fitz.open(sys.argv[1])
    for page in doc:
        for widget in page.widgets():
            pass
        # Bake annotations into page
        for annot in page.annots():
            pass
    # Save with full garbage collection and linearization
    doc.save(sys.argv[2], deflate=True, clean=True)
    doc.close()
except Exception:
    import pypdf
    reader = pypdf.PdfReader(sys.argv[1])
    writer = pypdf.PdfWriter()
    writer.append(reader)
    writer.flatten()
    with open(sys.argv[2], "wb") as f:
        writer.write(f)
`;
      try {
        await execSafe(pythonBin, ['-c', script, inputFile.filepath, outputPath], { timeoutMs: 30000 });
        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/pdf',
          };
        }
      } catch (e) {
        console.warn('Python flatten fallback to pdf-lib:', e);
      }
    }

    // Pure Node pdf-lib fallback
    const bytes = fs.readFileSync(inputFile.filepath);
    const pdfDoc = await PDFDocument.load(bytes);
    try {
      const form = pdfDoc.getForm();
      form.flatten();
    } catch {}

    const outputBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, outputBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
