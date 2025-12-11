'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalletButton } from './WalletButton';

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
    <header className="sticky top-0 z-50 bg-[#0A0A0B]/80 backdrop-blur border-b border-[#1F1F22]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">SL</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">Space Lab</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/tokens" className="text-gray-400 hover:text-white transition-colors">
              All Tokens
            </Link>
            <Link href="/graduating" className="text-gray-400 hover:text-white transition-colors">
              Graduating
            </Link>
            <Link href="/create" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Launch Token
            </Link>
          </nav>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full bg-[#131314] border border-[#1F1F22] rounded-lg px-4 py-2 text-white text-sm focus:border-purple-600 focus:outline-none transition-colors pl-10"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <WalletButton />
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#1F1F22] py-4 animate-in slide-in-from-top">
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tokens..."
                className="w-full bg-[#131314] border border-[#1F1F22] rounded-lg px-4 py-3 text-white text-sm focus:border-purple-600 focus:outline-none"
              />
            </form>
            <nav className="flex flex-col gap-2">
              <Link 
                href="/" 
                className="text-gray-400 hover:text-white py-2 px-2 rounded-lg hover:bg-[#131314] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/tokens" 
                className="text-gray-400 hover:text-white py-2 px-2 rounded-lg hover:bg-[#131314] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                All Tokens
              </Link>
              <Link 
                href="/graduating" 
                className="text-gray-400 hover:text-white py-2 px-2 rounded-lg hover:bg-[#131314] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Graduating
              </Link>
              <Link 
                href="/create" 
                className="text-purple-400 hover:text-purple-300 font-semibold py-2 px-2 rounded-lg hover:bg-purple-900/20 transition-colors"
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
