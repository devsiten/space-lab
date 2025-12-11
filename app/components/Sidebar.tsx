'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { formatNumber } from '../lib/utils';

interface SidebarProps {
    stats?: {
        totalVolume: number;
        totalTokens: number;
        totalEarnings: number;
    };
}

export function Sidebar({ stats }: SidebarProps) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);

    const platformLinks = [
        { href: '/create', label: '🚀 Launch Token' },
        { href: '/tokens', label: '📊 All Tokens' },
        { href: '/graduating', label: '🎓 Graduating Soon' },
    ];

    const learnLinks = [
        { href: '/how-it-works', label: 'How it Works' },
        { href: '/faq', label: 'FAQ' },
        { href: '/docs', label: 'Documentation' },
    ];

    const communityLinks = [
        { href: '#', label: '𝕏 Twitter', external: true },
        { href: '#', label: '📱 Telegram', external: true },
        { href: '#', label: '💬 Discord', external: true },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <>
            {/* Toggle Button - Always visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed left-4 top-20 z-50 bg-[#131314] border border-[#1F1F22] hover:border-purple-600 p-2 rounded-lg transition-all hidden lg:flex items-center justify-center"
                aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            >
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-0' : 'rotate-180'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#0A0A0B] border-r border-[#1F1F22] overflow-y-auto z-40 hidden lg:block transition-all duration-300 ${isOpen ? 'w-64' : 'w-0 border-r-0 overflow-hidden'
                    }`}
            >
                <div className={`p-4 space-y-6 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
                    {/* Platform Section */}
                    <div className="pt-8">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Platform
                        </h3>
                        <nav className="space-y-1">
                            {platformLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive(link.href)
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-[#131314]'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Learn Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Learn
                        </h3>
                        <nav className="space-y-1">
                            {learnLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive(link.href)
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-[#131314]'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Community Section */}
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Community
                        </h3>
                        <nav className="space-y-1">
                            {communityLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#131314] transition-all whitespace-nowrap"
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Stats Section */}
                    <div className="border-t border-[#1F1F22] pt-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Stats
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Volume</span>
                                <span className="text-white font-medium">
                                    ${formatNumber(stats?.totalVolume || 142500000)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tokens</span>
                                <span className="text-white font-medium">
                                    {formatNumber(stats?.totalTokens || 8421)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Earnings</span>
                                <span className="text-purple-400 font-medium">
                                    ${formatNumber(stats?.totalEarnings || 712500)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-xs text-gray-600 pt-4">
                        <p>© 2025 Space Lab</p>
                        <p className="mt-1">All rights reserved</p>
                    </div>
                </div>
            </aside>
        </>
    );
}
