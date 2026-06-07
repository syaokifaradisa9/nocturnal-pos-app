import React, { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { ClipboardList, Eye } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import Modal from '../../components/commons/Modal';
import Datatable, {
    ColumnDefinition,
    DatatableRef,
} from '../../components/commons/Datatable';

interface Branch {
    id: number;
    name: string;
    business_name: string;
    label: string;
}

interface TransactionItem {
    id: number;
    product_name: string;
    measurement_name: string;
    quantity: number;
    price: number;
    total: number;
}

interface Transaction {
    id: number;
    customer_name: string;
    branch_name: string | null;
    business_name: string | null;
    discount_price: number;
    status: string;
    payment_method: string;
    created_at: string;
    subtotal: number;
    total: number;
    items: TransactionItem[];
}

interface IndexProps {
    branches: Branch[];
}

export default function Index({ branches = [] }: IndexProps) {
    const datatableRef = useRef<DatatableRef>(null);

    // Detail Modal state
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const openDetailModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsDetailModalOpen(true);
    };

    const columns: ColumnDefinition<Transaction>[] = [
        {
            key: 'id',
            label: 'No. Invoice',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari invoice...',
            className: 'font-semibold text-slate-900 dark:text-white',
            render: (tx) => (
                <button
                    onClick={() => openDetailModal(tx)}
                    className="cursor-pointer text-left font-bold text-primary hover:underline"
                >
                    #{tx.id}
                </button>
            ),
        },
        {
            key: 'created_at',
            label: 'Waktu Transaksi',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari tanggal...',
            className: 'text-slate-600 dark:text-slate-355',
            render: (tx) => tx.created_at,
        },
        {
            key: 'business_name',
            label: 'Bisnis',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            className: 'text-slate-600 dark:text-slate-355',
            render: (tx) => tx.business_name || '—',
        },
        {
            key: 'branch_name',
            label: 'Cabang',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari cabang...',
            className: 'text-slate-600 dark:text-slate-355',
            render: (tx) => tx.branch_name || '—',
        },
        {
            key: 'customer_name',
            label: 'Customer',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari customer...',
            className: 'text-slate-700 dark:text-slate-300 font-medium',
            render: (tx) => tx.customer_name,
        },
        {
            key: 'payment_method',
            label: 'Metode',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari metode...',
            className: 'text-slate-600 dark:text-slate-355',
            render: (tx) => (
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                    {tx.payment_method}
                </span>
            ),
        },
        {
            key: 'total',
            label: 'Total Bayar',
            sortable: true,
            className:
                'font-semibold text-slate-900 dark:text-white text-right',
            headerClassName: 'text-right',
            render: (tx) => formatCurrency(tx.total),
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (tx) => (
                <button
                    onClick={() => openDetailModal(tx)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                </button>
            ),
        },
    ];

    return (
        <DashboardLayout title="Transaksi Penjualan">
            <Head title="Transaksi Penjualan" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 sm:px-6 md:pt-6 md:pb-8 lg:px-8">
                {/* Header */}
                <ContentHeader
                    title="Transaksi Penjualan"
                    icon={ClipboardList}
                    badge="Kasir"
                    description="Lihat dan kelola riwayat transaksi penjualan dari berbagai cabang sesuai tingkat hak akses Anda."
                    excelUrl="/transactions/print/excel"
                    pdfUrl="/transactions/print/pdf"
                />

                {/* Table */}
                <Datatable
                    ref={datatableRef}
                    apiUrl="/transactions/data"
                    columns={columns}
                    searchPlaceholder="Cari berdasarkan No Invoice atau Pelanggan..."
                    emptyMessage="Belum ada data transaksi"
                    emptySubMessage="Transaksi kasir akan muncul di sini setelah checkout."
                    printPdfUrl="/transactions/print/pdf"
                    printExcelUrl="/transactions/print/excel"
                    renderMobileCard={(tx: Transaction) => (
                        <div
                            key={tx.id}
                            className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    #{tx.id}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                                <div className="text-slate-400">Tanggal</div>
                                <div className="text-right text-slate-700 dark:text-slate-300">
                                    {tx.created_at}
                                </div>

                                <div className="text-slate-400">Bisnis</div>
                                <div className="truncate text-right text-slate-700 dark:text-slate-300">
                                    {tx.business_name || '—'}
                                </div>

                                <div className="text-slate-400">Cabang</div>
                                <div className="truncate text-right text-slate-700 dark:text-slate-300">
                                    {tx.branch_name || '—'}
                                </div>

                                <div className="text-slate-400">Customer</div>
                                <div className="text-right font-medium text-slate-700 dark:text-slate-300">
                                    {tx.customer_name}
                                </div>

                                <div className="text-slate-400">Metode</div>
                                <div className="text-right text-slate-700 dark:text-slate-300">
                                    {tx.payment_method}
                                </div>

                                <div className="mt-1 font-semibold text-slate-400">
                                    Total Bayar
                                </div>
                                <div className="mt-1 text-right font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(tx.total)}
                                </div>
                            </div>
                            <button
                                onClick={() => openDetailModal(tx)}
                                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                Lihat Detail
                            </button>
                        </div>
                    )}
                />
            </div>

            {/* Detail Modal */}
            <Modal
                open={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Detail Transaksi Penjualan"
            >
                {selectedTransaction && (
                    <div className="space-y-6">
                        {/* Transaction Metadata */}
                        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-900/50">
                            <div>
                                <span className="block font-medium text-slate-400">
                                    Invoice
                                </span>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                    #{selectedTransaction.id}
                                </span>
                            </div>
                            <div>
                                <span className="block font-medium text-slate-400">
                                    Tanggal Transaksi
                                </span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedTransaction.created_at}
                                </span>
                            </div>
                            <div>
                                <span className="block font-medium text-slate-400">
                                    Customer
                                </span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedTransaction.customer_name}
                                </span>
                            </div>
                            <div>
                                <span className="block font-medium text-slate-400">
                                    Metode Pembayaran
                                </span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedTransaction.payment_method}
                                </span>
                            </div>
                            <div>
                                <span className="block font-medium text-slate-400">
                                    Bisnis
                                </span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedTransaction.business_name || '—'}
                                </span>
                            </div>
                            <div>
                                <span className="block font-medium text-slate-400">
                                    Cabang
                                </span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedTransaction.branch_name || '—'}
                                </span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                                Item Belanja
                            </h4>
                            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="w-full border-collapse text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
                                            <th className="px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400">
                                                Nama Produk
                                            </th>
                                            <th className="px-4 py-2.5 text-center font-semibold text-slate-500 dark:text-slate-400">
                                                Satuan
                                            </th>
                                            <th className="px-4 py-2.5 text-center font-semibold text-slate-500 dark:text-slate-400">
                                                Qty
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-400">
                                                Harga Satuan
                                            </th>
                                            <th className="px-4 py-2.5 text-right font-semibold text-slate-500 dark:text-slate-400">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {selectedTransaction.items.map(
                                            (item, idx) => (
                                                <tr
                                                    key={item.id || idx}
                                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10"
                                                >
                                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                                        {item.product_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                                                        {item.measurement_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-slate-200">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                                                        {formatCurrency(
                                                            item.price,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(
                                                            item.total,
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="flex flex-col gap-2.5 border-t border-slate-200 pt-4 text-sm dark:border-slate-800">
                            <div className="text-slate-550 flex justify-between dark:text-slate-400">
                                <span>Subtotal</span>
                                <span>
                                    {formatCurrency(
                                        selectedTransaction.subtotal,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                                <span>Diskon</span>
                                <span>
                                    -
                                    {formatCurrency(
                                        selectedTransaction.discount_price,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-slate-100 pt-2.5 font-bold text-slate-900 dark:border-slate-800/80 dark:text-white">
                                <span>Total Bayar</span>
                                <span className="text-base text-primary">
                                    {formatCurrency(selectedTransaction.total)}
                                </span>
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}
