'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    RocketLaunchIcon,
    ChartBarIcon,
    AcademicCapIcon,
    UserGroupIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { formatNumber } from '../lib/utils';

interface SidebarProps {
    stats?: {
        totalVolume: number;
        totalTokens: number;
        totalEarnings: number;
    };
}

const NAVIGATION_ITEMS = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Launch Token', href: '/create', icon: RocketLaunchIcon },
    // { name: 'Platform', href: '/platform', icon: ChartBarIcon }, // Commented out until routes exist
    // { name: 'Learn', href: '/learn', icon: AcademicCapIcon },
    // { name: 'Community', href: '/community', icon: UserGroupIcon },
];

export function Sidebar({ stats }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside
            className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] 
        transition-all duration-300 ease-in-out z-40
        glass-panel border-r border-white/5
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-6 bg-violet-600 text-white p-1 rounded-full shadow-lg hover:bg-violet-500 transition-colors z-50 border border-white/10"
            >
                {isCollapsed ? (
                    <ChevronRightIcon className="w-4 h-4" />
                ) : (
                    <ChevronLeftIcon className="w-4 h-4" />
                )}
            </button>

            <div className="flex flex-col h-full py-6">
                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-2">
                    {NAVIGATION_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? 'bg-violet-600/20 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] border border-violet-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                                title={isCollapsed ? item.name : ''}
                            >
                                <item.icon className={`
                  w-6 h-6 transition-colors
                  ${isActive ? 'text-violet-400' : 'text-gray-500 group-hover:text-white'}
                `} />

                                {!isCollapsed && (
                                    <span className={`font-medium ${isActive ? 'text-white' : ''}`}>
                                        {item.name}
                                    </span>
                                )}

                                {isActive && !isCollapsed && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Stats Section */}
                <div className={`
          mx-3 p-4 rounded-xl glass-card
          ${isCollapsed ? 'hidden' : 'block'}
        `}>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                        Platform Stats
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Total Volume</p>
                            <p className="text-sm font-bold text-white space-gradient-text">
                                ${formatNumber(stats?.totalVolume || 142500000)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Tokens Launched</p>
                            <p className="text-sm font-bold text-white">
                                {formatNumber(stats?.totalTokens || 2405)}
                            </p>
                        </div>
                        <div className="pt-2 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <p className="text-xs text-emerald-400 font-medium tracking-wide">SYSTEM OPERATIONAL</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                {!isCollapsed && (
                    <div className="px-6 mt-6 pt-6 border-t border-white/5">
                        <p className="text-xs text-gray-600 text-center">
                            © 2025 Space Lab<br />
                            All rights reserved
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}
