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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Privacy Policy</h1>
            <p className="text-text-secondary">Last updated: February 2026</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">1. Introduction</h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager ("we", "our", or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our scoreboard management service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                2. Information We Collect
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We collect information that you provide directly to us and information generated
                when you use the service, including:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Account information (email address, password)</li>
                <li>Profile information (name, display preferences)</li>
                <li>Scoreboard data (titles, descriptions, entries, scores)</li>
                <li>Communications you send to us</li>
                <li>Usage and device data (IP address, browser type, pages visited, timestamps)</li>
                <li>
                  Cookies and similar technologies (see our{' '}
                  <a href="/cookies" className="text-primary hover:opacity-80 transition-opacity">
                    Cookie Policy
                  </a>
                  )
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Authenticate users and secure accounts</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and performance</li>
                <li>Detect, investigate, and prevent fraud, abuse, or security issues</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">4. Legal Bases</h2>
              <p className="text-text-secondary leading-relaxed">
                Where required by law, we process personal information based on one or more legal
                bases, including: performance of a contract (to provide the service), legitimate
                interests (to secure and improve the service), consent (for optional features), and
                compliance with legal obligations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                5. Canada (Ontario) Privacy Rights
              </h2>
              <p className="text-text-secondary leading-relaxed">
                If you are in Canada, we process personal information in accordance with PIPEDA and
                other applicable privacy laws. You may withdraw consent where processing is based
                on consent, subject to legal or contractual restrictions. If you have concerns, you
                may also contact the Office of the Privacy Commissioner of Canada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                6. European Economic Area and United Kingdom Rights
              </h2>
              <p className="text-text-secondary leading-relaxed">
                If you are in the EEA or UK, you may have rights under the GDPR to access, correct,
                delete, restrict, or object to processing of your personal data, and to data
                portability. You also have the right to lodge a complaint with your local data
                protection authority.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                7. United States Privacy Rights
              </h2>
              <p className="text-text-secondary leading-relaxed">
                If you are a resident of certain U.S. states, you may have rights to access,
                correct, delete, or obtain a copy of your personal data, and to opt out of certain
                processing. We do not sell personal information. To exercise your rights, contact
                us using the details below.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                8. Information Sharing
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We do not sell your personal information. We may share information in the
                following situations:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>
                  With service providers who help us operate the platform (hosting, authentication,
                  email delivery, analytics), under confidentiality agreements.
                </li>
                <li>To comply with law, legal processes, or enforce our terms.</li>
                <li>
                  In connection with a business transfer, such as a merger, acquisition, or asset
                  sale.
                </li>
                <li>With your consent or at your direction.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                9. Open Source & Self-Hosting
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager is open source under the AGPL v3 license. You can self-host the
                software, and if you run a modified version for others over a network, the license
                requires you to offer the source code to those users. For self-hosted instances, the
                operator is responsible for their own privacy practices and data handling, and this
                policy applies only to the hosted service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                10. Public Scoreboards
              </h2>
              <p className="text-text-secondary leading-relaxed">
                When you create a public scoreboard, the scoreboard title, description, and all
                entries (names and scores) become publicly accessible to anyone with the link.
                Private scoreboards are only visible to you when logged into your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">11. Data Security</h2>
              <p className="text-text-secondary leading-relaxed">
                We implement appropriate technical and organizational security measures to protect
                your personal information against unauthorized access, alteration, disclosure, or
                destruction. However, no method of transmission over the Internet or electronic
                storage is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">12. Data Retention</h2>
              <p className="text-text-secondary leading-relaxed">
                We retain personal information for as long as your account is active or as needed
                to provide the service. If you request deletion, we will delete your data within a
                reasonable timeframe, subject to legal requirements and backup retention.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">13. Your Rights</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Correct or update your information</li>
                <li>Delete your account and associated data</li>
                <li>Object to or restrict certain processing of your data</li>
                <li>Withdraw consent for optional processing where applicable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                14. International Data Transfers
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We may process and store information in countries where we or our service providers
                operate. These countries may have data protection laws that differ from your
                jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                15. Changes to This Policy
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the "Last
                updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">16. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at
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
