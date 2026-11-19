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

  if (hasPython) {
    try {
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
    
    pix = page.get_pixmap(dpi=150)
    img_b64 = base64.b64encode(pix.tobytes("jpeg")).decode("utf-8")
    
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

      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = execRes.stdout.substring(startIdx + startMarker.length, endIdx).trim();
        return JSON.parse(jsonStr) as ParsedPdfDocument;
      }
    } catch (err) {
      console.warn('Python PDF parser failed, falling back to pure Node engine:', err);
    }
  }

  // Pure Node.js fallback via pdf-parse & Mozilla PDF.js
  const pdfBytes = fs.readFileSync(pdfPath);
  const { PDFParse } = await import('pdf-parse');
  const parser = new (PDFParse as any)({ data: new Uint8Array(pdfBytes) });

  try {
    const screenshot = await parser.getScreenshot({ scale: 1.5 });
    await parser.load();

    const pagesData: ParsedPage[] = [];
    const totalPages = parser.doc?.numPages || 1;

    for (let i = 1; i <= totalPages; i++) {
      const page = await parser.doc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const spans: TextSpan[] = [];
      let spanCounter = 0;

      for (const item of content.items) {
        const text = (item as any).str || '';
        if (!text.trim()) continue;

        const transform = (item as any).transform || [12, 0, 0, 12, 0, 0];
        const x = transform[4] || 0;
        const y = transform[5] || 0;
        const w = (item as any).width || 0;
        const h = (item as any).height || Math.abs(transform[3]) || 12;

        // Convert bottom-up PDF coordinates to top-down web coordinates
        const y0 = Math.max(0, viewport.height - y - h);
        const y1 = Math.max(0, viewport.height - y);
        const x0 = x;
        const x1 = x + w;
        const fontName = (item as any).fontName || 'Helvetica';

        spans.push({
          id: `p${i - 1}_s${spanCounter++}`,
          pageIndex: i - 1,
          text,
          bbox: [
            parseFloat(x0.toFixed(2)),
            parseFloat(y0.toFixed(2)),
            parseFloat(x1.toFixed(2)),
            parseFloat(y1.toFixed(2)),
          ],
          origin: [parseFloat(x0.toFixed(2)), parseFloat(y1.toFixed(2))],
          font: fontName,
          size: parseFloat(h.toFixed(1)),
          colorHex: '#000000',
          isBold: fontName.toLowerCase().includes('bold'),
          isItalic:
            fontName.toLowerCase().includes('oblique') || fontName.toLowerCase().includes('italic'),
        });
      }

      const shotPage = screenshot.pages.find((p: any) => p.pageNumber === i);
      pagesData.push({
        pageIndex: i - 1,
        width: parseFloat(viewport.width.toFixed(2)),
        height: parseFloat(viewport.height.toFixed(2)),
        imageBase64: shotPage?.dataUrl || '',
        spans,
      });

      try {
        page.cleanup();
      } catch {}
    }

    return {
      pageCount: pagesData.length,
      pages: pagesData,
    };
  } finally {
    try {
      await parser.destroy();
    } catch {}
  }
}
