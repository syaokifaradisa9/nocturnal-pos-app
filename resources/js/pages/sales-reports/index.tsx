import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    ClipboardList,
    Coins,
    Users,
    TrendingUp,
    DollarSign,
    Calendar,
    Clock,
    ChevronUp,
    ChevronDown,
    Loader2,
    Building,
    Percent,
    Printer,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';

interface Branch {
    id: number;
    name: string;
    business_id: number;
    business_name: string;
    label: string;
}

interface SummaryData {
    total_gross_revenue: number;
    total_profit: number;
    total_transactions: number;
    total_customers: number;
    revenue_by_payment: Record<string, number>;
    profit_by_payment: Record<string, number>;
    gross_sales_revenue: number;
    total_discounts: number;
    net_sales_revenue: number;
    total_cogs: number;
    net_profit: number;
    total_stock_asset_value: number;
}

interface ProductRank {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
}

interface MonthlyTrend {
    period: string;
    revenue: number;
    profit: number;
    customers: number;
}

interface PaymentMethod {
    method: string;
    count: number;
    revenue: number;
    profit: number;
}

interface BusyDay {
    day: string;
    count: number;
}

interface BusyHour {
    hour: string;
    count: number;
}

interface ReportData {
    summary: SummaryData;
    top_products: ProductRank[];
    bottom_products: ProductRank[];
    top_revenue_products: ProductRank[];
    bottom_revenue_products: ProductRank[];
    top_profit_products: ProductRank[];
    bottom_profit_products: ProductRank[];
    monthly_trends: MonthlyTrend[];
    payment_methods: PaymentMethod[];
    busy_days: BusyDay[];
    busy_hours: BusyHour[];
}

interface IndexProps {
    branches: Branch[];
}

export default function Index({ branches = [] }: IndexProps) {
    const [filterBusiness, setFilterBusiness] = useState<string>('');
    const [filterBranch, setFilterBranch] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [data, setData] = useState<ReportData | null>(null);
    const [activeTab, setActiveTab] = useState<
        'produk' | 'penjualan' | 'waktu'
    >('produk');

    // Extract unique businesses
    const uniqueBusinesses = React.useMemo(() => {
        const busMap = new Map<number, string>();
        branches.forEach((b) => {
            if (b.business_id && b.business_name) {
                busMap.set(b.business_id, b.business_name);
            }
        });
        return Array.from(busMap.entries()).map(([id, name]) => ({ id, name }));
    }, [branches]);

    // Filter branches based on selected business
    const filteredBranches = React.useMemo(() => {
        if (!filterBusiness) return branches;
        return branches.filter((b) => b.business_id === Number(filterBusiness));
    }, [branches, filterBusiness]);

    // Reset branch filter if it's not in the filtered branches list
    useEffect(() => {
        if (filterBranch && filterBusiness) {
            const hasBranch = filteredBranches.some(
                (b) => b.id === Number(filterBranch),
            );
            if (!hasBranch) {
                setFilterBranch('');
            }
        }
    }, [filterBusiness, filteredBranches, filterBranch]);

    // Load initial date filter (current month)
    useEffect(() => {
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const fMonth = String(firstDay.getMonth() + 1).padStart(2, '0');
        const fDay = String(firstDay.getDate()).padStart(2, '0');
        const lMonth = String(lastDay.getMonth() + 1).padStart(2, '0');
        const lDay = String(lastDay.getDate()).padStart(2, '0');

        setStartDate(`${firstDay.getFullYear()}-${fMonth}-${fDay}`);
        setEndDate(`${lastDay.getFullYear()}-${lMonth}-${lDay}`);
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filterBusiness)
                queryParams.append('business_id', filterBusiness);
            if (filterBranch) queryParams.append('branch_id', filterBranch);
            if (startDate) queryParams.append('start_date', startDate);
            if (endDate) queryParams.append('end_date', endDate);

            const response = await fetch(
                `/sales-reports/data?${queryParams.toString()}`,
            );
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Error fetching sales report data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchReport();
        }
    }, [filterBusiness, filterBranch, startDate, endDate]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);
    };

    const profitMargin = data?.summary.total_gross_revenue
        ? (
              (data.summary.total_profit / data.summary.total_gross_revenue) *
              100
          ).toFixed(1)
        : '0.0';

    // SVG Drawing Helpers for Trends (Sparkline/Area Chart)
    const renderTrendChart = (trends: MonthlyTrend[]) => {
        if (!trends || trends.length === 0) return null;

        const width = 600;
        const height = 180;
        const padding = 20;

        const maxVal = Math.max(
            ...trends.map((t) => Math.max(t.revenue, t.profit)),
            100000,
        );
        const minVal = 0;
        const range = maxVal - minVal;

        const getX = (index: number) =>
            padding +
            (index * (width - 2 * padding)) / (trends.length - 1 || 1);
        const getY = (value: number) =>
            height -
            padding -
            ((value - minVal) / range) * (height - 2 * padding);

        // Path definitions
        let revPath = '';
        let profPath = '';
        let revArea = '';
        let profArea = '';

        trends.forEach((t, i) => {
            const x = getX(i);
            const yRev = getY(t.revenue);
            const yProf = getY(t.profit);

            if (i === 0) {
                revPath = `M ${x} ${yRev}`;
                profPath = `M ${x} ${yProf}`;
                revArea = `M ${x} ${height - padding} L ${x} ${yRev}`;
                profArea = `M ${x} ${height - padding} L ${x} ${yProf}`;
            } else {
                revPath += ` L ${x} ${yRev}`;
                profPath += ` L ${x} ${yProf}`;
                revArea += ` L ${x} ${yRev}`;
                profArea += ` L ${x} ${yProf}`;
            }

            if (i === trends.length - 1) {
                revArea += ` L ${x} ${height - padding} Z`;
                profArea += ` L ${x} ${height - padding} Z`;
            }
        });

        return (
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-auto w-full overflow-visible"
            >
                <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="rgb(59, 130, 246)"
                            stopOpacity="0.2"
                        />
                        <stop
                            offset="100%"
                            stopColor="rgb(59, 130, 246)"
                            stopOpacity="0.0"
                        />
                    </linearGradient>
                    <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="0%"
                            stopColor="rgb(16, 185, 129)"
                            stopOpacity="0.2"
                        />
                        <stop
                            offset="100%"
                            stopColor="rgb(16, 185, 129)"
                            stopOpacity="0.0"
                        />
                    </linearGradient>
                </defs>
                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                    const y = padding + p * (height - 2 * padding);
                    const labelVal = maxVal - p * range;
                    return (
                        <g key={idx} className="opacity-40">
                            <line
                                x1={padding}
                                y1={y}
                                x2={width - padding}
                                y2={y}
                                stroke="currentColor"
                                strokeDasharray="3,3"
                                className="text-slate-200 dark:text-slate-800"
                                strokeWidth="1"
                            />
                            <text
                                x={padding}
                                y={y - 4}
                                fontSize="9"
                                className="fill-slate-400 font-semibold"
                            >
                                {formatCurrency(labelVal)}
                            </text>
                        </g>
                    );
                })}

                {/* Areas */}
                {trends.length > 1 && (
                    <>
                        <path d={revArea} fill="url(#revGrad)" />
                        <path d={profArea} fill="url(#profGrad)" />
                    </>
                )}

                {/* Lines */}
                <path
                    d={revPath}
                    fill="none"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={profPath}
                    fill="none"
                    stroke="rgb(16, 185, 129)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data Points */}
                {trends.map((t, i) => {
                    const x = getX(i);
                    return (
                        <g key={i}>
                            <circle
                                cx={x}
                                cy={getY(t.revenue)}
                                r="4"
                                fill="white"
                                stroke="rgb(59, 130, 246)"
                                strokeWidth="2"
                            />
                            <circle
                                cx={x}
                                cy={getY(t.profit)}
                                r="4"
                                fill="white"
                                stroke="rgb(16, 185, 129)"
                                strokeWidth="2"
                            />
                            <text
                                x={x}
                                y={height - 4}
                                textAnchor="middle"
                                fontSize="9"
                                className="fill-slate-500 font-semibold dark:fill-slate-400"
                            >
                                {t.period}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    };

    return (
        <DashboardLayout title="Laporan Penjualan">
            <Head title="Laporan Penjualan" />
            <style>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    /* Hide sidebar/navigation, topbar, filters row, tabs, print buttons, and theme toggles */
                    aside, nav, header, footer,
                    .print\\:hidden,
                    button,
                    input,
                    select {
                        display: none !important;
                    }
                    /* Adjust layout constraints for paper */
                    main, .max-w-7xl, .mx-auto, .px-4, .sm\\:px-6, .lg\\:px-8 {
                        width: 100% !important;
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .rounded-2xl {
                        border: 1px solid rgb(226, 232, 240) !important;
                        box-shadow: none !important;
                        background: white !important;
                    }
                    /* Set proper text contrast in print */
                    .text-slate-900, .text-slate-850, .text-slate-800 {
                        color: black !important;
                    }
                    .text-slate-400, .text-slate-500, .text-slate-650 {
                        color: rgb(71, 85, 105) !important;
                    }
                }
            `}</style>

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 sm:px-6 md:pt-6 md:pb-8 lg:px-8">
                {/* Header */}
                <ContentHeader
                    title="Laporan Penjualan"
                    icon={ClipboardList}
                    badge="Laporan"
                    description="Analisis performa pendapatan kotor, keuntungan bersih, tren metode pembayaran, dan analisa jam/hari sibuk."
                    actions={
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-slate-800 focus:outline-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 print:hidden"
                        >
                            <Printer className="h-4 w-4" />
                            Cetak Laporan
                        </button>
                    }
                />

                {/* Filters Row */}
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:hidden">
                    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Pilih Bisnis
                            </label>
                            <div className="relative">
                                <select
                                    value={filterBusiness}
                                    onChange={(e) =>
                                        setFilterBusiness(e.target.value)
                                    }
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50"
                                >
                                    <option value="">Semua Bisnis</option>
                                    {uniqueBusinesses.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                <Building className="pointer-events-none absolute top-3 right-3.5 h-4.5 w-4.5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Pilih Cabang
                            </label>
                            <div className="relative">
                                <select
                                    value={filterBranch}
                                    onChange={(e) =>
                                        setFilterBranch(e.target.value)
                                    }
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100/50 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50"
                                >
                                    <option value="">Semua Cabang</option>
                                    {filteredBranches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                                <Building className="pointer-events-none absolute top-3 right-3.5 h-4.5 w-4.5 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Tanggal Mulai
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Tanggal Selesai
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                            />
                        </div>

                        {/* Quick Date Filters */}
                        <div className="mt-1 flex flex-wrap gap-2 border-t border-slate-100 pt-2.5 sm:col-span-2 lg:col-span-4 dark:border-slate-800/60">
                            <span className="mr-1 self-center text-xs font-bold tracking-wide text-slate-400 uppercase">
                                Filter Cepat:
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    const year = today.getFullYear();
                                    const month = String(
                                        today.getMonth() + 1,
                                    ).padStart(2, '0');
                                    const day = String(
                                        today.getDate(),
                                    ).padStart(2, '0');
                                    const dateStr = `${year}-${month}-${day}`;
                                    setStartDate(dateStr);
                                    setEndDate(dateStr);
                                }}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Hari Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const yesterday = new Date();
                                    yesterday.setDate(yesterday.getDate() - 1);
                                    const year = yesterday.getFullYear();
                                    const month = String(
                                        yesterday.getMonth() + 1,
                                    ).padStart(2, '0');
                                    const day = String(
                                        yesterday.getDate(),
                                    ).padStart(2, '0');
                                    const dateStr = `${year}-${month}-${day}`;
                                    setStartDate(dateStr);
                                    setEndDate(dateStr);
                                }}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Kemarin
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const today = new Date();
                                    const sevenDaysAgo = new Date();
                                    sevenDaysAgo.setDate(today.getDate() - 6);

                                    const getFormat = (d: Date) => {
                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                    };
                                    setStartDate(getFormat(sevenDaysAgo));
                                    setEndDate(getFormat(today));
                                }}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                7 Hari Terakhir
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const date = new Date();
                                    const firstDay = new Date(
                                        date.getFullYear(),
                                        date.getMonth(),
                                        1,
                                    );
                                    const lastDay = new Date(
                                        date.getFullYear(),
                                        date.getMonth() + 1,
                                        0,
                                    );

                                    const fMonth = String(
                                        firstDay.getMonth() + 1,
                                    ).padStart(2, '0');
                                    const fDay = String(
                                        firstDay.getDate(),
                                    ).padStart(2, '0');
                                    const lMonth = String(
                                        lastDay.getMonth() + 1,
                                    ).padStart(2, '0');
                                    const lDay = String(
                                        lastDay.getDate(),
                                    ).padStart(2, '0');

                                    setStartDate(
                                        `${firstDay.getFullYear()}-${fMonth}-${fDay}`,
                                    );
                                    setEndDate(
                                        `${lastDay.getFullYear()}-${lMonth}-${lDay}`,
                                    );
                                }}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Bulan Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const currentYear =
                                        new Date().getFullYear();
                                    setStartDate(`${currentYear}-01-01`);
                                    setEndDate(`${currentYear}-12-31`);
                                }}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Tahun Ini
                            </button>
                        </div>
                    </div>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <span className="text-sm font-semibold text-slate-500">
                            Menyusun laporan penjualan...
                        </span>
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Summary Cards Grid */}
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-blue-50/50 transition-transform duration-300 group-hover:scale-110 dark:bg-blue-900/10" />
                                <div className="relative flex flex-col gap-2.5">
                                    <div className="w-fit rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30">
                                        <ClipboardList className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] leading-tight font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                            Total Transaksi
                                        </span>
                                        <span className="mt-0.5 block text-lg font-bold text-slate-900 dark:text-white">
                                            {data.summary.total_transactions}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-amber-50/50 transition-transform duration-300 group-hover:scale-110 dark:bg-amber-900/10" />
                                <div className="relative flex flex-col gap-2.5">
                                    <div className="w-fit rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-900/30">
                                        <Coins className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] leading-tight font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                            Total Modal
                                        </span>
                                        <span className="mt-0.5 block text-lg font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(
                                                data.summary.total_cogs,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-indigo-50/50 transition-transform duration-300 group-hover:scale-110 dark:bg-indigo-900/10" />
                                <div className="relative flex flex-col gap-2.5">
                                    <div className="w-fit rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] leading-tight font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                            Total Penjualan
                                        </span>
                                        <span className="mt-0.5 block text-lg font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(
                                                data.summary.net_sales_revenue,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-rose-50/50 transition-transform duration-300 group-hover:scale-110 dark:bg-rose-900/10" />
                                <div className="relative flex flex-col gap-2.5">
                                    <div className="w-fit rounded-xl bg-rose-50 p-2 text-rose-600 dark:bg-rose-900/30">
                                        <Percent className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] leading-tight font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                            Total Diskon
                                        </span>
                                        <span className="mt-0.5 block text-lg font-bold text-rose-600">
                                            {formatCurrency(
                                                data.summary.total_discounts,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-emerald-50/50 transition-transform duration-300 group-hover:scale-110 dark:bg-emerald-900/10" />
                                <div className="relative flex flex-col gap-2.5">
                                    <div className="w-fit rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-900/30">
                                        <Coins className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] leading-tight font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                            Total Keuntungan
                                        </span>
                                        <span className="mt-0.5 block text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(
                                                data.summary.total_profit,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-px dark:border-slate-800 print:hidden">
                            <button
                                onClick={() => setActiveTab('produk')}
                                className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'produk' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                            >
                                Produk
                            </button>
                            <button
                                onClick={() => setActiveTab('penjualan')}
                                className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'penjualan' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                            >
                                Penjualan
                            </button>
                            <button
                                onClick={() => setActiveTab('waktu')}
                                className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'waktu' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                            >
                                Waktu Transaksi
                            </button>
                        </div>

                        {/* Tab Content: Penjualan */}
                        {activeTab === 'penjualan' && (
                            <div className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-3">
                                {/* Monthly Trends Sparklines */}
                                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                                    <div>
                                        <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
                                            Tren Bulanan Penjualan
                                        </h3>
                                        <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
                                            Grafik visualisasi pendapatan kotor
                                            (biru) vs keuntungan bersih (hijau).
                                        </p>
                                    </div>
                                    <div className="w-full">
                                        {data.monthly_trends.length > 0 ? (
                                            renderTrendChart(
                                                data.monthly_trends,
                                            )
                                        ) : (
                                            <div className="py-10 text-center text-xs text-slate-400">
                                                Data bulanan tidak mencukupi
                                                untuk dirender
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-slate-450 mt-4 flex items-center justify-end gap-4 text-[10px] font-bold tracking-wider uppercase dark:text-slate-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-blue-500" />{' '}
                                            Pendapatan
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="size-2 rounded-full bg-emerald-500" />{' '}
                                            Keuntungan
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Methods Breakdown */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
                                        Perbandingan Metode Pembayaran
                                    </h3>
                                    <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
                                        Metrik transaksi, omzet, dan margin
                                        profit berdasarkan pembayaran.
                                    </p>
                                    <div className="space-y-4">
                                        {data.payment_methods.length > 0 ? (
                                            data.payment_methods.map(
                                                (pm, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40"
                                                    >
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                                {pm.method}
                                                            </span>
                                                            <span className="rounded-lg bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                {pm.count}{' '}
                                                                Transaksi
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                                            <div>
                                                                <span className="text-slate-400">
                                                                    Pendapatan
                                                                </span>
                                                                <span className="mt-0.5 block font-semibold text-slate-800 dark:text-slate-200">
                                                                    {formatCurrency(
                                                                        pm.revenue,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-slate-400">
                                                                    Keuntungan
                                                                </span>
                                                                <span className="mt-0.5 block font-semibold text-emerald-600 dark:text-emerald-400">
                                                                    {formatCurrency(
                                                                        pm.profit,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ),
                                            )
                                        ) : (
                                            <div className="py-10 text-center text-xs text-slate-400">
                                                Belum ada transaksi
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Produk */}
                        {activeTab === 'produk' && (
                            <div className="space-y-6 pt-4">
                                {/* Top & Bottom Products by Quantity */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Top Products Qty */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                5 Produk Paling Banyak Terjual
                                                (Kuantitas)
                                            </h3>
                                        </div>
                                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                            Daftar item produk dengan volume
                                            penjualan tertinggi.
                                        </p>
                                        <div className="border-slate-150 overflow-hidden rounded-xl border dark:border-slate-800">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-slate-150 dark:border-slate-850 border-b bg-slate-50 dark:bg-slate-900">
                                                        <th className="text-slate-550 px-4 py-2.5 font-bold dark:text-slate-400">
                                                            Nama Produk
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Qty Terjual
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Penjualan
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Keuntungan
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="dark:divide-slate-850 divide-y divide-slate-100">
                                                    {data.top_products.length >
                                                    0 ? (
                                                        data.top_products.map(
                                                            (p, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="dark:hover:bg-slate-850/20 hover:bg-slate-50/50"
                                                                >
                                                                    <td className="dark:text-slate-250 flex items-center gap-2.5 px-4 py-2.5 font-medium text-slate-800">
                                                                        <span className="flex size-5.5 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-950/40">
                                                                            #
                                                                            {idx +
                                                                                1}
                                                                        </span>
                                                                        {p.name}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            p.quantity
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {formatCurrency(
                                                                            p.revenue,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {formatCurrency(
                                                                            p.profit,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="py-6 text-center text-slate-400"
                                                            >
                                                                Belum ada data
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Bottom Products Qty */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                5 Produk Paling Sedikit Terjual
                                                (Kuantitas)
                                            </h3>
                                        </div>
                                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                            Daftar item produk dengan volume
                                            penjualan terendah.
                                        </p>
                                        <div className="border-slate-150 overflow-hidden rounded-xl border dark:border-slate-800">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-slate-150 dark:border-slate-850 border-b bg-slate-50 dark:bg-slate-900">
                                                        <th className="text-slate-550 px-4 py-2.5 font-bold dark:text-slate-400">
                                                            Nama Produk
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Qty Terjual
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Penjualan
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Keuntungan
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="dark:divide-slate-850 divide-y divide-slate-100">
                                                    {data.bottom_products
                                                        .length > 0 ? (
                                                        data.bottom_products.map(
                                                            (p, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="dark:hover:bg-slate-850/20 hover:bg-slate-50/50"
                                                                >
                                                                    <td className="dark:text-slate-250 flex items-center gap-2.5 px-4 py-2.5 font-medium text-slate-800">
                                                                        <span className="text-red-650 flex size-5.5 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold dark:bg-red-950/40">
                                                                            #
                                                                            {idx +
                                                                                1}
                                                                        </span>
                                                                        {p.name}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            p.quantity
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {formatCurrency(
                                                                            p.revenue,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {formatCurrency(
                                                                            p.profit,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="py-6 text-center text-slate-400"
                                                            >
                                                                Belum ada data
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Top & Bottom Products by Revenue */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Top Products Revenue */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                5 Produk Paling Banyak
                                                Pendapatan
                                            </h3>
                                        </div>
                                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                            Daftar item produk dengan total
                                            omzet/pendapatan tertinggi.
                                        </p>
                                        <div className="border-slate-150 overflow-hidden rounded-xl border dark:border-slate-800">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-slate-150 dark:border-slate-850 border-b bg-slate-50 dark:bg-slate-900">
                                                        <th className="text-slate-550 px-4 py-2.5 font-bold dark:text-slate-400">
                                                            Nama Produk
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Qty Terjual
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Penjualan
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Keuntungan
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="dark:divide-slate-850 divide-y divide-slate-100">
                                                    {data.top_revenue_products &&
                                                    data.top_revenue_products
                                                        .length > 0 ? (
                                                        data.top_revenue_products.map(
                                                            (p, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="dark:hover:bg-slate-850/20 hover:bg-slate-50/50"
                                                                >
                                                                    <td className="dark:text-slate-250 flex items-center gap-2.5 px-4 py-2.5 font-medium text-slate-800">
                                                                        <span className="flex size-5.5 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-950/40">
                                                                            #
                                                                            {idx +
                                                                                1}
                                                                        </span>
                                                                        {p.name}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            p.quantity
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {formatCurrency(
                                                                            p.revenue,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {formatCurrency(
                                                                            p.profit,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="py-6 text-center text-slate-400"
                                                            >
                                                                Belum ada data
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Bottom Products Revenue */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                5 Produk Paling Sedikit
                                                Pendapatan
                                            </h3>
                                        </div>
                                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                            Daftar item produk dengan total
                                            omzet/pendapatan terendah.
                                        </p>
                                        <div className="border-slate-150 overflow-hidden rounded-xl border dark:border-slate-800">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-slate-150 dark:border-slate-850 border-b bg-slate-50 dark:bg-slate-900">
                                                        <th className="text-slate-550 px-4 py-2.5 font-bold dark:text-slate-400">
                                                            Nama Produk
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Qty Terjual
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Penjualan
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Keuntungan
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="dark:divide-slate-850 divide-y divide-slate-100">
                                                    {data.bottom_revenue_products &&
                                                    data.bottom_revenue_products
                                                        .length > 0 ? (
                                                        data.bottom_revenue_products.map(
                                                            (p, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="dark:hover:bg-slate-850/20 hover:bg-slate-50/50"
                                                                >
                                                                    <td className="dark:text-slate-250 flex items-center gap-2.5 px-4 py-2.5 font-medium text-slate-800">
                                                                        <span className="text-red-650 flex size-5.5 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold dark:bg-red-950/40">
                                                                            #
                                                                            {idx +
                                                                                1}
                                                                        </span>
                                                                        {p.name}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            p.quantity
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {formatCurrency(
                                                                            p.revenue,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {formatCurrency(
                                                                            p.profit,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="py-6 text-center text-slate-400"
                                                            >
                                                                Belum ada data
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Top & Bottom Products by Profit */}
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {/* Top Products Profit */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                5 Produk Paling Banyak
                                                Keuntungan
                                            </h3>
                                        </div>
                                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                            Daftar item produk dengan kontribusi
                                            margin keuntungan tertinggi.
                                        </p>
                                        <div className="border-slate-150 overflow-hidden rounded-xl border dark:border-slate-800">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-slate-150 dark:border-slate-850 border-b bg-slate-50 dark:bg-slate-900">
                                                        <th className="text-slate-550 px-4 py-2.5 font-bold dark:text-slate-400">
                                                            Nama Produk
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Qty Terjual
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Penjualan
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Keuntungan
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="dark:divide-slate-850 divide-y divide-slate-100">
                                                    {data.top_profit_products &&
                                                    data.top_profit_products
                                                        .length > 0 ? (
                                                        data.top_profit_products.map(
                                                            (p, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="dark:hover:bg-slate-850/20 hover:bg-slate-50/50"
                                                                >
                                                                    <td className="dark:text-slate-250 flex items-center gap-2.5 px-4 py-2.5 font-medium text-slate-800">
                                                                        <span className="flex size-5.5 items-center justify-center rounded-lg bg-blue-50 text-[10px] font-bold text-blue-600 dark:bg-blue-950/40">
                                                                            #
                                                                            {idx +
                                                                                1}
                                                                        </span>
                                                                        {p.name}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            p.quantity
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {formatCurrency(
                                                                            p.revenue,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {formatCurrency(
                                                                            p.profit,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="py-6 text-center text-slate-400"
                                                            >
                                                                Belum ada data
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Bottom Products Profit */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                        <div className="mb-1 flex items-center gap-2">
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                                5 Produk Paling Sedikit
                                                Keuntungan
                                            </h3>
                                        </div>
                                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                                            Daftar item produk dengan kontribusi
                                            margin keuntungan terendah.
                                        </p>
                                        <div className="border-slate-150 overflow-hidden rounded-xl border dark:border-slate-800">
                                            <table className="w-full border-collapse text-left text-xs">
                                                <thead>
                                                    <tr className="border-slate-150 dark:border-slate-850 border-b bg-slate-50 dark:bg-slate-900">
                                                        <th className="text-slate-550 px-4 py-2.5 font-bold dark:text-slate-400">
                                                            Nama Produk
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Qty Terjual
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Penjualan
                                                        </th>
                                                        <th className="text-slate-550 px-4 py-2.5 text-right font-bold dark:text-slate-400">
                                                            Total Keuntungan
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="dark:divide-slate-850 divide-y divide-slate-100">
                                                    {data.bottom_profit_products &&
                                                    data.bottom_profit_products
                                                        .length > 0 ? (
                                                        data.bottom_profit_products.map(
                                                            (p, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="dark:hover:bg-slate-850/20 hover:bg-slate-50/50"
                                                                >
                                                                    <td className="dark:text-slate-250 flex items-center gap-2.5 px-4 py-2.5 font-medium text-slate-800">
                                                                        <span className="text-red-650 flex size-5.5 items-center justify-center rounded-lg bg-red-50 text-[10px] font-bold dark:bg-red-950/40">
                                                                            #
                                                                            {idx +
                                                                                1}
                                                                        </span>
                                                                        {p.name}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {
                                                                            p.quantity
                                                                        }
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                                        {formatCurrency(
                                                                            p.revenue,
                                                                        )}
                                                                    </td>
                                                                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                        {formatCurrency(
                                                                            p.profit,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )
                                                    ) : (
                                                        <tr>
                                                            <td
                                                                colSpan={4}
                                                                className="py-6 text-center text-slate-400"
                                                            >
                                                                Belum ada data
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab Content: Waktu Transaksi */}
                        {activeTab === 'waktu' && (
                            <div className="grid grid-cols-1 gap-6 pt-4 md:grid-cols-2">
                                {/* Busy Day Analysis */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
                                        Analisa Hari Sibuk
                                    </h3>
                                    <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
                                        Distribusi volume transaksi berdasarkan
                                        hari dalam seminggu.
                                    </p>
                                    <div className="border-slate-150 flex h-60 items-end justify-between gap-2 border-b px-2 pt-6 dark:border-slate-800">
                                        {data.busy_days.map((bd, idx) => {
                                            const maxCount = Math.max(
                                                ...data.busy_days.map(
                                                    (d) => d.count,
                                                ),
                                                1,
                                            );
                                            const heightPercent =
                                                (bd.count / maxCount) * 75; // cap height at 75% to fit value labels above
                                            const isPeak =
                                                bd.count === maxCount &&
                                                bd.count > 0;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                                                >
                                                    {/* Tooltip on hover */}
                                                    <div className="pointer-events-none absolute bottom-full z-10 mb-1 rounded bg-slate-900 px-1.5 py-1 text-[10px] font-bold whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        {bd.day}: {bd.count} tx
                                                    </div>
                                                    {/* Value above bar */}
                                                    <span className="mb-1 text-[9px] font-bold text-slate-600 dark:text-slate-400">
                                                        {bd.count}
                                                    </span>
                                                    {/* Bar */}
                                                    <div
                                                        style={{
                                                            height: `${heightPercent}%`,
                                                        }}
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${
                                                            isPeak
                                                                ? 'bg-indigo-600 dark:bg-indigo-500'
                                                                : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'
                                                        }`}
                                                    />
                                                    {/* Axis Label */}
                                                    <span className="mt-2 text-[10px] font-bold whitespace-nowrap text-slate-400">
                                                        {bd.day}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Busy Hour Analysis */}
                                <div className="rounded-2xl border border-slate-200 bg-white p-5.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                    <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
                                        Analisa Jam Sibuk
                                    </h3>
                                    <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">
                                        Distribusi volume transaksi berdasarkan
                                        jam operasional.
                                    </p>
                                    <div className="border-slate-150 flex h-60 items-end justify-between gap-1 border-b px-2 pt-6 dark:border-slate-800">
                                        {data.busy_hours.map((bh, idx) => {
                                            const maxCount = Math.max(
                                                ...data.busy_hours.map(
                                                    (h) => h.count,
                                                ),
                                                1,
                                            );
                                            const heightPercent =
                                                (bh.count / maxCount) * 75; // cap height at 75% to fit value labels above
                                            const isPeak =
                                                bh.count === maxCount &&
                                                bh.count > 0;

                                            // Show only alternate labels on small charts to avoid overlap
                                            const showLabel = idx % 2 === 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="group relative flex h-full flex-1 flex-col items-center justify-end"
                                                >
                                                    {/* Tooltip on hover */}
                                                    <div className="pointer-events-none absolute bottom-full z-10 mb-1 rounded bg-slate-900 px-1.5 py-1 text-[10px] font-bold whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                        {bh.hour}: {bh.count} tx
                                                    </div>
                                                    {/* Value above bar */}
                                                    <span className="mb-1 text-[8px] font-bold text-slate-500 dark:text-slate-500">
                                                        {bh.count > 0
                                                            ? bh.count
                                                            : ''}
                                                    </span>
                                                    {/* Bar */}
                                                    <div
                                                        style={{
                                                            height: `${heightPercent}%`,
                                                        }}
                                                        className={`w-full rounded-t-sm transition-all duration-500 ${
                                                            isPeak
                                                                ? 'bg-primary'
                                                                : 'bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600'
                                                        }`}
                                                    />
                                                    {/* Axis Label */}
                                                    <span className="mt-2 origin-top-left translate-x-1 rotate-45 transform text-[9px] font-bold whitespace-nowrap text-slate-400">
                                                        {showLabel
                                                            ? bh.hour
                                                            : ''}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-20 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <span className="text-sm font-semibold text-slate-400">
                            Tidak ada data untuk rentang tanggal yang dipilih
                        </span>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
