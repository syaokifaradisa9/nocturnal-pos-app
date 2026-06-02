import React, { useState, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, ShoppingBag, Package, Eye } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import Tooltip from '../../components/commons/Tooltip';
import { UserPermission } from '../../types';

interface Business {
    id: number;
    name: string;
    description: string | null;
    user_id: number | null;
}

interface ProductItem {
    id: number;
    product_id: number;
    name: string;
    is_active: boolean;
    product?: {
        id: number;
        name: string;
    };
    items?: {
        id: number;
        measurement_unit_id: number;
        is_base_unit: boolean;
        conversion_rate: string | number;
        measurement_unit?: {
            short_name: string;
        };
    }[];
    businesses?: Business[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({ open, onClose, onConfirm, productName, isProcessing }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    productName: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Item Produk">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus item produk <strong className="text-slate-900 dark:text-white">{productName}</strong> beserta seluruh satuan kemasannya? Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            <div className="mt-6 flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                    Batal
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 transition-colors"
                >
                    {isProcessing ? 'Menghapus...' : 'Hapus'}
                </button>
            </div>
        </Modal>
    );
}

/* ──────────────────────── Detail Modal ──────────────────────── */
function DetailModal({ open, onClose, product }: {
    open: boolean;
    onClose: () => void;
    product: ProductItem | null;
}) {
    if (!product) return null;
    return (
        <Modal open={open} onClose={onClose} title="Detail Varian & Kemasan" maxWidth="max-w-4xl">
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                {/* Product & Variant Section */}
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <ShoppingBag className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informasi Varian & Produk</h4>
                            <p className="text-base font-bold text-slate-800 dark:text-slate-100">{product.name}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pt-3 border-t border-slate-200/60 dark:border-slate-800/40 text-xs">
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Produk Induk (Template)</span>
                            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{product.product?.name || '—'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Bisnis Terkait</span>
                            <p className="font-semibold text-slate-700 dark:text-slate-200 mt-0.5">
                                {product.businesses && product.businesses.length > 0
                                    ? product.businesses.map(b => b.name).join(', ')
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Packaging Measurements & Conversions */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">Daftar Unit Kemasan & Tiering Harga</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(product.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/20 hover:shadow-sm transition-all duration-300">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                        {item.measurement_unit?.name || 'Unit'} ({item.measurement_unit?.short_name || 'Unit'})
                                    </span>
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                        item.is_base_unit
                                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400'
                                            : 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400'
                                    }`}>
                                        {item.is_base_unit ? 'Base Unit' : 'Conversion Unit'}
                                    </span>
                                </div>

                                <div className="text-xs space-y-1">
                                    <span className="text-slate-400 font-semibold">Logika Konversi:</span>
                                    <p className="font-medium text-slate-700 dark:text-slate-300">
                                        {item.is_base_unit ? (
                                            'Sebagai unit dasar (Base Unit).'
                                        ) : (
                                            <>
                                                1 {item.measurement_unit?.short_name} = {parseFloat(item.conversion_rate)} {item.target_measurement_unit?.short_name || 'Base Unit'}
                                            </>
                                        )}
                                    </p>
                                </div>

                                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiering Harga Grosir:</span>
                                    
                                    {(item.price_tierings || []).length === 0 ? (
                                        <p className="text-[11px] text-slate-400 italic">Tidak ada tiering harga grosir.</p>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {item.price_tierings.map((tier: any, tIdx: number) => (
                                                <div key={tIdx} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/40 text-xs">
                                                    <span className="text-slate-500 dark:text-slate-400">Pembelian &ge; {tier.minimum} {item.measurement_unit?.short_name}</span>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Rp {Number(tier.price).toLocaleString('id-ID')}/unit</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                    Tutup
                </button>
            </div>
        </Modal>
    );
}

/* ──────────────────────── Row Action Menu ──────────────────────── */
function RowActions({ product, onView, onDelete }: {
    product: ProductItem;
    onView: (p: ProductItem) => void;
    onDelete: (p: ProductItem) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <Tooltip content="Lihat Detail">
                <button
                    onClick={() => onView(product)}
                    className="inline-flex rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                >
                    <Eye className="h-4 w-4" />
                </button>
            </Tooltip>

            <CheckPermission permissions={[UserPermission.EDIT_ANY_PRODUCT_ITEM, UserPermission.EDIT_ASSOCIATED_PRODUCT_ITEM, UserPermission.EDIT_OWN_PRODUCT_ITEM]}>
                <Tooltip content="Edit Item Produk">
                    <Link
                        href={`/product-items/${product.id}/edit`}
                        className="inline-flex rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Link>
                </Tooltip>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ANY_PRODUCT_ITEM, UserPermission.DELETE_ASSOCIATED_PRODUCT_ITEM, UserPermission.DELETE_OWN_PRODUCT_ITEM]}>
                <Tooltip content="Hapus Item Produk">
                    <button
                        onClick={() => onDelete(product)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </Tooltip>
            </CheckPermission>
        </div>
    );
}

/* ──────────────────────── Main Page ──────────────────────── */
export default function Index() {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];

    const datatableRef = useRef<DatatableRef>(null);

    const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
    const [viewTarget, setViewTarget] = useState<ProductItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/product-items/${deleteTarget.id}/delete`, {
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
                datatableRef.current?.fetchData();
            },
            onError: () => {
                setIsDeleting(false);
            }
        });
    };

    const openDeleteModal = (product: ProductItem) => {
        setDeleteTarget(product);
    };

    const openDetailModal = (product: ProductItem) => {
        setViewTarget(product);
    };

    const columns: ColumnDefinition<any>[] = [
        {
            key: 'name',
            label: 'Varian Item',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nama varian...',
            className: 'font-semibold text-slate-800 dark:text-slate-100',
            render: (p) => p.name
        },
        {
            key: 'product',
            label: 'Produk Induk',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari produk induk...',
            className: 'text-slate-600 dark:text-slate-300 font-medium',
            render: (p) => p.product?.name || '—'
        },
        {
            key: 'items',
            label: 'Daftar Unit Kemasan',
            sortable: true,
            searchable: false,
            className: 'text-xs text-slate-500 dark:text-slate-400',
            render: (p) => {
                const items = p.items || [];
                if (items.length === 0) return '—';
                return (
                    <div className="flex flex-wrap gap-1.5">
                        {items.map((item: any, idx: number) => (
                            <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                    item.is_base_unit
                                        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400'
                                        : 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400'
                                }`}
                            >
                                {item.measurement_unit?.short_name || 'Unit'}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            key: 'business',
            label: 'Bisnis Terkait',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            className: 'text-slate-500 dark:text-slate-400',
            render: (p) => p.businesses && p.businesses.length > 0
                ? p.businesses.map((b: any) => b.name).join(', ')
                : '—'
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (p) => <RowActions product={p} onView={openDetailModal} onDelete={openDeleteModal} />
        }
    ];

    return (
        <DashboardLayout title="Produk Penjualan">
            <Head title="Produk Penjualan" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 md:pt-6 md:pb-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Produk Penjualan"
                    icon={ShoppingBag}
                    badge="Master"
                    description="Kelola varian item produk penjualan, satuan kemasan, konversi unit, beserta tiering harga grosir."
                    excelUrl="/product-items/print/excel"
                    pdfUrl="/product-items/print/pdf"
                    actions={
                        <CheckPermission permissions={[UserPermission.CREATE_ANY_PRODUCT_ITEM, UserPermission.CREATE_ASSOCIATED_PRODUCT_ITEM, UserPermission.CREATE_OWN_PRODUCT_ITEM]}>
                            <Link
                                href="/product-items/create"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors focus:outline-none"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah Produk Penjualan
                            </Link>
                        </CheckPermission>
                    }
                />

                <Datatable
                    ref={datatableRef}
                    apiUrl="/product-items/datatable"
                    columns={columns}
                    searchPlaceholder="Cari item produk..."
                    emptyMessage="Belum ada data item produk"
                    emptySubMessage="Mulai dengan menambahkan item produk baru."
                    printPdfUrl="/product-items/print/pdf"
                    printExcelUrl="/product-items/print/excel"
                    renderMobileCard={(product: ProductItem) => {
                        const user = props.auth?.user as any;
                        const canEdit = userPermissions.includes(UserPermission.EDIT_ANY_PRODUCT_ITEM) || 
                                        (userPermissions.includes(UserPermission.EDIT_ASSOCIATED_PRODUCT_ITEM) && product.businesses?.some(pb => pb.user_id === user?.id)) ||
                                        (userPermissions.includes(UserPermission.EDIT_OWN_PRODUCT_ITEM) && product.businesses?.some(pb => pb.user_id === user?.id));
                        const canDelete = userPermissions.includes(UserPermission.DELETE_ANY_PRODUCT_ITEM) || 
                                          (userPermissions.includes(UserPermission.DELETE_ASSOCIATED_PRODUCT_ITEM) && product.businesses?.some(pb => pb.user_id === user?.id)) ||
                                          (userPermissions.includes(UserPermission.DELETE_OWN_PRODUCT_ITEM) && product.businesses?.some(pb => pb.user_id === user?.id));

                        return (
                            <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/20">
                                            <Package className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                            {product.name}
                                        </h4>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-slate-400">Produk Induk</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium">
                                        {product.product?.name || '—'}
                                    </div>
                                    <div className="text-slate-400">Bisnis Terkait</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium">
                                        {product.businesses && product.businesses.length > 0
                                            ? product.businesses.map(b => b.name).join(', ')
                                            : '—'}
                                    </div>
                                    <div className="col-span-2 mt-1">
                                        <div className="text-slate-400 mb-1">Satuan Kemasan:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {(product.items || []).map((item: any, idx: number) => (
                                                <span
                                                    key={idx}
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                        item.is_base_unit
                                                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400'
                                                            : 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400'
                                                    }`}
                                                >
                                                    {item.measurement_unit?.short_name || 'Unit'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {(canEdit || canDelete) && (
                                    <div className="flex gap-2 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        <button
                                            onClick={() => openDetailModal(product)}
                                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-500/10 transition-colors"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Detail
                                        </button>
                                        {canEdit && (
                                            <Link
                                                href={`/product-items/${product.id}/edit`}
                                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </Link>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => openDeleteModal(product)}
                                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }}
                />
            </div>

            {/* ─── Detail Modal ─── */}
            <DetailModal
                open={!!viewTarget}
                onClose={() => setViewTarget(null)}
                product={viewTarget}
            />

            {/* ─── Delete Confirmation ─── */}
            <DeleteConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                productName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_ANY_PRODUCT_ITEM, UserPermission.CREATE_ASSOCIATED_PRODUCT_ITEM, UserPermission.CREATE_OWN_PRODUCT_ITEM]}>
                <Link
                    href="/product-items/create"
                    className="md:hidden fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/35 hover:bg-sky-600 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                    <Plus className="h-6 w-6" />
                </Link>
            </CheckPermission>
        </DashboardLayout>
    );
}
