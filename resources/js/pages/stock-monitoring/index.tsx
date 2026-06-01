import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Package, Search, Calendar, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

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

export default function Index({ groupedStocks = [] }: IndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
        // Expand all by default
        const initial: Record<string, boolean> = {};
        groupedStocks.forEach(group => {
            initial[group.expired_date] = true;
        });
        return initial;
    });

    const toggleGroup = (date: string) => {
        setExpandedGroups(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    // Filter items based on search term (filters by product name or batch number)
    const filteredGroupedStocks = groupedStocks.map(group => {
        const filteredItems = group.items.filter(item => {
            const prodName = item.product_item_measurement?.product_item?.name || '';
            const batchNo = item.batch_number || '';
            const searchLower = searchTerm.toLowerCase();
            return prodName.toLowerCase().includes(searchLower) || batchNo.toLowerCase().includes(searchLower);
        });
        return {
            ...group,
            items: filteredItems
        };
    }).filter(group => group.items.length > 0);

    // Calculate days until expiration
    const getExpirationStatus = (expiredDateStr: string | null) => {
        if (!expiredDateStr || expiredDateStr === 'Tanpa Tanggal Kadaluarsa') return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(expiredDateStr);
        expDate.setHours(0, 0, 0, 0);
        
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    };

    return (
        <DashboardLayout title="Monitoring Stok">
            <Head title="Monitoring Stok" />

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                                <Package className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Monitoring Stok</h1>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Monitor stok batch produk Anda yang dikelompokkan berdasarkan tanggal kedaluwarsa.
                        </p>
                    </div>

                    {/* Search Input */}
                    <div className="relative w-full sm:w-72">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari produk atau batch..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-450 focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                    </div>
                </div>

                {filteredGroupedStocks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-850 bg-white dark:bg-slate-900">
                        <Package className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-600" />
                        <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">Tidak ada data stok</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {searchTerm ? 'Tidak ada kecocokan untuk pencarian Anda.' : 'Belum ada data batch stok masuk.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredGroupedStocks.map(group => {
                            const isExpanded = !!expandedGroups[group.expired_date];
                            const daysLeft = getExpirationStatus(group.expired_date);
                            
                            // Group Header Alert Styling based on Expiration
                            let badgeStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                            let cardBorder = "border-slate-200 dark:border-slate-800";
                            let headerBg = "bg-slate-50 dark:bg-slate-900/60";
                            let warningText = "";

                            if (daysLeft !== null) {
                                if (daysLeft < 0) {
                                    badgeStyle = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-200/50 dark:border-rose-900/30";
                                    cardBorder = "border-rose-200 dark:border-rose-950/50";
                                    headerBg = "bg-rose-50/30 dark:bg-rose-950/5";
                                    warningText = "Sudah Kedaluwarsa";
                                } else if (daysLeft <= 30) {
                                    badgeStyle = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-200/50 dark:border-amber-900/30";
                                    cardBorder = "border-amber-200 dark:border-amber-950/50";
                                    headerBg = "bg-amber-50/20 dark:bg-amber-950/5";
                                    warningText = `Kedaluwarsa dalam ${daysLeft} hari`;
                                } else {
                                    badgeStyle = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-200/50 dark:border-emerald-900/30";
                                }
                            }

                            return (
                                <div key={group.expired_date} className={`rounded-2xl border ${cardBorder} bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all`}>
                                    {/* Group Header */}
                                    <div 
                                        onClick={() => toggleGroup(group.expired_date)}
                                        className={`flex items-center justify-between px-5 py-4 cursor-pointer select-none border-b border-slate-100 dark:border-slate-800/80 ${headerBg} transition-colors`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}
                                            <div className="flex items-center gap-2.5">
                                                <Calendar className="h-4.5 w-4.5 text-slate-400" />
                                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                    {group.expired_date === 'Tanpa Tanggal Kadaluarsa' 
                                                        ? 'Tanpa Tanggal Kadaluarsa' 
                                                        : `Kedaluwarsa: ${new Date(group.expired_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                                                </span>
                                            </div>
                                            {warningText && (
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}`}>
                                                    <AlertCircle className="h-3 w-3" />
                                                    {warningText}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold text-slate-400">
                                            {group.items.length} Batch
                                        </span>
                                    </div>

                                    {/* Group Content */}
                                    {isExpanded && (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-150 dark:divide-slate-800 text-left text-xs">
                                                <thead className="bg-slate-50/40 dark:bg-slate-950/20 text-slate-450 font-bold uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-5 py-3">No Batch</th>
                                                        <th className="px-5 py-3">Produk / Unit</th>
                                                        <th className="px-5 py-3 text-right">Stok Saat Ini</th>
                                                        <th className="px-5 py-3 text-right">Stok Awal</th>
                                                        <th className="px-5 py-3 text-right">Harga Satuan</th>
                                                        <th className="px-5 py-3 text-right">Nilai Stok</th>
                                                        <th className="px-5 py-3">Cabang</th>
                                                        <th className="px-5 py-3">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/20">
                                                    {group.items.map((item) => {
                                                        const prodName = item.product_item_measurement?.product_item?.name || '—';
                                                        const unitName = item.product_item_measurement?.measurement_unit?.name || '—';
                                                        const curQty = parseFloat(item.current_quantity) || 0;
                                                        const initQty = parseFloat(item.initial_quantity) || 0;
                                                        const cost = parseFloat(item.unit_cost) || 0;
                                                        const totalVal = curQty * cost;

                                                        const conversionRate = item.product_item_measurement?.conversion_rate;
                                                        const targetUnit = item.product_item_measurement?.target_measurement_unit?.short_name;

                                                        let label = `${prodName} - ${unitName}`;
                                                        if (conversionRate && targetUnit) {
                                                            const formattedRate = String(conversionRate).replace(/\.?0+$/, '');
                                                            label += ` (${formattedRate} ${targetUnit})`;
                                                        }

                                                        const branchName = item.purchase_receipt_item?.purchase_receipt?.branch
                                                            ? `${item.purchase_receipt_item.purchase_receipt.branch.name} (${item.purchase_receipt_item.purchase_receipt.branch.business?.name || ''})`
                                                            : '—';

                                                        return (
                                                            <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                                                                <td className="px-5 py-3.5 font-mono font-semibold text-slate-800 dark:text-slate-100">
                                                                    {item.batch_number}
                                                                </td>
                                                                <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-200">
                                                                    {label}
                                                                </td>
                                                                <td className="px-5 py-3.5 text-right font-bold text-slate-800 dark:text-slate-200">
                                                                    {curQty.toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                                                                </td>
                                                                <td className="px-5 py-3.5 text-right text-slate-550 dark:text-slate-400">
                                                                    {initQty.toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                                                                </td>
                                                                <td className="px-5 py-3.5 text-right text-slate-600 dark:text-slate-400">
                                                                    Rp {cost.toLocaleString('id-ID')}
                                                                </td>
                                                                <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-450">
                                                                    Rp {totalVal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </td>
                                                                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                                                                    {branchName}
                                                                </td>
                                                                <td className="px-5 py-3.5">
                                                                    <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                                                                        item.status === 'Active'
                                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                                            : item.status === 'Expired'
                                                                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-450'
                                                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                                                                    }`}>
                                                                        {item.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
