'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X, ArrowRight, FileText } from 'lucide-react';
import { toolsConfig } from '@/config/tools.config';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTools = toolsConfig.filter((t) => {
    const q = query.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.acceptedExtensions.some((ext) => ext.toLowerCase().includes(q))
    );
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-primary-dark/40 backdrop-blur-sm animate-fadeIn"
    >
      <div
        className="w-full max-w-xl bg-surface rounded-2xl shadow-modal border border-warmborder overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-warmborder bg-ivory">
          <Search className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search PDF tools (e.g. Word, JPG, Excel, Edit)..."
            className="w-full bg-transparent text-ink-primary placeholder-ink-secondary outline-none text-sm"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="p-1 rounded-lg text-ink-secondary hover:text-primary hover:bg-warmborder/30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 bg-surface">
          {filteredTools.length === 0 ? (
            <div className="py-8 text-center text-ink-secondary text-sm">
              No tools match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTools.map((tool) => (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-ivory transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-ivory border border-warmborder text-primary flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-primary group-hover:text-primary transition-colors">
                        {tool.title}
                      </div>
                      <div className="text-xs text-ink-secondary line-clamp-1">
                        {tool.shortDesc}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-warmborder group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 bg-ivory-secondary border-t border-warmborder flex justify-between text-[11px] text-ink-secondary">
          <span>Search all 11 conversion & editor tools</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
}
