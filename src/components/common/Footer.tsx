import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { ScoreboardCustomStyles } from '@/types/models';

interface FooterProps {
  customStyles?: ScoreboardCustomStyles | null;
}

export default function Footer({ customStyles = null }: FooterProps) {
  const footerStyle = customStyles ? {
    backgroundColor: customStyles.backgroundColor,
    borderColor: customStyles.borderColor,
    fontFamily: customStyles.fontFamily || 'inherit',
  } : undefined;

  const textStyle = customStyles ? {
    color: customStyles.textColor,
    fontFamily: customStyles.fontFamily || 'inherit',
  } : undefined;

  const headingStyle = customStyles ? {
    color: customStyles.textColor,
    fontFamily: customStyles.fontFamily || 'inherit',
  } : undefined;

  return (
    <footer className="border-t border-border bg-surface mt-auto" style={customStyles ? footerStyle : undefined}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Logo size={36} />
              <span className="text-lg font-bold text-text-primary" style={customStyles ? headingStyle : undefined}>Scoreboard Manager</span>
            </div>
            <p className="text-sm text-text-secondary" style={customStyles ? textStyle : undefined}>
              Professional scoreboard management for tournaments, leagues, and competitions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-text-primary" style={customStyles ? headingStyle : undefined}>Product</h4>
            <ul className="space-y-2 text-sm text-text-secondary" style={customStyles ? textStyle : undefined}>
              <li>
                <Link href="/#features" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/public-scoreboard-list" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Scoreboards
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-text-primary" style={customStyles ? headingStyle : undefined}>Company</h4>
            <ul className="space-y-2 text-sm text-text-secondary" style={customStyles ? textStyle : undefined}>
              <li>
                <Link href="/about" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Support
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-text-primary" style={customStyles ? headingStyle : undefined}>Legal</h4>
            <ul className="space-y-2 text-sm text-text-secondary" style={customStyles ? textStyle : undefined}>
              <li>
                <Link href="/privacy" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:opacity-80 transition-opacity text-text-secondary" style={customStyles ? { color: customStyles.textColor } : undefined}>
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 text-center border-t border-border" style={customStyles ? { borderColor: customStyles.borderColor } : undefined}>
          <p className="text-sm text-text-secondary" style={customStyles ? textStyle : undefined}>
            &copy; {new Date()?.getFullYear()} Scoreboard Manager. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}