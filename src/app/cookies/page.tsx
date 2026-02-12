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

import PublicHeader from '@/components/common/PublicHeader';
import Footer from '@/components/common/Footer';

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Cookie Policy</h1>
            <p className="text-text-secondary">Last updated: February 2026</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">1. What Are Cookies</h2>
              <p className="text-text-secondary leading-relaxed">
                Cookies are small text files stored on your device when you visit a website. We also
                use similar technologies like local storage where appropriate. These tools help us
                keep the service secure, remember preferences, and improve performance.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                2. How We Use Cookies
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Scoreboard Manager uses cookies for the following purposes:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>
                  <strong className="text-text-primary">Essential Cookies:</strong> Required for
                  authentication, security, and session management.
                </li>
                <li>
                  <strong className="text-text-primary">Functionality Cookies:</strong> Remember
                  your preferences and settings.
                </li>
                <li>
                  <strong className="text-text-primary">Analytics Cookies:</strong> If enabled, help
                  us understand usage so we can improve the service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">3. Cookie Details</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                The cookies used by the hosted service may include the following. Names and
                durations can vary by environment or updates.
              </p>
              <div className="overflow-x-auto border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Cookie Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-border">
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">sb-access-token</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">Authentication and session management</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">Session</td>
                    </tr>
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">sb-refresh-token</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">Maintain logged-in state</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">30 days</td>
                    </tr>
                    <tr className="hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">preferences</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">Store user preferences</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">1 year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                4. Third-Party Cookies
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We may use third-party services that set their own cookies, such as analytics or
                infrastructure providers. These third parties have their own privacy policies
                governing the use of their cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                5. Open Source & Self-Hosting
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager is open source under the AGPL v3 license. If you self-host the
                software, you control which cookies are used and are responsible for notifying your
                users. The AGPL v3 also requires operators who modify and host the software for
                others to provide access to the corresponding source code.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">6. Managing Cookies</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>
                  <strong className="text-text-primary">Browser Settings:</strong> Most browsers
                  allow you to refuse or accept cookies, delete existing cookies, and set
                  preferences for certain websites.
                </li>
                <li>
                  <strong className="text-text-primary">Private Browsing:</strong> Using private or
                  incognito mode prevents cookies from being stored after your session.
                </li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                Please note that blocking certain cookies may affect the functionality of our
                website and your user experience.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">7. Essential Cookies</h2>
              <p className="text-text-secondary leading-relaxed">
                Some cookies are essential for the operation of our website. These cookies enable
                core functionality such as security, network management, and account access. You
                cannot opt out of these cookies as the website cannot function properly without
                them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                8. Do Not Track and Global Privacy Control
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Some browsers offer a "Do Not Track" signal or Global Privacy Control (GPC). The
                service may not respond to these signals uniformly because there is no consistent
                industry standard.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                9. Updates to This Policy
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our
                practices or for operational, legal, or regulatory reasons. We encourage you to
                review this page periodically for the latest information on our cookie practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">10. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have any questions about our use of cookies, please contact us at
                privacy@scoreboardmanager.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
