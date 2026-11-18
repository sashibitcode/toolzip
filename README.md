# TOOLZIP ⚡
### Production-Ready, Extensible PDF Tools Platform (iLovePDF & Smallpdf Alternative)

TOOLZIP is a modern, fast, and secure PDF tools web application built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. It is architected for maximum extensibility: **adding any new tool takes just 1 config entry + 1 handler file**, without touching routing, API endpoints, or UI layouts.

---

## 🚀 Features

- **Convert to PDF**:
  1. **JPG to PDF** (single & multi-image merging)
  2. **WORD to PDF** (DOC & DOCX via LibreOffice)
  3. **POWERPOINT to PDF** (PPT & PPTX via LibreOffice)
  4. **EXCEL to PDF** (XLS, XLSX & CSV via LibreOffice)
  5. **HTML to PDF** (web pages & HTML code via Chromium/Puppeteer)
- **Convert from PDF**:
  6. **PDF to JPG** (high-DPI page extraction + automatic ZIP packaging)
  7. **PDF to WORD** (editable DOCX via LibreOffice)
  8. **PDF to POWERPOINT** (slide deck generation via LibreOffice / pptxgenjs)
  9. **PDF to EXCEL** (table & data extraction via LibreOffice / SheetJS)
  10. **PDF to PDF/A** (ISO-standardized archival copy via Ghostscript & pdf-lib)
- **Architecture Highlights**:
  - **Single Source of Truth**: All tool metadata, routes, validation, and SEO are defined in `src/config/tools.config.ts`.
  - **Modular Handlers**: Common `ToolHandler` interface (`convert(context) => Promise<ConversionResult>`).
  - **30-Minute Auto-Deletion**: File cleaner automatically purges inputs and outputs older than 30 minutes.
  - **Zero-Log & Sandboxed**: Conversions run in isolated UUID directories (`storage/jobs/<jobId>/`) with strict process timeouts.
  - **Client & Server Validation**: MIME types, file extensions, and customizable size limits.
  - **Rate Limiting**: Sliding-window IP rate limiter to guard against DoS abuse.
  - **SEO & Performance**: Dynamic OpenGraph tags, sitemap.xml, robots.txt, and responsive dark/light mode.
  - **Dockerized**: Single multi-tool container bundling Node.js, LibreOffice, Ghostscript, Poppler, and Chromium.

---

## 🛠️ Architecture: How It Works

```
TOOLZIP Architecture
├── src/config/tools.config.ts       <- (1) Single source of truth for all tools
├── src/server/handlers/             <- (2) Modular conversion engines
│   ├── types.ts                     <- Standard ToolHandler interface
│   ├── jpgToPdf.ts
│   ├── wordToPdf.ts
│   ├── powerpointToPdf.ts
│   ├── excelToPdf.ts
│   ├── htmlToPdf.ts
│   ├── pdfToJpg.ts
│   ├── pdfToWord.ts
│   ├── pdfToPowerpoint.ts
│   ├── pdfToExcel.ts
│   ├── pdfToPdfa.ts
│   └── index.ts                     <- Handler registry
├── src/server/utils/
│   ├── execHelper.ts                <- Sandboxed process execution with timeouts
│   ├── storage.ts                   <- Isolated jobs & 30-min auto-cleanup
│   └── rateLimit.ts                 <- In-memory sliding window rate limiter
├── src/app/
│   ├── api/convert/[slug]/route.ts  <- Dynamic API converting any tool
│   ├── api/download/[jobId]/route.ts<- Streaming download endpoint
│   ├── tools/[slug]/page.tsx        <- Dynamic tool page renderer + SEO
│   └── page.tsx                     <- Clean dual-column Home page
```

---

## 🧩 How to Add a New Tool in 2 Steps

The entire platform is designed so that adding a new tool never requires touching API routes or frontend pages.

### Step 1: Create the Handler File
Create a new file in `src/server/handlers/myNewTool.ts`:

```typescript
import path from 'path';
import fs from 'fs';
import { ToolHandler, ConversionContext, ConversionResult } from './types';

export const myNewToolHandler: ToolHandler = {
  async convert(context: ConversionContext): Promise<ConversionResult> {
    const { inputFiles, outputDir } = context;
    const inputFile = inputFiles[0];

    // Your conversion logic here (e.g. call a CLI, use a Node library)
    const outputFilename = `${path.parse(inputFile.originalFilename).name}_result.pdf`;
    const outputPath = path.join(outputDir, outputFilename);

    fs.copyFileSync(inputFile.filepath, outputPath); // Replace with real conversion

    return {
      outputPath,
      outputFilename,
      mimeType: 'application/pdf',
    };
  },
};
```

Register it in `src/server/handlers/index.ts`:
```typescript
import { myNewToolHandler } from './myNewTool';

export const toolHandlers: Record<string, ToolHandler> = {
  // ... existing handlers
  myNewTool: myNewToolHandler,
};
```

### Step 2: Add Configuration Entry
Add an entry to `src/config/tools.config.ts`:

```typescript
{
  id: "my-new-tool",
  title: "My New Tool",
  slug: "my-new-tool",
  category: "to-pdf", // or "from-pdf"
  description: "Short description of what the tool does.",
  shortDesc: "Quick summary badge",
  icon: "FileText",
  badgeColor: "blue",
  acceptedMimeTypes: ["application/octet-stream"],
  acceptedExtensions: [".xyz"],
  maxFileSizeMB: 50,
  allowMultiple: false,
  outputExtension: ".pdf",
  outputMimeType: "application/pdf",
  handlerName: "myNewTool", // Matches handler registry key
  seoTitle: "My New Tool - Free Online | TOOLZIP",
  seoDescription: "Convert XYZ files to PDF online for free.",
  steps: [
    { step: 1, title: "Upload", desc: "Select your input file." },
    { step: 2, title: "Process", desc: "Click convert to start processing." },
    { step: 3, title: "Download", desc: "Save your result." }
  ],
  faqs: []
}
```

**That's it!** The dynamic route `/tools/my-new-tool`, navigation links, home page grid card, client/server validation, and upload handler are automatically wired up.

---

## 🏃 Running Locally

### Prerequisites
- Node.js 18+ (tested on v20 & v24)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note on Local Binaries**:
> Pure Node.js engines (like **JPG to PDF**, **pptxgenjs**, and **xlsx**) work immediately without external tools.
> For tools utilizing **LibreOffice** (Word/Excel/PowerPoint), **Ghostscript** (PDF/A), or **Poppler**, ensure those binaries are installed on your host PATH, or run the project using **Docker** where all dependencies are pre-configured.

---

## 🐳 Running with Docker (Recommended for Full Engine Support)

The included `Dockerfile` and `docker-compose.yml` install Debian packages for `libreoffice`, `ghostscript`, `poppler-utils`, and `chromium` so that all 10 tools work out-of-the-box.

### Build and Start:
```bash
docker compose up --build
```
Access the application at [http://localhost:3000](http://localhost:3000).

To stop the containers:
```bash
docker compose down
```

---

## 🔒 Security & Privacy

1. **Storage Isolation**: Every conversion job receives a unique UUID workspace (`storage/jobs/<jobId>/`).
2. **Safe Filenames**: Path traversal attacks (`../`, null bytes, illegal characters) are stripped by `sanitizeFilename()`.
3. **Execution Timeouts**: CLI subprocesses are killed via `execSafe()` after configurable limits (60–90 seconds) to prevent hanging tasks.
4. **Auto-Cleanup**: A background cleaner purges all job workspaces older than 30 minutes (`FILE_TTL_MS = 30 * 60 * 1000`).
5. **Rate Limiting**: Sliding window in-memory limiter defaults to 30 conversions per 5-minute window per IP.

---

## 🌐 Internet Indexing & AI Search Optimization

TOOLZIP implements all 6 modern discoverability and search optimization pillars:
1. **AEO (Answer Engine Optimization)**: Schema.org `FAQPage` and `HowTo` rich snippets on Home and all 27 tool pages for Google AI Overviews and conversational assistants.
2. **GEO (Generative Engine Optimization)**: Clear factual entity definitions and machine-readable citations in `/llms.txt` and `/llms-full.txt` for ChatGPT Search, Perplexity, and Claude.
3. **LLMO (Large Language Model Optimization)**: Standardized `/llms.txt` specifications and explicit AI crawler allowances (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, etc.) in `robots.txt`.
4. **AISEO & Agentic Browsing**: Semantic HTML5 landmarks, WCAG 2.1 accessibility, skip-to-content links, and deterministic dropzones for automated AI browser agents.
5. **E-E-A-T Identity Graph**: Schema.org `Person` linked to `WebSite` and `SoftwareApplication` establishing verifiable developer authority.
6. **Instant Indexing (IndexNow)**: Automatic multi-engine push notification script:
   ```bash
   npm run indexnow
   ```

---

## 👤 Author & Developer

- **Architect & Developer**: Shashikant Raj
- **Author Title**: Shashikant Raj | Data Analyst & Full Stack Developer
- **Job Title**: Data Analyst & Full Stack Developer
- **Brand / Username**: sashibitcode
- **Portfolio**: [https://sashibitcode.vercel.app/](https://sashibitcode.vercel.app/)
- **GitHub**: [@sashibitcode](https://github.com/sashibitcode)
- **LinkedIn**: [Shashikant Raj](https://www.linkedin.com/in/sashikant-raj/)
- **LeetCode**: [sashibitcode](https://leetcode.com/u/sashibitcode/)
- **Institution**: Jagannath University, Jaipur

---

## 📄 License
MIT License. Free for personal and commercial use.
