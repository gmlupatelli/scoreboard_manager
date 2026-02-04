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

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Terms of Service</h1>
            <p className="text-text-secondary">Last updated: February 2026</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-text-secondary leading-relaxed">
                By accessing or using Scoreboard Manager, you agree to be bound by these Terms of
                Service. If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                2. Description of Service
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager provides a web-based platform for creating, managing, and
                displaying scoreboards for various competitions, tournaments, and events. Our
                service allows users to track scores in real-time and share them publicly or keep
                them private.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                3. Open Source License (AGPL v3)
              </h2>
              <p className="text-text-secondary leading-relaxed">
                Scoreboard Manager is licensed under the GNU Affero General Public License v3. If
                you run a modified version of the software and make it available to others over a
                network, you must offer the corresponding source code to those users. This
                requirement applies to hosted or self-hosted deployments that serve third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">4. User Accounts</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To use certain features of our service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">5. User Content</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You retain ownership of all content you create through our service. By posting
                content, you grant us a non-exclusive, worldwide license to use, display, and
                distribute your content solely for the purpose of operating and improving our
                service.
              </p>
              <p className="text-text-secondary leading-relaxed">
                You are responsible for ensuring that your content does not violate any third-party
                rights or applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">6. Acceptable Use</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                You agree not to use our service to:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights of others</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Use the service for any fraudulent or deceptive purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                7. Service Availability
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We strive to maintain high availability of our service, but we do not guarantee
                uninterrupted access. We may temporarily suspend the service for maintenance,
                updates, or due to circumstances beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                8. Limitation of Liability
              </h2>
              <p className="text-text-secondary leading-relaxed">
                To the maximum extent permitted by law, Scoreboard Manager shall not be liable for
                any indirect, incidental, special, consequential, or punitive damages resulting from
                your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">9. Indemnification</h2>
              <p className="text-text-secondary leading-relaxed">
                You agree to indemnify and hold harmless Scoreboard Manager and its affiliates from
                any claims, damages, or expenses arising from your use of the service or violation
                of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">10. Termination</h2>
              <p className="text-text-secondary leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation
                of these terms or for any other reason at our sole discretion. You may also delete
                your account at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">11. Changes to Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                We may modify these Terms of Service at any time. We will notify users of
                significant changes by posting a notice on our website. Continued use of the service
                after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">12. Governing Law</h2>
              <p className="text-text-secondary leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with
                applicable laws, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                13. Contact Information
              </h2>
              <p className="text-text-secondary leading-relaxed">
                For any questions regarding these Terms of Service, please contact us at
                legal@scoreboardmanager.com.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
