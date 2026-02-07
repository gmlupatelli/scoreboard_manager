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
import Logo from '@/components/ui/Logo';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Logo size={80} />
            </div>
            <h1 className="text-4xl font-bold text-text-primary mb-4">About Scoreboard Manager</h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Learn more about the open-source project behind Scoreboard Manager and the mission to
              make score tracking simple and accessible.
            </p>
          </div>

          <div className="space-y-8">
            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">Our Mission</h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager exists to make score tracking effortless and accessible for any
                competition. From local tournaments to company events, the goal is the same: a
                reliable, easy-to-use platform that keeps everyone in sync.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">Open Source</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Scoreboard Manager is open source under the AGPL v3 license. You can self-host it
                for free, modify it to fit your needs, and share improvements with the community.
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                {
                  "I'm a solo developer who built this with the help of AI coding agents. The hosted version is supported by donations, so you can pay what you want to help cover hosting costs and keep development going."
                }
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                If hosting costs become unsustainable, I may pause or discontinue the hosted
                service. When possible, I will provide reasonable notice.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <a
                  href="https://github.com/gmlupatelli/scoreboard_manager/blob/main/LICENSE"
                  className="text-primary hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the AGPL v3 license
                </a>
                <a
                  href="https://github.com/gmlupatelli/scoreboard_manager"
                  className="text-primary hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noreferrer"
                >
                  View the GitHub repository
                </a>
                <a
                  href="https://github.com/gmlupatelli/scoreboard_manager/blob/main/docs/supabase-manual-setup.md"
                  className="text-primary hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noreferrer"
                >
                  Self-host setup guide
                </a>
                <a
                  href="https://github.com/gmlupatelli/scoreboard_manager/graphs/contributors"
                  className="text-primary hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noreferrer"
                >
                  Contributor list
                </a>
                <a
                  href="https://github.com/gmlupatelli/scoreboard_manager/blob/main/CONTRIBUTING.md"
                  className="text-primary hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read CONTRIBUTING.md
                </a>
                <Link
                  href="/supporters"
                  className="text-primary hover:opacity-80 transition-opacity"
                >
                  Supporters page
                </Link>
              </div>
              <p className="text-text-secondary leading-relaxed mt-4">
                Huge thanks to everyone who has contributed code, ideas, and feedback.
              </p>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">What We Offer</h2>
              <ul className="space-y-4 text-text-secondary">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-text-primary">Real-time Updates:</strong> Scores update
                    instantly across all devices, perfect for displaying on TVs and screens at your
                    venue.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-text-primary">Easy Management:</strong> Add, edit, and
                    organize entries with an intuitive interface that anyone can use.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-text-primary">Public Sharing:</strong> Share your
                    scoreboards with participants and spectators through simple, shareable links.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-bold">•</span>
                  <span>
                    <strong className="text-text-primary">CSV Import:</strong> Quickly import large
                    lists of participants from spreadsheets.
                  </span>
                </li>
              </ul>
            </section>

            <section className="bg-card border border-border rounded-lg p-8">
              <h2 className="text-2xl font-semibold text-text-primary mb-4">Our Story</h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager started as a side project to replace complicated and expensive
                scoring tools. It has grown into a community-friendly, open-source platform used by
                organizers who want speed, clarity, and control.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
