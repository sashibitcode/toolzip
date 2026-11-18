import { ToolHandler } from './types';
import { jpgToPdfHandler } from './jpgToPdf';
import { wordToPdfHandler } from './wordToPdf';
import { powerpointToPdfHandler } from './powerpointToPdf';
import { excelToPdfHandler } from './excelToPdf';
import { htmlToPdfHandler } from './htmlToPdf';
import { pdfToJpgHandler } from './pdfToJpg';
import { pdfToWordHandler } from './pdfToWord';
import { pdfToPowerpointHandler } from './pdfToPowerpoint';
import { pdfToExcelHandler } from './pdfToExcel';
import { pdfToPdfaHandler } from './pdfToPdfa';
import { editPdfHandler } from './editPdf';
import { mergePdfHandler } from './mergePdf';
import { splitPdfHandler } from './splitPdf';
import { rotatePdfHandler } from './rotatePdf';
import { deletePdfPagesHandler } from './deletePdfPages';
import { extractPdfPagesHandler } from './extractPdfPages';
import { organizePdfHandler } from './organizePdf';
import { compressPdfHandler } from './compressPdf';
import { protectPdfHandler } from './protectPdf';
import { unlockPdfHandler } from './unlockPdf';
import { watermarkPdfHandler } from './watermarkPdf';
import { numberPagesHandler } from './numberPages';
import { flattenPdfHandler } from './flattenPdf';
import { pdfToPngHandler } from './pdfToPng';
import { pngToPdfHandler } from './pngToPdf';
import { txtToPdfHandler } from './txtToPdf';
import { signPdfHandler } from './signPdf';

/**
 * Handler registry mapping handlerName from tools.config.ts to implementation
 * To add a new tool:
 * 1. Create your handler in src/server/handlers/myNewTool.ts
 * 2. Register it below
 * 3. Add tool definition to src/config/tools.config.ts
 */
export const toolHandlers: Record<string, ToolHandler> = {
  jpgToPdf: jpgToPdfHandler,
  wordToPdf: wordToPdfHandler,
  powerpointToPdf: powerpointToPdfHandler,
  excelToPdf: excelToPdfHandler,
  htmlToPdf: htmlToPdfHandler,
  pdfToJpg: pdfToJpgHandler,
  pdfToWord: pdfToWordHandler,
  pdfToPowerpoint: pdfToPowerpointHandler,
  pdfToExcel: pdfToExcelHandler,
  pdfToPdfa: pdfToPdfaHandler,
  editPdf: editPdfHandler,
  mergePdf: mergePdfHandler,
  splitPdf: splitPdfHandler,
  rotatePdf: rotatePdfHandler,
  deletePdfPages: deletePdfPagesHandler,
  extractPdfPages: extractPdfPagesHandler,
  organizePdf: organizePdfHandler,
  compressPdf: compressPdfHandler,
  protectPdf: protectPdfHandler,
  unlockPdf: unlockPdfHandler,
  watermarkPdf: watermarkPdfHandler,
  numberPages: numberPagesHandler,
  flattenPdf: flattenPdfHandler,
  pdfToPng: pdfToPngHandler,
  pngToPdf: pngToPdfHandler,
  txtToPdf: txtToPdfHandler,
  signPdf: signPdfHandler,
};

export function getHandler(handlerName: string): ToolHandler | undefined {
  return toolHandlers[handlerName];
}

export * from './types';
