import React, {
    useState,
    useEffect,
    useImperativeHandle,
    forwardRef,
} from 'react';
import {
    Search,
    Loader2,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Printer,
} from 'lucide-react';

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
    renderMobileCard?: (
        row: T,
        index: number,
        metaFrom: number,
    ) => React.ReactNode;
    printPdfUrl?: string;
    printExcelUrl?: string;
    renderRowDetails?: (row: T) => React.ReactNode;
}

export interface DatatableRef {
    fetchData: () => void;
}

const Datatable = forwardRef<DatatableRef, DatatableProps>(
    (
        {
            apiUrl,
            columns,
            searchPlaceholder = 'Cari...',
            emptyMessage = 'Belum ada data',
            emptySubMessage = 'Mulai dengan menambahkan data baru.',
            refreshTrigger,
            defaultSortBy = 'id',
            defaultSortType = 'desc',
            renderMobileCard,
            printPdfUrl,
            printExcelUrl,
            renderRowDetails,
        },
        ref,
    ) => {
        const [data, setData] = useState<any[]>([]);
        const [isLoading, setIsLoading] = useState(true);
        const [search, setSearch] = useState('');
        const [debouncedSearch, setDebouncedSearch] = useState('');
        const [limit, setLimit] = useState(10);
        const [page, setPage] = useState(1);
        const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
        const [meta, setMeta] = useState({
            current_page: 1,
            last_page: 1,
            total: 0,
            from: 0,
            to: 0,
        });

        const [expandedRows, setExpandedRows] = useState<
            Record<string | number, boolean>
        >({});

        const toggleRow = (id: string | number) => {
            setExpandedRows((prev) => ({
                ...prev,
                [id]: !prev[id],
            }));
        };

        // Sorting states
        const [sortBy, setSortBy] = useState(defaultSortBy);
        const [sortType, setSortType] = useState<'asc' | 'desc'>(
            defaultSortType,
        );

        // Individual column search states
        const searchableColumns = columns.filter(
            (col) => col.searchable && col.visible !== false,
        );
        const initialColSearch = searchableColumns.reduce(
            (acc, col) => {
                acc[col.key] = '';
                return acc;
            },
            {} as Record<string, string>,
        );

        const [colSearch, setColSearch] =
            useState<Record<string, string>>(initialColSearch);
        const [debouncedColSearch, setDebouncedColSearch] =
            useState<Record<string, string>>(initialColSearch);

        /* Debounce global search */
        useEffect(() => {
            const t = setTimeout(() => setDebouncedSearch(search), 300);
            return () => clearTimeout(t);
        }, [search]);

        /* Debounce column search */
        useEffect(() => {
            const t = setTimeout(
                () => setDebouncedColSearch({ ...colSearch }),
                300,
            );
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
                    page: String(page),
                });

                if (sortBy) params.set('sort_by', sortBy);
                if (sortType) params.set('sort_type', sortType);

                // Append active column searches
                Object.entries(debouncedColSearch).forEach(([key, val]) => {
                    if (val) params.set(key, val);
                });

                const res = await fetch(
                    `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}${params}`,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );
                const json = await res.json();
                setData(json.data || []);
                setMeta({
                    current_page: json.current_page ?? 1,
                    last_page: json.last_page ?? 1,
                    total: json.total ?? 0,
                    from: json.from ?? 0,
                    to: json.to ?? 0,
                });
            } catch (e) {
                console.error('Error fetching datatable data:', e);
            } finally {
                setIsLoading(false);
            }
        };

        useImperativeHandle(ref, () => ({
            fetchData,
        }));

        useEffect(() => {
            fetchData();
        }, [
            debouncedSearch,
            debouncedColSearch,
            limit,
            page,
            sortBy,
            sortType,
            refreshTrigger,
            apiUrl,
        ]);

        const handleSort = (col: ColumnDefinition) => {
            if (!col.sortable) return;
            const targetSortKey = col.sortKey || col.key;
            if (sortBy === targetSortKey) {
                setSortType((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            } else {
                setSortBy(targetSortKey);
                setSortType('asc');
            }
        };

        const activeColumns = columns.filter((col) => col.visible !== false);

        return (
            <div className="flex flex-col gap-0 md:gap-4">
                {/* Mobile View: Search input placed directly under the header */}
                <div className="sticky top-14 z-30 -mt-2 flex w-full items-center gap-2 border-b border-slate-200/80 bg-white/80 px-4 pt-0.5 pb-2.5 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="block w-full rounded-xl border border-slate-200 bg-white py-2 pr-3.5 pl-9.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        />
                    </div>
                    {(printPdfUrl || printExcelUrl) && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() =>
                                    setIsPrintDropdownOpen(!isPrintDropdownOpen)
                                }
                                className="flex h-8 w-8 shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-slate-700 focus:outline-none dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                <Printer className="h-4.5 w-4.5" />
                            </button>
                            {isPrintDropdownOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-30"
                                        onClick={() =>
                                            setIsPrintDropdownOpen(false)
                                        }
                                    />
                                    <div className="dark:border-slate-850 absolute right-0 z-40 mt-2 w-32 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:bg-slate-900">
                                        {printPdfUrl && (
                                            <a
                                                href={printPdfUrl}
                                                target="_blank"
                                                onClick={() =>
                                                    setIsPrintDropdownOpen(
                                                        false,
                                                    )
                                                }
                                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                PDF
                                            </a>
                                        )}
                                        {printExcelUrl && (
                                            <a
                                                href={printExcelUrl}
                                                target="_blank"
                                                onClick={() =>
                                                    setIsPrintDropdownOpen(
                                                        false,
                                                    )
                                                }
                                                className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
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
                <div className="md:overflow-hidden md:rounded-2xl md:border md:border-slate-200/60 md:bg-white md:shadow-sm dark:md:border-slate-800/80 dark:md:bg-slate-900">
                    {/* Desktop View: Limit (left) | Search (right) */}
                    <div className="hidden flex-row items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/20 px-5 py-3.5 md:flex dark:border-slate-800 dark:bg-slate-900/10">
                        {/* Limit selector */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                Tampilkan
                            </span>
                            <select
                                value={limit}
                                onChange={(e) =>
                                    setLimit(Number(e.target.value))
                                }
                                className="dark:text-slate-350 rounded-lg border border-slate-200/80 bg-white px-2 py-1 text-xs font-semibold text-slate-600 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/25 focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                            >
                                {[5, 10, 25, 50, 100].map((v) => (
                                    <option key={v} value={v}>
                                        {v}
                                    </option>
                                ))}
                            </select>
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                                entri
                            </span>
                        </div>

                        {/* Search */}
                        <div className="relative min-w-[260px]">
                            <Search className="text-slate-450 pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 dark:text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="dark:text-slate-250 block w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-4 pl-9 text-xs text-slate-700 placeholder-slate-400 transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="clean-scrollbar overflow-x-auto">
                        {isLoading && data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-24">
                                <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
                                <span className="text-sm text-slate-400">
                                    Memuat data...
                                </span>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-24">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                                    <Briefcase className="h-6 w-6 text-slate-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                        {emptyMessage}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                                        {search
                                            ? 'Coba ubah kata pencarian Anda.'
                                            : emptySubMessage}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Desktop View: Table Layout */}
                                <div className="clean-scrollbar hidden overflow-x-auto md:block">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                                {renderRowDetails && (
                                                    <th className="w-10 px-5 py-3"></th>
                                                )}
                                                {activeColumns.map((col) => {
                                                    const isCurrentSort =
                                                        sortBy ===
                                                        (col.sortKey ||
                                                            col.key);
                                                    return (
                                                        <th
                                                            key={col.key}
                                                            onClick={() =>
                                                                handleSort(col)
                                                            }
                                                            className={`px-5 py-3 text-xs font-medium whitespace-nowrap text-slate-400 dark:text-slate-500 ${
                                                                col.sortable
                                                                    ? 'cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200'
                                                                    : ''
                                                            } ${col.headerClassName || ''}`}
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <span>
                                                                    {col.label}
                                                                </span>
                                                                {col.sortable && (
                                                                    <span className="text-slate-400">
                                                                        {isCurrentSort ? (
                                                                            sortType ===
                                                                            'asc' ? (
                                                                                <ArrowUp className="h-3 w-3" />
                                                                            ) : (
                                                                                <ArrowDown className="h-3 w-3" />
                                                                            )
                                                                        ) : (
                                                                            <ArrowUpDown className="h-3 w-3 opacity-45 transition-opacity group-hover:opacity-100" />
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
                                            {isLoading
                                                ? data.map((row, i) => (
                                                      <tr
                                                          key={`skel-${row.id || i}`}
                                                      >
                                                          {renderRowDetails && (
                                                              <td className="w-10 px-5 py-3.5"></td>
                                                          )}
                                                          {activeColumns.map(
                                                              (col) => (
                                                                  <td
                                                                      key={`skel-td-${col.key}-${i}`}
                                                                      className={`relative px-5 py-3.5 text-sm whitespace-nowrap ${col.className || ''}`}
                                                                  >
                                                                      {/* Invisible content to preserve cell/column width */}
                                                                      <div className="pointer-events-none invisible select-none">
                                                                          {col.render
                                                                              ? col.render(
                                                                                    row,
                                                                                    i,
                                                                                    meta.from,
                                                                                )
                                                                              : row[
                                                                                    col
                                                                                        .key
                                                                                ] ||
                                                                                '—'}
                                                                      </div>
                                                                      {/* Pulse skeleton overlay */}
                                                                      <div className="absolute inset-0 flex items-center px-5">
                                                                          <div className="h-3.5 w-3/4 animate-pulse rounded-lg bg-slate-200/60 dark:bg-slate-700/50" />
                                                                      </div>
                                                                  </td>
                                                              ),
                                                          )}
                                                      </tr>
                                                  ))
                                                : data.map((row, i) => (
                                                      <React.Fragment
                                                          key={row.id || i}
                                                      >
                                                          <tr className="group transition-colors hover:bg-sky-50/40 dark:hover:bg-sky-500/5">
                                                              {renderRowDetails && (
                                                                  <td className="w-10 px-5 py-3.5 text-center whitespace-nowrap">
                                                                      <button
                                                                          type="button"
                                                                          onClick={() =>
                                                                              toggleRow(
                                                                                  row.id,
                                                                              )
                                                                          }
                                                                          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                      >
                                                                          {expandedRows[
                                                                              row
                                                                                  .id
                                                                          ] ? (
                                                                              <ChevronDown className="h-4 w-4" />
                                                                          ) : (
                                                                              <ChevronRight className="h-4 w-4" />
                                                                          )}
                                                                      </button>
                                                                  </td>
                                                              )}
                                                              {activeColumns.map(
                                                                  (col) => (
                                                                      <td
                                                                          key={
                                                                              col.key
                                                                          }
                                                                          className={`px-5 py-3.5 text-sm whitespace-nowrap ${col.className || ''}`}
                                                                      >
                                                                          {col.render
                                                                              ? col.render(
                                                                                    row,
                                                                                    i,
                                                                                    meta.from,
                                                                                )
                                                                              : row[
                                                                                    col
                                                                                        .key
                                                                                ] ||
                                                                                '—'}
                                                                      </td>
                                                                  ),
                                                              )}
                                                          </tr>
                                                          {renderRowDetails &&
                                                              expandedRows[
                                                                  row.id
                                                              ] && (
                                                                  <tr className="bg-slate-55/30 dark:bg-slate-800/10">
                                                                      <td
                                                                          colSpan={
                                                                              activeColumns.length +
                                                                              1
                                                                          }
                                                                          className="border-b border-slate-100 px-5 py-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400"
                                                                      >
                                                                          {renderRowDetails(
                                                                              row,
                                                                          )}
                                                                      </td>
                                                                  </tr>
                                                              )}
                                                      </React.Fragment>
                                                  ))}
                                        </tbody>
                                        {searchableColumns.length > 0 && (
                                            <tfoot>
                                                <tr className="border-t border-slate-100 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/50">
                                                    {renderRowDetails && (
                                                        <td className="px-5 py-2"></td>
                                                    )}
                                                    {activeColumns.map(
                                                        (col) => (
                                                            <td
                                                                key={`foot-${col.key}`}
                                                                className="px-5 py-2"
                                                            >
                                                                {col.searchable ? (
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            colSearch[
                                                                                col
                                                                                    .key
                                                                            ] ||
                                                                            ''
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            setColSearch(
                                                                                (
                                                                                    prev,
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    [col.key]:
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                }),
                                                                            )
                                                                        }
                                                                        placeholder={
                                                                            col.searchPlaceholder ||
                                                                            `Cari...`
                                                                        }
                                                                        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:placeholder-slate-500"
                                                                    />
                                                                ) : null}
                                                            </td>
                                                        ),
                                                    )}
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>

                                {/* Mobile View: Card Layout */}
                                <div className="flex flex-col gap-4 bg-slate-50/40 px-4 pt-3 pb-20 md:hidden dark:bg-slate-950/20">
                                    {isLoading
                                        ? Array.from({
                                              length: data.length || 5,
                                          }).map((_, i) => (
                                              <div
                                                  key={`skel-card-${i}`}
                                                  className="dark:border-slate-850 flex animate-pulse flex-col gap-3.5 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:bg-slate-900"
                                              >
                                                  <div className="flex items-start justify-between gap-3">
                                                      <div className="flex w-1/2 flex-col gap-1.5">
                                                          <div className="h-2.5 w-1/4 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                          <div className="h-4 w-3/4 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                      </div>
                                                      <div className="h-6 w-12 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                  </div>
                                                  <div className="flex flex-col gap-1.5">
                                                      <div className="h-3 w-full rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                      <div className="h-3 w-5/6 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                  </div>
                                                  <div className="mt-1 grid grid-cols-2 gap-3">
                                                      <div className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800/20 dark:bg-slate-800/40">
                                                          <div className="h-2 w-1/3 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                          <div className="h-3 w-2/3 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                      </div>
                                                      <div className="flex flex-col gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800/20 dark:bg-slate-800/40">
                                                          <div className="h-2 w-1/3 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                          <div className="h-3 w-2/3 rounded bg-slate-200/60 dark:bg-slate-700/50" />
                                                      </div>
                                                  </div>
                                              </div>
                                          ))
                                        : data.map((row, i) => {
                                              if (renderMobileCard) {
                                                  return (
                                                      <React.Fragment
                                                          key={row.id || i}
                                                      >
                                                          {renderMobileCard(
                                                              row,
                                                              i,
                                                              meta.from,
                                                          )}
                                                      </React.Fragment>
                                                  );
                                              }

                                              const actionCol =
                                                  activeColumns.find(
                                                      (c) =>
                                                          c.key === 'actions',
                                                  );
                                              const dataCols =
                                                  activeColumns.filter(
                                                      (c) =>
                                                          c.key !== 'no' &&
                                                          c.key !== 'actions',
                                                  );
                                              const primaryCol =
                                                  dataCols.find(
                                                      (c) => c.key === 'name',
                                                  ) || dataCols[0];
                                              const otherCols = dataCols.filter(
                                                  (c) =>
                                                      c.key !== primaryCol?.key,
                                              );

                                              return (
                                                  <div
                                                      key={row.id || i}
                                                      className="dark:border-slate-850 flex flex-col gap-3.5 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm dark:bg-slate-900"
                                                  >
                                                      {/* Top Line: Title & Actions */}
                                                      <div className="flex items-start justify-between gap-3">
                                                          {primaryCol && (
                                                              <div className="min-w-0">
                                                                  <span className="mb-0.5 block text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                                                      {
                                                                          primaryCol.label
                                                                      }
                                                                  </span>
                                                                  <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                                                      {primaryCol.render
                                                                          ? primaryCol.render(
                                                                                row,
                                                                                i,
                                                                                meta.from,
                                                                            )
                                                                          : row[
                                                                                primaryCol
                                                                                    .key
                                                                            ] ||
                                                                            '—'}
                                                                  </div>
                                                              </div>
                                                          )}
                                                          {actionCol && (
                                                              <div className="flex shrink-0 items-center gap-1">
                                                                  {actionCol.render
                                                                      ? actionCol.render(
                                                                            row,
                                                                            i,
                                                                            meta.from,
                                                                        )
                                                                      : null}
                                                              </div>
                                                          )}
                                                      </div>

                                                      {/* Middle Line: Description / Subtitle */}
                                                      {otherCols.some(
                                                          (c) =>
                                                              c.key ===
                                                              'description',
                                                      ) && (
                                                          <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                                              {(() => {
                                                                  const descCol =
                                                                      otherCols.find(
                                                                          (c) =>
                                                                              c.key ===
                                                                              'description',
                                                                      );
                                                                  return descCol?.render
                                                                      ? descCol.render(
                                                                            row,
                                                                            i,
                                                                            meta.from,
                                                                        )
                                                                      : row.description ||
                                                                            '—';
                                                              })()}
                                                          </div>
                                                      )}

                                                      {/* Bottom Line: Highlight Details Cards */}
                                                      {(() => {
                                                          const displayCols =
                                                              otherCols.filter(
                                                                  (c) =>
                                                                      c.key !==
                                                                      'description',
                                                              );
                                                          if (
                                                              displayCols.length ===
                                                              0
                                                          )
                                                              return null;
                                                          return (
                                                              <div className="mt-1 grid grid-cols-2 gap-3">
                                                                  {displayCols.map(
                                                                      (col) => (
                                                                          <div
                                                                              key={
                                                                                  col.key
                                                                              }
                                                                              className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-800/20 dark:bg-slate-800/40"
                                                                          >
                                                                              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                                                                  {
                                                                                      col.label
                                                                                  }
                                                                              </span>
                                                                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                                                  {col.render
                                                                                      ? col.render(
                                                                                            row,
                                                                                            i,
                                                                                            meta.from,
                                                                                        )
                                                                                      : row[
                                                                                            col
                                                                                                .key
                                                                                        ] ||
                                                                                        '—'}
                                                                              </div>
                                                                          </div>
                                                                      ),
                                                                  )}
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
                        <div className="fixed right-0 bottom-0 left-0 z-30 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 bg-white/95 px-5 py-3.5 backdrop-blur sm:flex-row md:relative md:right-auto md:bottom-auto md:left-auto dark:border-slate-800 dark:bg-slate-900/95">
                            {/* Info text */}
                            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                                Menampilkan{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {meta.from}-{meta.to}
                                </span>{' '}
                                data dari{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {meta.total}
                                </span>{' '}
                                data
                            </p>

                            {/* Pagination */}
                            {meta.last_page >= 1 && (
                                <div className="flex w-full justify-center sm:w-auto">
                                    <div className="inline-flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                                        <button
                                            onClick={() =>
                                                setPage(Math.max(1, page - 1))
                                            }
                                            disabled={page <= 1}
                                            className="inline-flex h-8.5 w-8.5 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        {Array.from(
                                            { length: meta.last_page },
                                            (_, i) => i + 1,
                                        )
                                            .filter((p) => {
                                                if (meta.last_page <= 7)
                                                    return true;
                                                if (
                                                    p === 1 ||
                                                    p === meta.last_page
                                                )
                                                    return true;
                                                if (Math.abs(p - page) <= 1)
                                                    return true;
                                                return false;
                                            })
                                            .reduce<(number | 'dots')[]>(
                                                (acc, p, idx, arr) => {
                                                    if (
                                                        idx > 0 &&
                                                        p -
                                                            (arr[
                                                                idx - 1
                                                            ] as number) >
                                                            1
                                                    )
                                                        acc.push('dots');
                                                    acc.push(p);
                                                    return acc;
                                                },
                                                [],
                                            )
                                            .map((item, idx) =>
                                                item === 'dots' ? (
                                                    <span
                                                        key={`dots-${idx}`}
                                                        className="inline-flex h-8.5 w-8.5 items-center justify-center bg-slate-50/50 text-xs text-slate-400 dark:bg-slate-900/10 dark:text-slate-500"
                                                    >
                                                        …
                                                    </span>
                                                ) : (
                                                    <button
                                                        key={item}
                                                        onClick={() =>
                                                            setPage(
                                                                item as number,
                                                            )
                                                        }
                                                        className={`inline-flex h-8.5 min-w-[2.125rem] items-center justify-center px-2.5 text-xs font-semibold transition-colors ${
                                                            page === item
                                                                ? 'bg-sky-500 text-white dark:bg-sky-600'
                                                                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/80'
                                                        }`}
                                                    >
                                                        {item}
                                                    </button>
                                                ),
                                            )}

                                        <button
                                            onClick={() =>
                                                setPage(
                                                    Math.min(
                                                        meta.last_page,
                                                        page + 1,
                                                    ),
                                                )
                                            }
                                            disabled={page >= meta.last_page}
                                            className="inline-flex h-8.5 w-8.5 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800"
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
    },
);

Datatable.displayName = 'Datatable';

export default Datatable;
