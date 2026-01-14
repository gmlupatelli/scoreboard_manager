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
            <p className="text-text-secondary">Last updated: November 2025</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">1. What Are Cookies</h2>
              <p className="text-text-secondary leading-relaxed">
                Cookies are small text files that are stored on your device when you visit a
                website. They are widely used to make websites work more efficiently and to provide
                information to website owners.
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
                  <strong className="text-text-primary">Essential Cookies:</strong> Required for the
                  operation of our website, including authentication and session management.
                </li>
                <li>
                  <strong className="text-text-primary">Functionality Cookies:</strong> Allow us to
                  remember your preferences and provide enhanced features.
                </li>
                <li>
                  <strong className="text-text-primary">Analytics Cookies:</strong> Help us
                  understand how visitors interact with our website so we can improve our service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                3. Types of Cookies We Use
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-text-secondary text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">
                        Cookie Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">
                        Purpose
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-text-primary">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">sb-access-token</td>
                      <td className="py-3 px-4">Authentication and session management</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">sb-refresh-token</td>
                      <td className="py-3 px-4">Maintain logged-in state</td>
                      <td className="py-3 px-4">30 days</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 px-4">preferences</td>
                      <td className="py-3 px-4">Store user preferences</td>
                      <td className="py-3 px-4">1 year</td>
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
                We may use third-party services that set their own cookies, such as analytics
                providers. These third parties have their own privacy policies governing the use of
                their cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">5. Managing Cookies</h2>
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
              <h2 className="text-xl font-semibold text-text-primary mb-4">6. Essential Cookies</h2>
              <p className="text-text-secondary leading-relaxed">
                Some cookies are essential for the operation of our website. These cookies enable
                core functionality such as security, network management, and account access. You
                cannot opt out of these cookies as the website cannot function properly without
                them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                7. Updates to This Policy
              </h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our
                practices or for operational, legal, or regulatory reasons. We encourage you to
                review this page periodically for the latest information on our cookie practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-4">8. Contact Us</h2>
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
