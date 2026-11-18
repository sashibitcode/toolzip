import fs from 'fs';
import path from 'path';
import { execSafe, hasBinary } from './execHelper';

export interface TextSpan {
  id: string;
  pageIndex: number;
  text: string;
  bbox: [number, number, number, number]; // [x0, y0, x1, y1]
  origin: [number, number]; // baseline point [x, y]
  font: string;
  size: number;
  colorHex: string;
  isBold: boolean;
  isItalic: boolean;
}

export interface ParsedPage {
  pageIndex: number;
  width: number;
  height: number;
  imageBase64: string;
  spans: TextSpan[];
}

export interface ParsedPdfDocument {
  pageCount: number;
  pages: ParsedPage[];
}

export async function parsePdfForEditing(pdfPath: string): Promise<ParsedPdfDocument> {
  const hasPython = (await hasBinary('python')) || (await hasBinary('python3'));
  if (!hasPython) {
    throw new Error('Python with PyMuPDF is required for direct PDF text editing and parsing.');
  }

  const pythonBin = (await hasBinary('python')) ? 'python' : 'python3';

  const pyScript = `
import sys, json, base64
try:
    import pymupdf as fitz
except ImportError:
    import fitz

pdf_path = sys.argv[1]
doc = fitz.open(pdf_path)
pages_data = []

for page_idx, page in enumerate(doc):
    rect = page.rect
    width = rect.width
    height = rect.height
    
    # 1. Render high quality preview image
    pix = page.get_pixmap(dpi=150)
    img_b64 = base64.b64encode(pix.tobytes("jpeg")).decode("utf-8")
    
    # 2. Extract detailed text spans with font, size, color, bbox
    d = page.get_text("dict")
    spans_list = []
    span_counter = 0
    
    for b_idx, b in enumerate(d.get("blocks", [])):
        if "lines" in b:
            for l_idx, l in enumerate(b["lines"]):
                for s_idx, s in enumerate(l["spans"]):
                    text = s.get("text", "")
                    if not text.strip():
                        continue
                        
                    raw_color = s.get("color", 0)
                    r = (raw_color >> 16) & 255
                    g = (raw_color >> 8) & 255
                    b_col = raw_color & 255
                    hex_color = f"#{r:02x}{g:02x}{b_col:02x}"
                    
                    bbox = [float(round(v, 2)) for v in s.get("bbox", [0, 0, 0, 0])]
                    origin = [float(round(v, 2)) for v in s.get("origin", [bbox[0], bbox[3]])]
                    font = s.get("font", "Helvetica")
                    size = float(round(s.get("size", 12), 1))
                    flags = s.get("flags", 0)
                    
                    spans_list.append({
                        "id": f"p{page_idx}_s{span_counter}",
                        "pageIndex": page_idx,
                        "text": text,
                        "bbox": bbox,
                        "origin": origin,
                        "font": font,
                        "size": size,
                        "colorHex": hex_color,
                        "isBold": bool(flags & 16),
                        "isItalic": bool(flags & 2)
                    })
                    span_counter += 1
                    
    pages_data.append({
        "pageIndex": page_idx,
        "width": float(round(width, 2)),
        "height": float(round(height, 2)),
        "imageBase64": f"data:image/jpeg;base64,{img_b64}",
        "spans": spans_list
    })

print("===JSON_OUTPUT_START===")
print(json.dumps({"pageCount": len(pages_data), "pages": pages_data}))
print("===JSON_OUTPUT_END===")
`;

  const execRes = await execSafe(pythonBin, ['-c', pyScript, pdfPath], { timeoutMs: 90000 });
  const startMarker = '===JSON_OUTPUT_START===';
  const endMarker = '===JSON_OUTPUT_END===';
  const startIdx = execRes.stdout.indexOf(startMarker);
  const endIdx = execRes.stdout.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Failed to parse PDF document output from parser.');
  }

  const jsonStr = execRes.stdout.substring(startIdx + startMarker.length, endIdx).trim();
  return JSON.parse(jsonStr) as ParsedPdfDocument;
}
