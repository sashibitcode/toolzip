import fs from 'fs';
import path from 'path';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const unlockPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided to unlock');
    }

    const password = options?.password || '';
    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}_unlocked.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));
    if (hasPython) {
      const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
      const script = `
import sys
try:
    import pymupdf as fitz
    doc = fitz.open(sys.argv[1])
    if doc.is_encrypted:
        auth = doc.authenticate(sys.argv[3])
        if auth <= 0:
            sys.stderr.write("Incorrect password. Please verify and try again.\\n")
            sys.exit(2)
    doc.save(sys.argv[2])
    doc.close()
except Exception as e:
    import pypdf
    reader = pypdf.PdfReader(sys.argv[1])
    if reader.is_encrypted:
        if not reader.decrypt(sys.argv[3]):
            sys.stderr.write("Incorrect password. Please verify and try again.\\n")
            sys.exit(2)
    writer = pypdf.PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    with open(sys.argv[2], "wb") as f:
        writer.write(f)
`;

      try {
        await execSafe(pythonBin, ['-c', script, inputFile.filepath, outputPath, password], {
          timeoutMs: 30000,
        });

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/pdf',
          };
        }
      } catch (err: any) {
        if (err?.message?.includes('Incorrect password')) {
          throw new Error('Incorrect password. Please check the document password and try again.');
        }
        console.warn('Python decrypt failed, falling back to pure Node engine:', err);
      }
    }

    // Pure Node.js decryption engine (100% Vercel Serverless compatible)
    const inBytes = fs.readFileSync(inputFile.filepath);
    const { decryptPDF } = await import('@localonlytools/pdf-decrypt');

    try {
      const decryptedBytes = await decryptPDF(new Uint8Array(inBytes), password);
      fs.writeFileSync(outputPath, Buffer.from(decryptedBytes));
    } catch (err: any) {
      if (
        err?.message?.toLowerCase().includes('password') ||
        err?.message?.toLowerCase().includes('match')
      ) {
        throw new Error('Incorrect password. Please check the document password and try again.');
      }
      throw err;
    }

    if (!fs.existsSync(outputPath)) {
      throw new Error('Unlocking failed to produce output document.');
    }

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
