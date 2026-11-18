import fs from 'fs';
import path from 'path';
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
    if (!hasPython) {
      throw new Error('Python with PyMuPDF is required for saving vector PDF edits.');
    }

    const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';

    // Temporary JSON file containing all edits instructions
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

# Map standard font names to PyMuPDF core standard fonts
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
        # Default Helvetica / Sans-serif
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

# 1. Apply Whiteouts
for w in whiteouts:
    p_idx = w.get("pageIndex", 0)
    if p_idx < len(doc):
        page = doc[p_idx]
        bbox = w.get("bbox", [0, 0, 0, 0])
        rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
        fill_rgb = hex_to_rgb(w.get("fillHex", "#ffffff"))
        page.draw_rect(rect, color=fill_rgb, fill=fill_rgb)

# 2. Redact Old Spans and Insert Replacement Text
for r in replaced_spans:
    p_idx = r.get("pageIndex", 0)
    if p_idx < len(doc):
        page = doc[p_idx]
        bbox = r.get("bbox", [0, 0, 0, 0])
        # Expand slightly to completely clear background font artifacts
        rect = fitz.Rect(bbox[0] - 0.5, bbox[1] - 0.5, bbox[2] + 0.5, bbox[3] + 0.5)
        page.add_redact_annot(rect, fill=(1, 1, 1))
        page.apply_redactions()

        origin = r.get("origin", [bbox[0], bbox[3]])
        new_text = r.get("newText", "")
        font_key = map_font(r.get("font", "helv"))
        font_size = float(r.get("size", 12))
        rgb = hex_to_rgb(r.get("colorHex", "#000000"))

        page.insert_text((origin[0], origin[1]), new_text, fontname=font_key, fontsize=font_size, color=rgb)

# 3. Insert newly added text elements
for a in added_texts:
    p_idx = a.get("pageIndex", 0)
    if p_idx < len(doc):
        page = doc[p_idx]
        x = float(a.get("x", 50))
        y = float(a.get("y", 50))
        text = a.get("text", "")
        font_key = map_font(a.get("font", "helv"))
        font_size = float(a.get("size", 14))
        rgb = hex_to_rgb(a.get("colorHex", "#000000"))

        page.insert_text((x, y), text, fontname=font_key, fontsize=font_size, color=rgb)

doc.save(pdf_out, garbage=4, deflate=True)
doc.close()
print("PDF_EDITS_APPLIED_SUCCESS")
`;

    try {
      await execSafe(pythonBin, ['-c', pyScript, inputFile.filepath, outputPath, editsJsonPath], {
        timeoutMs: 90000,
      });

      try {
        fs.unlinkSync(editsJsonPath);
      } catch {}

      if (!fs.existsSync(outputPath)) {
        throw new Error('Modified PDF file was not created.');
      }

      return {
        outputPath,
        outputFilename,
        mimeType: 'application/pdf',
      };
    } catch (err: any) {
      try {
        fs.unlinkSync(editsJsonPath);
      } catch {}
      throw err;
    }
  },
};
