import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Search, Loader2, Briefcase, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Printer } from 'lucide-react';

export interface ColumnDefinition<T = any> {
    key: string;
    label: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    sortable?: boolean;
    sortKey?: string; // custom key used for sorting in API
    className?: string;
    render?: (row: T, index: number, metaFrom: number) => React.ReactNode;
    visible?: boolean;
    headerClassName?: string;
}

interface DatatableProps<T = any> {
    apiUrl: string;
    columns: ColumnDefinition<T>[];
    searchPlaceholder?: string;
    emptyMessage?: string;
    emptySubMessage?: string;
    refreshTrigger?: any;
    defaultSortBy?: string;
    defaultSortType?: 'asc' | 'desc';
    renderMobileCard?: (row: T, index: number, metaFrom: number) => React.ReactNode;
    printPdfUrl?: string;
    printExcelUrl?: string;
}

export interface DatatableRef {
    fetchData: () => void;
}

const Datatable = forwardRef<DatatableRef, DatatableProps>(({
    apiUrl,
    columns,
    searchPlaceholder = "Cari...",
    emptyMessage = "Belum ada data",
    emptySubMessage = "Mulai dengan menambahkan data baru.",
    refreshTrigger,
    defaultSortBy = 'id',
    defaultSortType = 'desc',
    renderMobileCard,
    printPdfUrl,
    printExcelUrl
}, ref) => {
    const [data, setData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [limit, setLimit] = useState(10);
    const [page, setPage] = useState(1);
    const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });

    // Sorting states
    const [sortBy, setSortBy] = useState(defaultSortBy);
    const [sortType, setSortType] = useState<'asc' | 'desc'>(defaultSortType);

    // Individual column search states
    const searchableColumns = columns.filter(col => col.searchable && col.visible !== false);
    const initialColSearch = searchableColumns.reduce((acc, col) => {
        acc[col.key] = '';
        return acc;
    }, {} as Record<string, string>);

    const [colSearch, setColSearch] = useState<Record<string, string>>(initialColSearch);
    const [debouncedColSearch, setDebouncedColSearch] = useState<Record<string, string>>(initialColSearch);

    /* Debounce global search */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    /* Debounce column search */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedColSearch({ ...colSearch }), 300);
        return () => clearTimeout(t);
    }, [colSearch]);

    /* Reset to page 1 when any filter/sort changes */
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, debouncedColSearch, limit, sortBy, sortType]);

    /* Fetch */
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                search: debouncedSearch,
                limit: String(limit),
                page: String(page)
            });

            if (sortBy) params.set('sort_by', sortBy);
            if (sortType) params.set('sort_type', sortType);

            // Append active column searches
            Object.entries(debouncedColSearch).forEach(([key, val]) => {
                if (val) params.set(key, val);
            });

            const res = await fetch(`${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${params}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            const json = await res.json();
            setData(json.data || []);
            setMeta({
                current_page: json.current_page ?? 1,
                last_page: json.last_page ?? 1,
                total: json.total ?? 0,
                from: json.from ?? 0,
                to: json.to ?? 0
            });
        } catch (e) {
            console.error('Error fetching datatable data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({
        fetchData
    }));

    useEffect(() => {
        fetchData();
    }, [debouncedSearch, debouncedColSearch, limit, page, sortBy, sortType, refreshTrigger, apiUrl]);

    const handleSort = (col: ColumnDefinition) => {
        if (!col.sortable) return;
        const targetSortKey = col.sortKey || col.key;
        if (sortBy === targetSortKey) {
            setSortType(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(targetSortKey);
            setSortType('asc');
        }
    };

    const activeColumns = columns.filter(col => col.visible !== false);

    return (
        <div className="flex flex-col gap-0 md:gap-4">
            {/* Mobile View: Search input placed directly under the header */}
            <div className="md:hidden sticky top-14 z-30 w-full px-4 pb-2.5 pt-0.5 -mt-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="block w-full rounded-xl border border-slate-200 bg-white py-2 pl-9.5 pr-3.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 shadow-sm"
                    />
                </div>
                {(printPdfUrl || printExcelUrl) && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsPrintDropdownOpen(!isPrintDropdownOpen)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none"
                        >
                            <Printer className="h-4.5 w-4.5" />
                        </button>
                        {isPrintDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-30" 
                                    onClick={() => setIsPrintDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-850 dark:bg-slate-900 z-40">
                                    {printPdfUrl && (
                                        <a
                                            href={printPdfUrl}
                                            target="_blank"
                                            onClick={() => setIsPrintDropdownOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            PDF
                                        </a>
                                    )}
                                    {printExcelUrl && (
                                        <a
                                            href={printExcelUrl}
                                            target="_blank"
                                            onClick={() => setIsPrintDropdownOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            Excel
                                        </a>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Datatable main card */}
            <div className="md:rounded-2xl md:border md:border-slate-200/80 md:bg-white md:shadow-sm dark:md:border-slate-800 dark:md:bg-slate-900 md:overflow-hidden">
                {/* Desktop View: Limit (left) | Search (right) */}
                <div className="hidden md:flex border-b border-slate-100 px-5 py-4 dark:border-slate-800 flex-row items-center justify-between gap-3">
                    {/* Limit selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Tampilkan</label>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                            {[5, 10, 25, 50, 100].map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                        <span className="text-xs text-slate-500 dark:text-slate-400">data</span>
                    </div>

                    {/* Search */}
                    <div className="relative min-w-[240px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                </div>


                {/* Table */}
                <div className="overflow-x-auto">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
                        <span className="text-sm text-slate-400">Memuat data...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                            <Briefcase className="h-6 w-6 text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{emptyMessage}</p>
                            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                {search ? 'Coba ubah kata pencarian Anda.' : emptySubMessage}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop View: Table Layout */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        {activeColumns.map((col) => {
                                            const isCurrentSort = sortBy === (col.sortKey || col.key);
                                            return (
                                                <th
                                                    key={col.key}
                                                    onClick={() => handleSort(col)}
                                                    className={`whitespace-nowrap py-3 px-5 text-xs font-medium text-slate-400 dark:text-slate-500 ${
                                                        col.sortable ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200' : ''
                                                    } ${col.headerClassName || ''}`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{col.label}</span>
                                                        {col.sortable && (
                                                            <span className="text-slate-400">
                                                                {isCurrentSort ? (
                                                                    sortType === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                                                ) : (
                                                                    <ArrowUpDown className="h-3 w-3 opacity-45 group-hover:opacity-100 transition-opacity" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                                    {data.map((row, i) => (
                                        <tr key={row.id || i} className="group hover:bg-sky-50/40 dark:hover:bg-sky-500/5 transition-colors">
                                            {activeColumns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={`whitespace-nowrap py-3.5 px-5 text-sm ${col.className || ''}`}
                                                >
                                                    {col.render ? col.render(row, i, meta.from) : (row[col.key] || '—')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                                {searchableColumns.length > 0 && (
                                    <tfoot>
                                        <tr className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50">
                                            {activeColumns.map((col) => (
                                                <td key={`foot-${col.key}`} className="py-2 px-5">
                                                    {col.searchable ? (
                                                        <input
                                                            type="text"
                                                            value={colSearch[col.key] || ''}
                                                            onChange={(e) => setColSearch(prev => ({ ...prev, [col.key]: e.target.value }))}
                                                            placeholder={col.searchPlaceholder || `Cari...`}
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                                                        />
                                                    ) : null}
                                                </td>
                                            ))}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Mobile View: Card Layout */}
                        <div className="md:hidden flex flex-col gap-4 pt-3 pb-20 px-4 bg-slate-50/40 dark:bg-slate-950/20">
                            {data.map((row, i) => {
                                if (renderMobileCard) {
                                    return (
                                        <React.Fragment key={row.id || i}>
                                            {renderMobileCard(row, i, meta.from)}
                                        </React.Fragment>
                                    );
                                }

                                const actionCol = activeColumns.find(c => c.key === 'actions');
                                const dataCols = activeColumns.filter(c => c.key !== 'no' && c.key !== 'actions');
                                const primaryCol = dataCols.find(c => c.key === 'name') || dataCols[0];
                                const otherCols = dataCols.filter(c => c.key !== primaryCol?.key);

                                return (
                                    <div 
                                        key={row.id || i} 
                                        className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:border-slate-850 dark:bg-slate-900 flex flex-col gap-3.5"
                                    >
                                        {/* Top Line: Title & Actions */}
                                        <div className="flex items-start justify-between gap-3">
                                            {primaryCol && (
                                                <div className="min-w-0">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                                                        {primaryCol.label}
                                                    </span>
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                        {primaryCol.render ? primaryCol.render(row, i, meta.from) : (row[primaryCol.key] || '—')}
                                                    </div>
                                                </div>
                                            )}
                                            {actionCol && (
                                                <div className="shrink-0 flex items-center gap-1">
                                                    {actionCol.render ? actionCol.render(row, i, meta.from) : null}
                                                </div>
                                            )}
                                        </div>

                                        {/* Middle Line: Description / Subtitle */}
                                        {otherCols.some(c => c.key === 'description') && (
                                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {(() => {
                                                    const descCol = otherCols.find(c => c.key === 'description');
                                                    return descCol?.render ? descCol.render(row, i, meta.from) : (row.description || '—');
                                                })()}
                                            </div>
                                        )}

                                        {/* Bottom Line: Highlight Details Cards */}
                                        {(() => {
                                            const displayCols = otherCols.filter(c => c.key !== 'description');
                                            if (displayCols.length === 0) return null;
                                            return (
                                                <div className="grid grid-cols-2 gap-3 mt-1">
                                                    {displayCols.map((col) => (
                                                        <div 
                                                            key={col.key} 
                                                            className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 p-3 flex flex-col gap-1 border border-slate-100 dark:border-slate-800/20"
                                                        >
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                                {col.label}
                                                            </span>
                                                            <div className="text-xs text-slate-800 dark:text-slate-200 font-semibold">
                                                                {col.render ? col.render(row, i, meta.from) : (row[col.key] || '—')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Footer: Info (left) | Pagination (right) */}
            {!isLoading && meta.total > 0 && (
                <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200/80 dark:border-slate-800 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Info text */}
                    <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                        Menampilkan{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{meta.from}-{meta.to}</span>{' '}
                        data dari{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">{meta.total}</span>{' '}
                        data
                    </p>

                    {/* Pagination */}
                    {meta.last_page >= 1 && (
                        <div className="flex justify-center w-full sm:w-auto">
                            <div className="inline-flex rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page <= 1}
                                    className="inline-flex h-8.5 w-8.5 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                                    .filter((p) => {
                                        if (meta.last_page <= 7) return true;
                                        if (p === 1 || p === meta.last_page) return true;
                                        if (Math.abs(p - page) <= 1) return true;
                                        return false;
                                    })
                                    .reduce<(number | 'dots')[]>((acc, p, idx, arr) => {
                                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('dots');
                                        acc.push(p);
                                        return acc;
                                    }, [])
                                    .map((item, idx) =>
                                        item === 'dots' ? (
                                            <span key={`dots-${idx}`} className="inline-flex h-8.5 w-8.5 items-center justify-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/10">…</span>
                                        ) : (
                                            <button
                                                key={item}
                                                onClick={() => setPage(item as number)}
                                                className={`inline-flex h-8.5 min-w-[2.125rem] px-2.5 items-center justify-center text-xs font-semibold transition-colors ${
                                                    page === item
                                                        ? 'bg-sky-500 dark:bg-sky-600 text-white'
                                                        : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/80'
                                                }`}
                                            >
                                                {item}
                                            </button>
                                        )
                                    )}

                                <button
                                    onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                                    disabled={page >= meta.last_page}
                                    className="inline-flex h-8.5 w-8.5 items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
    );
});

Datatable.displayName = 'Datatable';

export default Datatable;
