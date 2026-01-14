import '../styles/index.css';
import { Providers } from './providers';
import { Nunito_Sans, JetBrains_Mono } from 'next/font/google';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-nunito-sans',
  adjustFontFallback: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'Scoreboard Manager - Live Rankings & Competition Tracking',
  description:
    'Professional scoreboard management system with real-time updates and comprehensive analytics',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunitoSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={nunitoSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
