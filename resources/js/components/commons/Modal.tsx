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
    closeOnOverlayClick = false 
}: ModalProps) {
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={closeOnOverlayClick ? onClose : undefined}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200" />

            {/* Panel */}
            <div
                className={`relative w-full ${maxWidth} max-h-[85vh] flex flex-col rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
