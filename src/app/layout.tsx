import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolzip.io';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'TOOLZIP — Elegant, Fast & Secure PDF Tools | Shashikant Raj',
    template: '%s | TOOLZIP',
  },
  description:
    'Convert, organize, compress, protect, edit, and sign documents online with TOOLZIP. Free Word to PDF, JPG to PDF, Excel to PDF, PPT to PDF, and in-browser PDF editor. 100% secure with automatic 30-minute file deletion. Architected by Shashikant Raj (sashibitcode).',
  keywords: [
    'TOOLZIP',
    'PDF tools',
    'Shashikant Raj',
    'sashibitcode',
    'Data Analyst',
    'Full Stack Developer',
    'convert to PDF',
    'convert from PDF',
    'Word to PDF',
    'JPG to PDF',
    'PowerPoint to PDF',
    'Excel to PDF',
    'PDF to JPG',
    'PDF to Word',
    'Compress PDF',
    'Edit PDF online',
    'Sign PDF',
    'Merge PDF',
    'Split PDF',
    'Zero-Retention PDF',
    'Free PDF tools',
  ],
  authors: [{ name: 'Shashikant Raj', url: 'https://sashibitcode.vercel.app/' }],
  creator: 'Shashikant Raj',
  publisher: 'Shashikant Raj',
  alternates: {
    canonical: '/',
    types: {
      'text/plain': [
        { url: '/llms.txt', title: 'LLM Context' },
        { url: '/llms-full.txt', title: 'Full LLM Context' },
      ],
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'TOOLZIP',
    title: 'TOOLZIP — Elegant, Fast & Secure PDF Tools | Shashikant Raj',
    description:
      'Convert and edit documents with archival precision. 100% free, private, with automatic 30-minute file deletion.',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@sashibitcode',
    creator: '@sashibitcode',
    title: 'TOOLZIP — Elegant, Fast & Secure PDF Tools | Shashikant Raj',
    description:
      '27 essential document & PDF tools built for speed, privacy, and precision by Shashikant Raj.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'author-title': 'Shashikant Raj | Data Analyst & Full Stack Developer',
    'job-title': 'Data Analyst & Full Stack Developer',
    'google-site-verification': 'H1VaM4zOcJ9KYa-x-C4MMOhkovetODClD6duII0LNc0',
    'msvalidate.01': 'BING_WEBMASTER_VERIFICATION_TOKEN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': 'https://sashibitcode.vercel.app/#person',
        name: 'Shashikant Raj',
        alternateName: ['sashibitcode', 'Shashi'],
        jobTitle: 'Data Analyst & Full Stack Developer',
        description:
          'Data Analyst and Full Stack Developer, Computer Science undergraduate at Jagannath University, Jaipur specializing in Data Analytics, Python, Next.js, and Cloud Security.',
        url: 'https://sashibitcode.vercel.app/',
        email: 'mailto:sashibitcode@gmail.com',
        alumniOf: {
          '@type': 'CollegeOrUniversity',
          name: 'Jagannath University, Jaipur',
          url: 'https://www.jagannathuniversity.org/',
        },
        sameAs: [
          'https://github.com/sashibitcode',
          'https://www.linkedin.com/in/sashikant-raj/',
          'https://leetcode.com/u/sashibitcode/',
          'https://www.instagram.com/sashibitcode/',
        ],
        knowsAbout: [
          'Data Analytics',
          'Python',
          'SQL',
          'Power BI',
          'Next.js',
          'React',
          'PDF Architecture',
          'Document Processing Systems',
          'Web Performance & Core Web Vitals',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${BASE_URL}/#website`,
        url: `${BASE_URL}/`,
        name: 'TOOLZIP',
        description:
          'Production-grade, 100% free online PDF and document processing platform with 27 tools and zero cloud retention.',
        inLanguage: 'en-US',
        publisher: {
          '@id': 'https://sashibitcode.vercel.app/#person',
        },
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${BASE_URL}/#app`,
        name: 'TOOLZIP',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web, iOS, Android, Windows, macOS, Linux',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        description:
          'High-performance online suite of 27 tools to convert, organize, compress, protect, edit, and sign PDFs with zero cloud retention and automatic 30-minute purging.',
        url: `${BASE_URL}/`,
        author: {
          '@id': 'https://sashibitcode.vercel.app/#person',
        },
      },
    ],
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Verification Tokens */}
        <meta name="google-site-verification" content="H1VaM4zOcJ9KYa-x-C4MMOhkovetODClD6duII0LNc0" />
        <meta name="msvalidate.01" content="BING_WEBMASTER_VERIFICATION_TOKEN" />

        {/* AI & LLM Discoverability (LLMO / GEO) */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Full LLM Context" />

        {/* PageSpeed Insights: Preconnect & Non-Render-Blocking Font Optimization */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />

        {/* E-E-A-T Person, WebSite & SoftwareApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
        />
      </head>
      <body className="bg-ivory text-ink-primary font-sans flex flex-col min-h-screen antialiased selection:bg-primary selection:text-white">
        {/* Agentic Browsing & Screen Reader Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-grow focus:outline-none" role="main">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
