import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Sidebar Component */}
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* Main Content Area */}
            <div 
                className={`flex flex-col min-h-screen transition-all duration-300 ${
                    isCollapsed ? 'pl-20' : 'pl-64'
                }`}
            >
                {/* Topbar Component */}
                <Topbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

                {/* Content Body */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
