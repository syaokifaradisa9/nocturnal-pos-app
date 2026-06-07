import React, { useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Plus,
    Trash2,
    ClipboardList,
    Eye,
    CheckCircle,
    AlertTriangle,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import Modal from '../../components/commons/Modal';
import Datatable, {
    ColumnDefinition,
    DatatableRef,
} from '../../components/commons/Datatable';
import Tooltip from '../../components/commons/Tooltip';

interface Branch {
    id: number;
    name: string;
    business?: {
        name: string;
    };
}

interface User {
    id: number;
    name: string;
}

interface StockAdjustment {
    id: number;
    adjustment_number: string;
    adjustment_date: string;
    status: 'Draft' | 'Adjusted';
    notes: string | null;
    branch?: Branch;
    user?: User;
}

interface DetailItem {
    id: number;
    inventory_batch?: {
        batch_number: string;
        expired_date: string | null;
        product_item_measurement?: {
            product_item?: {
                name: string;
            };
            measurement_unit?: {
                name: string;
            };
            target_measurement_unit?: {
                name: string;
            };
            conversion_rate?: string;
        };
    };
    current_quantity: string;
    physical_quantity: string;
    difference: string;
    note: string | null;
}

interface FullStockAdjustment extends StockAdjustment {
    items?: DetailItem[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    number,
    isProcessing,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    number: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Stock Opname">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus data stock opname{' '}
                    <strong className="text-slate-900 dark:text-white">
                        {number}
                    </strong>
                    ? Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            <div className="mt-6 flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    Batal
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:opacity-50"
                >
                    {isProcessing ? 'Menghapus...' : 'Hapus'}
                </button>
            </div>
        </Modal>
    );
}

/* ──────────────────────── Detail Modal ──────────────────────── */
function DetailModal({
    open,
    onClose,
    adjustment,
}: {
    open: boolean;
    onClose: () => void;
    adjustment: FullStockAdjustment | null;
}) {
    if (!adjustment) return null;

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Detail Stock Opname"
            maxWidth="max-w-4xl"
        >
            <div className="space-y-6">
                {/* Info Utama */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-4.5 dark:border-slate-800/60 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <ClipboardList className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Informasi Stock Opname
                            </h4>
                            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {adjustment.adjustment_number}
                            </p>
                        </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-4 border-t border-slate-200/60 pt-3 text-xs sm:grid-cols-3 dark:border-slate-800/40">
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Tanggal Opname
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                                {adjustment.adjustment_date}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Status
                            </span>
                            <p className="mt-0.5">
                                <span
                                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                        adjustment.status === 'Draft'
                                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            : 'dark:text-emerald-450 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10'
                                    }`}
                                >
                                    {adjustment.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Operator
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                                {adjustment.user?.name || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-slate-200/60 pt-3 text-xs sm:grid-cols-2 dark:border-slate-800/40">
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Cabang / Bisnis
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                                {adjustment.branch
                                    ? `${adjustment.branch.name} (${adjustment.branch.business?.name || ''})`
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {adjustment.notes && (
                        <div className="border-t border-slate-200/60 pt-3 text-xs dark:border-slate-800/40">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Catatan
                            </span>
                            <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                                {adjustment.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Detail Penyesuaian Barang */}
                <div className="space-y-3">
                    <h4 className="border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800">
                        Penyesuaian Detail Barang
                    </h4>

                    {(adjustment.items || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                            Tidak ada item yang disesuaikan.
                        </p>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-800">
                                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase dark:bg-slate-900/60">
                                    <tr>
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-4 py-3">
                                            Nomor Batch
                                        </th>
                                        <th className="px-4 py-3">
                                            Tanggal Kadaluarsa
                                        </th>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3 text-right">
                                            Stok Fisik
                                        </th>
                                        <th className="px-4 py-3">Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900/10">
                                    {adjustment.items?.map((item, idx) => {
                                        const batchNo =
                                            item.inventory_batch
                                                ?.batch_number || '—';
                                        const expiredDate =
                                            item.inventory_batch
                                                ?.expired_date || '—';
                                        const prodName =
                                            item.inventory_batch
                                                ?.product_item_measurement
                                                ?.product_item?.name || '—';
                                        const unitName =
                                            item.inventory_batch
                                                ?.product_item_measurement
                                                ?.measurement_unit?.name || '—';
                                        const conversionRate =
                                            item.inventory_batch
                                                ?.product_item_measurement
                                                ?.conversion_rate;
                                        const targetUnit =
                                            item.inventory_batch
                                                ?.product_item_measurement
                                                ?.target_measurement_unit?.name;

                                        let productLabel = `${prodName} ${unitName}`;
                                        if (
                                            conversionRate &&
                                            targetUnit &&
                                            parseFloat(conversionRate) !== 1
                                        ) {
                                            const formattedRate =
                                                parseFloat(
                                                    conversionRate,
                                                ).toString();
                                            productLabel += ` (${formattedRate} ${targetUnit})`;
                                        }

                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30"
                                            >
                                                <td className="px-4 py-3 text-slate-500">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                                                    {batchNo}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                    {expiredDate}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                    {productLabel}
                                                </td>
                                                <td className="text-slate-805 px-4 py-3 text-right font-bold dark:text-slate-200">
                                                    {parseFloat(
                                                        item.physical_quantity,
                                                    ).toLocaleString('id-ID', {
                                                        maximumFractionDigits: 4,
                                                    })}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                    {item.note || '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    Tutup
                </button>
            </div>
        </Modal>
    );
}

const formatDateIndonesian = (dateStr: string) => {
    if (!dateStr) return '—';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
    ];
    const monthName = months[monthIndex] || parts[1];
    return `${day} ${monthName} ${year}`;
};

export default function Index() {
    const datatableRef = useRef<DatatableRef>(null);
    const [deleteTarget, setDeleteTarget] = useState<StockAdjustment | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const [detailTarget, setDetailTarget] =
        useState<FullStockAdjustment | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const viewDetail = async (row: StockAdjustment) => {
        try {
            const response = await fetch(`/stock-adjustments/${row.id}`);
            if (response.ok) {
                const data = await response.json();
                setDetailTarget(data);
                setIsDetailOpen(true);
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
        }
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/stock-adjustments/${deleteTarget.id}/delete`, {
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
                datatableRef.current?.fetchData();
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const columns: ColumnDefinition<StockAdjustment>[] = [
        {
            key: 'adjustment_number',
            label: 'Nomor Penyesuaian',
            sortable: true,
            searchable: true,
            className: 'font-semibold text-slate-800 dark:text-slate-100',
            render: (row) => row.adjustment_number,
        },
        {
            key: 'adjustment_date',
            label: 'Tanggal Opname',
            sortable: true,
            searchable: true,
            className: 'text-slate-600 dark:text-slate-300',
            render: (row) =>
                formatDateIndonesian(
                    row.adjustment_date
                        ? row.adjustment_date.split('T')[0]
                        : '',
                ),
        },
        {
            key: 'branch',
            label: 'Cabang',
            sortable: true,
            searchable: true,
            className: 'text-slate-500 dark:text-slate-400',
            render: (row) =>
                row.branch
                    ? `${row.branch.name} (${row.branch.business?.name || ''})`
                    : '—',
        },
        {
            key: 'user',
            label: 'Operator',
            sortable: true,
            searchable: true,
            className: 'text-slate-500 dark:text-slate-400',
            render: (row) => row.user?.name || '—',
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            searchable: true,
            render: (row) => (
                <span
                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        row.status === 'Draft'
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-emerald-55 dark:text-emerald-450 text-emerald-700 dark:bg-emerald-500/10'
                    }`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-1">
                    <Tooltip content="Detail">
                        <button
                            onClick={() => viewDetail(row)}
                            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/10"
                        >
                            <Eye className="h-4 w-4" />
                        </button>
                    </Tooltip>
                    {row.status === 'Draft' && (
                        <Tooltip content="Hapus">
                            <button
                                onClick={() => setDeleteTarget(row)}
                                className="cursor-pointer rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </Tooltip>
                    )}
                </div>
            ),
        },
    ];

    return (
        <DashboardLayout title="Stock Opname">
            <Head title="Stock Opname" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 sm:px-6 md:pt-6 md:pb-8 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Stock Opname"
                    icon={ClipboardList}
                    badge="Transaksi"
                    description="Kelola data stock opname dan lakukan rekonsiliasi stok fisik Anda."
                    excelUrl="/stock-adjustments/print/excel"
                    pdfUrl="/stock-adjustments/print/pdf"
                    actions={
                        <Link
                            href="/stock-adjustments/create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Opname
                        </Link>
                    }
                />

                <Datatable
                    ref={datatableRef}
                    apiUrl="/stock-adjustments/datatable"
                    columns={columns}
                    searchPlaceholder="Cari data stock opname..."
                    emptyMessage="Belum ada data stock opname"
                    emptySubMessage="Mulai dengan melakukan audit stok opname baru."
                    printPdfUrl="/stock-adjustments/print/pdf"
                    printExcelUrl="/stock-adjustments/print/excel"
                    renderMobileCard={(row) => (
                        <div
                            key={row.id}
                            className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10">
                                        <ClipboardList className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <h3 className="truncate text-base leading-snug font-bold text-slate-900 dark:text-white">
                                        {row.adjustment_number}
                                    </h3>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                        row.status === 'Draft'
                                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            : 'dark:text-emerald-450 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10'
                                    }`}
                                >
                                    {row.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-xs">
                                <div className="text-slate-400">
                                    Tanggal Opname
                                </div>
                                <div className="text-right font-medium text-slate-700 dark:text-slate-300">
                                    {formatDateIndonesian(
                                        row.adjustment_date
                                            ? row.adjustment_date.split('T')[0]
                                            : '',
                                    )}
                                </div>

                                <div className="text-slate-400">Cabang</div>
                                <div className="truncate text-right font-medium text-slate-700 dark:text-slate-300">
                                    {row.branch
                                        ? `${row.branch.name} (${row.branch.business?.name || ''})`
                                        : '—'}
                                </div>

                                <div className="text-slate-400">Operator</div>
                                <div className="truncate text-right font-medium text-slate-700 dark:text-slate-300">
                                    {row.user?.name || '—'}
                                </div>
                            </div>

                            {row.notes && (
                                <div className="border-t border-slate-50 pt-2.5 text-xs leading-relaxed text-slate-500 dark:border-slate-800/40 dark:text-slate-400">
                                    {row.notes}
                                </div>
                            )}

                            <div className="mt-1.5 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/60">
                                <button
                                    onClick={() => viewDetail(row)}
                                    className="dark:hover:bg-slate-850 flex min-w-[80px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Detail
                                </button>
                                {row.status === 'Draft' && (
                                    <button
                                        onClick={() => setDeleteTarget(row)}
                                        className="flex min-w-[80px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                />
            </div>

            <DeleteConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                number={deleteTarget?.adjustment_number || 'Tanpa Nomor'}
                isProcessing={isDeleting}
            />

            <DetailModal
                open={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setDetailTarget(null);
                }}
                adjustment={detailTarget}
            />

            {/* Mobile FAB */}
            <Link
                href="/stock-adjustments/create"
                className="fixed right-6 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/35 transition-all hover:scale-105 hover:bg-sky-600 active:scale-95 md:hidden"
            >
                <Plus className="h-6 w-6" />
            </Link>
        </DashboardLayout>
    );
}
