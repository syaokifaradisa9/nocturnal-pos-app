import React, { useState } from 'react';
import { 
    ChevronDown, 
    Menu, 
    LogOut,
    User as UserIcon,
    Settings
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

export default function Topbar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen, title }: TopbarProps) {
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
        <header className="sticky top-0 z-40 flex h-14 md:h-16 shrink-0 items-center justify-between border-b border-transparent md:border-slate-200/80 bg-white/80 px-4 md:px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-1 items-center gap-4">
                {/* Mobile hamburger menu button */}
                <button
                    onClick={() => setIsMobileOpen?.(!isMobileOpen)}
                    className="md:hidden rounded-lg p-2 pl-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Mobile Only: Title Page */}
                {title && (
                    <span className="md:hidden text-base font-bold text-slate-900 dark:text-white truncate">
                        {title}
                    </span>
                )}

                {/* Desktop Collapse / Expand Button */}
                {isCollapsed && (
                    <button
                        onClick={() => setIsCollapsed(false)}
                        className="hidden md:block rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Theme Toggle Wrapper with relative adjust (Desktop Only) */}
                <div className="hidden md:flex relative flex size-9 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ThemeToggle className="relative inset-0" />
                </div>

                {/* User Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                    >
                        {/* Avatar */}
                        <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary dark:bg-primary/20">
                            {getInitials(user.name)}
                        </div>
                        {/* Name & Email */}
                        <div className="hidden text-left sm:block">
                            <h4 className="text-sm font-bold text-slate-950 dark:text-white leading-tight">
                                {user.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                                {user.email}
                            </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {isUserMenuOpen && (
                        <>
                            <div 
                                className="fixed inset-0 z-30" 
                                onClick={() => setIsUserMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950 z-40">
                                {/* Mobile Only: Theme Toggle inside Profile Dropdown */}
                                <div className="md:hidden flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-55 dark:hover:bg-slate-900 transition-colors">
                                    <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Ubah Tema</span>
                                    <ThemeToggle className="relative inset-0" />
                                </div>
                                <div className="md:hidden my-1.5 border-t border-slate-200 dark:border-slate-800" />

                                <Link 
                                    href="/pengaturan" 
                                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                                    onClick={() => setIsUserMenuOpen(false)}
                                >
                                    <Settings className="h-4 w-4 text-slate-400" />
                                    Pengaturan Akun
                                </Link>
                                <hr className="my-1.5 border-slate-200 dark:border-slate-850" />
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50/50 dark:text-rose-400 dark:hover:bg-rose-950/20"
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
