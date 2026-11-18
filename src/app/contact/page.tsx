'use client';

import { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

  return (
    <div className="py-12 sm:py-20 bg-ivory">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" />
            <span>Get In Touch</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-ink-heading tracking-tight">
            Contact Support
          </h1>
          <p className="text-sm sm:text-base text-ink-secondary max-w-md mx-auto">
            Have questions, feedback, or a feature request for a new PDF tool? We would love to hear from you.
          </p>
        </div>

        <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-warmborder shadow-card">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-success/10 text-success mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-ink-heading">
                Message Sent!
              </h2>
              <p className="text-sm text-ink-secondary max-w-sm mx-auto">
                Thank you for reaching out. We will get back to your email within 24 hours.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: '', email: '', message: '' });
                }}
                className="mt-4 px-6 py-2.5 rounded-xl bg-surface border border-warmborder text-ink-primary text-sm font-medium hover:bg-ivory transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-4 py-3 rounded-xl bg-ivory/60 border border-warmborder text-ink-primary placeholder-ink-secondary/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-ivory/60 border border-warmborder text-ink-primary placeholder-ink-secondary/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-secondary mb-2">
                  Your Message or Feature Request
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what you'd like to see or any issue you encountered..."
                  className="w-full px-4 py-3 rounded-xl bg-ivory/60 border border-warmborder text-ink-primary placeholder-ink-secondary/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl shadow-button transition-colors text-sm flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
