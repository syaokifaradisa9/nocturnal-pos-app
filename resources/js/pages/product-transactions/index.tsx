import React, { useState, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { Package, Eye, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import Modal from '../../components/commons/Modal';

interface ProductTransactionItem {
    id: number;
    transaction_id: number;
    created_at: string;
    branch_name: string | null;
    business_name: string | null;
    product_name: string;
    measurement_name: string;
    quantity: number;
    price: number;
    subtotal: number;
}

export default function Index() {
    const datatableRef = useRef<DatatableRef>(null);

    // Detail Modal state
    const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    };

    const handleInvoiceClick = async (transactionId: number) => {
        setIsLoadingDetail(true);
        try {
            const response = await fetch(`/transactions/${transactionId}`, {
                headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedTransaction(data);
                setIsDetailModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching transaction detail:', error);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const columns: ColumnDefinition<ProductTransactionItem>[] = [
        {
            key: 'transaction_id',
            label: 'No. Invoice',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari invoice...',
            className: 'font-semibold text-slate-900 dark:text-white',
            render: (item) => (
                <button
                    onClick={() => handleInvoiceClick(item.transaction_id)}
                    className="text-primary hover:underline font-bold text-left cursor-pointer inline-flex items-center gap-1"
                >
                    #{item.transaction_id}
                </button>
            )
        },
        {
            key: 'created_at',
            label: 'Waktu Transaksi',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari tanggal...',
            className: 'text-slate-600 dark:text-slate-355',
            render: (item) => item.created_at
        },
        {
            key: 'branch_name',
            label: 'Cabang',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari cabang...',
            className: 'text-slate-600 dark:text-slate-355',
            render: (item) => item.branch_name ? `${item.business_name} - ${item.branch_name}` : '—'
        },
        {
            key: 'product_name',
            label: 'Produk',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari produk...',
            className: 'text-slate-800 dark:text-slate-200 font-medium',
            render: (item) => item.product_name
        },
        {
            key: 'measurement_name',
            label: 'Satuan',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari satuan...',
            className: 'text-slate-605 dark:text-slate-350 text-center',
            headerClassName: 'text-center',
            render: (item) => item.measurement_name
        },
        {
            key: 'quantity',
            label: 'Quantity',
            sortable: true,
            className: 'text-slate-800 dark:text-slate-200 text-center font-semibold',
            headerClassName: 'text-center',
            render: (item) => item.quantity
        },
        {
            key: 'subtotal',
            label: 'Sub Total',
            sortable: true,
            className: 'font-semibold text-slate-900 dark:text-white text-right',
            headerClassName: 'text-right',
            render: (item) => formatCurrency(item.subtotal)
        }
    ];

    return (
        <DashboardLayout title="Transaksi Produk">
            <Head title="Transaksi Produk" />

            {/* Spinner Overlay when loading detail */}
            {isLoadingDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-xs">
                    <div className="rounded-2xl bg-white p-4.5 shadow-xl dark:bg-slate-900 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Memuat detail transaksi...</span>
                    </div>
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 md:pt-6 md:pb-8 sm:px-6 lg:px-8">
                {/* Header */}
                <ContentHeader
                    title="Transaksi Produk"
                    icon={Package}
                    badge="Kasir"
                    description="Lihat riwayat item produk terjual dari transaksi checkout di semua cabang sesuai izin akses Anda."
                    excelUrl="/product-transactions/print/excel"
                    pdfUrl="/product-transactions/print/pdf"
                />

                {/* Table */}
                <Datatable
                    ref={datatableRef}
                    apiUrl="/product-transactions/data"
                    columns={columns}
                    searchPlaceholder="Cari invoice atau produk..."
                    emptyMessage="Belum ada data transaksi produk"
                    emptySubMessage="Transaksi produk akan terisi setelah POS checkout produk berhasil."
                    printPdfUrl="/product-transactions/print/pdf"
                    printExcelUrl="/product-transactions/print/excel"
                    renderMobileCard={(item: ProductTransactionItem) => (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => handleInvoiceClick(item.transaction_id)}
                                    className="text-sm font-bold text-primary hover:underline"
                                >
                                    #{item.transaction_id}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                                <div className="text-slate-400">Tanggal</div>
                                <div className="text-slate-700 dark:text-slate-300 text-right">{item.created_at}</div>

                                <div className="text-slate-400">Cabang</div>
                                <div className="text-slate-700 dark:text-slate-300 text-right truncate">{item.branch_name || '—'}</div>

                                <div className="text-slate-400">Produk</div>
                                <div className="text-slate-800 dark:text-slate-200 text-right font-medium truncate">{item.product_name}</div>

                                <div className="text-slate-400">Satuan</div>
                                <div className="text-slate-700 dark:text-slate-300 text-right">{item.measurement_name}</div>

                                <div className="text-slate-400 font-semibold">Quantity</div>
                                <div className="text-slate-850 dark:text-slate-205 text-right font-bold">{item.quantity}</div>

                                <div className="text-slate-400 font-semibold mt-1">Sub Total</div>
                                <div className="text-slate-900 dark:text-white text-right font-bold mt-1">{formatCurrency(item.subtotal)}</div>
                            </div>
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
                        <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 p-4 text-xs">
                            <div>
                                <span className="block text-slate-400 font-medium">Invoice</span>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">#{selectedTransaction.id}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400 font-medium">Waktu Transaksi</span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedTransaction.created_at}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400 font-medium">Customer</span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedTransaction.customer_name}</span>
                            </div>
                            <div>
                                <span className="block text-slate-400 font-medium">Cabang</span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {selectedTransaction.branch_name ? `${selectedTransaction.business_name} - ${selectedTransaction.branch_name}` : '—'}
                                </span>
                            </div>
                            <div>
                                <span className="block text-slate-400 font-medium">Metode Pembayaran</span>
                                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedTransaction.payment_method}</span>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Item Belanja</h4>
                            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                            <th className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">Nama Produk</th>
                                            <th className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400 text-center">Satuan</th>
                                            <th className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400 text-center font-semibold">Qty</th>
                                            <th className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Harga Satuan</th>
                                            <th className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {selectedTransaction.items.map((item: any, idx: number) => (
                                            <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                                <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{item.product_name}</td>
                                                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">{item.measurement_name}</td>
                                                <td className="py-3 px-4 text-center text-slate-800 dark:text-slate-200 font-semibold">{item.quantity}</td>
                                                <td className="py-3 px-4 text-right text-slate-700 dark:text-slate-300">{formatCurrency(item.price)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Price breakdown */}
                        <div className="flex flex-col gap-2.5 border-t border-slate-200 dark:border-slate-800 pt-4 text-sm">
                            <div className="flex justify-between text-slate-550 dark:text-slate-400">
                                <span>Subtotal</span>
                                <span>{formatCurrency(selectedTransaction.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                                <span>Diskon</span>
                                <span>-{formatCurrency(selectedTransaction.discount_price)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                                <span>Total Bayar</span>
                                <span className="text-base text-primary">{formatCurrency(selectedTransaction.total)}</span>
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
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
