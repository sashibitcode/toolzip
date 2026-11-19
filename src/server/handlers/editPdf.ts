import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ToolHandler, ConversionContext, ConversionResult } from './types';
import { execSafe, hasBinary } from '../utils/execHelper';

export interface ReplacedSpanEdit {
  pageIndex: number;
  bbox: [number, number, number, number];
  origin: [number, number];
  originalText: string;
  newText: string;
  font: string;
  size: number;
  colorHex: string;
}

export interface AddedTextEdit {
  pageIndex: number;
  x: number;
  y: number;
  text: string;
  font: string;
  size: number;
  colorHex: string;
}

export interface WhiteoutEdit {
  pageIndex: number;
  bbox: [number, number, number, number];
  fillHex?: string;
}

export interface PdfEditsPayload {
  replacedSpans?: ReplacedSpanEdit[];
  addedTexts?: AddedTextEdit[];
  whiteouts?: WhiteoutEdit[];
}

function parseHexColor(hexStr?: string) {
  let hex = (hexStr || '#000000').replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) {
    return rgb(0, 0, 0);
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export const editPdfHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir, options } = context;

    if (!inputFiles || inputFiles.length === 0) {
      throw new Error('No input PDF file provided');
    }

    const inputFile = inputFiles[0];
    const baseName = path.parse(inputFile.originalFilename).name;
    const outputFilename = `${baseName}_edited.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    const edits: PdfEditsPayload = (options?.edits as PdfEditsPayload) || {
      replacedSpans: [],
      addedTexts: [],
      whiteouts: [],
    };

    const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));
    if (hasPython) {
      const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';
      const editsJsonPath = path.join(outputDir, `edits_${Date.now()}.json`);
      fs.writeFileSync(editsJsonPath, JSON.stringify(edits));

      const pyScript = `
import sys, json
try:
    import pymupdf as fitz
except ImportError:
    import fitz

pdf_in = sys.argv[1]
pdf_out = sys.argv[2]
edits_json_path = sys.argv[3]

with open(edits_json_path, "r", encoding="utf-8") as f:
    edits = json.load(f)

doc = fitz.open(pdf_in)
replaced_spans = edits.get("replacedSpans", [])
added_texts = edits.get("addedTexts", [])
whiteouts = edits.get("whiteouts", [])

def map_font(font_name):
    fn = (font_name or "").lower()
    if "times" in fn or "serif" in fn:
        if "bold" in fn and "italic" in fn: return "tibi"
        if "bold" in fn: return "tibo"
        if "italic" in fn: return "tiit"
        return "tiro"
    elif "courier" in fn or "mono" in fn:
        if "bold" in fn and "italic" in fn: return "cobi"
        if "bold" in fn: return "cobo"
        if "italic" in fn: return "coit"
        return "cour"
    else:
        if "bold" in fn and "italic" in fn: return "hebi"
        if "bold" in fn: return "hebo"
        if "italic" in fn: return "heit"
        return "helv"

def hex_to_rgb(hex_str):
    h = (hex_str or "#000000").lstrip("#")
    if len(h) == 3:
        h = "".join([c*2 for c in h])
    if len(h) != 6:
        return (0.0, 0.0, 0.0)
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))

for w in whiteouts:
    p_idx = w.get("pageIndex", 0)
    if p_idx < len(doc):
        page = doc[p_idx]
        bbox = w.get("bbox", [0, 0, 0, 0])
        rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
        fill_rgb = hex_to_rgb(w.get("fillHex", "#ffffff"))
        page.draw_rect(rect, color=fill_rgb, fill=fill_rgb)

for r in replaced_spans:
    p_idx = r.get("pageIndex", 0)
    if p_idx < len(doc):
        page = doc[p_idx]
        bbox = r.get("bbox", [0, 0, 0, 0])
        rect = fitz.Rect(bbox[0] - 0.5, bbox[1] - 0.5, bbox[2] + 0.5, bbox[3] + 0.5)
        page.add_redact_annot(rect, fill=(1, 1, 1))
        page.apply_redactions()

        origin = r.get("origin", [bbox[0], bbox[3]])
        new_text = r.get("newText", "")
        font_key = map_font(r.get("font", "helv"))
        font_size = float(r.get("size", 12))
        rgb_col = hex_to_rgb(r.get("colorHex", "#000000"))
        page.insert_text((origin[0], origin[1]), new_text, fontname=font_key, fontsize=font_size, color=rgb_col)

for a in added_texts:
    p_idx = a.get("pageIndex", 0)
    if p_idx < len(doc):
        page = doc[p_idx]
        x = float(a.get("x", 50))
        y = float(a.get("y", 50))
        text = a.get("text", "")
        font_key = map_font(a.get("font", "helv"))
        font_size = float(a.get("size", 14))
        rgb_col = hex_to_rgb(a.get("colorHex", "#000000"))
        page.insert_text((x, y), text, fontname=font_key, fontsize=font_size, color=rgb_col)

doc.save(pdf_out, garbage=4, deflate=True)
doc.close()
`;
      try {
        await execSafe(pythonBin, ['-c', pyScript, inputFile.filepath, outputPath, editsJsonPath], {
          timeoutMs: 90000,
        });

        try {
          fs.unlinkSync(editsJsonPath);
        } catch {}

        if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
          return {
            outputPath,
            outputFilename,
            mimeType: 'application/pdf',
          };
        }
      } catch (err: any) {
        console.warn('Python edit-pdf failed, falling back to pure Node pdf-lib engine:', err);
        try {
          fs.unlinkSync(editsJsonPath);
        } catch {}
      }
    }

    // Pure Node.js fallback via pdf-lib (100% Vercel Serverless compatible)
    const inBytes = fs.readFileSync(inputFile.filepath);
    const pdfDoc = await PDFDocument.load(inBytes, { ignoreEncryption: true });

    const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const times = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const courier = await pdfDoc.embedFont(StandardFonts.Courier);

    const selectFont = (fontName?: string) => {
      const fn = (fontName || '').toLowerCase();
      if (fn.includes('times') || fn.includes('serif')) {
        return fn.includes('bold') ? timesBold : times;
      }
      if (fn.includes('courier') || fn.includes('mono')) {
        return courier;
      }
      if (fn.includes('bold')) return helvBold;
      if (fn.includes('italic') || fn.includes('oblique')) return helvItalic;
      return helv;
    };

    const pages = pdfDoc.getPages();

    // 1. Whiteouts
    for (const w of edits.whiteouts || []) {
      const pIdx = w.pageIndex;
      if (pIdx < pages.length) {
        const page = pages[pIdx];
        const { height } = page.getSize();
        const [x0, y0, x1, y1] = w.bbox;
        const rectW = Math.max(1, x1 - x0);
        const rectH = Math.max(1, y1 - y0);
        const pdfY = height - y1;
        page.drawRectangle({
          x: x0,
          y: Math.max(0, pdfY),
          width: rectW,
          height: rectH,
          color: parseHexColor(w.fillHex || '#ffffff'),
        });
      }
    }

    // 2. Replaced Spans (Whiteout old text + draw new text)
    for (const r of edits.replacedSpans || []) {
      const pIdx = r.pageIndex;
      if (pIdx < pages.length) {
        const page = pages[pIdx];
        const { height } = page.getSize();
        const [x0, y0, x1, y1] = r.bbox;
        const rectW = Math.max(1, x1 - x0);
        const rectH = Math.max(1, y1 - y0);
        const pdfY = height - y1;

        // Cover the old text completely with a crisp white rectangle
        page.drawRectangle({
          x: Math.max(0, x0 - 1),
          y: Math.max(0, pdfY - 1),
          width: rectW + 2,
          height: rectH + 2,
          color: rgb(1, 1, 1),
        });

        // Insert new text
        const textY = height - r.origin[1];
        const font = selectFont(r.font);
        page.drawText(r.newText, {
          x: r.origin[0],
          y: textY,
          size: r.size || 12,
          font,
          color: parseHexColor(r.colorHex),
        });
      }
    }

    // 3. Added Texts
    for (const a of edits.addedTexts || []) {
      const pIdx = a.pageIndex;
      if (pIdx < pages.length) {
        const page = pages[pIdx];
        const { height } = page.getSize();
        const font = selectFont(a.font);
        const textY = height - a.y - (a.size || 14);
        page.drawText(a.text, {
          x: a.x,
          y: Math.max(10, textY),
          size: a.size || 14,
          font,
          color: parseHexColor(a.colorHex),
        });
      }
    }

    const outputBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, outputBytes);

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
