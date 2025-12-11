'use client';

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
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-[#0A0A0B] border-r border-[#1F1F22] overflow-y-auto z-40 hidden lg:block">
            <div className="p-4 space-y-6">
                {/* Platform Section */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Platform
                    </h3>
                    <nav className="space-y-1">
                        {platformLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
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
                                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
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
                                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#131314] transition-all"
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
                    <p>© 2024 Space Lab</p>
                    <p className="mt-1">Earn 0.5% on all trades</p>
                </div>
            </div>
        </aside>
    );
}
