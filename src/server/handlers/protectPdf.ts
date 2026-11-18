import fs from 'fs';
import path from 'path';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const protectPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided to protect');
    }

    const password = options?.password;
    if (!password || typeof password !== 'string' || password.trim() === '') {
      throw new Error('Please provide a secure password to encrypt this document.');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}_protected.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));
    if (!hasPython) {
      throw new Error('AES-256 PDF encryption engine requires Python environment on server.');
    }

    const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
    const script = `
import sys
try:
    import pymupdf as fitz
    doc = fitz.open(sys.argv[1])
    doc.save(sys.argv[2], encryption=fitz.PDF_ENCRYPT_AES_256, user_pw=sys.argv[3], owner_pw=sys.argv[3])
    doc.close()
except Exception:
    import pypdf
    reader = pypdf.PdfReader(sys.argv[1])
    writer = pypdf.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(sys.argv[3], algorithm="AES-256")
    with open(sys.argv[2], "wb") as f:
        writer.write(f)
`;

    await execSafe(pythonBin, ['-c', script, inputFile.filepath, outputPath, password], { timeoutMs: 30000 });

    if (!fs.existsSync(outputPath)) {
      throw new Error('Encryption failed to produce output document.');
    }

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
