import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, ClipboardCheck, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';

interface Supplier {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
    business?: {
        name: string;
    };
}

interface DetailItem {
    id: number;
    product_item_measurement?: {
        product_item?: {
            name: string;
        };
        measurement_unit?: {
            name: string;
            short_name: string;
        };
        target_measurement_unit?: {
            name: string;
            short_name: string;
        };
        conversion_rate?: string | number;
    };
    quantity: string;
    unit_cost: string;
    expired_date: string | null;
}

interface DetailReject {
    id: number;
    product_item_measurement?: {
        product_item?: {
            name: string;
        };
        measurement_unit?: {
            name: string;
            short_name: string;
        };
    };
    quantity: string;
    reason: string;
}

interface FullPurchaseReceipt {
    id: number;
    receipt_number: string | null;
    receipt_date: string;
    status: 'Draft' | 'Confirmed';
    notes: string | null;
    supplier?: Supplier;
    branch?: {
        id: number;
        name: string;
        business?: {
            name: string;
            owner?: {
                name: string;
            };
        };
    };
    items?: DetailItem[];
    rejects?: DetailReject[];
}

interface ConfirmProps {
    receipt: FullPurchaseReceipt;
}

export default function Confirm({ receipt }: ConfirmProps) {
    const { props: pageProps } = usePage();
    const [isConfirming, setIsConfirming] = React.useState(false);

    const totalCost = (receipt.items || []).reduce((acc, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const cost = parseFloat(item.unit_cost) || 0;
        return acc + (qty * cost);
    }, 0);

    const handleConfirm = () => {
        setIsConfirming(true);
        router.post(`/purchase-receipts/${receipt.id}/confirm`, {}, {
            onFinish: () => setIsConfirming(false)
        });
    };

    return (
        <DashboardLayout title="Konfirmasi Penerimaan Barang">
            <Head title="Konfirmasi Penerimaan Barang" />

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Back Link / Header */}
                <div className="mb-6 flex items-center gap-3">
                    <Link
                        href="/purchase-receipts"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Konfirmasi Penerimaan Barang</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tinjau rincian penerimaan sebelum melakukan konfirmasi data masuk.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Info Utama */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                                <ClipboardCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nomor Pengiriman</h4>
                                <p className="text-base font-bold text-slate-800 dark:text-slate-100">{receipt.receipt_number || 'Tanpa Nomor Pengiriman'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                            <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal Penerimaan</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{receipt.receipt_date}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Status</span>
                                <p className="mt-0.5">
                                    <span className="inline-flex items-center rounded-lg bg-slate-105 px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300">
                                        {receipt.status}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Owner</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{receipt.branch?.business?.owner?.name || '—'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                            <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Supplier</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{receipt.supplier?.name || '—'}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Cabang / Bisnis</span>
                                <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                                    {receipt.branch ? `${receipt.branch.name} (${receipt.branch.business?.name || ''})` : '—'}
                                </p>
                            </div>
                        </div>

                        {receipt.notes && (
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase">Catatan</span>
                                <p className="text-slate-700 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">{receipt.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Pendataan Barang */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Pendataan Barang</h4>
                        
                        {(receipt.items || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Tidak ada detail barang.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase">
                                        <tr>
                                            <th className="px-4 py-3">No</th>
                                            <th className="px-4 py-3">Produk / Unit</th>
                                            <th className="px-4 py-3 text-right">Quantity</th>
                                            <th className="px-4 py-3 text-right">Harga Satuan</th>
                                            <th className="px-4 py-3 text-right">Subtotal</th>
                                            <th className="px-4 py-3">Tgl Kadaluarsa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/10">
                                        {receipt.items?.map((item, idx) => {
                                            const prodName = item.product_item_measurement?.product_item?.name || '—';
                                            const unitName = item.product_item_measurement?.measurement_unit?.name || '—';
                                            const qty = parseFloat(item.quantity) || 0;
                                            const cost = parseFloat(item.unit_cost) || 0;
                                            const subtotal = qty * cost;
                                            const conversionRate = item.product_item_measurement?.conversion_rate;
                                            const targetUnit = item.product_item_measurement?.target_measurement_unit?.short_name;

                                            let label = `${prodName} - ${unitName}`;
                                            if (conversionRate && targetUnit) {
                                                const formattedRate = String(conversionRate).replace(/\.?0+$/, '');
                                                label += ` (${formattedRate} ${targetUnit})`;
                                            }

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{label}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                                        {parseFloat(item.quantity).toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                                        Rp {Number(item.unit_cost).toLocaleString('id-ID')}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">
                                                        Rp {subtotal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                        {item.expired_date ? item.expired_date.split('T')[0] : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {receipt.items && receipt.items.length > 0 && (
                            <div className="flex justify-end pt-2 text-sm font-semibold text-slate-750 dark:text-slate-300">
                                Total Keseluruhan: <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">Rp {totalCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        )}
                    </div>

                    {/* Pendataan Barang Reject */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Pendataan Barang Reject</h4>
                        
                        {(receipt.rejects || []).length === 0 ? (
                            <p className="text-xs text-slate-400 italic">Tidak ada barang reject.</p>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 font-semibold uppercase">
                                        <tr>
                                            <th className="px-4 py-3">No</th>
                                            <th className="px-4 py-3">Produk / Unit</th>
                                            <th className="px-4 py-3 text-right">Quantity Reject</th>
                                            <th className="px-4 py-3">Alasan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/10">
                                        {receipt.rejects?.map((reject, idx) => {
                                            const prodName = reject.product_item_measurement?.product_item?.name || '—';
                                            const unitName = reject.product_item_measurement?.measurement_unit?.name || '—';
                                            return (
                                                <tr key={reject.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{prodName} - {unitName}</td>
                                                    <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">
                                                        {parseFloat(reject.quantity).toLocaleString('id-ID', { maximumFractionDigits: 4 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-700 dark:text-slate-350">{reject.reason}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Konfirmasi Notice & Buttons */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                        <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
                            <div>
                                <span className="font-bold">Peringatan:</span> Konfirmasi penerimaan barang akan mengunci data ini. Data barang masuk akan otomatis disalin ke dalam batch inventory dan status penerimaan akan diperbarui menjadi <strong className="text-slate-900 dark:text-white">Confirmed</strong> (tidak dapat diedit atau dihapus kembali).
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link
                                href="/purchase-receipts"
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                Kembali
                            </Link>
                            <button
                                onClick={handleConfirm}
                                disabled={isConfirming}
                                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="h-4 w-4" />
                                {isConfirming ? 'Mengkonfirmasi...' : 'Konfirmasi Penerimaan Barang'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
