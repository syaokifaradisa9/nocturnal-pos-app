import React from 'react';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    name: string;
    label: string;
    error?: string;
    children: React.ReactNode;
}

export default function FormSelect({ name, label, error, children, className = '', ...props }: FormSelectProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={name} className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                {label}
            </label>
            <select
                id={name}
                name={name}
                className={`block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-sky-500 ${className}`}
                {...props}
            >
                {children}
            </select>
            {error && (
                <p className="mt-1.5 text-xs text-rose-500 font-medium">{error}</p>
            )}
        </div>
    );
}
