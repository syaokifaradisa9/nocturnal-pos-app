import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import toast, { Toaster } from 'react-hot-toast';
import { usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FlashMessage {
    success?: string;
    error?: string;
}

interface PagePropsWithFlash {
    flash?: FlashMessage;
    [key: string]: any;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function DashboardLayout({
    children,
    title,
}: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { url, props } = usePage();
    const { flash } = props as PagePropsWithFlash;
    const isCashierPage = url.startsWith('/cashier');

    useEffect(() => {
        if (isCashierPage) {
            setIsCollapsed(true);
        }
    }, [isCashierPage]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <div className="relative min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
            <Toaster position="bottom-right" />
            {/* Sidebar Component - hidden on cashier page */}
            {!isCashierPage && (
                <Sidebar
                    isCollapsed={isCollapsed}
                    setIsCollapsed={setIsCollapsed}
                    isMobileOpen={isMobileOpen}
                    setIsMobileOpen={setIsMobileOpen}
                />
            )}

            {/* Mobile Sidebar Overlay */}
            {!isCashierPage && isMobileOpen && (
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity md:hidden"
                />
            )}

            {/* Floating Desktop Sidebar Toggle (hidden on cashier page) */}
            {!isCashierPage && (
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`fixed top-[14px] z-50 hidden h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-300 hover:bg-slate-50 hover:text-slate-700 md:flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200`}
                    style={{
                        left: isCollapsed ? '80px' : '240px',
                    }}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronLeft className="h-3.5 w-3.5" />
                    )}
                </button>
            )}

            {/* Main Content Area */}
            <div
                className={`flex min-h-screen flex-col transition-all duration-300 ${
                    isCashierPage
                        ? 'pl-0'
                        : `pl-0 ${isCollapsed ? 'md:pl-20' : 'md:pl-60'}`
                }`}
            >
                {/* Topbar Component - hidden on cashier page */}
                {!isCashierPage && (
                    <Topbar
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                        isMobileOpen={isMobileOpen}
                        setIsMobileOpen={setIsMobileOpen}
                        title={title}
                    />
                )}

                {/* Content Body */}
                <main
                    className={
                        isCashierPage ? 'h-screen w-full flex-1' : 'flex-1'
                    }
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
