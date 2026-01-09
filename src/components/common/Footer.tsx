import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { ScoreboardCustomStyles } from '@/types/models';

interface FooterProps {
  customStyles?: ScoreboardCustomStyles | null;
}

export default function Footer({ customStyles = null }: FooterProps) {
  const footerStyle = {
    backgroundColor: customStyles?.backgroundColor || 'var(--surface)',
    borderColor: customStyles?.borderColor || 'var(--border)',
    fontFamily: customStyles?.fontFamily || 'inherit',
  };

  const textStyle = {
    color: customStyles?.textColor || 'var(--text-secondary)',
    fontFamily: customStyles?.fontFamily || 'inherit',
  };

  const headingStyle = {
    color: customStyles?.textColor || 'var(--text-primary)',
    fontFamily: customStyles?.fontFamily || 'inherit',
  };

  return (
    <footer className="border-t mt-auto" style={footerStyle}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Logo size={36} />
              <span className="text-lg font-bold" style={headingStyle}>Scoreboard Manager</span>
            </div>
            <p className="text-sm" style={textStyle}>
              Professional scoreboard management for tournaments, leagues, and competitions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={headingStyle}>Product</h4>
            <ul className="space-y-2 text-sm" style={textStyle}>
              <li>
                <Link href="/#features" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/public-scoreboard-list" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Scoreboards
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={headingStyle}>Company</h4>
            <ul className="space-y-2 text-sm" style={textStyle}>
              <li>
                <Link href="/about" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4" style={headingStyle}>Legal</h4>
            <ul className="space-y-2 text-sm" style={textStyle}>
              <li>
                <Link href="/privacy" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:opacity-80 transition-opacity" style={{ color: customStyles?.textColor || 'var(--text-secondary)' }}>
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 text-center" style={{ borderTop: `1px solid ${customStyles?.borderColor || 'var(--border)'}` }}>
          <p className="text-sm" style={textStyle}>
            &copy; {new Date()?.getFullYear()} Scoreboard Manager. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}