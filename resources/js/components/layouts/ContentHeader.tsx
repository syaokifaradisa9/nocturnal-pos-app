import React from 'react';
import { FileSpreadsheet, FileText, LucideIcon } from 'lucide-react';

interface ContentHeaderProps {
    title: string;
    icon: LucideIcon;
    badge?: string;
    description?: string;
    excelUrl?: string;
    pdfUrl?: string;
    actions?: React.ReactNode;
}

export default function ContentHeader({
    title,
    icon: Icon,
    badge,
    description,
    excelUrl,
    pdfUrl,
    actions,
}: ContentHeaderProps) {
    return (
        <div className="mb-6 hidden gap-4 sm:flex-row sm:items-start sm:justify-between md:flex">
            <div className="flex items-start gap-3.5">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-100">
                    <Icon className="h-5 w-5 text-white dark:text-slate-900" />
                </div>
                <div>
                    <div className="mb-0.5 flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                            {title}
                        </h1>
                    </div>
                    {description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {(excelUrl || pdfUrl) && (
                    <div className="flex items-center gap-1 overflow-hidden rounded-lg border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
                        {excelUrl && (
                            <a
                                href={excelUrl}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-emerald-400"
                            >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                                Excel
                            </a>
                        )}
                        {excelUrl && pdfUrl && (
                            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                        )}
                        {pdfUrl && (
                            <a
                                href={pdfUrl}
                                target="_blank"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-50 hover:text-rose-500 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-rose-400"
                            >
                                <FileText className="h-3.5 w-3.5" />
                                PDF
                            </a>
                        )}
                    </div>
                )}

                {actions}
            </div>
        </div>
    );
}
