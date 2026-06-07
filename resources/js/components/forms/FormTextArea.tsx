import React from 'react';

interface FormTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    name: string;
    label: string;
    error?: string;
}

export default function FormTextArea({
    name,
    label,
    error,
    className = '',
    ...props
}: FormTextAreaProps) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={name}
                className="block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
                {label}
            </label>
            <textarea
                id={name}
                name={name}
                className={`block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:border-sky-500 ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-1.5 text-xs font-medium text-rose-500">
                    {error}
                </p>
            )}
        </div>
    );
}
