import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
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
      <Icon name={icon as any} size={24} className="text-primary" />
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
      icon: 'BoltIcon',
      title: 'Real-Time Updates',
      description: 'Instant scoreboard updates that sync across all devices automatically. Never miss a score change with our live update technology.'
    },
    {
      icon: 'Cog6ToothIcon',
      title: 'Easy Management',
      description: 'Create and manage unlimited scoreboards with our intuitive admin dashboard. No technical skills required.'
    },
    {
      icon: 'GlobeAltIcon',
      title: 'Public Access',
      description: 'Share scoreboards with anyone via simple public links. Perfect for tournaments, events, and competitions.'
    },
    {
      icon: 'ShieldCheckIcon',
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control. Your data is always protected and backed up.'
    },
    {
      icon: 'DevicePhoneMobileIcon',
      title: 'Mobile Optimized',
      description: 'Fully responsive design works flawlessly on any device. Manage scoreboards on the go from your smartphone.'
    },
    {
      icon: 'ChartBarIcon',
      title: 'Advanced Analytics',
      description: 'Track performance trends and generate detailed reports. Make data-driven decisions with comprehensive insights.'
    }
  ];

  const benefits = [
    {
      number: '1',
      title: 'Save Time',
      description: 'Automate score tracking and eliminate manual updates. Focus on what matters most - your event.'
    },
    {
      number: '2',
      title: 'Increase Engagement',
      description: 'Keep participants and spectators informed with live updates. Boost excitement and participation.'
    },
    {
      number: '3',
      title: 'Professional Image',
      description: 'Present polished, branded scoreboards that elevate your event. Stand out from the competition.'
    }
  ];

  const testimonials = [
    {
      quote: 'Scoreboard Manager transformed how we run our tournaments. The real-time updates are a game changer!',
      author: 'Sarah Johnson',
      role: 'Tournament Director'
    },
    {
      quote: 'Simple, powerful, and reliable. Exactly what we needed for our sports league management.',
      author: 'Michael Chen',
      role: 'League Coordinator'
    },
    {
      quote: 'The mobile experience is excellent. We can update scores from anywhere during our events.',
      author: 'Emily Rodriguez',
      role: 'Event Manager'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={false} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-6">
                <Icon name="SparklesIcon" size={16} />
                <span>Trusted by 10,000+ Event Organizers</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
                Manage Scoreboards <span className="text-primary">Like a Pro</span>
              </h1>
              <p className="text-xl text-text-secondary mb-8 leading-relaxed">
                The ultimate platform for creating, managing, and sharing real-time scoreboards. 
                Perfect for tournaments, leagues, and competitions of any size.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-smooth duration-150 hover-lift elevation-1"
                >
                  <span>Create an Account</span>
                  <Icon name="ArrowRightIcon" size={20} />
                </Link>
                <Link
                  href="/public-scoreboard-list"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-surface border-2 border-border text-text-primary rounded-lg font-semibold text-lg hover:bg-muted transition-smooth duration-150"
                >
                  <Icon name="TrophyIcon" size={20} />
                  <span>Scoreboards</span>
                </Link>
              </div>
              <div className="flex items-center space-x-8 mt-8 pt-8 border-t border-border">
                <div>
                  <p className="text-3xl font-bold text-text-primary">10K+</p>
                  <p className="text-sm text-text-secondary">Active Users</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">50K+</p>
                  <p className="text-sm text-text-secondary">Scoreboards Created</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">99.9%</p>
                  <p className="text-sm text-text-secondary">Uptime</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-surface border border-border rounded-2xl p-6 elevation-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Icon name="TrophyIcon" size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">Q4 Sales Performance</p>
                        <p className="text-sm text-text-secondary">Top Performers</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-success/10 rounded-full">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-success">LIVE</span>
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center">
                          <span className="text-sm font-bold text-white">1</span>
                        </div>
                        <span className="font-medium text-text-primary">Sarah Johnson</span>
                      </div>
                      <span className="text-lg font-bold text-primary">98,500</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-text-secondary flex items-center justify-center">
                          <span className="text-sm font-bold text-white">2</span>
                        </div>
                        <span className="font-medium text-text-primary">Michael Chen</span>
                      </div>
                      <span className="text-lg font-bold text-text-primary">87,200</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-bold text-white">3</span>
                        </div>
                        <span className="font-medium text-text-primary">Emily Rodriguez</span>
                      </div>
                      <span className="text-lg font-bold text-text-primary">76,800</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center">
                          <span className="text-sm font-bold text-text-secondary">4</span>
                        </div>
                        <span className="font-medium text-text-secondary">David Kim</span>
                      </div>
                      <span className="text-lg font-bold text-text-secondary">65,400</span>
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
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
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
              <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
                Why Choose <span className="text-primary">Scoreboard Manager?</span>
              </h2>
              <p className="text-xl text-text-secondary mb-8">
                Join thousands of event organizers who trust us to deliver exceptional scoreboard management
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
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
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

      <Footer />
    </div>
  );
}
