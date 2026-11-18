'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  Shield,
  PenTool,
  Sparkles,
} from 'lucide-react';
import ToolCard from './ToolCard';
import { toolsConfig, ToolConfig } from '@/config/tools.config';

type FilterCategory = 'all' | 'organize' | 'to-pdf' | 'from-pdf' | 'optimize' | 'edit-sign';

export default function ToolsExplorer() {
  const [activeTab, setActiveTab] = useState<FilterCategory>('all');

  const organizeTools = toolsConfig.filter((t) => t.category === 'organize');
  const toPdfTools = toolsConfig.filter((t) => t.category === 'to-pdf');
  const fromPdfTools = toolsConfig.filter((t) => t.category === 'from-pdf');
  const optimizeTools = toolsConfig.filter((t) => t.category === 'optimize');
  const editSignTools = toolsConfig.filter((t) => t.category === 'edit-sign');

  const filterTabs: { id: FilterCategory; label: string; count: number; icon: any }[] = [
    { id: 'all', label: 'All 27 Tools', count: toolsConfig.length, icon: Sparkles },
    { id: 'organize', label: 'Organize', count: organizeTools.length, icon: Layers },
    { id: 'to-pdf', label: 'Convert to PDF', count: toPdfTools.length, icon: ArrowDownToLine },
    { id: 'from-pdf', label: 'Convert from PDF', count: fromPdfTools.length, icon: ArrowUpFromLine },
    { id: 'optimize', label: 'Optimize & Security', count: optimizeTools.length, icon: Shield },
    { id: 'edit-sign', label: 'Edit & Sign', count: editSignTools.length, icon: PenTool },
  ];

  return (
    <div className="space-y-12">
      {/* BESPOKE CATEGORY FILTER BAR: Warm Paper & Crimson styling */}
      <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 scrollbar-none gap-2">
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-180 border ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]'
                  : 'bg-surface text-ink-secondary border-warmborder hover:bg-ivory hover:text-ink-primary'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-primary'}`} />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-ivory-secondary text-ink-secondary'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SECTIONS */}
      <div className="space-y-16">
        {/* 1. ORGANIZE */}
        {(activeTab === 'all' || activeTab === 'organize') && (
          <div id="organize" className="scroll-mt-24 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary text-white shadow-sm">
                <Layers className="w-5 h-5 text-ivory" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary-dark">
                  Organize Suite
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Merge documents, split pages into ZIP or range, rotate orientation, delete pages, extract content, and sort page order.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {organizeTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* 2. CONVERT TO PDF */}
        {(activeTab === 'all' || activeTab === 'to-pdf') && (
          <div id="to-pdf" className="scroll-mt-24 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary text-white shadow-sm">
                <ArrowDownToLine className="w-5 h-5 text-ivory" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary-dark">
                  Convert to PDF
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Transform Word documents, Excel spreadsheets, PowerPoint decks, JPG/PNG images, HTML, and text files into clean PDF.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {toPdfTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* 3. CONVERT FROM PDF */}
        {(activeTab === 'all' || activeTab === 'from-pdf') && (
          <div id="from-pdf" className="scroll-mt-24 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary-dark text-white shadow-sm">
                <ArrowUpFromLine className="w-5 h-5 text-ivory" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary-dark">
                  Convert from PDF
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Extract PDF contents into Word, PowerPoint, Excel, JPG, lossless PNG, and ISO-standardized PDF/A.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {fromPdfTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* 4. OPTIMIZE & SECURITY */}
        {(activeTab === 'all' || activeTab === 'optimize') && (
          <div id="optimize" className="scroll-mt-24 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary text-white shadow-sm">
                <Shield className="w-5 h-5 text-ivory" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary-dark">
                  Optimize & Security Suite
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Compress file size with savings estimates, lock/unlock with AES-256 encryption, watermark pages, add page numbering, and flatten forms.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {optimizeTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}

        {/* 5. EDIT & SIGN */}
        {(activeTab === 'all' || activeTab === 'edit-sign') && (
          <div id="edit-sign" className="scroll-mt-24 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary-dark text-white shadow-sm">
                <PenTool className="w-5 h-5 text-ivory" />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-primary-dark">
                  Edit & Sign Suite
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Direct in-browser text editing with automatic font/color matching, and interactive electronic signature stamping.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {editSignTools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
