import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Logo size={36} />
              <span className="text-lg font-bold text-text-primary">Scoreboard Manager</span>
            </div>
            <p className="text-text-secondary text-sm">
              Professional scoreboard management for tournaments, leagues, and competitions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/public-scoreboard-list" className="hover:text-primary transition-colors">
                  Scoreboards
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-text-secondary">
            &copy; {new Date()?.getFullYear()} Scoreboard Manager. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}