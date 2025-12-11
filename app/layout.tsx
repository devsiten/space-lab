import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Header } from './components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Space Lab - Launch Tokens on Solana',
  description: 'Launch fair, safe memecoins that appear on Pump.fun with YOUR authority. No presale, no team tokens.',
  keywords: ['solana', 'memecoin', 'token', 'launchpad', 'pump.fun', 'crypto', 'space lab'],
  openGraph: {
    title: 'Space Lab - Launch Tokens on Solana',
    description: 'Launch fair, safe memecoins that appear on Pump.fun with YOUR authority.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0A0A0B] text-white`}>
        <Providers>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
