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
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[#0A0A0B] border-r border-[#1F1F22] z-40 hidden lg:flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-16'
                    }`}
            >
                {/* Toggle Button - Integrated at top of sidebar */}
                <div className="flex items-center justify-between p-4 border-b border-[#1F1F22]">
                    {isOpen && (
                        <span className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                            Menu
                        </span>
                    )}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-2 rounded-lg bg-[#131314] border border-[#1F1F22] hover:border-purple-600 hover:bg-[#1a1a1c] transition-all ${!isOpen ? 'mx-auto' : 'ml-auto'
                            }`}
                        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Platform Section */}
                    <div>
                        {isOpen ? (
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Platform
                            </h3>
                        ) : (
                            <div className="w-8 h-px bg-[#1F1F22] mx-auto mb-3" />
                        )}
                        <nav className="space-y-1">
                            {platformLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-[#131314]'
                                        } ${!isOpen ? 'justify-center px-2' : ''}`}
                                    title={!isOpen ? link.label : undefined}
                                >
                                    <span className="text-lg">{link.label.split(' ')[0]}</span>
                                    {isOpen && <span className="whitespace-nowrap">{link.label.split(' ').slice(1).join(' ')}</span>}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Learn Section */}
                    <div>
                        {isOpen ? (
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Learn
                            </h3>
                        ) : (
                            <div className="w-8 h-px bg-[#1F1F22] mx-auto mb-3" />
                        )}
                        <nav className="space-y-1">
                            {learnLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                                            ? 'bg-purple-600 text-white'
                                            : 'text-gray-400 hover:text-white hover:bg-[#131314]'
                                        } ${!isOpen ? 'justify-center px-2' : ''}`}
                                    title={!isOpen ? link.label : undefined}
                                >
                                    <span className="text-lg">📖</span>
                                    {isOpen && <span className="whitespace-nowrap">{link.label}</span>}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Community Section */}
                    <div>
                        {isOpen ? (
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Community
                            </h3>
                        ) : (
                            <div className="w-8 h-px bg-[#1F1F22] mx-auto mb-3" />
                        )}
                        <nav className="space-y-1">
                            {communityLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#131314] transition-all ${!isOpen ? 'justify-center px-2' : ''
                                        }`}
                                    title={!isOpen ? link.label : undefined}
                                >
                                    <span className="text-lg">{link.label.split(' ')[0]}</span>
                                    {isOpen && <span className="whitespace-nowrap">{link.label.split(' ').slice(1).join(' ')}</span>}
                                </a>
                            ))}
                        </nav>
                    </div>

                    {/* Stats Section - Only show when expanded */}
                    {isOpen && (
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
                    )}
                </div>

                {/* Footer - Pinned at bottom */}
                <div className="border-t border-[#1F1F22] p-4">
                    {isOpen ? (
                        <div className="text-xs text-gray-600">
                            <p>© 2025 Space Lab</p>
                            <p className="mt-1">All rights reserved</p>
                        </div>
                    ) : (
                        <div className="text-center text-xs text-gray-600">
                            <p>©</p>
                        </div>
                    )}
                </div>
            </aside>

            {/* Dynamic margin spacer for main content */}
            <div className={`hidden lg:block transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`} />
        </>
    );
}
