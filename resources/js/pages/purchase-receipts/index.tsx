import React, { useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Plus,
    Trash2,
    ClipboardCheck,
    Pencil,
    Eye,
    CheckCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import Modal from '../../components/commons/Modal';
import Datatable, {
    ColumnDefinition,
    DatatableRef,
} from '../../components/commons/Datatable';
import Tooltip from '../../components/commons/Tooltip';

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

interface PurchaseReceipt {
    id: number;
    receipt_number: string | null;
    receipt_date: string;
    status: 'Draft' | 'Review' | 'Confirmed';
    notes: string | null;
    supplier?: Supplier;
    branch?: Branch;
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    receiptNumber,
    isProcessing,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    receiptNumber: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Penerimaan Barang">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus penerimaan barang{' '}
                    <strong className="text-slate-900 dark:text-white">
                        {receiptNumber}
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

interface FullPurchaseReceipt extends PurchaseReceipt {
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

function DetailModal({
    open,
    onClose,
    receipt,
}: {
    open: boolean;
    onClose: () => void;
    receipt: FullPurchaseReceipt | null;
}) {
    if (!receipt) return null;

    const totalCost = (receipt.items || []).reduce((acc, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const cost = parseFloat(item.unit_cost) || 0;
        return acc + qty * cost;
    }, 0);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Detail Penerimaan Barang"
            maxWidth="max-w-4xl"
        >
            <div className="space-y-6">
                {/* Info Utama */}
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 p-4.5 dark:border-slate-800/60 dark:bg-slate-900/40">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <ClipboardCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                Informasi Penerimaan
                            </h4>
                            <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                                {receipt.receipt_number ||
                                    'Tanpa Nomor Pengiriman'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-4 border-t border-slate-200/60 pt-3 text-xs sm:grid-cols-3 dark:border-slate-800/40">
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Tanggal Penerimaan
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                                {receipt.receipt_date}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Status
                            </span>
                            <p className="mt-0.5">
                                <span
                                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                        receipt.status === 'Draft'
                                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            : 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
                                    }`}
                                >
                                    {receipt.status}
                                </span>
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Owner
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                                {receipt.branch?.business?.owner?.name || '—'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-slate-200/60 pt-3 text-xs sm:grid-cols-2 dark:border-slate-800/40">
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Supplier
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                                {receipt.supplier?.name || '—'}
                            </p>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Cabang / Bisnis
                            </span>
                            <p className="mt-0.5 font-semibold text-slate-700 dark:text-slate-200">
                                {receipt.branch
                                    ? `${receipt.branch.name} (${receipt.branch.business?.name || ''})`
                                    : '—'}
                            </p>
                        </div>
                    </div>

                    {receipt.notes && (
                        <div className="border-t border-slate-200/60 pt-3 text-xs dark:border-slate-800/40">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                Catatan
                            </span>
                            <p className="mt-0.5 whitespace-pre-wrap text-slate-700 dark:text-slate-200">
                                {receipt.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Pendataan Barang */}
                <div className="space-y-3">
                    <h4 className="border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800">
                        Pendataan Barang
                    </h4>

                    {(receipt.items || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                            Tidak ada detail barang.
                        </p>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-800">
                                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase dark:bg-slate-900/60">
                                    <tr>
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-4 py-3">
                                            Produk / Unit
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Harga Satuan
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Subtotal
                                        </th>
                                        <th className="px-4 py-3">
                                            Tgl Kadaluarsa
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900/10">
                                    {receipt.items?.map((item, idx) => {
                                        const prodName =
                                            item.product_item_measurement
                                                ?.product_item?.name || '—';
                                        const unitName =
                                            item.product_item_measurement
                                                ?.measurement_unit?.name || '—';
                                        const qty =
                                            parseFloat(item.quantity) || 0;
                                        const cost =
                                            parseFloat(item.unit_cost) || 0;
                                        const subtotal = qty * cost;
                                        const conversionRate =
                                            item.product_item_measurement
                                                ?.conversion_rate;
                                        const targetUnit =
                                            item.product_item_measurement
                                                ?.target_measurement_unit
                                                ?.short_name;

                                        let label = `${prodName} - ${unitName}`;
                                        if (conversionRate && targetUnit) {
                                            const formattedRate = String(
                                                conversionRate,
                                            ).replace(/\.?0+$/, '');
                                            label += ` (${formattedRate} ${targetUnit})`;
                                        }

                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30"
                                            >
                                                <td className="px-4 py-3 text-slate-500">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                    {label}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                                                    {parseFloat(
                                                        item.quantity,
                                                    ).toLocaleString('id-ID', {
                                                        maximumFractionDigits: 4,
                                                    })}
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                                    Rp{' '}
                                                    {Number(
                                                        item.unit_cost,
                                                    ).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-100">
                                                    Rp{' '}
                                                    {subtotal.toLocaleString(
                                                        'id-ID',
                                                        {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        },
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                    {item.expired_date
                                                        ? item.expired_date.split(
                                                              'T',
                                                          )[0]
                                                        : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {receipt.items && receipt.items.length > 0 && (
                        <div className="flex justify-end p-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Total Keseluruhan:{' '}
                            <span className="ml-2 font-bold text-emerald-600 dark:text-emerald-400">
                                Rp{' '}
                                {totalCost.toLocaleString('id-ID', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Pendataan Barang Reject */}
                <div className="space-y-3">
                    <h4 className="border-b border-slate-100 pb-2 text-xs font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800">
                        Pendataan Barang Reject
                    </h4>

                    {(receipt.rejects || []).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                            Tidak ada barang reject.
                        </p>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-xs dark:divide-slate-800">
                                <thead className="bg-slate-50 font-semibold text-slate-500 uppercase dark:bg-slate-900/60">
                                    <tr>
                                        <th className="px-4 py-3">No</th>
                                        <th className="px-4 py-3">
                                            Produk / Unit
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Quantity Reject
                                        </th>
                                        <th className="px-4 py-3">Alasan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900/10">
                                    {receipt.rejects?.map((reject, idx) => {
                                        const prodName =
                                            reject.product_item_measurement
                                                ?.product_item?.name || '—';
                                        const unitName =
                                            reject.product_item_measurement
                                                ?.measurement_unit?.name || '—';
                                        return (
                                            <tr
                                                key={reject.id}
                                                className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30"
                                            >
                                                <td className="px-4 py-3 text-slate-500">
                                                    {idx + 1}
                                                </td>
                                                <td className="text-slate-805 px-4 py-3 font-medium dark:text-slate-200">
                                                    {prodName} - {unitName}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-rose-600 dark:text-rose-400">
                                                    {parseFloat(
                                                        reject.quantity,
                                                    ).toLocaleString('id-ID', {
                                                        maximumFractionDigits: 4,
                                                    })}
                                                </td>
                                                <td className="dark:text-slate-350 px-4 py-3 text-slate-700">
                                                    {reject.reason}
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
    const { props: pageProps } = usePage();
    const userPermissions = (pageProps.auth?.user as any)?.permissions || [];
    const hasConfirmPermission = userPermissions.includes(
        'Konfirmasi Data Penerimaan Barang',
    );

    const [deleteTarget, setDeleteTarget] = useState<PurchaseReceipt | null>(
        null,
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const [detailTarget, setDetailTarget] =
        useState<FullPurchaseReceipt | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const viewDetail = async (row: PurchaseReceipt) => {
        try {
            const response = await fetch(`/purchase-receipts/${row.id}`);
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
        router.delete(`/purchase-receipts/${deleteTarget.id}/delete`, {
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

    const columns: ColumnDefinition<PurchaseReceipt>[] = [
        {
            key: 'receipt_number',
            label: 'Nomor Pengiriman',
            sortable: true,
            searchable: true,
            render: (row) => (
                <span
                    className={`font-semibold ${
                        row.status === 'Confirmed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'dark:text-sky-450 text-sky-600'
                    }`}
                >
                    {row.receipt_number || '—'}
                </span>
            ),
        },
        {
            key: 'receipt_date',
            label: 'Tanggal Pengiriman',
            sortable: true,
            searchable: true,
            className: 'text-slate-600 dark:text-slate-300',
            render: (row) => formatDateIndonesian(row.receipt_date),
        },
        {
            key: 'supplier',
            label: 'Supplier',
            sortable: true,
            searchable: true,
            className: 'text-slate-600 dark:text-slate-300',
            render: (row) => row.supplier?.name || '—',
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
                    {row.status !== 'Confirmed' && hasConfirmPermission && (
                        <Tooltip content="Konfirmasi">
                            <Link
                                href={`/purchase-receipts/${row.id}/confirm`}
                                className="cursor-pointer rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                            >
                                <CheckCircle className="h-4 w-4" />
                            </Link>
                        </Tooltip>
                    )}
                    {row.status === 'Draft' && (
                        <Tooltip content="Ubah">
                            <Link
                                href={`/purchase-receipts/${row.id}/edit`}
                                className="cursor-pointer rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                            >
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Tooltip>
                    )}
                    {row.status !== 'Confirmed' && (
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
        <DashboardLayout title="Penerimaan Barang">
            <Head title="Penerimaan Barang" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 sm:px-6 md:pt-6 md:pb-8 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Penerimaan Barang"
                    icon={ClipboardCheck}
                    badge="Transaksi"
                    description="Kelola data penerimaan barang dan status operasional logistik Anda."
                    excelUrl="/purchase-receipts/print/excel"
                    pdfUrl="/purchase-receipts/print/pdf"
                    actions={
                        <Link
                            href="/purchase-receipts/create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Penerimaan
                        </Link>
                    }
                />

                <Datatable
                    ref={datatableRef}
                    apiUrl="/purchase-receipts/datatable"
                    columns={columns}
                    searchPlaceholder="Cari data penerimaan..."
                    emptyMessage="Belum ada data penerimaan barang"
                    emptySubMessage="Mulai dengan menambahkan data penerimaan barang baru."
                    printPdfUrl="/purchase-receipts/print/pdf"
                    printExcelUrl="/purchase-receipts/print/excel"
                    renderMobileCard={(row) => (
                        <div
                            key={row.id}
                            className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/20">
                                        <ClipboardCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                    </div>
                                    <h3 className="truncate text-base leading-snug font-bold text-slate-900 dark:text-white">
                                        {row.receipt_number || '—'}
                                    </h3>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                        row.status === 'Draft'
                                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            : row.status === 'Confirmed'
                                              ? 'bg-emerald-55 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                              : 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400'
                                    }`}
                                >
                                    {row.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 text-xs">
                                <div className="text-slate-400">
                                    Tanggal Pengiriman
                                </div>
                                <div className="text-right font-medium text-slate-700 dark:text-slate-300">
                                    {formatDateIndonesian(row.receipt_date)}
                                </div>

                                <div className="text-slate-400">Supplier</div>
                                <div className="truncate text-right font-medium text-slate-700 dark:text-slate-300">
                                    {row.supplier?.name || '—'}
                                </div>

                                <div className="text-slate-400">Cabang</div>
                                <div className="truncate text-right font-medium text-slate-700 dark:text-slate-300">
                                    {row.branch
                                        ? `${row.branch.name} (${row.branch.business?.name || ''})`
                                        : '—'}
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
                                {row.status !== 'Confirmed' &&
                                    hasConfirmPermission && (
                                        <Link
                                            href={`/purchase-receipts/${row.id}/confirm`}
                                            className="flex min-w-[80px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-white py-2 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
                                        >
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            Konfirmasi
                                        </Link>
                                    )}
                                {row.status === 'Draft' && (
                                    <Link
                                        href={`/purchase-receipts/${row.id}/edit`}
                                        className="flex min-w-[80px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-white py-2 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-50 dark:border-slate-800 dark:bg-slate-900 dark:text-amber-400 dark:hover:bg-amber-500/10"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                        Edit
                                    </Link>
                                )}
                                {row.status !== 'Confirmed' && (
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
                receiptNumber={deleteTarget?.receipt_number || 'Tanpa Nomor'}
                isProcessing={isDeleting}
            />

            <DetailModal
                open={isDetailOpen}
                onClose={() => {
                    setIsDetailOpen(false);
                    setDetailTarget(null);
                }}
                receipt={detailTarget}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <Link
                href="/purchase-receipts/create"
                className="fixed right-6 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/35 transition-all hover:scale-105 hover:bg-sky-600 focus:ring-2 focus:ring-sky-500/30 focus:outline-none active:scale-95 md:hidden"
            >
                <Plus className="h-6 w-6" />
            </Link>
        </DashboardLayout>
    );
}
