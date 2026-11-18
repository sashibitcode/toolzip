'use client';

import { useState, useRef, useEffect, ChangeEvent, DragEvent, MouseEvent, TouchEvent } from 'react';
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Loader2,
  FileText,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  RotateCw,
  Scissors,
  Trash2,
  Grid,
  ArrowUpDown,
  Lock,
  Unlock,
  Stamp,
  Hash,
  PenTool,
  Minimize2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { ToolConfig } from '@/config/tools.config';

interface DropZoneProps {
  tool: ToolConfig;
}

interface SelectedFile {
  file: File;
  id: string;
}

interface ConversionSuccessData {
  jobId: string;
  downloadUrl: string;
  filename: string;
  size: number;
}

export default function DropZone({ tool }: DropZoneProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [result, setResult] = useState<ConversionSuccessData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Options states for Organize PDF tools
  const [splitMode, setSplitMode] = useState<'all' | 'range'>('all');
  const [splitRange, setSplitRange] = useState<string>('1-2');
  const [rotateAngle, setRotateAngle] = useState<number>(90);
  const [rotateScope, setRotateScope] = useState<'all' | 'range'>('all');
  const [rotateRange, setRotateRange] = useState<string>('1');
  const [deletePages, setDeletePages] = useState<string>('2');
  const [extractPages, setExtractPages] = useState<string>('1');
  const [organizeMode, setOrganizeMode] = useState<'custom' | 'reverse'>('reverse');
  const [organizeSequence, setOrganizeSequence] = useState<string>('2, 1');

  // Options states for Optimize & Security tools
  const [compressLevel, setCompressLevel] = useState<'recommended' | 'extreme' | 'low'>('recommended');
  const [protectPassword, setProtectPassword] = useState<string>('');
  const [showProtectPassword, setShowProtectPassword] = useState<boolean>(false);
  const [unlockPassword, setUnlockPassword] = useState<string>('');
  const [showUnlockPassword, setShowUnlockPassword] = useState<boolean>(false);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkAngle, setWatermarkAngle] = useState<number>(45);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.28);
  const [numberPosition, setNumberPosition] = useState<string>('bottom-center');
  const [numberFormat, setNumberFormat] = useState<string>('page-of-total');

  // Options states for Sign PDF tool
  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedSignerName, setTypedSignerName] = useState<string>('Jane Doe');
  const [inkColor, setInkColor] = useState<string>('#1E3A8A'); // Navy default
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize signature canvas
  useEffect(() => {
    if (tool.slug === 'sign-pdf' && canvasRef.current && signMode === 'draw') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 2.5;
      }
    }
  }, [tool.slug, signMode, inkColor]);

  const startCanvasDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const drawOnCanvas = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopCanvasDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateAndAddFiles = (incomingFiles: FileList | File[]) => {
    setErrorMsg(null);
    const newFiles: SelectedFile[] = [];
    const maxSizeBytes = tool.maxFileSizeMB * 1024 * 1024;

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      // Check size
      if (file.size > maxSizeBytes) {
        setErrorMsg(`"${file.name}" exceeds the maximum allowed size of ${tool.maxFileSizeMB}MB.`);
        return;
      }

      // Check extension
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isAllowed = tool.acceptedExtensions.some((e) => e.toLowerCase() === ext);

      if (!isAllowed) {
        setErrorMsg(
          `"${file.name}" is not supported. Allowed formats: ${tool.acceptedExtensions.join(', ')}`
        );
        return;
      }

      newFiles.push({
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
      });
    }

    if (tool.allowMultiple) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    } else {
      setSelectedFiles(newFiles.slice(0, 1));
    }
  };

  const moveFileUp = (index: number) => {
    if (index <= 0) return;
    setSelectedFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveFileDown = (index: number) => {
    setSelectedFiles((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetAll = () => {
    setSelectedFiles([]);
    setErrorMsg(null);
    setIsConverting(false);
    setResult(null);
    setProgressStep('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startConversion = async () => {
    if (selectedFiles.length === 0) return;

    setErrorMsg(null);
    setIsConverting(true);
    setProgressStep('Uploading document(s)...');

    const formData = new FormData();
    selectedFiles.forEach((sf) => {
      formData.append('files', sf.file);
    });

    // Package contextual options
    let optionsPayload: Record<string, any> = {};
    if (tool.slug === 'split-pdf') {
      optionsPayload = { mode: splitMode, range: splitMode === 'range' ? splitRange : undefined };
    } else if (tool.slug === 'rotate-pdf') {
      optionsPayload = { angle: rotateAngle, pages: rotateScope === 'range' ? rotateRange : 'all' };
    } else if (tool.slug === 'delete-pdf-pages') {
      if (!deletePages.trim()) {
        setErrorMsg('Please specify which page(s) to remove (e.g. 2, 4-6).');
        setIsConverting(false);
        return;
      }
      optionsPayload = { pagesToDelete: deletePages };
    } else if (tool.slug === 'extract-pdf-pages') {
      if (!extractPages.trim()) {
        setErrorMsg('Please specify which page(s) to extract (e.g. 1-3, 5).');
        setIsConverting(false);
        return;
      }
      optionsPayload = { pagesToExtract: extractPages };
    } else if (tool.slug === 'organize-pdf') {
      optionsPayload = { pageOrder: organizeMode === 'reverse' ? 'reverse' : organizeSequence };
    } else if (tool.slug === 'compress-pdf') {
      optionsPayload = { level: compressLevel };
    } else if (tool.slug === 'protect-pdf') {
      if (!protectPassword.trim()) {
        setErrorMsg('Please enter a password to encrypt this document.');
        setIsConverting(false);
        return;
      }
      optionsPayload = { password: protectPassword };
    } else if (tool.slug === 'unlock-pdf') {
      if (!unlockPassword.trim()) {
        setErrorMsg('Please enter the document password to unlock.');
        setIsConverting(false);
        return;
      }
      optionsPayload = { password: unlockPassword };
    } else if (tool.slug === 'watermark-pdf') {
      optionsPayload = { text: watermarkText, angle: watermarkAngle, opacity: watermarkOpacity };
    } else if (tool.slug === 'number-pages') {
      optionsPayload = { position: numberPosition, format: numberFormat };
    } else if (tool.slug === 'sign-pdf') {
      if (signMode === 'draw') {
        const canvas = canvasRef.current;
        const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';
        optionsPayload = { signatureDataUrl, signerDate: new Date().toISOString().split('T')[0] };
      } else {
        optionsPayload = { signerName: typedSignerName, signerDate: new Date().toISOString().split('T')[0] };
      }
    }

    if (Object.keys(optionsPayload).length > 0) {
      formData.append('options', JSON.stringify(optionsPayload));
    }

    try {
      setTimeout(() => {
        setProgressStep('Processing conversion engine...');
      }, 700);

      const response = await fetch(`/api/convert/${tool.slug}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Conversion failed. Please try again.');
      }

      setProgressStep('Complete!');
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'An error occurred during conversion.');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* SUCCESS STATE */}
      {result ? (
        <div className="p-8 sm:p-10 bg-surface rounded-2xl border border-warmborder shadow-card text-center space-y-6 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-success-bg border border-success-border text-success mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold text-primary-dark">
              Your Document is Ready
            </h2>
            <p className="text-xs sm:text-sm text-ink-secondary mt-1">
              File processed successfully with high-fidelity formatting.
            </p>
          </div>

          <div className="p-4 bg-ivory rounded-xl border border-warmborder max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3 text-left overflow-hidden pr-2">
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="truncate">
                <div className="text-sm font-semibold text-ink-primary truncate">
                  {result.filename}
                </div>
                <div className="text-xs text-ink-secondary">{formatFileSize(result.size)}</div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-success-bg text-success border border-success-border flex-shrink-0">
              Ready
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={result.downloadUrl}
              download={result.filename}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-3.5 bg-primary hover:bg-primary-hover active:scale-[0.98] text-white font-medium rounded-xl shadow-sm transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 bg-surface border border-primary text-primary hover:bg-ivory rounded-xl font-medium transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Process Another</span>
            </button>
          </div>

          <div className="text-[11px] text-ink-secondary flex items-center justify-center space-x-1.5 pt-2 border-t border-warmborder/60">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span>Files are processed in memory and permanently deleted within 30 minutes.</span>
          </div>
        </div>
      ) : (
        /* UPLOAD & PROCESS STATE */
        <div className="space-y-5">
          {/* DRAG AND DROP AREA: White surface + dashed crimson border */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer relative p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-180 text-center flex flex-col items-center justify-center shadow-card ${
              isDragging
                ? 'border-primary bg-ivory scale-[1.01]'
                : 'border-primary/50 hover:border-primary bg-surface hover:bg-ivory/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={tool.allowMultiple}
              accept={tool.acceptedExtensions.join(',')}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-ivory border border-warmborder text-primary flex items-center justify-center mb-4 transition-transform hover:scale-105">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-serif font-bold text-primary-dark mb-1">
              Choose file{tool.allowMultiple ? 's' : ''} or drag & drop here
            </h3>
            <p className="text-xs text-ink-secondary mb-4">
              Supports {tool.acceptedExtensions.join(', ')} up to {tool.maxFileSizeMB}MB.
            </p>

            <button
              type="button"
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-xs shadow-sm pointer-events-none transition-colors"
            >
              Select File{tool.allowMultiple ? 's' : ''}
            </button>
          </div>

          {/* SOFT RED ERROR ALERT */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger flex items-start space-x-3 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">Notice</div>
                <div className="mt-0.5">{errorMsg}</div>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-danger hover:opacity-75"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* SELECTED FILES LIST */}
          {selectedFiles.length > 0 && (
            <div className="p-4 sm:p-5 bg-surface rounded-2xl border border-warmborder shadow-card space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary uppercase tracking-wider">
                <span>
                  Selected Document{selectedFiles.length > 1 ? 's' : ''} ({selectedFiles.length})
                </span>
                {tool.allowMultiple && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:underline text-xs"
                  >
                    + Add more files
                  </button>
                )}
              </div>

              {/* LIST OF FILES */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedFiles.map((sf, index) => (
                  <div
                    key={sf.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-ivory border border-warmborder/80"
                  >
                    <div className="flex items-center space-x-3 truncate pr-2">
                      <File className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-ink-primary truncate">
                          {sf.file.name}
                        </div>
                        <div className="text-[10px] text-ink-secondary">
                          {formatFileSize(sf.file.size)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {/* Up/Down reorder for multi-file tools like Merge PDF */}
                      {tool.allowMultiple && selectedFiles.length > 1 && !isConverting && (
                        <>
                          <button
                            type="button"
                            onClick={() => moveFileUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                            className="p-1 rounded text-ink-secondary hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveFileDown(index)}
                            disabled={index === selectedFiles.length - 1}
                            title="Move Down"
                            className="p-1 rounded text-ink-secondary hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {!isConverting && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(sf.id);
                          }}
                          aria-label="Remove file"
                          className="p-1 rounded-lg text-ink-secondary hover:text-primary hover:bg-warmborder/40 transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CONTEXTUAL TOOL OPTIONS */}
              {tool.slug === 'split-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <Scissors className="w-3.5 h-3.5 text-primary" />
                    <span>Split Options</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setSplitMode('all')}
                      className={`p-2 rounded-lg font-medium border text-left transition-colors ${
                        splitMode === 'all'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                      }`}
                    >
                      All Pages (ZIP)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSplitMode('range')}
                      className={`p-2 rounded-lg font-medium border text-left transition-colors ${
                        splitMode === 'range'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                      }`}
                    >
                      Page Range (PDF)
                    </button>
                  </div>
                  {splitMode === 'range' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                        Page Range (e.g. 1-3, 5)
                      </label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="1-3, 5"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {tool.slug === 'rotate-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <RotateCw className="w-3.5 h-3.5 text-primary" />
                    <span>Rotation Angle</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { angle: 90, label: '90° Clockwise' },
                      { angle: 180, label: '180° Flip' },
                      { angle: 270, label: '270° (90° CCW)' },
                    ].map((opt) => (
                      <button
                        key={opt.angle}
                        type="button"
                        onClick={() => setRotateAngle(opt.angle)}
                        className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                          rotateAngle === opt.angle
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="pt-1 flex items-center space-x-3 text-xs">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={rotateScope === 'all'}
                        onChange={() => setRotateScope('all')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-ink-secondary">All Pages</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={rotateScope === 'range'}
                        onChange={() => setRotateScope('range')}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-ink-secondary">Specific Pages</span>
                    </label>
                  </div>
                  {rotateScope === 'range' && (
                    <input
                      type="text"
                      value={rotateRange}
                      onChange={(e) => setRotateRange(e.target.value)}
                      placeholder="e.g. 1, 3-5"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                    />
                  )}
                </div>
              )}

              {tool.slug === 'delete-pdf-pages' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <Trash2 className="w-3.5 h-3.5 text-primary" />
                    <span>Pages to Delete</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    Specify comma-separated page numbers or ranges (e.g. 2, 4-6):
                  </p>
                  <input
                    type="text"
                    value={deletePages}
                    onChange={(e) => setDeletePages(e.target.value)}
                    placeholder="e.g. 2, 4-6"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              {tool.slug === 'extract-pdf-pages' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <Grid className="w-3.5 h-3.5 text-primary" />
                    <span>Pages to Extract</span>
                  </div>
                  <p className="text-[11px] text-ink-secondary">
                    Enter pages to save into a new document (e.g. 1-3, 5):
                  </p>
                  <input
                    type="text"
                    value={extractPages}
                    onChange={(e) => setExtractPages(e.target.value)}
                    placeholder="e.g. 1-3, 5"
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              {tool.slug === 'organize-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                    <span>Page Arrangement</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setOrganizeMode('reverse')}
                      className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                        organizeMode === 'reverse'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                      }`}
                    >
                      Invert / Reverse Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrganizeMode('custom')}
                      className={`p-2 rounded-lg font-medium border text-center transition-colors ${
                        organizeMode === 'custom'
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                      }`}
                    >
                      Custom Sequence
                    </button>
                  </div>
                  {organizeMode === 'custom' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                        Desired Sequence (e.g. 3, 1, 2, 4):
                      </label>
                      <input
                        type="text"
                        value={organizeSequence}
                        onChange={(e) => setOrganizeSequence(e.target.value)}
                        placeholder="e.g. 3, 1, 2, 4"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* COMPRESS PDF WORKSPACE */}
              {tool.slug === 'compress-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-primary">
                    <div className="flex items-center space-x-2">
                      <Minimize2 className="w-3.5 h-3.5 text-primary" />
                      <span>Compression Level</span>
                    </div>
                    <span className="text-[10px] text-primary font-bold px-2 py-0.5 rounded-full bg-primary/10">
                      Estimated Savings: {compressLevel === 'extreme' ? '~85%' : compressLevel === 'recommended' ? '~60%' : '~30%'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: 'recommended', label: 'Recommended', desc: 'Balanced (~60% smaller)' },
                      { id: 'extreme', label: 'Extreme', desc: 'Max (~85% smaller)' },
                      { id: 'low', label: 'Low', desc: 'Lossless (~30% smaller)' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCompressLevel(opt.id as any)}
                        className={`p-2.5 rounded-xl font-medium border text-left transition-all ${
                          compressLevel === opt.id
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                        }`}
                      >
                        <div className="font-bold text-xs">{opt.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PROTECT PDF WORKSPACE */}
              {tool.slug === 'protect-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    <span>Set Document Password (AES-256)</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showProtectPassword ? 'text' : 'password'}
                      value={protectPassword}
                      onChange={(e) => setProtectPassword(e.target.value)}
                      placeholder="Enter a strong password..."
                      className="w-full px-3 py-2 pr-9 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProtectPassword(!showProtectPassword)}
                      className="absolute right-2.5 top-2 text-ink-secondary hover:text-ink-primary"
                    >
                      {showProtectPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-ink-secondary">
                    <ShieldCheck className="w-3 h-3 text-success" />
                    <span>Password is used strictly in-memory and never stored or logged.</span>
                  </div>
                </div>
              )}

              {/* UNLOCK PDF WORKSPACE */}
              {tool.slug === 'unlock-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <Unlock className="w-3.5 h-3.5 text-primary" />
                    <span>Enter Current Password</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showUnlockPassword ? 'text' : 'password'}
                      value={unlockPassword}
                      onChange={(e) => setUnlockPassword(e.target.value)}
                      placeholder="Enter document password..."
                      className="w-full px-3 py-2 pr-9 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                      className="absolute right-2.5 top-2 text-ink-secondary hover:text-ink-primary"
                    >
                      {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* WATERMARK PDF WORKSPACE */}
              {tool.slug === 'watermark-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <Stamp className="w-3.5 h-3.5 text-primary" />
                    <span>Watermark Configuration</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['CONFIDENTIAL', 'DRAFT', 'COPY', 'URGENT'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setWatermarkText(chip)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-colors ${
                          watermarkText === chip
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                        }`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Custom watermark text..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                        Alignment
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setWatermarkAngle(45)}
                          className={`py-1.5 rounded-lg border text-center text-xs font-medium ${
                            watermarkAngle === 45
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface text-ink-secondary border-warmborder'
                          }`}
                        >
                          45° Diagonal
                        </button>
                        <button
                          type="button"
                          onClick={() => setWatermarkAngle(0)}
                          className={`py-1.5 rounded-lg border text-center text-xs font-medium ${
                            watermarkAngle === 0
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface text-ink-secondary border-warmborder'
                          }`}
                        >
                          Horizontal
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-ink-secondary mb-1">
                        Opacity ({Math.round(watermarkOpacity * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="0.7"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-primary mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NUMBER PAGES WORKSPACE */}
              {tool.slug === 'number-pages' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-ink-primary">
                    <Hash className="w-3.5 h-3.5 text-primary" />
                    <span>Page Numbering Settings</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-secondary mb-1.5">
                      Position on Page
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[
                        { id: 'top-left', label: 'Top Left' },
                        { id: 'top-center', label: 'Top Center' },
                        { id: 'top-right', label: 'Top Right' },
                        { id: 'bottom-left', label: 'Bottom Left' },
                        { id: 'bottom-center', label: 'Bottom Center' },
                        { id: 'bottom-right', label: 'Bottom Right' },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setNumberPosition(pos.id)}
                          className={`p-1.5 rounded-lg border text-center text-[11px] font-medium transition-colors ${
                            numberPosition === pos.id
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-secondary mb-1.5">
                      Format Style
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[
                        { id: 'page-of-total', label: 'Page 1 of N' },
                        { id: 'slash', label: '1 / N' },
                        { id: 'number-only', label: '1' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setNumberFormat(fmt.id)}
                          className={`p-1.5 rounded-lg border text-center text-[11px] font-medium transition-colors ${
                            numberFormat === fmt.id
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SIGN PDF WORKSPACE */}
              {tool.slug === 'sign-pdf' && (
                <div className="p-3.5 rounded-xl bg-ivory/80 border border-warmborder space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink-primary">
                    <div className="flex items-center space-x-2">
                      <PenTool className="w-3.5 h-3.5 text-primary" />
                      <span>Electronic Signature</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setSignMode('draw')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          signMode === 'draw'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-ink-secondary border-warmborder'
                        }`}
                      >
                        Draw Signature
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignMode('type')}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          signMode === 'type'
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-ink-secondary border-warmborder'
                        }`}
                      >
                        Type Name
                      </button>
                    </div>
                  </div>

                  {signMode === 'draw' ? (
                    <div className="space-y-2">
                      <div className="relative border-2 border-dashed border-warmborder rounded-xl bg-white overflow-hidden shadow-inner">
                        <canvas
                          ref={canvasRef}
                          width={480}
                          height={120}
                          onMouseDown={startCanvasDrawing}
                          onMouseMove={drawOnCanvas}
                          onMouseUp={stopCanvasDrawing}
                          onMouseLeave={stopCanvasDrawing}
                          onTouchStart={startCanvasDrawing}
                          onTouchMove={drawOnCanvas}
                          onTouchEnd={stopCanvasDrawing}
                          className="w-full h-28 touch-none cursor-crosshair bg-white"
                        />
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="absolute right-2 top-2 px-2 py-0.5 rounded text-[10px] bg-ivory border border-warmborder text-ink-secondary hover:text-primary"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-ink-secondary">
                        <span>Sign above using mouse or finger</span>
                        <div className="flex items-center space-x-2">
                          <span>Ink:</span>
                          {[
                            { color: '#1E3A8A', name: 'Navy' },
                            { color: '#7A1F2B', name: 'Crimson' },
                            { color: '#1A1A1A', name: 'Black' },
                          ].map((ink) => (
                            <button
                              key={ink.color}
                              type="button"
                              onClick={() => setInkColor(ink.color)}
                              className={`w-4 h-4 rounded-full border-2 ${
                                inkColor === ink.color ? 'border-primary ring-2 ring-primary/30' : 'border-white'
                              }`}
                              style={{ backgroundColor: ink.color }}
                              title={ink.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={typedSignerName}
                        onChange={(e) => setTypedSignerName(e.target.value)}
                        placeholder="Type your full name..."
                        className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-warmborder text-ink-primary focus:border-primary focus:outline-none"
                      />
                      <div className="p-4 rounded-xl bg-white border border-warmborder text-center">
                        <span className="font-serif italic font-bold text-2xl text-primary tracking-wide">
                          {typedSignerName || 'Your Signature'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONVERT BUTTON & PROGRESS */}
              <div className="pt-2 border-t border-warmborder/80">
                {isConverting ? (
                  <div className="space-y-2.5 text-center py-2">
                    <div className="flex items-center justify-center space-x-2 text-xs font-medium text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{progressStep}</span>
                    </div>
                    <div className="w-full bg-ivory-secondary h-2 rounded-full overflow-hidden border border-warmborder/60">
                      <div className="bg-primary h-2 rounded-full animate-pulse w-3/4 transition-all duration-300" />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startConversion}
                    className="w-full py-3.5 bg-primary hover:bg-primary-hover active:scale-[0.99] text-white font-medium rounded-xl shadow-sm transition-all text-sm flex items-center justify-center space-x-2"
                  >
                    <span>
                      {tool.slug === 'merge-pdf'
                        ? 'Merge PDF Files'
                        : tool.slug === 'split-pdf'
                        ? 'Split PDF'
                        : tool.slug === 'rotate-pdf'
                        ? 'Rotate PDF'
                        : tool.slug === 'delete-pdf-pages'
                        ? 'Delete Selected Pages'
                        : tool.slug === 'extract-pdf-pages'
                        ? 'Extract Pages'
                        : tool.slug === 'organize-pdf'
                        ? 'Organize Pages'
                        : tool.slug === 'compress-pdf'
                        ? 'Compress PDF Now'
                        : tool.slug === 'protect-pdf'
                        ? 'Encrypt & Protect PDF'
                        : tool.slug === 'unlock-pdf'
                        ? 'Unlock PDF'
                        : tool.slug === 'watermark-pdf'
                        ? 'Apply Watermark'
                        : tool.slug === 'number-pages'
                        ? 'Add Page Numbers'
                        : tool.slug === 'flatten-pdf'
                        ? 'Flatten PDF Form'
                        : tool.slug === 'sign-pdf'
                        ? 'Stamp Signature on PDF'
                        : `Convert ${tool.title}`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
