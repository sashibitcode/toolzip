import Link from 'next/link';
import { FileText, ShieldCheck, Clock, Zap, ExternalLink } from 'lucide-react';
import { toolsConfig } from '@/config/tools.config';

export default function Footer() {
  const organizeTools = toolsConfig.filter((t) => t.category === 'organize');
  const convertTools = toolsConfig.filter((t) => t.category === 'to-pdf' || t.category === 'from-pdf').slice(0, 8);
  const optimizeAndSignTools = toolsConfig.filter((t) => t.category === 'optimize' || t.category === 'edit-sign');

  return (
    <footer role="contentinfo" className="bg-primary-dark text-ivory text-sm mt-auto border-t border-primary-hover">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-[#5E1520]/80 bg-[#350A11]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-primary text-ivory shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-ivory text-sm">Auto-Delete in 30 Mins</div>
              <div className="text-xs text-warmborder/80">Uploaded files are permanently erased automatically.</div>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-primary text-ivory shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-ivory text-sm">Isolated Security</div>
              <div className="text-xs text-warmborder/80">Every document is processed in a sandboxed directory.</div>
            </div>
          </div>

          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-primary text-ivory shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-ivory text-sm">Archival Grade Quality</div>
              <div className="text-xs text-warmborder/80">High fidelity vector rendering with font preservation.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links: 5 Columns */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand column & E-E-A-T Author Attribution */}
        <div className="space-y-3.5 sm:col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-ivory flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-ivory">
              TOOLZIP
            </span>
          </Link>
          <p className="text-xs text-warmborder/80 leading-relaxed pr-2">
            TOOLZIP is a fast, elegant, and secure online platform for converting, organizing, optimizing, and editing documents. Built with a document-first philosophy.
          </p>
          <div className="text-[11px] text-warmborder/90 pt-1 leading-normal">
            Architected by{' '}
            <a
              href="https://sashibitcode.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ivory hover:underline font-semibold"
            >
              Shashikant Raj
            </a>
            <div className="text-warmborder/70 text-[10px]">
              Shashikant Raj | Data Analyst & Full Stack Developer
            </div>
          </div>
          <div className="text-[11px] text-warmborder/60 pt-1">
            © {new Date().getFullYear()} TOOLZIP. All rights reserved.
          </div>
        </div>

        {/* Organize PDF */}
        <div>
          <h4 className="font-serif font-bold text-ivory text-xs uppercase tracking-wider mb-3">
            Organize Suite
          </h4>
          <ul className="space-y-2 text-xs">
            {organizeTools.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tools/${t.slug}`}
                  className="text-warmborder/80 hover:text-ivory transition-colors"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Convert Suite */}
        <div>
          <h4 className="font-serif font-bold text-ivory text-xs uppercase tracking-wider mb-3">
            Popular Converters
          </h4>
          <ul className="space-y-2 text-xs">
            {convertTools.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tools/${t.slug}`}
                  className="text-warmborder/80 hover:text-ivory transition-colors"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Optimize & Sign */}
        <div>
          <h4 className="font-serif font-bold text-ivory text-xs uppercase tracking-wider mb-3">
            Security & Sign
          </h4>
          <ul className="space-y-2 text-xs">
            {optimizeAndSignTools.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/tools/${t.slug}`}
                  className="text-warmborder/80 hover:text-ivory transition-colors"
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company & Legal */}
        <div>
          <h4 className="font-serif font-bold text-ivory text-xs uppercase tracking-wider mb-3">
            Company & Trust
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/about" className="text-warmborder/80 hover:text-ivory transition-colors">
                About TOOLZIP & Author
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-warmborder/80 hover:text-ivory transition-colors">
                Privacy & Data Retention
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-warmborder/80 hover:text-ivory transition-colors">
                Contact & Support
              </Link>
            </li>
            <li>
              <Link href="/sitemap.xml" className="text-warmborder/80 hover:text-ivory transition-colors">
                XML Sitemap
              </Link>
            </li>
            <li>
              <Link href="/llms.txt" className="text-warmborder/80 hover:text-ivory transition-colors">
                LLM Context (/llms.txt)
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
