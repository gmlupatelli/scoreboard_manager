import Icon from '@/components/ui/AppIcon';
import Button from '@/components/ui/Button';
import Footer from '@/components/common/Footer';
import Header from '@/components/common/Header';

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
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
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

export default function Home() {
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
      icon: 'UserGroupIcon',
      title: 'Team Collaboration',
      description:
        'Invite collaborators with specific permissions. Manage access levels for editors and viewers to streamline team workflows.',
    },
    {
      icon: 'DevicePhoneMobileIcon',
      title: 'Mobile Optimized',
      description:
        'Fully responsive design works flawlessly on any device. Manage scoreboards on the go from your smartphone.',
    },
    {
      icon: 'BoltIcon',
      title: 'Zero Setup Required',
      description:
        'Start tracking scores in seconds. No installation, no configuration - just sign up and create your first scoreboard instantly.',
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
      <Header isAuthenticated={false} />

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 sm:pt-24 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
          <div className="relative max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/15 rounded-full text-accent font-semibold text-sm mb-6">
                  <Icon name="SparklesIcon" size={16} />
                  <span>Trusted by 10,000+ Event Organizers</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight">
                  Manage Scoreboards{' '}
                  <span className="text-primary whitespace-nowrap">Like a Pro</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-text-secondary mb-8 leading-relaxed">
                  The ultimate platform for creating, managing, and sharing real-time scoreboards.
                  Perfect for tournaments, leagues, and competitions of any size.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    href="/register"
                    variant="primary"
                    size="lg"
                    icon="ArrowRightIcon"
                    iconPosition="right"
                  >
                    Create an Account
                  </Button>
                  <Button
                    href="/public-scoreboard-list"
                    variant="outline"
                    size="lg"
                    icon="TrophyIcon"
                    iconPosition="left"
                  >
                    Scoreboards
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
            <div className="grid md:grid-cols-2 gap-12 items-center">
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
