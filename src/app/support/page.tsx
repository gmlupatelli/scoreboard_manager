/*
 * Scoreboard Manager
 * Copyright (c) 2026 Scoreboard Manager contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Link from 'next/link';
import PublicHeader from '@/components/common/PublicHeader';
import Footer from '@/components/common/Footer';
import Icon from '@/components/ui/AppIcon';

const faqs = [
  {
    question: 'How do I create a new scoreboard?',
    answer:
      'After logging in, go to your Dashboard and click the "Create Scoreboard" button. Fill in the title, description, and visibility settings, then click "Create" to start adding entries.',
  },
  {
    question: 'Can I display my scoreboard on a TV?',
    answer:
      "Yes! Every scoreboard has a public view URL that you can open in any browser. Simply navigate to your scoreboard, copy the public URL, and open it on your TV's browser. The display will update automatically when you make changes from another device.",
  },
  {
    question: 'How do I import entries from a spreadsheet?',
    answer:
      'In the Scoreboard Management page, click "Import CSV". Your CSV file should have two columns: Name and Score. Download our template for the correct format, then upload your file to import all entries at once.',
  },
  {
    question: "What's the difference between Public and Private scoreboards?",
    answer:
      'Public scoreboards can be viewed by anyone with the link - perfect for displaying at events. Private scoreboards are only visible to you when logged in, ideal for planning or testing before an event.',
  },
  {
    question: 'Do scores update in real-time?',
    answer:
      'Yes! When you edit a score on one device, all other devices viewing that scoreboard will automatically update within seconds. No need to refresh the page.',
  },
  {
    question: 'How do I delete entries or clear my scoreboard?',
    answer:
      'In the Scoreboard Management page, you can delete individual entries by clicking the trash icon next to each one. To remove all entries, use the "Clear All" button. Both actions will ask for confirmation before proceeding.',
  },
];

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Support Center</h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our support team.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link
              href="/contact"
              className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-600/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/20 transition-colors">
                  <Icon name="ChatBubbleLeftRightIcon" size={24} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Contact Support</h3>
                  <p className="text-text-secondary text-sm">
                    Send us a message and we'll get back to you within 24-48 hours.
                  </p>
                </div>
              </div>
            </Link>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-600/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="EnvelopeIcon" size={24} className="text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-1">Email Us</h3>
                  <p className="text-text-secondary text-sm">support@scoreboardmanager.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-12">
            <h2 className="text-xl font-semibold text-text-primary mb-2">Open-source community</h2>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Scoreboard Manager is maintained by a solo developer and the community. If you
              self-host or want to contribute, GitHub Issues and pull requests are the best way to
              get help and improve the project.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/gmlupatelli/scoreboard_manager/issues"
                className="px-4 py-2 text-orange-900 rounded-md font-medium text-sm hover:bg-orange-900/10 transition-colors duration-150 flex items-center gap-2"
                title="Open a GitHub Issue"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="GitHubIcon" size={16} />
                GitHub Issues
              </a>
              <Link
                href="/pricing"
                className="px-4 py-2 text-primary rounded-md font-medium text-sm hover:bg-red-600/10 transition-colors duration-150 flex items-center gap-2"
                title="View supporter pricing"
              >
                <Icon name="GiftIcon" size={16} />
                Support the project
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border pb-6 last:border-0 last:pb-0">
                  <h3 className="font-medium text-text-primary mb-2 flex items-start gap-3">
                    <Icon
                      name="QuestionMarkCircleIcon"
                      size={20}
                      className="text-primary flex-shrink-0 mt-0.5"
                    />
                    {faq.question}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed pl-8">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-red-600/5 border border-red-600/20 rounded-lg p-6 text-center">
            <h3 className="font-semibold text-text-primary mb-2">Still need help?</h3>
            <p className="text-text-secondary text-sm mb-4">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              title="Contact the support team"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={18} />
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
