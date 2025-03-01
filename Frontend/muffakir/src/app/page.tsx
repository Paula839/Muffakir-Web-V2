import Link from 'next/link';
import ThemeToggle from './components/ThemeToggle';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome to Muffakir',
  description: 'Your innovative platform for creative thinking and collaboration',
  openGraph: {
    title: 'Welcome to Muffakir',
    description: 'Your innovative platform for creative thinking and collaboration',
    images: [
      {
        url: '/og-image.jpg', // Add your OpenGraph image here
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Welcome to Muffakir',
    description: 'Your innovative platform for creative thinking and collaboration',
    images: ['/og-image.jpg'], // Add your Twitter card image here
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

function Home() {
  return (
    <main className="container">
      <ThemeToggle />
      <h1 className="title">Welcome to Muffakir</h1>
      <div className="button-group">
        <Link href="/chat" className="primary-button">
          Use Muffakir Now
        </Link>
        <Link href="/signin" className="secondary-button">
          Sign In
        </Link>
      </div>
    </main>
  );
}

export default Home;