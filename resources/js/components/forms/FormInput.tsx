import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label: string;
    error?: string;
}

export default function FormInput({ name, label, error, className = '', ...props }: FormInputProps) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <input
                id={name}
                name={name}
                className={`block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:focus:border-slate-500 ${className}`}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
}
