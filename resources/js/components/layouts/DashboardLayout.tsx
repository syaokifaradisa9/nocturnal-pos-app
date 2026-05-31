import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import toast, { Toaster } from 'react-hot-toast';
import { usePage } from '@inertiajs/react';

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

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { flash } = usePage<PagePropsWithFlash>().props;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Toaster position="bottom-right" />
            {/* Sidebar Component */}
            <Sidebar 
                isCollapsed={isCollapsed} 
                setIsCollapsed={setIsCollapsed} 
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            {/* Mobile Sidebar Overlay */}
            {isMobileOpen && (
                <div 
                    onClick={() => setIsMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden transition-opacity"
                />
            )}

            {/* Main Content Area */}
            <div 
                className={`flex flex-col min-h-screen transition-all duration-300 pl-0 ${
                    isCollapsed ? 'md:pl-20' : 'md:pl-64'
                }`}
            >
                {/* Topbar Component */}
                <Topbar 
                    isCollapsed={isCollapsed} 
                    setIsCollapsed={setIsCollapsed} 
                    isMobileOpen={isMobileOpen}
                    setIsMobileOpen={setIsMobileOpen}
                    title={title}
                />

                {/* Content Body */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
