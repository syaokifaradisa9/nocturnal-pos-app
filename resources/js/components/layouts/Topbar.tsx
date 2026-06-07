import React, { useState } from 'react';
import {
    ChevronDown,
    Menu,
    LogOut,
    User as UserIcon,
    Settings,
} from 'lucide-react';
import { usePage, router, Link } from '@inertiajs/react';
import ThemeToggle from '../commons/ThemeToggle';

interface TopbarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
    title?: string;
}

export default function Topbar({
    isCollapsed,
    setIsCollapsed,
    isMobileOpen,
    setIsMobileOpen,
    title,
}: TopbarProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user || { name: 'User POS', email: 'user@pos.com' };

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        router.post('/auth/logout');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between border-b border-transparent bg-white/80 px-4 backdrop-blur md:h-13 md:border-slate-200/80 md:px-6 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-1 items-center gap-4">
                {/* Mobile hamburger menu button */}
                <button
                    onClick={() => setIsMobileOpen?.(!isMobileOpen)}
                    className="rounded-lg p-2 pl-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Mobile Only: Title Page */}
                {title && (
                    <span className="truncate text-base font-bold text-slate-900 md:hidden dark:text-white">
                        {title}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Theme Toggle Wrapper with relative adjust (Desktop Only) */}
                <div className="relative flex hidden size-9 items-center justify-center rounded-lg hover:bg-slate-100 md:flex dark:hover:bg-slate-800">
                    <ThemeToggle className="relative inset-0" />
                </div>

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 focus:outline-none dark:hover:bg-slate-800/80"
                    >
                        {/* Name Only */}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {user.name}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-30"
                                onClick={() => setIsUserMenuOpen(false)}
                            />
                            <div className="absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-1.5 shadow-xl transition-all dark:border-slate-800/80 dark:bg-slate-950">
                                {/* User Info Header inside Dropdown */}
                                <div className="px-3 py-2.5">
                                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                        Akun Masuk
                                    </p>
                                    <p className="text-slate-850 mt-0.5 truncate text-xs font-bold dark:text-slate-200">
                                        {user.name}
                                    </p>
                                    <p className="text-slate-450 truncate text-[11px] dark:text-slate-400">
                                        {user.email}
                                    </p>
                                </div>

                                <div className="dark:bg-slate-850 my-1 h-px bg-slate-100" />

                                {/* Mobile Only: Theme Toggle inside Profile Dropdown */}
                                <div className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-slate-50 md:hidden dark:hover:bg-slate-900/60">
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        Ubah Tema
                                    </span>
                                    <ThemeToggle className="relative inset-0" />
                                </div>
                                <div className="dark:bg-slate-850 my-1 h-px bg-slate-100 md:hidden" />

                                <Link
                                    href="/pengaturan"
                                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900/60 dark:hover:text-slate-200"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    <Settings className="text-slate-450 dark:text-slate-550 h-4 w-4" />
                                    Pengaturan Akun
                                </Link>
                                <div className="dark:bg-slate-850 my-1 h-px bg-slate-100" />
                                <button
                                    onClick={handleLogout}
                                    className="dark:text-rose-450 flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50/60 dark:hover:bg-rose-950/20"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Keluar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
