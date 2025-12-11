'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletButton } from './WalletButton';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/5 shadow-lg shadow-purple-900/5">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/40 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-lg">SL</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block tracking-tight group-hover:text-glow transition-all">Space Lab</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm font-medium hover:text-glow">
              Home
            </Link>
            <Link href="/tokens" className="text-gray-400 hover:text-white transition-colors text-sm font-medium hover:text-glow">
              All Tokens
            </Link>
            <Link href="/graduating" className="text-gray-400 hover:text-white transition-colors text-sm font-medium hover:text-glow">
              Graduating
            </Link>
          </nav>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-violet-500 focus:bg-white/10 focus:outline-none transition-all pl-10 group-hover:border-white/20"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link href="/create" className="hidden sm:flex btn-primary px-4 py-2 text-sm items-center gap-2">
              <span>🚀</span>
              Launch
            </Link>

            <WalletButton />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 py-4 animate-in slide-in-from-top glass-panel mt-2 rounded-xl">
            <form onSubmit={handleSearch} className="mb-4 px-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-violet-600 focus:outline-none"
              />
            </form>
            <nav className="flex flex-col px-2 gap-1">
              <Link
                href="/"
                className="text-gray-400 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/tokens"
                className="text-gray-400 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Tokens
              </Link>
              <Link
                href="/graduating"
                className="text-gray-400 hover:text-white py-3 px-4 rounded-lg hover:bg-white/5 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Graduating
              </Link>
              <Link
                href="/create"
                className="text-white bg-violet-600/20 py-3 px-4 rounded-lg hover:bg-violet-600/30 transition-colors font-medium flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                🚀 Launch Token
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
