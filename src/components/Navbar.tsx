'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, FileText } from 'lucide-react';
import SearchModal from './SearchModal';

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-surface border-b border-warmborder transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
          {/* Logo: Toolzip in Crimson */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm group-hover:bg-primary-hover transition-colors">
              <FileText className="w-5 h-5 text-ivory" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-serif font-bold tracking-tight text-primary">
                Toolzip
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-ink-secondary">
                PDF
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 text-xs lg:text-sm font-medium">
            <Link
              href="/"
              className="px-3 py-2 rounded-xl text-ink-secondary hover:text-primary hover:bg-ivory transition-colors"
            >
              All Tools (27)
            </Link>
            <Link
              href="/#organize"
              className="px-3 py-2 rounded-xl text-ink-secondary hover:text-primary hover:bg-ivory transition-colors"
            >
              Organize
            </Link>
            <Link
              href="/#to-pdf"
              className="px-3 py-2 rounded-xl text-ink-secondary hover:text-primary hover:bg-ivory transition-colors"
            >
              Convert
            </Link>
            <Link
              href="/#optimize"
              className="px-3 py-2 rounded-xl text-ink-secondary hover:text-primary hover:bg-ivory transition-colors"
            >
              Optimize & Security
            </Link>
            <Link
              href="/#edit-sign"
              className="px-3 py-2 rounded-xl text-primary font-semibold hover:bg-ivory transition-colors flex items-center space-x-1"
            >
              <span>Edit & Sign</span>
            </Link>
            <Link
              href="/about"
              className="px-3 py-2 rounded-xl text-ink-secondary hover:text-primary hover:bg-ivory transition-colors"
            >
              About
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-ivory text-ink-secondary hover:text-primary hover:border-primary/40 border border-warmborder transition-all text-xs font-medium"
              aria-label="Search tools"
            >
              <Search className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Search tools...</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-surface rounded border border-warmborder text-ink-secondary">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-ink-primary hover:bg-ivory"
              aria-label="Open mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-warmborder bg-surface px-4 pt-2 pb-4 space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              All Tools
            </Link>
            <Link
              href="/#organize"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              Organize
            </Link>
            <Link
              href="/#to-pdf"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              Convert to PDF
            </Link>
            <Link
              href="/#from-pdf"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              Convert from PDF
            </Link>
            <Link
              href="/#optimize"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              Optimize & Security
            </Link>
            <Link
              href="/#edit-sign"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-ivory"
            >
              Edit & Sign
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              About Toolzip
            </Link>
            <Link
              href="/privacy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-ink-primary hover:bg-ivory hover:text-primary"
            >
              Contact Support
            </Link>
          </div>
        )}
      </header>

      {/* Global Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
