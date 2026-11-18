import Link from 'next/link';
import {
  Image,
  FileText,
  Presentation,
  Table,
  Code,
  ImageDown,
  FileEdit,
  Tv,
  Sheet,
  ShieldCheck,
  ArrowRight,
  LucideIcon,
  Layers,
  Scissors,
  RotateCw,
  Trash2,
  Grid,
  ArrowUpDown,
  Minimize2,
  Lock,
  Unlock,
  Stamp,
  Hash,
  FileCheck2,
  PenTool,
} from 'lucide-react';
import { ToolConfig } from '@/config/tools.config';

const ICON_MAP: Record<string, LucideIcon> = {
  Image,
  FileText,
  Presentation,
  Table,
  Code,
  ImageDown,
  FileEdit,
  Tv,
  Sheet,
  ShieldCheck,
  Layers,
  Scissors,
  RotateCw,
  Trash2,
  Grid,
  ArrowUpDown,
  Minimize2,
  Lock,
  Unlock,
  Stamp,
  Hash,
  FileCheck2,
  PenTool,
};

export default function ToolCard({ tool }: { tool: ToolConfig }) {
  const IconComponent = ICON_MAP[tool.icon] || FileText;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col p-5 sm:p-6 bg-surface rounded-2xl border border-warmborder transition-all duration-180 hover:-translate-y-1 hover:border-primary hover:shadow-cardHover shadow-card"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-ivory border border-warmborder flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
          <IconComponent className="w-5 h-5 transition-transform group-hover:scale-110" />
        </div>
        <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-warmborder group-hover:text-primary transition-colors">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      <h3 className="text-base font-bold text-ink-primary mb-1.5 group-hover:text-primary transition-colors">
        {tool.title}
      </h3>

      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed mb-4 flex-grow">
        {tool.description}
      </p>

      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-warmborder/60">
        {tool.acceptedExtensions.slice(0, 3).map((ext) => (
          <span
            key={ext}
            className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-ivory-secondary border border-warmborder/60 text-ink-secondary"
          >
            {ext}
          </span>
        ))}
        {tool.acceptedExtensions.length > 3 && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 text-ink-secondary">
            +{tool.acceptedExtensions.length - 3}
          </span>
        )}
      </div>
    </Link>
  );
}
