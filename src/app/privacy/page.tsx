import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Toolzip',
  description:
    'Our privacy commitment: zero document inspection, isolated sandboxes, and permanent 30-minute auto-deletion.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 sm:py-20 bg-ivory">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-surface border border-warmborder text-primary text-xs font-medium uppercase tracking-wider mb-3">
            Zero-Log Promise
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-primary-dark tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-ink-secondary">
            Last updated: November 2026
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-success-bg border border-success-border flex items-start space-x-4 shadow-card">
          <ShieldCheck className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-success leading-relaxed">
            <strong>TL;DR Summary:</strong> We do not inspect, index, or retain your files. Uploaded documents are converted in an isolated directory and permanently erased from the server after 30 minutes. We require no sign-ups and sell zero user data.
          </div>
        </div>

        <div className="space-y-8 text-ink-primary text-xs sm:text-sm leading-relaxed">
          <section className="space-y-2.5">
            <h2 className="text-lg font-serif font-bold text-primary-dark">
              1. File Processing & 30-Minute Auto-Deletion
            </h2>
            <p className="text-ink-secondary">
              When you upload a file to Toolzip, it is stored in a temporary, UUID-isolated workspace accessible only by your unique conversion job. Once converted, your files are scheduled for automatic permanent deletion:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-ink-secondary">
              <li>Both input files and converted results are permanently unlinked and deleted after 30 minutes.</li>
              <li>Files are not backed up, duplicated, or mirrored to external cloud storage.</li>
              <li>You can download your result immediately upon completion of the conversion job.</li>
            </ul>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-serif font-bold text-primary-dark">
              2. No Personal Data or Accounts
            </h2>
            <p className="text-ink-secondary">
              Toolzip does not require an account, credit card, or email address to use our conversion tools. We do not correlate your conversion activities with your identity.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-serif font-bold text-primary-dark">
              3. Rate Limiting and Security Logs
            </h2>
            <p className="text-ink-secondary">
              To protect the platform against denial-of-service (DoS) attacks and malicious abuse, our server temporarily retains IP addresses in memory for sliding-window rate limiting. These records are flushed frequently and are never associated with document contents.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-serif font-bold text-primary-dark">
              4. Third-Party Sharing
            </h2>
            <p className="text-ink-secondary">
              We do not sell, rent, or share user files or metadata with any third parties or advertisers under any circumstances.
            </p>
          </section>

          <section className="space-y-2.5">
            <h2 className="text-lg font-serif font-bold text-primary-dark">
              5. Contact Us
            </h2>
            <p className="text-ink-secondary">
              If you have questions about our privacy practices, please contact us through our{' '}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                Contact Page
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
