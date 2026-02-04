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

export default function SupportersPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      <main className="flex-1 pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-text-primary mb-4">Supporters</h1>
            <p className="text-lg text-text-secondary max-w-3xl mx-auto">
              Scoreboard Manager is built and maintained by a solo developer with help from the
              community. If the project saves you time, consider supporting to keep hosting running
              and development moving.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 mb-10">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Why support?</h2>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-start gap-3">
                <Icon name="HeartIcon" size={18} className="text-primary mt-0.5" />
                Helps cover hosting and infrastructure costs.
              </li>
              <li className="flex items-start gap-3">
                <Icon name="SparklesIcon" size={18} className="text-primary mt-0.5" />
                Supports ongoing improvements and new features.
              </li>
              <li className="flex items-start gap-3">
                <Icon name="UsersIcon" size={18} className="text-primary mt-0.5" />
                Keeps the open-source community thriving.
              </li>
            </ul>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <div className="border border-border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🙌</div>
              <p className="font-semibold text-text-primary">Supporter</p>
              <p className="text-sm text-text-secondary">$5–9/mo</p>
            </div>
            <div className="border border-border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🏆</div>
              <p className="font-semibold text-text-primary">Champion</p>
              <p className="text-sm text-text-secondary">$10–24/mo</p>
            </div>
            <div className="border border-border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🌟</div>
              <p className="font-semibold text-text-primary">Legend</p>
              <p className="text-sm text-text-secondary">$25–49/mo</p>
            </div>
            <div className="border border-border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">👑</div>
              <p className="font-semibold text-text-primary">Hall of Famer</p>
              <p className="text-sm text-text-secondary">$50+/mo</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-text-primary mb-4">Ready to support?</h2>
            <p className="text-text-secondary mb-6">
              All supporter tiers unlock the same hosted features. You can choose any amount and
              change it anytime.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:bg-red-700 transition-colors duration-150 flex items-center gap-2"
                title="View pricing and supporter tiers"
              >
                <Icon name="GiftIcon" size={16} />
                View Pricing
              </Link>
              <a
                href="https://github.com/gmlupatelli/scoreboard_manager"
                className="px-4 py-2 text-orange-900 rounded-md font-medium text-sm hover:bg-orange-900/10 transition-colors duration-150 flex items-center gap-2"
                title="View the GitHub repository"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="GitHubIcon" size={16} />
                Visit GitHub
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
