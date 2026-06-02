import React, { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { 
    Package, 
    Search, 
    Calendar, 
    ChevronUp, 
    ChevronDown, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    Filter, 
    Building2, 
    Coins, 
    Layers,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';

interface ProductItem {
    id: number;
    name: string;
}

interface MeasurementUnit {
    id: number;
    name: string;
    short_name: string;
}

interface ProductItemMeasurement {
    id: number;
    product_item?: ProductItem;
    measurement_unit?: MeasurementUnit;
    target_measurement_unit?: MeasurementUnit;
    conversion_rate?: string | number;
}

interface Business {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
    business?: Business;
}

interface PurchaseReceipt {
    id: number;
    branch?: Branch;
}

interface PurchaseReceiptItem {
    id: number;
    purchase_receipt?: PurchaseReceipt;
}

interface InventoryBatch {
    id: number;
    batch_number: string;
    initial_quantity: string;
    current_quantity: string;
    unit_cost: string;
    expired_date: string | null;
    status: 'Active' | 'Exhausted' | 'Expired';
    product_item_measurement?: ProductItemMeasurement;
    purchase_receipt_item?: PurchaseReceiptItem;
}

interface GroupedStock {
    expired_date: string;
    items: InventoryBatch[];
}

interface IndexProps {
    groupedStocks: GroupedStock[];
}

type SortField = 'expired_date' | 'product' | 'stock' | 'unit_cost' | 'branch' | 'status';
type SortOrder = 'asc' | 'desc';

export default function Index({ groupedStocks = [] }: IndexProps) {
    // State management
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [expirationFilter, setExpirationFilter] = useState<string>('All');
    const [branchFilter, setBranchFilter] = useState<string>('All');
    const [sortField, setSortField] = useState<SortField>('expired_date');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Flatten data for unified monitoring table
    const allStocks = useMemo(() => {
        return groupedStocks.flatMap(group => 
            group.items.map(item => ({
                ...item,
                // Ensure expired_date is a standard string or null
                expired_date: group.expired_date === 'Tanpa Tanggal Kadaluarsa' ? null : group.expired_date
            }))
        );
    }, [groupedStocks]);

    // Extract unique branches for filter dropdown
    const uniqueBranches = useMemo(() => {
        const branchesMap = new Map<string, string>();
        allStocks.forEach(item => {
            const branch = item.purchase_receipt_item?.purchase_receipt?.branch;
            if (branch) {
                const displayName = `${branch.name} (${branch.business?.name || ''})`;
                branchesMap.set(String(branch.id), displayName);
            }
        });
        return Array.from(branchesMap.entries()).map(([id, name]) => ({ id, name }));
    }, [allStocks]);

    // Expiration details calculation helper
    const getExpirationDetails = (dateStr: string | null) => {
        if (!dateStr) return { daysLeft: null, warningText: 'Tanpa Kadaluarsa', severity: 'safe' };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(dateStr);
        expDate.setHours(0, 0, 0, 0);
        
        const diffTime = expDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) {
            return { daysLeft, warningText: 'Sudah Kedaluwarsa', severity: 'expired' };
        } else if (daysLeft <= 30) {
            return { daysLeft, warningText: `Kedaluwarsa ${daysLeft} hari`, severity: 'near' };
        } else {
            return { daysLeft, warningText: `${daysLeft} hari lagi`, severity: 'safe' };
        }
    };

    // Filtered and sorted data
    const processedStocks = useMemo(() => {
        let result = [...allStocks];

        // Search text filter (Product Name, Batch Number)
        if (searchTerm) {
            const query = searchTerm.toLowerCase();
            result = result.filter(item => {
                const prodName = item.product_item_measurement?.product_item?.name || '';
                const batchNo = item.batch_number || '';
                return prodName.toLowerCase().includes(query) || batchNo.toLowerCase().includes(query);
            });
        }

        // Status Filter
        if (statusFilter !== 'All') {
            result = result.filter(item => item.status === statusFilter);
        }

        // Expiration Status Filter
        if (expirationFilter !== 'All') {
            result = result.filter(item => {
                const details = getExpirationDetails(item.expired_date);
                return details.severity === expirationFilter;
            });
        }

        // Branch Filter
        if (branchFilter !== 'All') {
            result = result.filter(item => {
                const branchId = item.purchase_receipt_item?.purchase_receipt?.branch?.id;
                return String(branchId) === branchFilter;
            });
        }

        // Sorting
        result.sort((a, b) => {
            let valA: any = '';
            let valB: any = '';

            switch (sortField) {
                case 'expired_date':
                    valA = a.expired_date ? new Date(a.expired_date).getTime() : Infinity;
                    valB = b.expired_date ? new Date(b.expired_date).getTime() : Infinity;
                    break;
                case 'product':
                    valA = a.product_item_measurement?.product_item?.name || '';
                    valB = b.product_item_measurement?.product_item?.name || '';
                    break;
                case 'stock':
                    valA = parseFloat(a.current_quantity) || 0;
                    valB = parseFloat(b.current_quantity) || 0;
                    break;
                case 'unit_cost':
                    valA = parseFloat(a.unit_cost) || 0;
                    valB = parseFloat(b.unit_cost) || 0;
                    break;
                case 'branch':
                    valA = a.purchase_receipt_item?.purchase_receipt?.branch?.name || '';
                    valB = b.purchase_receipt_item?.purchase_receipt?.branch?.name || '';
                    break;
                case 'status':
                    valA = a.status || '';
                    valB = b.status || '';
                    break;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [allStocks, searchTerm, statusFilter, expirationFilter, branchFilter, sortField, sortOrder]);

    // Paginated items
    const paginatedStocks = useMemo(() => {
        const startIndex = (currentPage - 1) * perPage;
        return processedStocks.slice(startIndex, startIndex + perPage);
    }, [processedStocks, currentPage, perPage]);

    const totalPages = Math.ceil(processedStocks.length / perPage);

    // Reset pagination when filter/search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, expirationFilter, branchFilter]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const formatDateIndonesian = (dateStr: string | null) => {
        if (!dateStr) return 'Tanpa Kadaluarsa';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return `${day} ${months[monthIndex]} ${year}`;
    };

    const renderSortArrow = (field: SortField) => {
        if (sortField !== field) return null;
        return sortOrder === 'asc' 
            ? <ChevronUp className="ml-1 h-3.5 w-3.5 inline text-primary dark:text-sky-400" />
            : <ChevronDown className="ml-1 h-3.5 w-3.5 inline text-primary dark:text-sky-400" />;
    };

    // Calculate aggregated statistics
    const stats = useMemo(() => {
        let active = 0;
        let nearExp = 0;
        let expired = 0;
        
        allStocks.forEach(item => {
            if (item.status === 'Expired') {
                expired++;
            } else if (item.status === 'Active') {
                active++;
                const details = getExpirationDetails(item.expired_date);
                if (details.severity === 'near') {
                    nearExp++;
                }
            } else if (item.status === 'Exhausted') {
                // optional count
            }
        });

        return { active, nearExp, expired };
    }, [allStocks]);

    return (
        <DashboardLayout title="Monitoring Stok">
            <Head title="Monitoring Stok" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 md:pt-6 md:pb-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Monitoring Stok"
                    icon={Package}
                    badge="Laporan"
                    description="Monitor persediaan stok batch produk, detail harga, cabang, dan status kedaluwarsa secara realtime."
                />

                {/* ─── Quick Stats Overview cards ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 flex items-center gap-4 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-405">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Stok Aktif</span>
                            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{stats.active} Batch</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 flex items-center gap-4 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-650 dark:text-amber-450">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Segera Kadaluarsa</span>
                            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{stats.nearExp} Batch</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 flex items-center gap-4 shadow-sm">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-450">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Sudah Kadaluarsa</span>
                            <span className="text-xl font-black text-slate-800 dark:text-slate-100">{stats.expired} Batch</span>
                        </div>
                    </div>
                </div>

                {/* ─── Controls & Filters Panel ─── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari nama produk atau nomor batch..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-4 text-sm text-slate-850 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white transition-all outline-none"
                            />
                        </div>

                        {/* Reset Filters button */}
                        {(searchTerm || statusFilter !== 'All' || expirationFilter !== 'All' || branchFilter !== 'All') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('All');
                                    setExpirationFilter('All');
                                    setBranchFilter('All');
                                }}
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 transition-all active:scale-95"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                Reset Filter
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                        {/* Expiration Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Masa Kadaluarsa
                            </label>
                            <select
                                value={expirationFilter}
                                onChange={(e) => setExpirationFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 outline-none focus:border-sky-500 transition-colors"
                            >
                                <option value="All">Semua Masa</option>
                                <option value="expired">🚨 Sudah Kadaluarsa</option>
                                <option value="near">⚠️ Segera Kadaluarsa (≤ 30 Hari)</option>
                                <option value="safe">✅ Aman / Tanpa Kadaluarsa</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                Status Batch
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 outline-none focus:border-sky-500 transition-colors"
                            >
                                <option value="All">Semua Status</option>
                                <option value="Active">Aktif (Active)</option>
                                <option value="Exhausted">Habis (Exhausted)</option>
                                <option value="Expired">Kadaluarsa (Expired)</option>
                            </select>
                        </div>

                        {/* Branch Filter */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                Cabang Bisnis
                            </label>
                            <select
                                value={branchFilter}
                                onChange={(e) => setBranchFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 outline-none focus:border-sky-500 transition-colors"
                            >
                                <option value="All">Semua Cabang</option>
                                {uniqueBranches.map(branch => (
                                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ─── Main Monitoring Datatable ─── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-800 text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-150 dark:border-slate-800/80">
                                <tr>
                                    {/* Expired Date Column */}
                                    <th 
                                        onClick={() => handleSort('expired_date')}
                                        className="px-5 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/60 select-none transition-colors"
                                    >
                                        <div className="flex items-center">
                                            Tanggal Kadaluarsa
                                            {renderSortArrow('expired_date')}
                                        </div>
                                    </th>
                                    
                                    {/* Product Column */}
                                    <th 
                                        onClick={() => handleSort('product')}
                                        className="px-5 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/60 select-none transition-colors"
                                    >
                                        <div className="flex items-center">
                                            Produk
                                            {renderSortArrow('product')}
                                        </div>
                                    </th>

                                    {/* Stock Column */}
                                    <th 
                                        onClick={() => handleSort('stock')}
                                        className="px-5 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/60 select-none text-right transition-colors"
                                    >
                                        <div className="flex items-center justify-end">
                                            Stok
                                            {renderSortArrow('stock')}
                                        </div>
                                    </th>

                                    {/* Unit Price Column */}
                                    <th 
                                        onClick={() => handleSort('unit_cost')}
                                        className="px-5 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/60 select-none text-right transition-colors"
                                    >
                                        <div className="flex items-center justify-end">
                                            Harga Satuan
                                            {renderSortArrow('unit_cost')}
                                        </div>
                                    </th>

                                    {/* Branch Column */}
                                    <th 
                                        onClick={() => handleSort('branch')}
                                        className="px-5 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/60 select-none transition-colors"
                                    >
                                        <div className="flex items-center">
                                            Cabang
                                            {renderSortArrow('branch')}
                                        </div>
                                    </th>

                                    {/* Status Column */}
                                    <th 
                                        onClick={() => handleSort('status')}
                                        className="px-5 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-950/60 select-none transition-colors"
                                    >
                                        <div className="flex items-center">
                                            Status
                                            {renderSortArrow('status')}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/10">
                                {paginatedStocks.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                            <Package className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-650 mb-2" />
                                            <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Stok tidak ditemukan</p>
                                            <p className="text-[10px] text-slate-500">Coba ubah filter atau pencarian Anda.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedStocks.map((item) => {
                                        const prodName = item.product_item_measurement?.product_item?.name || '—';
                                        const unitName = item.product_item_measurement?.measurement_unit?.name || '—';
                                        const curQty = parseFloat(item.current_quantity) || 0;
                                        const cost = parseFloat(item.unit_cost) || 0;

                                        const conversionRate = item.product_item_measurement?.conversion_rate;
                                        const targetUnit = item.product_item_measurement?.target_measurement_unit?.short_name;

                                        let productLabel = `${prodName}`;
                                        let unitLabel = `${unitName}`;
                                        if (conversionRate && targetUnit) {
                                            const formattedRate = String(conversionRate).replace(/\.?0+$/, '');
                                            unitLabel += ` (${formattedRate} ${targetUnit})`;
                                        }

                                        const branchName = item.purchase_receipt_item?.purchase_receipt?.branch
                                            ? item.purchase_receipt_item.purchase_receipt.branch.name
                                            : '—';
                                        const businessName = item.purchase_receipt_item?.purchase_receipt?.branch?.business?.name;

                                        // Exp expiration details
                                        const { severity, warningText } = getExpirationDetails(item.expired_date);

                                        let expBadgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
                                        let dateTextColor = "text-slate-800 dark:text-slate-200";

                                        if (severity === 'expired') {
                                            expBadgeColor = "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-450 border border-rose-200/20";
                                            dateTextColor = "text-rose-600 dark:text-rose-400 font-semibold";
                                        } else if (severity === 'near') {
                                            expBadgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-450 border border-amber-200/20";
                                            dateTextColor = "text-amber-650 dark:text-amber-450 font-semibold";
                                        }

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                                                {/* Tanggal Kadaluarsa */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-col gap-1 justify-center">
                                                        <span className={`font-mono text-xs ${dateTextColor}`}>
                                                            {formatDateIndonesian(item.expired_date)}
                                                        </span>
                                                        <span className={`inline-self-start text-[10px] font-bold px-2 py-0.5 rounded-full ${expBadgeColor}`}>
                                                            {warningText}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Produk */}
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-850 dark:text-slate-100 text-sm leading-snug">
                                                            {productLabel}
                                                        </span>
                                                        <span className="text-[10px] font-semibold font-mono text-slate-400 mt-0.5">
                                                            Batch: {item.batch_number}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Stok */}
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="font-extrabold text-slate-850 dark:text-slate-200 text-sm">
                                                            {curQty.toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                                                        </span>
                                                        <span className="text-[10px] text-slate-450 font-medium">
                                                            {unitLabel}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Harga Satuan */}
                                                <td className="px-5 py-3.5 text-right font-semibold text-slate-700 dark:text-slate-350">
                                                    <div className="flex flex-col items-end justify-center">
                                                        <span>Rp {cost.toLocaleString('id-ID')}</span>
                                                    </div>
                                                </td>

                                                {/* Cabang */}
                                                <td className="px-5 py-3.5 text-slate-650 dark:text-slate-350">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 dark:text-slate-205">{branchName}</span>
                                                        {businessName && (
                                                            <span className="text-[10px] text-slate-400 font-medium mt-0.5">{businessName}</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-5 py-3.5">
                                                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-extrabold tracking-wider uppercase ${
                                                        item.status === 'Active'
                                                            ? 'bg-emerald-55 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                            : item.status === 'Expired'
                                                                ? 'bg-rose-55 text-rose-700 dark:bg-rose-500/10 dark:text-rose-450'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-400'
                                                    }`}>
                                                        {item.status === 'Active' ? 'Aktif' : item.status === 'Expired' ? 'Kadaluarsa' : 'Habis'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ─── Pagination Controls ─── */}
                    {processedStocks.length > 0 && (
                        <div className="bg-slate-50/60 dark:bg-slate-950/20 px-5 py-4 border-t border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-550 dark:text-slate-400">
                            <div>
                                Menampilkan <span className="text-slate-800 dark:text-white font-bold">{Math.min(processedStocks.length, (currentPage - 1) * perPage + 1)}</span> sampai{' '}
                                <span className="text-slate-800 dark:text-white font-bold">{Math.min(processedStocks.length, currentPage * perPage)}</span> dari{' '}
                                <span className="text-slate-800 dark:text-white font-bold">{processedStocks.length}</span> batch
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span>Tampilkan</span>
                                    <select
                                        value={perPage}
                                        onChange={(e) => {
                                            setPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 font-bold focus:border-sky-500 transition-colors"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <span className="px-2 text-slate-850 dark:text-white font-bold">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="rounded-lg p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
