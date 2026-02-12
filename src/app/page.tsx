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

import Icon from '@/components/ui/AppIcon';
import Button from '@/components/ui/Button';
import Footer from '@/components/common/Footer';
import PublicHeader from '@/components/common/PublicHeader';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

interface BenefitCardProps {
  number: string;
  title: string;
  description: string;
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="bg-card border border-border rounded-lg p-6 hover-lift transition-smooth duration-150 elevation-1">
    <div className="w-12 h-12 rounded-lg bg-red-600/10 flex items-center justify-center mb-4">
      <Icon name={icon} size={24} className="text-primary" />
    </div>
    <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
    <p className="text-text-secondary leading-relaxed">{description}</p>
  </div>
);

const BenefitCard = ({ number, title, description }: BenefitCardProps) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
      <span className="text-2xl font-bold text-white">{number}</span>
    </div>
    <div>
      <h3 className="text-lg font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  </div>
);

const TestimonialCard = ({ quote, author, role }: TestimonialCardProps) => (
  <div className="bg-card border border-border rounded-lg p-6 elevation-1">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Icon key={i} name="StarIcon" size={16} className="text-warning fill-warning" />
      ))}
    </div>
    <p className="text-text-primary italic mb-4">"{quote}"</p>
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
        <Icon name="UserIcon" size={20} className="text-white" />
      </div>
      <div>
        <p className="font-semibold text-text-primary">{author}</p>
        <p className="text-sm text-text-secondary">{role}</p>
      </div>
    </div>
  </div>
);

const getGitHubStars = async () => {
  try {
    const response = await fetch('https://api.github.com/repos/gmlupatelli/scoreboard_manager', {
      headers: {
        Accept: 'application/vnd.github+json',
      },
      next: {
        revalidate: 3600,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data: { stargazers_count?: number } = await response.json();

    if (typeof data.stargazers_count !== 'number') {
      return null;
    }

    return data.stargazers_count;
  } catch (_error) {
    return null;
  }
};

export default async function Home() {
  const githubStars = await getGitHubStars();
  const formattedStars = githubStars
    ? new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(githubStars)
    : null;
  const githubStarsLabel = formattedStars
    ? `View Scoreboard Manager on GitHub (${formattedStars} stars)`
    : 'View Scoreboard Manager on GitHub';
  const features = [
    {
      icon: 'PaintBrushIcon',
      title: 'Custom Branding & Styling',
      description:
        'Personalize your scoreboards with custom colors, fonts, and logos. Match your brand identity perfectly with our flexible design system.',
    },
    {
      icon: 'ClockIcon',
      title: 'Flexible Score Formats',
      description:
        'Support for numbers, times, and custom formats. Track everything from race times to game points with built-in format converters.',
    },
    {
      icon: 'CodeBracketIcon',
      title: 'Embed Anywhere',
      description:
        'One-click embed codes for any website. Display your scoreboard seamlessly on your site with responsive iframe integration.',
    },
    {
      icon: 'TvIcon',
      title: 'Kiosk Mode',
      description:
        'Display scoreboards on TVs and large screens with a beautiful carousel. Add custom images, set durations, and enable PIN protection.',
    },
    {
      icon: 'DevicePhoneMobileIcon',
      title: 'Mobile Optimized',
      description:
        'Fully responsive design works flawlessly on any device. Manage scoreboards on the go from your smartphone.',
    },
    {
      icon: 'BoltIcon',
      title: 'Hosted or Self-Hosted',
      description:
        'Use the hosted app for instant setup, or self-host for full control with the same features.',
    },
  ];

  const benefits = [
    {
      number: '1',
      title: 'Save Time',
      description:
        'Automate score tracking and eliminate manual updates. Focus on what matters most - your event.',
    },
    {
      number: '2',
      title: 'Increase Engagement',
      description:
        'Keep participants and spectators informed with live updates. Boost excitement and participation.',
    },
    {
      number: '3',
      title: 'Professional Image',
      description:
        'Present polished, branded scoreboards that elevate your event. Stand out from the competition.',
    },
  ];

  const testimonials = [
    {
      quote:
        'Scoreboard Manager transformed how we run our tournaments. The real-time updates are a game changer!',
      author: 'Sarah Johnson',
      role: 'Tournament Director',
    },
    {
      quote:
        'Simple, powerful, and reliable. Exactly what we needed for our sports league management.',
      author: 'Michael Chen',
      role: 'League Coordinator',
    },
    {
      quote:
        'The mobile experience is excellent. We can update scores from anywhere during our events.',
      author: 'Emily Rodriguez',
      role: 'Event Manager',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 sm:pt-24 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-orange-600/5 to-amber-600/5" />
          <div className="relative max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary whitespace-nowrap">
                    <Icon name="SparklesIcon" size={16} className="text-success flex-shrink-0" />
                    <span>Open Source • AGPL v3</span>
                  </div>
                  <a
                    href="https://github.com/gmlupatelli/scoreboard_manager"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-muted hover:text-text-primary"
                    aria-label={githubStarsLabel}
                    title={githubStarsLabel}
                  >
                    <Icon name="StarIcon" size={16} className="text-amber-600" />
                    <span>Star on GitHub</span>
                    {formattedStars ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-text-secondary">
                        {formattedStars}
                      </span>
                    ) : null}
                    <Icon
                      name="ArrowTopRightOnSquareIcon"
                      size={14}
                      className="text-text-secondary"
                    />
                  </a>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
                  Manage Scoreboards{' '}
                  <span className="text-primary whitespace-nowrap">Your Way</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-text-secondary mb-8 leading-relaxed">
                  Scoreboard Manager is open source and built by a solo developer who wanted a
                  simple, reliable way to run events. Self-host for free or use the hosted app and
                  pay what you want to help cover hosting (and the occasional coffee).
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    href="/register"
                    variant="outline"
                    size="lg"
                    icon="ArrowRightIcon"
                    iconPosition="right"
                    title="Start using the hosted app"
                  >
                    Sign Up for Free
                  </Button>
                  <Button
                    href="/pricing"
                    variant="primary"
                    size="lg"
                    icon="GiftIcon"
                    iconPosition="left"
                    title="View pricing and supporter tiers"
                  >
                    View Pricing
                  </Button>
                </div>
                <div className="flex items-center space-x-4 sm:space-x-6 md:space-x-8 mt-8 pt-8 border-t border-border">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-text-primary">10K+</p>
                    <p className="text-sm text-text-secondary">Active Users</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-text-primary">50K+</p>
                    <p className="text-sm text-text-secondary">Scoreboards Created</p>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-text-primary">99.9%</p>
                    <p className="text-sm text-text-secondary">Uptime</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-surface border border-border rounded-2xl p-6 elevation-2">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-semibold text-text-primary">Q4 Sales Performance</p>
                          <p className="text-sm text-text-secondary">Top Performers</p>
                        </div>
                      </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-[60px_1fr_100px] sm:grid-cols-[80px_1fr_120px] gap-4 px-4 py-3 border-b border-border">
                      <span className="text-xs font-semibold text-text-secondary uppercase">
                        Rank
                      </span>
                      <span className="text-xs font-semibold text-text-secondary uppercase">
                        Name
                      </span>
                      <span className="text-xs font-semibold text-text-secondary uppercase text-right">
                        Score
                      </span>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-border">
                      <div className="grid grid-cols-[60px_1fr_100px] sm:grid-cols-[80px_1fr_120px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center">
                          <Icon name="TrophyIcon" size={24} className="text-warning" />
                          <span className="ml-2 font-semibold text-text-primary">#1</span>
                        </div>
                        <span className="font-medium text-text-primary">Sarah Johnson</span>
                        <span className="text-lg font-bold text-accent text-right">98,500</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr_100px] sm:grid-cols-[80px_1fr_120px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center">
                          <Icon name="TrophyIcon" size={24} className="text-text-secondary" />
                          <span className="ml-2 font-semibold text-text-primary">#2</span>
                        </div>
                        <span className="font-medium text-text-primary">Michael Chen</span>
                        <span className="text-lg font-bold text-accent text-right">87,200</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr_100px] sm:grid-cols-[80px_1fr_120px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center">
                          <Icon name="TrophyIcon" size={24} className="text-secondary" />
                          <span className="ml-2 font-semibold text-text-primary">#3</span>
                        </div>
                        <span className="font-medium text-text-primary">Emily Rodriguez</span>
                        <span className="text-lg font-bold text-accent text-right">76,800</span>
                      </div>
                      <div className="grid grid-cols-[60px_1fr_100px] sm:grid-cols-[80px_1fr_120px] gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center">
                          <span className="ml-2 font-semibold text-text-primary">#4</span>
                        </div>
                        <span className="font-medium text-text-primary">David Kim</span>
                        <span className="text-lg font-bold text-accent text-right">65,400</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Open Source Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                  Why <span className="text-primary">Open Source</span>?
                </h2>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {
                    "I'm a solo developer who built Scoreboard Manager with the help of AI coding agents. It started as a side project and grew into something worth sharing. Open source keeps it transparent and lets anyone self-host for free."
                  }
                </p>
                <p className="text-text-secondary leading-relaxed">
                  If you use the hosted app, you can pay what you want to support hosting costs —
                  and maybe leave enough for a coffee. Every contribution helps keep the project
                  moving.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 elevation-1">
                <h3 className="text-xl font-semibold text-text-primary mb-4">Get involved</h3>
                <ul className="space-y-3 text-text-secondary">
                  <li className="flex items-start gap-3">
                    <Icon name="GitHubIcon" size={18} className="text-text-secondary mt-0.5" />
                    <a
                      href="https://github.com/gmlupatelli/scoreboard_manager"
                      className="hover:opacity-80 transition-opacity"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Star the repo and follow updates
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="CodeBracketIcon" size={18} className="text-text-secondary mt-0.5" />
                    <a
                      href="https://github.com/gmlupatelli/scoreboard_manager/blob/main/CONTRIBUTING.md"
                      className="hover:opacity-80 transition-opacity"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read the contribution guide
                    </a>
                  </li>
                  <li className="flex items-start gap-3">
                    <Icon name="HeartIcon" size={18} className="text-text-secondary mt-0.5" />
                    <a
                      href="/supporters"
                      className="hover:opacity-80 transition-opacity"
                      title="See supporter tiers and perks"
                    >
                      See supporter tiers and perks
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Powerful Features for <span className="text-primary">Every Need</span>
              </h2>
              <p className="text-xl text-text-secondary max-w-3xl mx-auto">
                Everything you need to create, manage, and share professional scoreboards with ease
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-6">
                  Why Choose <span className="text-primary">Scoreboard Manager?</span>
                </h2>
                <p className="text-xl text-text-secondary mb-8">
                  Join thousands of event organizers who trust us to deliver exceptional scoreboard
                  management
                </p>
                <div className="space-y-6">
                  {benefits.map((benefit, index) => (
                    <BenefitCard key={index} {...benefit} />
                  ))}
                </div>
                <div className="mt-8 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="ShieldCheckIcon" size={20} className="text-success" />
                    <span className="text-sm text-text-secondary">Enterprise Security</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Icon name="CheckBadgeIcon" size={20} className="text-success" />
                    <span className="text-sm text-text-secondary">99.9% Uptime SLA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-4">
                Loved by <span className="text-primary">Event Organizers</span>
              </h2>
              <p className="text-xl text-text-secondary">
                See what our customers have to say about their experience
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} {...testimonial} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
