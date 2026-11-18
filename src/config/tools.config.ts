export type ToolCategory = "organize" | "to-pdf" | "from-pdf" | "optimize" | "edit-sign";

export interface ToolStep {
  step: number;
  title: string;
  desc: string;
}

export interface ToolFAQ {
  question: string;
  answer: string;
}

export interface ToolConfig {
  id: string;
  title: string;
  slug: string;
  category: ToolCategory;
  description: string;
  shortDesc: string;
  icon: string;
  badgeColor: "purple" | "blue" | "orange" | "emerald" | "cyan" | "rose" | "indigo" | "amber" | "teal" | "slate";
  acceptedMimeTypes: string[];
  acceptedExtensions: string[];
  maxFileSizeMB: number;
  allowMultiple: boolean;
  outputExtension: string;
  outputMimeType: string;
  handlerName: string;
  seoTitle: string;
  seoDescription: string;
  steps: ToolStep[];
  faqs: ToolFAQ[];
}

export const toolsConfig: ToolConfig[] = [
  // 1. JPG to PDF
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    slug: "jpg-to-pdf",
    category: "to-pdf",
    description: "Convert JPG, PNG, and WebP images to high-quality PDF documents in seconds.",
    shortDesc: "Images to clean PDF document",
    icon: "Image",
    badgeColor: "purple",
    acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
    maxFileSizeMB: 50,
    allowMultiple: true,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "jpgToPdf",
    seoTitle: "JPG to PDF - Convert Images to PDF Online Free | TOOLZIP",
    seoDescription: "Easily merge JPG, PNG, and WebP images into a single beautifully formatted PDF. Free, fast, and secure.",
    steps: [
      { step: 1, title: "Select or Drop Images", desc: "Choose one or more image files from your computer or phone." },
      { step: 2, title: "Convert to PDF", desc: "Click the Convert button to instantly merge your images into a PDF." },
      { step: 3, title: "Download PDF", desc: "Save your newly created PDF document right away." }
    ],
    faqs: [
      { question: "Can I combine multiple pictures into one PDF?", answer: "Yes! TOOLZIP allows you to upload multiple JPG or PNG images and automatically combines them into a multi-page PDF." },
      { question: "Are my photos kept secure?", answer: "All files are processed in isolated temporary directories and automatically permanently deleted within 30 minutes." }
    ]
  },
  // 2. WORD to PDF
  {
    id: "word-to-pdf",
    title: "WORD to PDF",
    slug: "word-to-pdf",
    category: "to-pdf",
    description: "Convert Microsoft Word documents (DOC, DOCX) to formatted PDF preserving typography and tables.",
    shortDesc: "DOC and DOCX to PDF",
    icon: "FileText",
    badgeColor: "blue",
    acceptedMimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    acceptedExtensions: [".doc", ".docx"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "wordToPdf",
    seoTitle: "Word to PDF - Convert DOCX to PDF Online Free | TOOLZIP",
    seoDescription: "Convert DOC and DOCX files to PDF documents with high fidelity layouts, tables, and typography.",
    steps: [
      { step: 1, title: "Upload Word File", desc: "Select your .doc or .docx document." },
      { step: 2, title: "Process Document", desc: "Our conversion engine reproduces fonts, margins, and headings." },
      { step: 3, title: "Download PDF", desc: "Download your shareable, read-only PDF file." }
    ],
    faqs: [
      { question: "Will my document formatting change?", answer: "No, TOOLZIP preserves your fonts, bullet points, headers, footers, and table alignments accurately." }
    ]
  },
  // 3. POWERPOINT to PDF
  {
    id: "powerpoint-to-pdf",
    title: "POWERPOINT to PDF",
    slug: "powerpoint-to-pdf",
    category: "to-pdf",
    description: "Convert PPT and PPTX presentation slide decks into printable, easy-to-share PDF handouts.",
    shortDesc: "PPT and PPTX slides to PDF",
    icon: "Presentation",
    badgeColor: "orange",
    acceptedMimeTypes: [
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    acceptedExtensions: [".ppt", ".pptx"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "powerpointToPdf",
    seoTitle: "PowerPoint to PDF - Convert PPTX Slides to PDF | TOOLZIP",
    seoDescription: "Transform PowerPoint presentations into high-resolution PDF documents for handouts or emailing.",
    steps: [
      { step: 1, title: "Upload Presentation", desc: "Select your PPT or PPTX slideshow." },
      { step: 2, title: "Convert Slides", desc: "Each slide is cleanly converted into a corresponding page." },
      { step: 3, title: "Download PDF", desc: "Save your presentation PDF." }
    ],
    faqs: [
      { question: "Can I convert animations to PDF?", answer: "PDF is a static document format, so slides are converted to crisp static pages with all visual elements intact." }
    ]
  },
  // 4. EXCEL to PDF
  {
    id: "excel-to-pdf",
    title: "EXCEL to PDF",
    slug: "excel-to-pdf",
    category: "to-pdf",
    description: "Convert Excel spreadsheets (XLS, XLSX, CSV) to clean PDF sheets with proper pagination.",
    shortDesc: "XLS, XLSX and CSV to PDF",
    icon: "Table",
    badgeColor: "emerald",
    acceptedMimeTypes: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv"
    ],
    acceptedExtensions: [".xls", ".xlsx", ".csv"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "excelToPdf",
    seoTitle: "Excel to PDF - Convert Spreadsheets to PDF Free | TOOLZIP",
    seoDescription: "Easily convert Excel workbooks and CSV files to high quality PDFs. Free and secure.",
    steps: [
      { step: 1, title: "Upload Spreadsheet", desc: "Choose your .xlsx, .xls or .csv file." },
      { step: 2, title: "Auto-format Tables", desc: "Gridlines, formulas, and cells are rendered cleanly." },
      { step: 3, title: "Download PDF", desc: "Get your print-ready financial or data report." }
    ],
    faqs: [
      { question: "Will all tabs in the workbook be converted?", answer: "Yes, all active sheets in the workbook are converted sequentially into the final PDF." }
    ]
  },
  // 5. HTML to PDF
  {
    id: "html-to-pdf",
    title: "HTML to PDF",
    slug: "html-to-pdf",
    category: "to-pdf",
    description: "Convert HTML documents, code files, and web pages into pixel-perfect vector PDF documents.",
    shortDesc: "HTML files and web code to PDF",
    icon: "Code",
    badgeColor: "cyan",
    acceptedMimeTypes: ["text/html", "application/xhtml+xml"],
    acceptedExtensions: [".html", ".htm"],
    maxFileSizeMB: 25,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "htmlToPdf",
    seoTitle: "HTML to PDF - Render HTML Files into PDF Online | TOOLZIP",
    seoDescription: "Convert HTML files with complete CSS and layout preservation into crisp PDF files using headless browser rendering.",
    steps: [
      { step: 1, title: "Upload HTML File", desc: "Upload your .html or .htm source file." },
      { step: 2, title: "Render Styles", desc: "Our engine executes styles, colors, and layout rules." },
      { step: 3, title: "Download PDF", desc: "Download the converted vector PDF document." }
    ],
    faqs: [
      { question: "Are external CSS and inline images supported?", answer: "Yes, standard HTML styling and embedded images are fully rendered into the PDF." }
    ]
  },
  // 6. PDF to JPG
  {
    id: "pdf-to-jpg",
    title: "PDF to JPG",
    slug: "pdf-to-jpg",
    category: "from-pdf",
    description: "Extract PDF pages into high-resolution JPG images or download all pages in a single ZIP file.",
    shortDesc: "Extract pages into JPG images",
    icon: "ImageDown",
    badgeColor: "rose",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".jpg",
    outputMimeType: "image/jpeg",
    handlerName: "pdfToJpg",
    seoTitle: "PDF to JPG - Extract High-Quality Images from PDF | TOOLZIP",
    seoDescription: "Convert every page of your PDF file into individual high-definition JPG images.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file you want to turn into pictures." },
      { step: 2, title: "Rasterize Pages", desc: "Every page is rendered into high-DPI JPEG." },
      { step: 3, title: "Download", desc: "Download the JPG or a ZIP containing all pages." }
    ],
    faqs: [
      { question: "What is the image resolution?", answer: "Pages are exported at high DPI (up to 300 DPI equivalent) for sharp text and visuals." }
    ]
  },
  // 7. PDF to WORD
  {
    id: "pdf-to-word",
    title: "PDF to WORD",
    slug: "pdf-to-word",
    category: "from-pdf",
    description: "Convert read-only PDF documents into fully editable Microsoft Word DOCX files.",
    shortDesc: "Convert PDF to editable DOCX",
    icon: "FileEdit",
    badgeColor: "indigo",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".docx",
    outputMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    handlerName: "pdfToWord",
    seoTitle: "PDF to Word - Convert PDF to DOCX Online Free | TOOLZIP",
    seoDescription: "Turn read-only PDF files into fully editable Microsoft Word (DOCX) documents with preserved text and formatting.",
    steps: [
      { step: 1, title: "Choose PDF Document", desc: "Upload the PDF you want to make editable." },
      { step: 2, title: "Extract & Rebuild", desc: "Text, tables, and structures are converted to Word format." },
      { step: 3, title: "Download DOCX", desc: "Open and edit in Word, Google Docs, or Pages." }
    ],
    faqs: [
      { question: "Can I edit the text after conversion?", answer: "Yes! The output is a standard Microsoft Word .docx file that you can freely edit, format, and save." }
    ]
  },
  // 8. PDF to POWERPOINT
  {
    id: "pdf-to-powerpoint",
    title: "PDF to POWERPOINT",
    slug: "pdf-to-powerpoint",
    category: "from-pdf",
    description: "Convert PDF pages into presentation slides in Microsoft PowerPoint PPTX format.",
    shortDesc: "Convert PDF to PPTX slide deck",
    icon: "Tv",
    badgeColor: "amber",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pptx",
    outputMimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    handlerName: "pdfToPowerpoint",
    seoTitle: "PDF to PowerPoint - Convert PDF to PPTX Slides | TOOLZIP",
    seoDescription: "Transform PDF documents into editable Microsoft PowerPoint presentation slides.",
    steps: [
      { step: 1, title: "Select PDF", desc: "Upload your PDF slides or report." },
      { step: 2, title: "Build Slide Deck", desc: "Each PDF page becomes a PowerPoint slide." },
      { step: 3, title: "Download PPTX", desc: "Download and edit in Microsoft PowerPoint." }
    ],
    faqs: [
      { question: "Does this work for multi-page documents?", answer: "Yes, every page in your PDF document is converted into an individual slide in the deck." }
    ]
  },
  // 9. PDF to EXCEL
  {
    id: "pdf-to-excel",
    title: "PDF to EXCEL",
    slug: "pdf-to-excel",
    category: "from-pdf",
    description: "Extract data tables and tabular records from PDF files into Microsoft Excel XLSX spreadsheets.",
    shortDesc: "Extract tables from PDF to XLSX",
    icon: "Sheet",
    badgeColor: "teal",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".xlsx",
    outputMimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    handlerName: "pdfToExcel",
    seoTitle: "PDF to Excel - Extract PDF Tables to XLSX Online | TOOLZIP",
    seoDescription: "Extract tables and tabular data from PDF files into Microsoft Excel XLSX spreadsheets accurately.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Choose the PDF containing tables or numbers." },
      { step: 2, title: "Parse Tabular Data", desc: "Rows, columns, and numbers are identified." },
      { step: 3, title: "Download Excel", desc: "Open your new XLSX workbook in Excel." }
    ],
    faqs: [
      { question: "Can I perform calculations on the extracted data?", answer: "Yes, numerical data is extracted into real spreadsheet cells ready for Excel formulas and charts." }
    ]
  },
  // 10. PDF to PDF/A
  {
    id: "pdf-to-pdfa",
    title: "PDF to PDF/A",
    slug: "pdf-to-pdfa",
    category: "from-pdf",
    description: "Convert regular PDF documents to ISO-compliant PDF/A for long-term legal archiving and recordkeeping.",
    shortDesc: "ISO-compliant archive PDF",
    icon: "ShieldCheck",
    badgeColor: "slate",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "pdfToPdfa",
    seoTitle: "PDF to PDF/A - Convert PDF for Long-Term Archiving | TOOLZIP",
    seoDescription: "Convert regular PDF files to ISO standardized PDF/A format for legal compliance and permanent archiving.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select your standard PDF document." },
      { step: 2, title: "Standardize Format", desc: "Embedded fonts, device-independent colors, and ISO compliance tags are applied." },
      { step: 3, title: "Download PDF/A", desc: "Save your verified archive-ready document." }
    ],
    faqs: [
      { question: "What is PDF/A?", answer: "PDF/A is an ISO-standardized version of the Portable Document Format specialized for long-term preservation and digital archiving." }
    ]
  },
  // 11. Edit PDF (Direct in-browser editing with matching font & color)
  {
    id: "edit-pdf",
    title: "Edit PDF",
    slug: "edit-pdf",
    category: "edit-sign",
    description: "Directly edit text in your PDF with automatic font family, size, and color matching. Add new text or white out areas.",
    shortDesc: "Direct in-browser PDF text editor",
    icon: "FileEdit",
    badgeColor: "rose",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "editPdf",
    seoTitle: "Edit PDF Online - Direct PDF Text Editor with Font & Color Matching | TOOLZIP",
    seoDescription: "Directly edit PDF text online. Automatically detects original font, size, and color. Add text, whiteout, and save instantly.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file you wish to edit." },
      { step: 2, title: "Click & Edit Text", desc: "Click on any text to edit in-place with the matching font and color." },
      { step: 3, title: "Download Updated PDF", desc: "Click Save & Download to export your modified document immediately." }
    ],
    faqs: [
      { question: "Does it keep the same font and color?", answer: "Yes! TOOLZIP parses each text span's font family, font size, and color, and automatically applies them to your edits." },
      { question: "Can I add new text or whiteout sensitive sections?", answer: "Yes, you can click anywhere to insert new text boxes or draw whiteout blocks over any content." }
    ]
  },
  // 12. Merge PDF
  {
    id: "merge-pdf",
    title: "Merge PDF",
    slug: "merge-pdf",
    category: "organize",
    description: "Combine multiple PDF documents into a single organized file in your preferred order.",
    shortDesc: "Combine multiple PDFs into one document",
    icon: "Layers",
    badgeColor: "purple",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: true,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "mergePdf",
    seoTitle: "Merge PDF - Combine Multiple PDFs Online Free | TOOLZIP",
    seoDescription: "Easily merge multiple PDF files into a single unified document. Arrange order and download instantly.",
    steps: [
      { step: 1, title: "Select or Drop PDFs", desc: "Upload two or more PDF files you want to combine." },
      { step: 2, title: "Arrange Order", desc: "Drag or move files to specify your desired page order." },
      { step: 3, title: "Download Merged PDF", desc: "Click Merge to download your combined PDF immediately." }
    ],
    faqs: [
      { question: "Can I choose the order of merged documents?", answer: "Yes! You can re-order uploaded PDFs before clicking Merge to ensure pages appear in your desired sequence." },
      { question: "Is there a limit to how many PDFs I can combine?", answer: "You can combine multiple files up to 50MB each with instant processing." }
    ]
  },
  // 13. Split PDF
  {
    id: "split-pdf",
    title: "Split PDF",
    slug: "split-pdf",
    category: "organize",
    description: "Split a PDF into separate one-page documents or extract specific page ranges into new files.",
    shortDesc: "Split PDF into individual pages or ranges",
    icon: "Scissors",
    badgeColor: "rose",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".zip",
    outputMimeType: "application/zip",
    handlerName: "splitPdf",
    seoTitle: "Split PDF - Extract Pages or Split to Separate Files | TOOLZIP",
    seoDescription: "Split PDF pages into individual single-page documents or extract page ranges. Fast, secure, and free.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file you wish to split." },
      { step: 2, title: "Choose Split Mode", desc: "Extract all pages as individual PDFs (ZIP) or enter a custom page range." },
      { step: 3, title: "Download Result", desc: "Save your split documents or zip package instantly." }
    ],
    faqs: [
      { question: "How are individual pages delivered?", answer: "When splitting all pages, TOOLZIP packages each single-page PDF into a clean ZIP archive." },
      { question: "Can I extract just a specific page range?", answer: "Yes! Enter ranges like '1-3, 5' to create a single targeted PDF containing only those pages." }
    ]
  },
  // 14. Rotate PDF
  {
    id: "rotate-pdf",
    title: "Rotate PDF",
    slug: "rotate-pdf",
    category: "organize",
    description: "Rotate PDF pages clockwise or counter-clockwise (90°, 180°, or 270°) and save permanently.",
    shortDesc: "Rotate PDF pages clockwise or counter-clockwise",
    icon: "RotateCw",
    badgeColor: "indigo",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "rotatePdf",
    seoTitle: "Rotate PDF - Rotate PDF Pages Online Free | TOOLZIP",
    seoDescription: "Permanently rotate PDF pages by 90, 180, or 270 degrees. Works on all pages or specific ranges.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF document that needs rotation." },
      { step: 2, title: "Select Rotation Angle", desc: "Choose 90° Clockwise, 180° Flip, or 270° Counter-Clockwise." },
      { step: 3, title: "Download Rotated PDF", desc: "Export your permanently oriented PDF file." }
    ],
    faqs: [
      { question: "Is rotation permanent?", answer: "Yes, the page orientation is permanently saved in the PDF's internal metadata and page dictionary." }
    ]
  },
  // 15. Delete PDF Pages
  {
    id: "delete-pdf-pages",
    title: "Delete PDF Pages",
    slug: "delete-pdf-pages",
    category: "organize",
    description: "Remove unwanted, blank, or sensitive pages from your PDF document easily.",
    shortDesc: "Remove unwanted pages from your PDF",
    icon: "Trash2",
    badgeColor: "orange",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "deletePdfPages",
    seoTitle: "Delete PDF Pages - Remove Pages from PDF Online | TOOLZIP",
    seoDescription: "Remove unwanted pages from your PDF file online. Fast, secure, and deletes selected pages cleanly.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file from your device." },
      { step: 2, title: "Specify Pages to Remove", desc: "Enter the page numbers you want deleted (e.g. 2, 4-6)." },
      { step: 3, title: "Download Clean PDF", desc: "Save the document with unwanted pages stripped away." }
    ],
    faqs: [
      { question: "Can I delete multiple pages at once?", answer: "Yes, you can enter comma-separated numbers or page ranges such as '1, 3, 5-7' to remove several pages at once." }
    ]
  },
  // 16. Extract PDF Pages
  {
    id: "extract-pdf-pages",
    title: "Extract PDF Pages",
    slug: "extract-pdf-pages",
    category: "organize",
    description: "Extract specific pages from a PDF and save them into a new standalone document.",
    shortDesc: "Extract selected pages into a new PDF",
    icon: "Grid",
    badgeColor: "teal",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "extractPdfPages",
    seoTitle: "Extract PDF Pages - Save Selected Pages to New PDF | TOOLZIP",
    seoDescription: "Extract selected pages from your PDF into a brand new document. Fast, accurate, and free.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the source PDF document." },
      { step: 2, title: "Select Pages to Extract", desc: "Enter the page numbers to extract (e.g. 1-3, 5)." },
      { step: 3, title: "Download Extracted PDF", desc: "Download the newly created PDF with only your selected pages." }
    ],
    faqs: [
      { question: "Does extracting alter the original document?", answer: "No, your original file remains completely untouched. A new PDF is generated containing only the chosen pages." }
    ]
  },
  // 17. Organize PDF
  {
    id: "organize-pdf",
    title: "Organize PDF",
    slug: "organize-pdf",
    category: "organize",
    description: "Rearrange, reorder, sort, or reverse the page sequence of your PDF document.",
    shortDesc: "Reorder, arrange, and sort PDF pages",
    icon: "ArrowUpDown",
    badgeColor: "blue",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "organizePdf",
    seoTitle: "Organize PDF - Reorder and Sort PDF Pages Online | TOOLZIP",
    seoDescription: "Reorder, sort, and organize PDF pages in any custom sequence or reverse order. Free and secure.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file you wish to reorganize." },
      { step: 2, title: "Define Page Sequence", desc: "Enter your desired order (e.g. 3, 1, 2, 4) or click Reverse." },
      { step: 3, title: "Download Reorganized PDF", desc: "Save your freshly arranged document immediately." }
    ],
    faqs: [
      { question: "Can I reverse the page order?", answer: "Yes! You can choose 'Reverse' to invert page order from last to first with one click." }
    ]
  },
  // 18. Compress PDF
  {
    id: "compress-pdf",
    title: "Compress PDF",
    slug: "compress-pdf",
    category: "optimize",
    description: "Significantly reduce PDF file size while maintaining sharp text and visual clarity.",
    shortDesc: "Reduce PDF size with smart compression",
    icon: "Minimize2",
    badgeColor: "rose",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 100,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "compressPdf",
    seoTitle: "Compress PDF Online - Reduce PDF File Size Free | TOOLZIP",
    seoDescription: "Compress PDF files online while preserving optimal resolution. Perfect for email attachments and web upload.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the large PDF file you wish to compress." },
      { step: 2, title: "Select Quality Level", desc: "Choose between Recommended (Balanced), Extreme, or Low compression." },
      { step: 3, title: "Download Compressed PDF", desc: "Save your optimized, smaller PDF file immediately." }
    ],
    faqs: [
      { question: "Will compressing decrease document quality?", answer: "Our smart compression engine maintains vector typography and downsamples only oversized embedded raster elements." },
      { question: "How much file size can I save?", answer: "Users typically see 40% to 80% reduction depending on the level chosen." }
    ]
  },
  // 19. Protect PDF
  {
    id: "protect-pdf",
    title: "Protect PDF",
    slug: "protect-pdf",
    category: "optimize",
    description: "Encrypt your PDF with robust military-grade AES-256 password protection to prevent unauthorized access.",
    shortDesc: "Encrypt PDF with secure password",
    icon: "Lock",
    badgeColor: "purple",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "protectPdf",
    seoTitle: "Protect PDF - Add Password Protection to PDF Online | TOOLZIP",
    seoDescription: "Secure your confidential PDF files with AES-256 encryption. Fast, private, and no signup needed.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file you wish to password-protect." },
      { step: 2, title: "Set Password", desc: "Enter a strong password to lock the document." },
      { step: 3, title: "Download Encrypted PDF", desc: "Save your newly secured document." }
    ],
    faqs: [
      { question: "Is my password saved on your servers?", answer: "Never. Encryption is executed purely in-memory and deleted immediately. We have zero knowledge of your password." }
    ]
  },
  // 20. Unlock PDF
  {
    id: "unlock-pdf",
    title: "Unlock PDF",
    slug: "unlock-pdf",
    category: "optimize",
    description: "Remove security and password restrictions from encrypted PDF documents quickly and safely.",
    shortDesc: "Remove password & unlock PDF",
    icon: "Unlock",
    badgeColor: "emerald",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "unlockPdf",
    seoTitle: "Unlock PDF - Remove Password Security Online | TOOLZIP",
    seoDescription: "Remove password protection from your PDF files online. Permanent decryption with zero retention.",
    steps: [
      { step: 1, title: "Upload Protected PDF", desc: "Select your encrypted PDF document." },
      { step: 2, title: "Enter Current Password", desc: "Type in the document password to authenticate." },
      { step: 3, title: "Download Unlocked PDF", desc: "Download your unencrypted, open PDF." }
    ],
    faqs: [
      { question: "Can I unlock a PDF without knowing the password?", answer: "No. For legal and security standards, the correct document password is required to decrypt the file." }
    ]
  },
  // 21. Watermark PDF
  {
    id: "watermark-pdf",
    title: "Watermark PDF",
    slug: "watermark-pdf",
    category: "optimize",
    description: "Add customized text watermarks (CONFIDENTIAL, DRAFT, custom) with angle and opacity control across all pages.",
    shortDesc: "Add text watermark across pages",
    icon: "Stamp",
    badgeColor: "orange",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "watermarkPdf",
    seoTitle: "Watermark PDF - Stamp Text Watermarks Online | TOOLZIP",
    seoDescription: "Add custom watermarks, copyright notices, and draft stamps to your PDF documents online.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file to watermark." },
      { step: 2, title: "Customize Watermark", desc: "Choose preset stamps (CONFIDENTIAL, DRAFT) or type your own text." },
      { step: 3, title: "Download Watermarked PDF", desc: "Save your document with permanent watermark protection." }
    ],
    faqs: [
      { question: "Can I adjust the watermark angle?", answer: "Yes, you can toggle between 45° diagonal and 0° horizontal alignment." }
    ]
  },
  // 22. Number Pages
  {
    id: "number-pages",
    title: "Number Pages",
    slug: "number-pages",
    category: "optimize",
    description: "Insert elegant page numbers in headers or footers with customizable positions and formatting.",
    shortDesc: "Add page numbers to headers or footers",
    icon: "Hash",
    badgeColor: "indigo",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "numberPages",
    seoTitle: "Number PDF Pages - Add Page Numbers Online | TOOLZIP",
    seoDescription: "Easily number PDF pages. Choose positions, numbering formats (Page 1 of N), and typography.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file that needs numbering." },
      { step: 2, title: "Select Position & Format", desc: "Pick bottom-center, bottom-right, or top-center with your preferred style." },
      { step: 3, title: "Download Numbered PDF", desc: "Export your paginated document." }
    ],
    faqs: [
      { question: "What formats are supported?", answer: "You can choose 'Page 1 of N', '1 / N', or single numbers." }
    ]
  },
  // 23. Flatten PDF
  {
    id: "flatten-pdf",
    title: "Flatten PDF",
    slug: "flatten-pdf",
    category: "optimize",
    description: "Flatten form fields, annotations, and markup into permanent static vector elements to prevent editing.",
    shortDesc: "Bake form fields & annotations permanently",
    icon: "FileCheck2",
    badgeColor: "teal",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "flattenPdf",
    seoTitle: "Flatten PDF - Lock Form Fields & Annotations Online | TOOLZIP",
    seoDescription: "Flatten interactive fillable PDF forms into read-only permanent documents securely.",
    steps: [
      { step: 1, title: "Upload PDF Form", desc: "Select your fillable or annotated PDF document." },
      { step: 2, title: "Process Flattening", desc: "Our engine converts form widgets into immutable background vector paths." },
      { step: 3, title: "Download Flattened PDF", desc: "Save your tamper-proof document." }
    ],
    faqs: [
      { question: "Why should I flatten a PDF?", answer: "Flattening prevents recipients from modifying filled form values, checkmarks, or signatures." }
    ]
  },
  // 24. PDF to PNG
  {
    id: "pdf-to-png",
    title: "PDF to PNG",
    slug: "pdf-to-png",
    category: "from-pdf",
    description: "Convert each page of your PDF into high-resolution, lossless PNG images.",
    shortDesc: "High-resolution PNG image export",
    icon: "ImageDown",
    badgeColor: "cyan",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".png",
    outputMimeType: "image/png",
    handlerName: "pdfToPng",
    seoTitle: "PDF to PNG - Convert PDF to PNG Images Online | TOOLZIP",
    seoDescription: "Convert PDF pages to lossless high-resolution PNG images online free. Single files or ZIP archive.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file you wish to convert." },
      { step: 2, title: "Convert to PNG", desc: "Each page is rasterized at crisp 150 DPI resolution." },
      { step: 3, title: "Download Images", desc: "Download single PNG or a bundled ZIP file." }
    ],
    faqs: [
      { question: "Are PNGs transparent?", answer: "Yes, pages maintain crisp vector edges and clean typography." }
    ]
  },
  // 25. PNG to PDF
  {
    id: "png-to-pdf",
    title: "PNG to PDF",
    slug: "png-to-pdf",
    category: "to-pdf",
    description: "Convert PNG graphics, screenshots, and artwork into clean, multi-page PDF documents.",
    shortDesc: "PNG graphics to formatted PDF",
    icon: "Image",
    badgeColor: "blue",
    acceptedMimeTypes: ["image/png"],
    acceptedExtensions: [".png"],
    maxFileSizeMB: 50,
    allowMultiple: true,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "pngToPdf",
    seoTitle: "PNG to PDF - Convert PNG Images to PDF Online | TOOLZIP",
    seoDescription: "Combine PNG images and screenshots into a single beautifully formatted PDF file.",
    steps: [
      { step: 1, title: "Select PNGs", desc: "Upload one or more PNG image files." },
      { step: 2, title: "Convert", desc: "Images are packaged into document pages." },
      { step: 3, title: "Download PDF", desc: "Save your new PDF document." }
    ],
    faqs: [
      { question: "Can I combine multiple PNGs?", answer: "Yes, you can upload multiple PNGs and merge them into one PDF." }
    ]
  },
  // 26. TXT to PDF
  {
    id: "txt-to-pdf",
    title: "TXT to PDF",
    slug: "txt-to-pdf",
    category: "to-pdf",
    description: "Convert plain text files (.txt) into cleanly formatted, paginated PDF documents with elegant typography.",
    shortDesc: "Plain text files to formatted PDF",
    icon: "FileText",
    badgeColor: "slate",
    acceptedMimeTypes: ["text/plain"],
    acceptedExtensions: [".txt"],
    maxFileSizeMB: 20,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "txtToPdf",
    seoTitle: "TXT to PDF - Convert Text Files to PDF Online | TOOLZIP",
    seoDescription: "Convert plain text (.txt) files to formatted PDF documents online with automatic pagination and margins.",
    steps: [
      { step: 1, title: "Upload Text File", desc: "Select your .txt document." },
      { step: 2, title: "Paginate & Format", desc: "Our engine applies standard A4 margins, line wrapping, and typography." },
      { step: 3, title: "Download PDF", desc: "Save your ready-to-print PDF file." }
    ],
    faqs: [
      { question: "Does it wrap long lines?", answer: "Yes, words and sentences are automatically word-wrapped to fit standard margins." }
    ]
  },
  // 27. Sign PDF
  {
    id: "sign-pdf",
    title: "Sign PDF",
    slug: "sign-pdf",
    category: "edit-sign",
    description: "Draw or type your signature and stamp it directly onto any PDF page with date and verification.",
    shortDesc: "Draw or type electronic signature on PDF",
    icon: "PenTool",
    badgeColor: "rose",
    acceptedMimeTypes: ["application/pdf"],
    acceptedExtensions: [".pdf"],
    maxFileSizeMB: 50,
    allowMultiple: false,
    outputExtension: ".pdf",
    outputMimeType: "application/pdf",
    handlerName: "signPdf",
    seoTitle: "Sign PDF Online - Free Electronic Signature on PDF | TOOLZIP",
    seoDescription: "Sign PDF documents online for free. Draw your signature or type with elegant script and date stamping. No signup needed.",
    steps: [
      { step: 1, title: "Upload PDF", desc: "Select the PDF file that requires a signature." },
      { step: 2, title: "Create Your Signature", desc: "Draw with your finger/mouse or type your name in cursive script." },
      { step: 3, title: "Download Signed PDF", desc: "Download your legally verified, signed PDF document." }
    ],
    faqs: [
      { question: "Is this free?", answer: "Yes! Unlike Smallpdf which requires a paid subscription for signing, TOOLZIP provides 100% free electronic signing." },
      { question: "Can I choose the ink color?", answer: "Yes, you can choose between Royal Blue, Deep Crimson, and Charcoal Black." }
    ]
  }
];

export function getToolBySlug(slug: string): ToolConfig | undefined {
  return toolsConfig.find((tool) => tool.slug === slug);
}

export function getToolsByCategory(category: ToolCategory): ToolConfig[] {
  return toolsConfig.filter((tool) => tool.category === category);
}
