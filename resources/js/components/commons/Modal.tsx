import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    closeOnOverlayClick?: boolean;
}

export default function Modal({
    open,
    onClose,
    title,
    children,
    maxWidth = 'max-w-lg',
    closeOnOverlayClick = false,
}: ModalProps) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeOnOverlayClick ? onClose : undefined}
        >
            {/* Overlay */}
            <div className="absolute inset-0 animate-in bg-slate-950/50 backdrop-blur-sm duration-200 fade-in" />

            {/* Panel */}
            <div
                className={`relative w-full ${maxWidth} flex max-h-[85vh] animate-in flex-col rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl duration-200 zoom-in-95 dark:border-slate-800 dark:bg-slate-900`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 clean-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
