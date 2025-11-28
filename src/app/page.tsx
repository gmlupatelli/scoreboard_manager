'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import Logo from '@/components/ui/Logo';

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

export default function MarketingLandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

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
      {/* Sticky Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-smooth duration-300 ${
        isScrolled ? 'bg-surface/95 backdrop-blur-sm elevation-1 border-b border-border' : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Logo size={40} />
              <span className="text-xl font-bold text-text-primary tracking-tight">
                Scoreboard Manager
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-text-secondary hover:text-primary transition-smooth duration-150 font-medium"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('benefits')}
                className="text-text-secondary hover:text-primary transition-smooth duration-150 font-medium"
              >
                Benefits
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-text-secondary hover:text-primary transition-smooth duration-150 font-medium"
              >
                Testimonials
              </button>
              <Link
                href="/register"
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition-smooth duration-150 hover-lift"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

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
                  <span>Start Free Trial</span>
                  <Icon name="ArrowRightIcon" size={20} />
                </Link>
                <Link
                  href="/public-scoreboard-list"
                  className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-surface border-2 border-border text-text-primary rounded-lg font-semibold text-lg hover:bg-muted transition-smooth duration-150"
                >
                  <Icon name="PlayIcon" size={20} />
                  <span>View Demo</span>
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
              <div className="bg-surface border border-border rounded-2xl p-8 elevation-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <Icon name="TrophyIcon" size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">Championship Finals</p>
                        <p className="text-sm text-text-secondary">Live Now</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-1 bg-success/10 rounded-full">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                      <span className="text-xs font-semibold text-success">LIVE</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 py-6 border-y border-border">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">42</p>
                      <p className="text-sm text-text-secondary mt-1">Team A</p>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="text-2xl font-bold text-text-secondary">VS</div>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-secondary">38</p>
                      <p className="text-sm text-text-secondary mt-1">Team B</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['Player A scored +3', 'Player B scored +2', 'Timeout called'].map((update, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <Icon name="ClockIcon" size={14} className="text-text-secondary" />
                        <span className="text-text-secondary">{update}</span>
                      </div>
                    ))}
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
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 text-white elevation-2">
                <Icon name="RocketLaunchIcon" size={48} className="mb-4" />
                <h3 className="text-2xl font-bold mb-2">Quick Setup</h3>
                <p className="text-white/90">Create your first scoreboard in under 60 seconds. No credit card required for trial.</p>
              </div>
              <div className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-8 text-white elevation-2">
                <Icon name="UserGroupIcon" size={48} className="mb-4" />
                <h3 className="text-2xl font-bold mb-2">24/7 Support</h3>
                <p className="text-white/90">Our dedicated support team is always here to help you succeed.</p>
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

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-primary via-secondary to-primary rounded-2xl p-12 elevation-2">
            <Icon name="TrophyIcon" size={64} className="text-white mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join 10,000+ event organizers managing their scoreboards with ease
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-white text-primary rounded-lg font-semibold text-lg hover:bg-white/90 transition-smooth duration-150 hover-lift elevation-1"
              >
                <span>Start Free Trial</span>
                <Icon name="ArrowRightIcon" size={20} />
              </Link>
              <Link
                href="/public-scoreboard-list"
                className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-lg font-semibold text-lg hover:bg-white/20 transition-smooth duration-150"
              >
                <Icon name="EyeIcon" size={20} />
                <span>View Examples</span>
              </Link>
            </div>
            <p className="text-white/80 text-sm mt-6">
              No credit card required • Free 14-day trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Logo size={36} />
                <span className="text-lg font-bold">Scoreboard Manager</span>
              </div>
              <p className="text-white/70 text-sm">
                Professional scoreboard management for tournaments, leagues, and competitions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/public-scoreboard-list" className="hover:text-white transition-smooth">Features</Link></li>
                <li><Link href="/register" className="hover:text-white transition-smooth">Pricing</Link></li>
                <li><Link href="/public-scoreboard-list" className="hover:text-white transition-smooth">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition-smooth">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-smooth">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-smooth">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition-smooth">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-smooth">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-smooth">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-white/70">
              © 2025 Scoreboard Manager. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <Link href="#" className="text-white/70 hover:text-white transition-smooth">
                <Icon name="GlobeAltIcon" size={20} />
              </Link>
              <Link href="/login" className="text-white/70 hover:text-white transition-smooth text-sm font-medium">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}