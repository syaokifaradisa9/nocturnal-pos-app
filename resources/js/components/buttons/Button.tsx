import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label: string;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export default function Button({ label, isLoading, icon, className = '', ...props }: ButtonProps) {
    return (
        <button
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50 dark:bg-sky-600 dark:hover:bg-sky-500 ${className}`}
            {...props}
        >
            {isLoading && (
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )}
            {!isLoading && icon}
            <span>{label}</span>
        </button>
    );
}
