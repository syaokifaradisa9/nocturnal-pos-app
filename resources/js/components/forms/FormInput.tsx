import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label: string;
    error?: string;
    prefix?: React.ReactNode;
}

export default function FormInput({
    name,
    label,
    error,
    prefix,
    className = '',
    ...props
}: FormInputProps) {
    if (prefix) {
        return (
            <div className="space-y-1.5">
                <label
                    htmlFor={name}
                    className="block text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                    {label}
                </label>
                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800">
                    <span className="inline-flex items-center border-r border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500 select-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                        {prefix}
                    </span>
                    <input
                        id={name}
                        name={name}
                        className={`block w-full border-0 bg-transparent px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:ring-0 focus:outline-none dark:text-white dark:placeholder-slate-500 ${className}`}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="mt-1.5 text-xs font-medium text-rose-500">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <label
                htmlFor={name}
                className="block text-xs font-medium text-slate-500 dark:text-slate-400"
            >
                {label}
            </label>
            <input
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
