import Link from 'next/link';
import ToolsExplorer from '@/components/ToolsExplorer';
import { Layers, ShieldCheck, Clock, Zap, FileEdit, Sparkles, PenTool, Shield, HelpCircle, ChevronDown } from 'lucide-react';

const homeFaqs = [
  {
    question: 'What is TOOLZIP?',
    answer:
      'TOOLZIP is a fast, 100% free, and privacy-respecting online document platform featuring 27 essential tools to convert, organize, compress, protect, edit, and sign PDF files with archival precision and zero cloud retention.',
  },
  {
    question: 'Who created and maintains TOOLZIP?',
    answer:
      'TOOLZIP was architected and developed by Shashikant Raj (known online as sashibitcode), a Data Analyst & Full Stack Developer from Jagannath University, Jaipur. He also created SAS Music, an ad-free Progressive Web App streaming player.',
  },
  {
    question: 'Is TOOLZIP completely free to use?',
    answer:
      'Yes, TOOLZIP is 100% free forever with no hidden subscriptions, credit cards, conversion limits, or intrusive advertising.',
  },
  {
    question: 'How does the Zero-Retention & 30-minute auto-deletion guarantee work?',
    answer:
      'Every uploaded document is processed in an isolated UUID sandbox directory. Files are permanently wiped from the server automatically within 30 minutes of conversion. We never read, index, or share your data.',
  },
  {
    question: 'Can automated AI agents and screen readers navigate TOOLZIP?',
    answer:
      'Yes. TOOLZIP is built with Agentic AI Browsing compatibility and WCAG 2.1 accessibility. It features semantic HTML5 landmarks, explicit ARIA labels on all dropzones and action buttons, and complete documentation in /llms.txt and /llms-full.txt.',
  },
  {
    question: 'Which document formats can TOOLZIP convert to and from PDF?',
    answer:
      'TOOLZIP converts Microsoft Office documents (Word, Excel, PowerPoint), images (JPG, PNG, WebP), web formats (HTML, Markdown), source code, and raw text files with font and layout preservation.',
  },
];

export default function HomePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="relative bg-ivory">
      {/* FAQ Schema for AEO & Google AI Overviews */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* HERO SECTION */}
      <section className="relative pt-14 pb-16 sm:pt-24 sm:pb-24 border-b border-warmborder">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-surface border border-warmborder text-primary text-xs font-medium mb-6 shadow-card">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>27 Essential Tools • Fast • Private • Free Forever</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-primary-dark leading-[1.12]">
            The Document-First{' '}
            <span className="italic font-normal text-primary">PDF Platform</span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-ink-secondary max-w-2xl mx-auto leading-relaxed">
            Convert, organize, compress, protect, edit, and sign documents with archival-grade precision. Everything runs in-memory with automatic 30-minute auto-deletion.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="#organize"
              className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-sm transition-all flex items-center space-x-2"
            >
              <Layers className="w-4 h-4" />
              <span>Organize Suite</span>
            </Link>
            <Link
              href="/tools/compress-pdf"
              className="px-6 py-3.5 rounded-xl bg-surface border border-warmborder text-ink-primary hover:border-primary hover:text-primary font-medium text-sm transition-all flex items-center space-x-2"
            >
              <Shield className="w-4 h-4 text-primary" />
              <span>Compress PDF</span>
            </Link>
            <Link
              href="/tools/sign-pdf"
              className="px-6 py-3.5 rounded-xl bg-surface border border-warmborder text-ink-primary hover:border-primary hover:text-primary font-medium text-sm transition-all flex items-center space-x-2"
            >
              <PenTool className="w-4 h-4 text-primary" />
              <span>Sign PDF</span>
            </Link>
            <Link
              href="/tools/edit-pdf"
              className="px-6 py-3.5 rounded-xl bg-surface border border-primary text-primary hover:bg-ivory-secondary font-medium text-sm transition-all flex items-center space-x-2"
            >
              <FileEdit className="w-4 h-4 text-primary" />
              <span>Direct PDF Editor</span>
            </Link>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-ink-secondary">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>Zero-Retention Architecture</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-primary" />
              <span>Auto-Deletes in 30 Mins</span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-primary" />
              <span>100% Free & No Sign-Up</span>
            </div>
          </div>
        </div>
      </section>

      {/* 27 TOOLS EXPLORER & SUITES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <ToolsExplorer />
      </section>

      {/* WHY CHOOSE TOOLZIP SECTION: Secondary Sand Background #F3EBDA */}
      <section className="border-t border-b border-warmborder bg-ivory-secondary py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary-dark">
              Built for Security & Fidelity
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-ink-secondary">
              Professional document processing crafted with precision, privacy, and performance at its core.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-surface rounded-2xl border border-warmborder shadow-card">
              <div className="w-10 h-10 rounded-xl bg-ivory border border-warmborder flex items-center justify-center text-primary mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-dark mb-1">
                Zero Cloud Retention
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                All temporary workspaces and files are wiped from disk automatically within 30 minutes of conversion.
              </p>
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-warmborder shadow-card">
              <div className="w-10 h-10 rounded-xl bg-ivory border border-warmborder flex items-center justify-center text-primary mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-dark mb-1">
                Sandboxed Processing
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Conversions run inside isolated UUID scratchpads with tight timeouts preventing denial-of-service vulnerabilities.
              </p>
            </div>

            <div className="p-6 bg-surface rounded-2xl border border-warmborder shadow-card">
              <div className="w-10 h-10 rounded-xl bg-ivory border border-warmborder flex items-center justify-center text-primary mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-dark mb-1">
                Lightning Fast Engine
              </h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Pure Node.js vector streaming, PyMuPDF, and headless document engines process pages in milliseconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (AEO & ANSWER ENGINE OPTIMIZATION) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface border border-warmborder text-primary text-xs font-medium mb-3 shadow-card">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Answer Engine Optimization (AEO)</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary-dark">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-ink-secondary">
            Quick answers about TOOLZIP, security, privacy, and file conversions.
          </p>
        </div>

        <div className="space-y-4">
          {homeFaqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-surface border border-warmborder shadow-card hover:border-primary/40 transition-colors"
            >
              <h3 className="font-serif font-bold text-primary-dark text-base sm:text-lg mb-2">
                {faq.question}
              </h3>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
