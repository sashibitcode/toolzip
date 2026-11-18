import fs from 'fs';
import path from 'path';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export const powerpointToPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PowerPoint file provided');
    }

    const inputFile = inputFiles[0];
    const isSofficeAvailable = (await hasBinary('soffice')) || (await hasBinary('libreoffice'));

    if (isSofficeAvailable) {
      const binary = (await hasBinary('soffice')) ? 'soffice' : 'libreoffice';
      await execSafe(binary, [
        '--headless',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        inputFile.filepath,
      ], { timeoutMs: 60000 });

      const generatedFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.pdf'));
      if (generatedFiles.length > 0) {
        const actualOutputFile = path.join(outputDir, generatedFiles[0]);
        return {
          outputPath: actualOutputFile,
          outputFilename: generatedFiles[0],
          mimeType: 'application/pdf',
        };
      }
    }

    throw new Error(
      'LibreOffice is required for PowerPoint to PDF conversion. Please run TOOLZIP via Docker (`docker compose up`) where LibreOffice is pre-configured, or install LibreOffice on your host system.'
    );
  },
};
