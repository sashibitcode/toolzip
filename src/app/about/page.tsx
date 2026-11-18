import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Zap, User, GraduationCap, ExternalLink, Code2, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us & Author Profile | TOOLZIP',
  description:
    'Learn about TOOLZIP, our mission to build fast, free, secure, and extensible PDF tools for everyone. Architected by Shashikant Raj (sashibitcode).',
  other: {
    'author-title': 'Shashikant Raj | Data Analyst & Full Stack Developer',
    'job-title': 'Data Analyst & Full Stack Developer',
  },
};

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-20 bg-ivory">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface border border-warmborder text-primary text-xs font-medium uppercase tracking-wider shadow-card">
            Our Document Philosophy
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-primary-dark tracking-tight">
            About TOOLZIP
          </h1>
          <p className="text-sm sm:text-base text-ink-secondary max-w-xl mx-auto leading-relaxed">
            Fast, accessible, and privacy-respecting PDF tools built for students, professionals, and publishers worldwide.
          </p>
        </div>

        {/* Philosophy Content */}
        <div className="space-y-6 text-ink-primary text-sm sm:text-base leading-relaxed">
          <p>
            At <strong>TOOLZIP</strong>, we believe document conversion should be effortless, lightning-fast, and completely private. Traditional online converters are often bloated with popups, paywalls, and questionable data practices. TOOLZIP was created to provide an editorial, clean, and trustworthy alternative with an archival-paper feel.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <div className="p-6 rounded-2xl bg-surface border border-warmborder shadow-card space-y-2">
              <div className="w-10 h-10 rounded-xl bg-ivory border border-warmborder text-success flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-primary-dark text-base">Strict Zero-Retention Policy</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                Files are processed inside isolated job directories and permanently purged after 30 minutes. We never view, index, or share your document contents.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-warmborder shadow-card space-y-2">
              <div className="w-10 h-10 rounded-xl bg-ivory border border-warmborder text-primary flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-primary-dark text-base">True Open Architecture</h3>
              <p className="text-xs text-ink-secondary leading-relaxed">
                TOOLZIP is built to be easily extensible. Developers can add new document tools by introducing just 1 configuration record and 1 handler file.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-serif font-bold text-primary-dark pt-4">Archival Precision Technology</h2>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            We leverage industry standard rendering and document processing engines including headless LibreOffice, PyMuPDF, Ghostscript, Poppler utilities, and Puppeteer to achieve pixel-perfect document fidelity and preserve fonts, tables, and colors.
          </p>

          {/* E-E-A-T AUTHOR & DEVELOPER PROFILE SECTION */}
          <div className="mt-12 p-8 rounded-3xl bg-surface border border-warmborder shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-warmborder pb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-sm">
                  <User className="w-7 h-7 text-ivory" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-primary-dark">
                    Shashikant Raj
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-primary">
                    Shashikant Raj | Data Analyst & Full Stack Developer
                  </p>
                  <p className="text-[11px] text-ink-secondary">
                    Brand & Online Handle: <span className="font-mono font-semibold text-ink-primary">sashibitcode</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-ivory border border-warmborder text-ink-primary">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span>Jagannath University, Jaipur</span>
                </div>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-ink-secondary space-y-3 leading-relaxed">
              <p>
                Shashikant Raj is a Data Analyst and Full Stack Developer studying Computer Science at Jagannath University, Jaipur. He specializes in high-performance web systems, applied data analytics, and secure document streaming architectures.
              </p>
              <p>
                As the sole architect of <strong>TOOLZIP</strong> and <strong>SAS Music</strong>, Shashikant enforces strict digital privacy standards, high-fidelity vector rendering, and modern Agentic AI compatibility across all his software solutions.
              </p>
            </div>

            {/* Entity Verification Links */}
            <div className="pt-2 flex flex-wrap gap-2.5 text-xs font-medium">
              <a
                href="https://sashibitcode.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-ivory hover:bg-warmborder/30 text-ink-primary border border-warmborder transition-colors"
              >
                <span>Portfolio</span>
                <ExternalLink className="w-3 h-3 text-ink-secondary" />
              </a>
              <a
                href="https://github.com/sashibitcode"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-ivory hover:bg-warmborder/30 text-ink-primary border border-warmborder transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-primary" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-ink-secondary" />
              </a>
              <a
                href="https://www.linkedin.com/in/sashikant-raj/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-ivory hover:bg-warmborder/30 text-ink-primary border border-warmborder transition-colors"
              >
                <span>LinkedIn</span>
                <ExternalLink className="w-3 h-3 text-ink-secondary" />
              </a>
              <a
                href="https://leetcode.com/u/sashibitcode/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-ivory hover:bg-warmborder/30 text-ink-primary border border-warmborder transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-primary" />
                <span>LeetCode</span>
                <ExternalLink className="w-3 h-3 text-ink-secondary" />
              </a>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-medium text-sm shadow-sm transition-all"
            >
              <span>Explore All Tools</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
