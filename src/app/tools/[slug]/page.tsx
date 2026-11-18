import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { toolsConfig, getToolBySlug } from '@/config/tools.config';
import DropZone from '@/components/DropZone';
import PdfEditorStudio from '@/components/editor/PdfEditorStudio';
import ToolCard from '@/components/ToolCard';
import { ChevronRight, HelpCircle } from 'lucide-react';

interface ToolPageProps {
  params: {
    slug: string;
  };
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolzip.io';

export async function generateStaticParams() {
  return toolsConfig.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const tool = getToolBySlug(params.slug);
  if (!tool) {
    return {
      title: 'Tool Not Found | TOOLZIP',
    };
  }

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    alternates: {
      canonical: `${BASE_URL}/tools/${tool.slug}`,
    },
    authors: [{ name: 'Shashikant Raj', url: 'https://sashibitcode.vercel.app/' }],
    creator: 'Shashikant Raj',
    publisher: 'Shashikant Raj',
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      url: `${BASE_URL}/tools/${tool.slug}`,
      type: 'website',
      siteName: 'TOOLZIP',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@sashibitcode',
      creator: '@sashibitcode',
      title: tool.seoTitle,
      description: tool.seoDescription,
    },
    other: {
      'author-title': 'Shashikant Raj | Data Analyst & Full Stack Developer',
      'job-title': 'Data Analyst & Full Stack Developer',
    },
  };
}

export default function ToolPage({ params }: ToolPageProps) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = toolsConfig
    .filter((t) => t.id !== tool.id && t.category === tool.category)
    .slice(0, 4);

  const categoryName =
    tool.category === 'to-pdf'
      ? 'Convert to PDF'
      : tool.category === 'organize'
      ? 'Organize Suite'
      : tool.category === 'optimize'
      ? 'Optimize & Security'
      : tool.category === 'edit-sign'
      ? 'Edit & Sign'
      : 'Convert from PDF';

  const categoryAnchor =
    tool.category === 'to-pdf'
      ? '/#to-pdf'
      : tool.category === 'organize'
      ? '/#organize'
      : tool.category === 'optimize'
      ? '/#optimize'
      : tool.category === 'edit-sign'
      ? '/#edit-sign'
      : '/#from-pdf';

  // Schema.org Structured Data: Breadcrumbs, HowTo, and FAQPage (AEO & GEO)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${BASE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName,
            item: `${BASE_URL}${categoryAnchor}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: tool.title,
            item: `${BASE_URL}/tools/${tool.slug}`,
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: `${tool.title} - TOOLZIP`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web, iOS, Android, Windows, macOS, Linux',
        description: tool.description,
        url: `${BASE_URL}/tools/${tool.slug}`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        author: {
          '@type': 'Person',
          name: 'Shashikant Raj',
          url: 'https://sashibitcode.vercel.app/',
        },
      },
      ...(tool.steps && tool.steps.length > 0
        ? [
            {
              '@type': 'HowTo',
              name: `How to Use ${tool.title}`,
              description: tool.description,
              step: tool.steps.map((st) => ({
                '@type': 'HowToStep',
                position: st.step,
                name: st.title,
                text: st.desc,
              })),
            },
          ]
        : []),
      ...(tool.faqs && tool.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: tool.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div className="py-8 sm:py-16 bg-ivory">
      {/* Schema.org JSON-LD Graph */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-medium text-ink-secondary">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-warmborder" />
          <Link href={categoryAnchor} className="hover:text-primary transition-colors">
            {categoryName}
          </Link>
          <ChevronRight className="w-3 h-3 text-warmborder" />
          <span className="text-primary font-semibold">{tool.title}</span>
        </nav>

        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-primary-dark tracking-tight">
            {tool.title}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* CONVERSION OR EDITOR COMPONENT */}
        {tool.slug === 'edit-pdf' ? <PdfEditorStudio /> : <DropZone tool={tool} />}

        {/* HOW TO CONVERT (SEO STEPS & HOW-TO SCHEMA TARGET) */}
        {tool.steps && tool.steps.length > 0 && (
          <div className="pt-12 border-t border-warmborder">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary-dark text-center mb-8">
              How to Use {tool.title}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tool.steps.map((st) => (
                <div
                  key={st.step}
                  className="p-6 rounded-2xl bg-surface border border-warmborder shadow-card relative"
                >
                  <div className="w-7 h-7 rounded-lg bg-ivory border border-warmborder text-primary flex items-center justify-center font-serif font-bold text-xs mb-3.5">
                    {st.step}
                  </div>
                  <h3 className="font-serif font-bold text-ink-primary mb-1.5 text-sm">{st.title}</h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQS SECTION (AEO SCHEMA TARGET) */}
        {tool.faqs && tool.faqs.length > 0 && (
          <div className="pt-8 border-t border-warmborder">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-primary-dark">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-2xl mx-auto space-y-3.5">
              {tool.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-surface border border-warmborder shadow-card"
                >
                  <h3 className="font-serif font-bold text-ink-primary text-sm mb-1.5">
                    {faq.question}
                  </h3>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RELATED TOOLS */}
        {relatedTools.length > 0 && (
          <div className="pt-12 border-t border-warmborder">
            <h2 className="text-lg font-serif font-bold text-primary-dark mb-6">
              More {categoryName} Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedTools.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
