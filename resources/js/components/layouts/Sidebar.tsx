import React from 'react';
import { 
    LayoutDashboard, 
    Store,
    ChevronLeft
} from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { UserPermission } from '../../types';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
    const { url, props } = usePage();
    const user = props.auth?.user as any;
    const userPermissions = user?.permissions || [];
    const hasOverallPermission = userPermissions.includes(UserPermission.VIEW_ANY_BUSINESS);

    const menuGroups = [
        {
            groupName: '',
            items: [
                { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }
            ]
        },
        ...(hasOverallPermission ? [
            {
                groupName: 'Data Bisnis',
                items: [
                    { name: 'Bisnis', icon: Store, href: '/businesses' }
                ]
            }
        ] : [])
    ];

    const isActive = (href: string) => {
        return url.startsWith(href);
    };

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-300
                ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
                w-64
                max-md:-translate-x-full
                ${isMobileOpen ? 'max-md:translate-x-0' : ''}
            `}
        >
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between px-4 dark:border-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
                        <Store className="h-5 w-5" />
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                        <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white transition-opacity duration-300">
                            Nocturnal POS
                        </span>
                    )}
                </div>
                {!isCollapsed && !isMobileOpen && (
                    <button 
                        onClick={() => setIsCollapsed(true)}
                        className="hidden md:block rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
                {isMobileOpen && setIsMobileOpen && (
                    <button 
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Navigation Menu */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
                <nav className="space-y-6">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-1.5">
                            {group.groupName && (!isCollapsed || isMobileOpen) && (
                                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    {group.groupName}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item, itemIndex) => {
                                    const active = isActive(item.href);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={itemIndex}
                                            href={item.href}
                                            className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                                                active 
                                                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' 
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                                            }`}
                                            title={isCollapsed && !isMobileOpen ? item.name : undefined}
                                        >
                                            <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                                                active 
                                                    ? 'text-primary' 
                                                    : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                                            }`} />
                                            {(!isCollapsed || isMobileOpen) && (
                                                <span className="truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
