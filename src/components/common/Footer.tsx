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
import Logo from '@/components/ui/Logo';
import { ScoreboardCustomStyles } from '@/types/models';

interface FooterProps {
  customStyles?: ScoreboardCustomStyles | null;
}

export default function Footer({ customStyles = null }: FooterProps) {
  const footerStyle = customStyles
    ? {
        backgroundColor: customStyles.backgroundColor,
        borderColor: customStyles.borderColor,
        fontFamily: customStyles.fontFamily || 'inherit',
      }
    : undefined;

  const textStyle = customStyles
    ? {
        color: customStyles.textColor,
        fontFamily: customStyles.fontFamily || 'inherit',
      }
    : undefined;

  const headingStyle = customStyles
    ? {
        color: customStyles.textColor,
        fontFamily: customStyles.fontFamily || 'inherit',
      }
    : undefined;

  return (
    <footer
      className="border-t border-border bg-surface mt-auto"
      style={customStyles ? footerStyle : undefined}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <Logo size={36} />
              <span
                className="text-lg font-bold text-text-primary"
                style={customStyles ? headingStyle : undefined}
              >
                Scoreboard Manager
              </span>
            </div>
            <p className="text-sm text-text-secondary" style={customStyles ? textStyle : undefined}>
              Professional scoreboard management for tournaments, leagues, and competitions.
            </p>
          </div>
          <div>
            <h2
              className="font-semibold mb-4 text-text-primary text-base"
              style={customStyles ? headingStyle : undefined}
            >
              Product
            </h2>
            <ul
              className="space-y-1 text-sm text-text-secondary"
              style={customStyles ? textStyle : undefined}
            >
              <li>
                <Link
                  href="/#features"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/public-scoreboard-list"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Scoreboards
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/supporters"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Supporters
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h2
              className="font-semibold mb-4 text-text-primary text-base"
              style={customStyles ? headingStyle : undefined}
            >
              Company
            </h2>
            <ul
              className="space-y-1 text-sm text-text-secondary"
              style={customStyles ? textStyle : undefined}
            >
              <li>
                <Link
                  href="/about"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Support
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/gmlupatelli/scoreboard_manager"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  target="_blank"
                  rel="noreferrer"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2
              className="font-semibold mb-4 text-text-primary text-base"
              style={customStyles ? headingStyle : undefined}
            >
              Legal
            </h2>
            <ul
              className="space-y-1 text-sm text-text-secondary"
              style={customStyles ? textStyle : undefined}
            >
              <li>
                <Link
                  href="/privacy"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="block py-2 hover:opacity-80 transition-opacity text-text-secondary"
                  style={customStyles ? { color: customStyles.textColor } : undefined}
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="pt-8 text-center border-t border-border"
          style={customStyles ? { borderColor: customStyles.borderColor } : undefined}
        >
          <p className="text-sm text-text-secondary" style={customStyles ? textStyle : undefined}>
            &copy; {new Date()?.getFullYear()} Scoreboard Manager. All rights reserved.
          </p>
          <p
            className="text-sm text-text-secondary mt-2"
            style={customStyles ? textStyle : undefined}
          >
            Open source under the{' '}
            <a
              href="https://www.gnu.org/licenses/agpl-3.0"
              className="hover:opacity-80 transition-opacity"
              target="_blank"
              rel="noreferrer"
            >
              AGPL v3
            </a>
            . View the code on{' '}
            <a
              href="https://github.com/gmlupatelli/scoreboard_manager"
              className="hover:opacity-80 transition-opacity"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
