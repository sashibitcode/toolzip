'use client';

import { useState, useRef, MouseEvent } from 'react';
import {
  UploadCloud,
  Type,
  Eraser,
  Download,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { TextSpan, ParsedPage, ParsedPdfDocument } from '@/server/utils/pdfParser';
import { ReplacedSpanEdit, AddedTextEdit, WhiteoutEdit } from '@/server/handlers/editPdf';

export default function PdfEditorStudio() {
  // Upload and parsing state
  const [, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedPdfDocument | null>(null);

  // Studio canvas state
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [activeTool, setActiveTool] = useState<'edit' | 'add-text' | 'whiteout'>('edit');

  // Currently active selected/editing span
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  // Current styling toolbar properties
  const [currentFont, setCurrentFont] = useState('Helvetica');
  const [currentSize, setCurrentSize] = useState(14);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  // User edits state
  const [editsMap, setEditsMap] = useState<Record<string, string>>({}); // spanId -> newText
  const [spanStylesMap, setSpanStylesMap] = useState<Record<string, { font: string; size: number; colorHex: string }>>({});
  const [addedTexts, setAddedTexts] = useState<AddedTextEdit[]>([]);
  const [whiteouts, setWhiteouts] = useState<WhiteoutEdit[]>([]);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ downloadUrl: string; fileData?: string; filename: string; size: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Handle uploading and parsing
  const handleFileUpload = async (selectedFile: File) => {
    setParseError(null);
    setFile(selectedFile);
    setIsParsing(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('/api/pdf/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse PDF document.');
      }

      setJobId(data.jobId);
      setParsedDoc(data.parsedDoc);
      setCurrentPageIndex(0);
    } catch (err: any) {
      setParseError(err?.message || 'Error uploading and parsing PDF.');
    } finally {
      setIsParsing(false);
    }
  };

  const currentPage: ParsedPage | undefined = parsedDoc?.pages[currentPageIndex];

  // When a text span is clicked in edit mode:
  const handleSpanClick = (span: TextSpan) => {
    setSelectedSpanId(span.id);

    // Auto-detect and populate styling from the original span!
    const activeStyle = spanStylesMap[span.id] || {
      font: span.font,
      size: span.size,
      colorHex: span.colorHex,
    };

    setCurrentFont(activeStyle.font);
    setCurrentSize(activeStyle.size);
    setCurrentColor(activeStyle.colorHex);
    setIsBold(span.isBold);
    setIsItalic(span.isItalic);
  };

  const handleSpanTextChange = (spanId: string, newText: string) => {
    setEditsMap((prev) => ({ ...prev, [spanId]: newText }));
  };

  // Canvas click in "add-text" or "whiteout" mode
  const handleCanvasClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!currentPage || !canvasContainerRef.current) return;

    if (activeTool === 'add-text') {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const pdfX = (clickX / rect.width) * currentPage.width;
      const pdfY = (clickY / rect.height) * currentPage.height;

      const newTextItem: AddedTextEdit = {
        pageIndex: currentPageIndex,
        x: Math.round(pdfX),
        y: Math.round(pdfY),
        text: 'Type new text here',
        font: currentFont,
        size: currentSize,
        colorHex: currentColor,
      };

      setAddedTexts((prev) => [...prev, newTextItem]);
    } else if (activeTool === 'whiteout') {
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const pdfX = (clickX / rect.width) * currentPage.width;
      const pdfY = (clickY / rect.height) * currentPage.height;

      const newWhiteout: WhiteoutEdit = {
        pageIndex: currentPageIndex,
        bbox: [pdfX, pdfY, pdfX + 120, pdfY + 25],
        fillHex: '#ffffff',
      };

      setWhiteouts((prev) => [...prev, newWhiteout]);
    }
  };

  // Save edits and generate output PDF
  const handleSaveEdits = async () => {
    if (!jobId || !parsedDoc) return;

    setIsSaving(true);
    setSaveError(null);

    const replacedSpans: ReplacedSpanEdit[] = [];
    for (const page of parsedDoc.pages) {
      for (const span of page.spans) {
        if (span.id in editsMap && editsMap[span.id] !== span.text) {
          const style = spanStylesMap[span.id] || {
            font: span.font,
            size: span.size,
            colorHex: span.colorHex,
          };

          replacedSpans.push({
            pageIndex: page.pageIndex,
            bbox: span.bbox,
            origin: span.origin,
            originalText: span.text,
            newText: editsMap[span.id],
            font: style.font,
            size: style.size,
            colorHex: style.colorHex,
          });
        }
      }
    }

    try {
      const res = await fetch('/api/pdf/save-edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          edits: {
            replacedSpans,
            addedTexts,
            whiteouts,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save modifications.');
      }

      setSaveResult(data);
    } catch (err: any) {
      setSaveError(err?.message || 'Error occurred while saving modifications.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditsMap({});
    setSpanStylesMap({});
    setAddedTexts([]);
    setWhiteouts([]);
    setSelectedSpanId(null);
    setSaveResult(null);
    setSaveError(null);
  };

  // 1. Initial State: Upload Dropzone
  if (!parsedDoc) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer p-10 sm:p-14 rounded-2xl border-2 border-dashed border-primary/50 hover:border-primary bg-surface hover:bg-ivory/50 shadow-card text-center flex flex-col items-center justify-center transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="w-14 h-14 rounded-2xl bg-ivory border border-warmborder text-primary flex items-center justify-center mb-4">
            <UploadCloud className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-serif font-bold text-primary-dark mb-1">
            Upload PDF to Edit Directly
          </h3>

          <p className="text-xs text-ink-secondary max-w-sm mb-5 leading-relaxed">
            Click on any existing text to edit it in the exact same font family, size, and color.
          </p>

          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-sm transition-colors"
          >
            Select PDF File
          </button>
        </div>

        {isParsing && (
          <div className="p-6 rounded-2xl bg-surface border border-warmborder text-center space-y-3 animate-fadeIn shadow-card">
            <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
            <div className="text-xs font-semibold text-ink-primary">
              Analyzing PDF fonts, colors, and layout metrics...
            </div>
          </div>
        )}

        {parseError && (
          <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger flex items-start space-x-3 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{parseError}</div>
          </div>
        )}
      </div>
    );
  }

  // 2. SUCCESS DOWNLOAD STATE
  if (saveResult) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 sm:p-10 bg-surface rounded-2xl border border-warmborder shadow-card text-center space-y-6 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-success-bg border border-success-border text-success mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-serif font-bold text-primary-dark">
            PDF Edits Saved Successfully
          </h2>
          <p className="text-xs sm:text-sm text-ink-secondary mt-1">
            All text replacements were applied with original font and color preservation.
          </p>
        </div>

        <div className="p-4 bg-ivory rounded-xl border border-warmborder flex items-center justify-between">
          <div className="flex items-center space-x-3 text-left truncate">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="truncate">
              <div className="text-sm font-semibold text-ink-primary truncate">
                {saveResult.filename}
              </div>
              <div className="text-xs text-ink-secondary">
                {(saveResult.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-success-bg text-success border border-success-border">
            Ready
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={saveResult.fileData || saveResult.downloadUrl}
            download={saveResult.filename}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl shadow-sm transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Edited PDF</span>
          </a>

          <button
            onClick={() => setSaveResult(null)}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-surface border border-primary text-primary hover:bg-ivory rounded-xl font-medium transition-colors text-sm"
          >
            <span>Continue Editing</span>
          </button>
        </div>

        <div className="text-[11px] text-ink-secondary flex items-center justify-center space-x-1.5 pt-2 border-t border-warmborder/60">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Files are encrypted and permanently deleted after 30 minutes.</span>
        </div>
      </div>
    );
  }

  // 3. INTERACTIVE PDF STUDIO WORKSPACE
  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* TOP STUDIO TOOLBAR */}
      <div className="p-3 sm:p-4 bg-surface rounded-2xl border border-warmborder shadow-card flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Switcher */}
        <div className="flex items-center space-x-1.5 bg-ivory p-1 rounded-xl border border-warmborder/60">
          <button
            onClick={() => setActiveTool('edit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTool === 'edit'
                ? 'bg-surface text-primary shadow-sm border border-warmborder/80'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Edit Text</span>
          </button>

          <button
            onClick={() => setActiveTool('add-text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTool === 'add-text'
                ? 'bg-surface text-primary shadow-sm border border-warmborder/80'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <span>+ Add Text</span>
          </button>

          <button
            onClick={() => setActiveTool('whiteout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTool === 'whiteout'
                ? 'bg-surface text-primary shadow-sm border border-warmborder/80'
                : 'text-ink-secondary hover:text-ink-primary'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Whiteout</span>
          </button>
        </div>

        {/* Center: Live Detected Styling Controls */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Detected Font Family */}
          <div className="flex items-center space-x-1 px-2.5 py-1.5 bg-ivory rounded-lg border border-warmborder">
            <span className="text-[10px] uppercase font-bold text-ink-secondary">Font</span>
            <select
              value={currentFont}
              onChange={(e) => {
                setCurrentFont(e.target.value);
                if (selectedSpanId) {
                  setSpanStylesMap((prev) => ({
                    ...prev,
                    [selectedSpanId]: { font: e.target.value, size: currentSize, colorHex: currentColor },
                  }));
                }
              }}
              className="bg-transparent text-ink-primary font-medium outline-none cursor-pointer text-xs"
            >
              <option value="Helvetica">Helvetica (Sans)</option>
              <option value="Times">Times (Serif)</option>
              <option value="Courier">Courier (Mono)</option>
            </select>
          </div>

          {/* Detected Font Size */}
          <div className="flex items-center space-x-1 px-2.5 py-1.5 bg-ivory rounded-lg border border-warmborder">
            <span className="text-[10px] uppercase font-bold text-ink-secondary">Size</span>
            <input
              type="number"
              min={6}
              max={72}
              value={currentSize}
              onChange={(e) => {
                const s = parseFloat(e.target.value) || 12;
                setCurrentSize(s);
                if (selectedSpanId) {
                  setSpanStylesMap((prev) => ({
                    ...prev,
                    [selectedSpanId]: { font: currentFont, size: s, colorHex: currentColor },
                  }));
                }
              }}
              className="w-10 bg-transparent text-ink-primary font-medium outline-none text-xs"
            />
            <span className="text-ink-secondary text-[10px]">pt</span>
          </div>

          {/* Detected Color Swatch & Picker */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-ivory rounded-lg border border-warmborder">
            <span className="text-[10px] uppercase font-bold text-ink-secondary">Color</span>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => {
                setCurrentColor(e.target.value);
                if (selectedSpanId) {
                  setSpanStylesMap((prev) => ({
                    ...prev,
                    [selectedSpanId]: { font: currentFont, size: currentSize, colorHex: e.target.value },
                  }));
                }
              }}
              className="w-4 h-4 rounded cursor-pointer border-0 p-0 bg-transparent"
              title="Detected font color"
            />
            <span className="font-mono text-[10px] text-ink-secondary">{currentColor}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Zoom */}
          <div className="hidden sm:flex items-center space-x-1 text-ink-secondary">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.6, z - 0.1))}
              className="p-1 hover:text-primary transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono w-10 text-center">{Math.round(zoomScale * 100)}%</span>
            <button
              onClick={() => setZoomScale((z) => Math.min(1.6, z + 0.1))}
              className="p-1 hover:text-primary transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleReset}
            className="p-2 text-ink-secondary hover:text-primary rounded-lg hover:bg-ivory transition-colors"
            title="Reset All Edits"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveEdits}
            disabled={isSaving}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl shadow-sm text-xs flex items-center space-x-1.5 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Save & Download</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="p-3 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs flex items-center justify-between">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)}>✕</button>
        </div>
      )}

      {/* PAGE NAVIGATION BAR */}
      <div className="flex items-center justify-between text-xs text-ink-secondary px-2">
        <div className="flex items-center space-x-2">
          <button
            disabled={currentPageIndex === 0}
            onClick={() => {
              setCurrentPageIndex((p) => Math.max(0, p - 1));
              setSelectedSpanId(null);
            }}
            className="p-1.5 rounded-lg bg-surface border border-warmborder disabled:opacity-40 hover:border-primary text-ink-primary"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <span className="font-medium text-ink-primary">
            Page {currentPageIndex + 1} of {parsedDoc.pageCount}
          </span>

          <button
            disabled={currentPageIndex === parsedDoc.pageCount - 1}
            onClick={() => {
              setCurrentPageIndex((p) => Math.min(parsedDoc.pageCount - 1, p + 1));
              setSelectedSpanId(null);
            }}
            className="p-1.5 rounded-lg bg-surface border border-warmborder disabled:opacity-40 hover:border-primary text-ink-primary"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-[11px] text-ink-secondary">
          Click any word to edit in-place with matching font and color.
        </div>
      </div>

      {/* MAIN INTERACTIVE CANVAS WORKSPACE: warm neutral container */}
      {currentPage && (
        <div className="overflow-auto max-h-[75vh] p-6 bg-ivory-secondary rounded-2xl border border-warmborder flex justify-center">
          <div
            ref={canvasContainerRef}
            onClick={handleCanvasClick}
            style={{
              width: `${currentPage.width * zoomScale}px`,
              height: `${currentPage.height * zoomScale}px`,
              backgroundImage: `url(${currentPage.imageBase64})`,
              backgroundSize: '100% 100%',
            }}
            className="relative bg-white shadow-modal rounded select-none cursor-text transition-all duration-150 border border-warmborder/80"
          >
            {/* 1. DETECTED TEXT SPANS LAYER */}
            {currentPage.spans.map((span) => {
              const isSelected = selectedSpanId === span.id;
              const hasEdits = span.id in editsMap;
              const displayText = hasEdits ? editsMap[span.id] : span.text;
              const activeStyle = spanStylesMap[span.id] || {
                font: span.font,
                size: span.size,
                colorHex: span.colorHex,
              };

              const leftPct = (span.bbox[0] / currentPage.width) * 100;
              const topPct = (span.bbox[1] / currentPage.height) * 100;
              const widthPct = ((span.bbox[2] - span.bbox[0]) / currentPage.width) * 100;
              const heightPct = ((span.bbox[3] - span.bbox[1]) / currentPage.height) * 100;

              return (
                <div
                  key={span.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpanClick(span);
                  }}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    minWidth: `${Math.max(widthPct, 2)}%`,
                    height: `${heightPct}%`,
                  }}
                  className={`group absolute transition-all duration-100 ${
                    isSelected
                      ? 'z-30 ring-2 ring-primary rounded bg-white shadow-md'
                      : hasEdits
                      ? 'z-20 bg-white ring-1 ring-primary/80 rounded'
                      : 'hover:bg-primary/10 hover:ring-1 hover:ring-primary/40 rounded cursor-pointer'
                  }`}
                  title={`${span.font} • ${span.size}pt • ${span.colorHex}`}
                >
                  {/* INLINE EDITABLE INPUT */}
                  {isSelected ? (
                    <input
                      autoFocus
                      type="text"
                      value={displayText}
                      onChange={(e) => handleSpanTextChange(span.id, e.target.value)}
                      style={{
                        fontFamily: activeStyle.font,
                        fontSize: `${activeStyle.size * zoomScale}px`,
                        color: activeStyle.colorHex,
                        fontWeight: span.isBold ? 'bold' : 'normal',
                        fontStyle: span.isItalic ? 'italic' : 'normal',
                      }}
                      className="w-full h-full bg-white px-1 outline-none border-0 leading-none"
                    />
                  ) : hasEdits ? (
                    <span
                      style={{
                        fontFamily: activeStyle.font,
                        fontSize: `${activeStyle.size * zoomScale}px`,
                        color: activeStyle.colorHex,
                        fontWeight: span.isBold ? 'bold' : 'normal',
                        fontStyle: span.isItalic ? 'italic' : 'normal',
                      }}
                      className="inline-block px-1 leading-none whitespace-nowrap bg-white"
                    >
                      {displayText}
                    </span>
                  ) : null}

                  {/* HOVER FONT & COLOR TOOLTIP PILL */}
                  {!isSelected && !hasEdits && (
                    <div className="hidden group-hover:flex absolute -top-6 left-0 px-2 py-0.5 rounded bg-primary-dark text-ivory text-[9px] font-sans font-medium whitespace-nowrap items-center space-x-1.5 shadow-md z-40 pointer-events-none">
                      <span className="w-2 h-2 rounded-full border border-white/40" style={{ backgroundColor: span.colorHex }} />
                      <span>{span.font}</span>
                      <span>•</span>
                      <span>{span.size}pt</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. NEWLY ADDED TEXTS LAYER */}
            {addedTexts
              .filter((a) => a.pageIndex === currentPageIndex)
              .map((item, idx) => (
                <div
                  key={`added-${idx}`}
                  style={{
                    left: `${(item.x / currentPage.width) * 100}%`,
                    top: `${(item.y / currentPage.height) * 100}%`,
                  }}
                  className="absolute z-30 bg-white ring-1 ring-primary rounded p-1 shadow-sm"
                >
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => {
                      const updated = [...addedTexts];
                      updated[idx].text = e.target.value;
                      setAddedTexts(updated);
                    }}
                    style={{
                      fontFamily: item.font,
                      fontSize: `${item.size * zoomScale}px`,
                      color: item.colorHex,
                    }}
                    className="bg-transparent outline-none border-0 leading-none px-1"
                  />
                </div>
              ))}

            {/* 3. WHITEOUT RECTANGLES LAYER */}
            {whiteouts
              .filter((w) => w.pageIndex === currentPageIndex)
              .map((w, idx) => (
                <div
                  key={`whiteout-${idx}`}
                  style={{
                    left: `${(w.bbox[0] / currentPage.width) * 100}%`,
                    top: `${(w.bbox[1] / currentPage.height) * 100}%`,
                    width: `${((w.bbox[2] - w.bbox[0]) / currentPage.width) * 100}%`,
                    height: `${((w.bbox[3] - w.bbox[1]) / currentPage.height) * 100}%`,
                    backgroundColor: w.fillHex || '#ffffff',
                  }}
                  className="absolute z-10 border border-warmborder shadow-sm"
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
