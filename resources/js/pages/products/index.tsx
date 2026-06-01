import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, FileSpreadsheet, FileText, ShoppingBag, Package } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import { UserPermission } from '../../types';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';

interface Business {
    id: number;
    name: string;
    description: string | null;
    user_id: number | null;
}

interface User {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    businesses?: Business[];
    created_at: string;
}

interface IndexProps {
    businesses?: Business[];
    users?: User[];
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
        <Modal open={open} onClose={onClose} title="Hapus Produk">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus produk <strong className="text-slate-900 dark:text-white">{productName}</strong>? Tindakan ini tidak dapat dibatalkan.
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

/* ──────────────────────── Row Action Menu ──────────────────────── */
function RowActions({ product, onEdit, onDelete }: {
    product: Product;
    onEdit: (p: Product) => void;
    onDelete: (p: Product) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_ANY_PRODUCT, UserPermission.EDIT_ASSOCIATED_PRODUCT, UserPermission.EDIT_OWN_PRODUCT]}>
                <div className="relative group/edit">
                    <button
                        onClick={() => onEdit(product)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/edit:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Edit Produk
                        <div className="absolute top-full right-3.5 h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 dark:bg-slate-800" />
                    </div>
                </div>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ANY_PRODUCT, UserPermission.DELETE_ASSOCIATED_PRODUCT, UserPermission.DELETE_OWN_PRODUCT]}>
                <div className="relative group/delete">
                    <button
                        onClick={() => onDelete(product)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/delete:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Hapus Produk
                        <div className="absolute top-full right-3.5 h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 dark:bg-slate-800" />
                    </div>
                </div>
            </CheckPermission>
        </div>
    );
}

/* ──────────────────────── Main Page ──────────────────────── */
export default function Index({ businesses = [], users = [] }: IndexProps) {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];

    // Determines create forms permissions:
    const hasCreateAnyProduct = userPermissions.includes(UserPermission.CREATE_ANY_PRODUCT);
    const hasCreateAssociatedProduct = userPermissions.includes(UserPermission.CREATE_ASSOCIATED_PRODUCT);

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Selected owner state for dynamic filtering in CREATE_ANY_PRODUCT
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
    const [fetchedBusinesses, setFetchedBusinesses] = useState<Business[]>([]);
    const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(false);

    /* Create Form */
    const { data: createData, setData: setCreateData, post: postCreate, reset: resetCreate, errors: createErrors, processing: createProcessing, clearErrors: clearCreateErrors } = useForm({
        name: '', business_ids: [] as number[]
    });

    /* Edit Form */
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, errors: editErrors, processing: editProcessing, clearErrors: clearEditErrors } = useForm({
        name: '', business_ids: [] as number[]
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/products/store', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                setSelectedOwnerId('');
                setFetchedBusinesses([]);
                datatableRef.current?.fetchData();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        putEdit(`/products/${selectedProduct.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedProduct(null);
                datatableRef.current?.fetchData();
            }
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/products/${deleteTarget.id}/delete`, {
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

    const openEditModal = async (product: Product) => {
        const associatedBusinessIds = product.businesses ? product.businesses.map(b => b.id) : [];
        const ownerId = product.businesses && product.businesses.length > 0
            ? String(product.businesses[0].user_id || '')
            : '';
        setSelectedProduct(product);
        setEditData({
            name: product.name,
            business_ids: associatedBusinessIds
        });
        setSelectedOwnerId(ownerId);

        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(`/products/owner-businesses?user_id=${ownerId}`);
                if (response.ok) {
                    const data = await response.json();
                    setFetchedBusinesses(data);
                } else {
                    setFetchedBusinesses([]);
                }
            } catch (error) {
                console.error('Error fetching businesses:', error);
                setFetchedBusinesses([]);
            } finally {
                setIsFetchingBusinesses(false);
            }
        } else {
            setFetchedBusinesses([]);
        }
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (product: Product) => {
        setDeleteTarget(product);
    };

    const handleOwnerChange = async (ownerId: string, setFormData: (key: string, value: any) => void) => {
        setSelectedOwnerId(ownerId);
        setFormData('business_ids', []);
        
        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(`/products/owner-businesses?user_id=${ownerId}`);
                if (response.ok) {
                    const data = await response.json();
                    setFetchedBusinesses(data);
                } else {
                    setFetchedBusinesses([]);
                }
            } catch (error) {
                console.error('Error fetching businesses:', error);
                setFetchedBusinesses([]);
            } finally {
                setIsFetchingBusinesses(false);
            }
        } else {
            setFetchedBusinesses([]);
        }
    };

    const renderFormFields = (
        formData: any,
        setFormData: (key: string, value: any) => void,
        formErrors: any,
        isEdit: boolean = false
    ) => {
        const showOwnerSelector = hasCreateAnyProduct;
        const showBusinessSelector = hasCreateAnyProduct 
            ? (selectedOwnerId !== '')
            : (isEdit ? false : (hasCreateAssociatedProduct && businesses.length > 1));

        const displayBusinesses = hasCreateAnyProduct ? fetchedBusinesses : businesses;

        const handleCheckboxChange = (businessId: number, checked: boolean) => {
            const currentIds = formData.business_ids || [];
            if (checked) {
                setFormData('business_ids', [...currentIds, businessId]);
            } else {
                setFormData('business_ids', currentIds.filter((id: number) => id !== businessId));
            }
        };

        return (
            <div className="space-y-4 pt-2">
                <FormInput
                    name="name"
                    label="Nama Produk"
                    value={formData.name}
                    onChange={(e) => setFormData('name', e.target.value)}
                    error={formErrors.name}
                />

                {showOwnerSelector && (
                    <FormSelect
                        name="owner_id"
                        label="Pilih Owner Bisnis"
                        value={selectedOwnerId}
                        onChange={(e) => handleOwnerChange(e.target.value, setFormData)}
                    >
                        <option value="">Pilih Owner</option>
                        {users.map((owner) => (
                            <option key={owner.id} value={owner.id}>
                                {owner.name}
                            </option>
                        ))}
                    </FormSelect>
                )}

                {isFetchingBusinesses && (
                    <div className="text-xs font-medium text-slate-500 animate-pulse py-2">
                        Memuat data bisnis...
                    </div>
                )}

                {!isFetchingBusinesses && showBusinessSelector && (
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                            Pilih Bisnis
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                            {displayBusinesses.length === 0 ? (
                                <div className="col-span-full py-4 text-center text-xs text-slate-400">
                                    Owner ini belum memiliki bisnis
                                </div>
                            ) : (
                                displayBusinesses.map((b) => {
                                    const isChecked = (formData.business_ids || []).includes(b.id);
                                    return (
                                        <label
                                            key={b.id}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer select-none transition-all ${
                                                isChecked
                                                    ? 'border-sky-500 bg-sky-500/5 text-sky-900 dark:text-sky-300 dark:border-sky-500/50'
                                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => handleCheckboxChange(b.id, e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                                            />
                                            <span className="text-sm font-medium">{b.name}</span>
                                        </label>
                                    );
                                })
                            )}
                        </div>
                        {formErrors.business_ids && (
                            <p className="mt-1.5 text-xs text-rose-500 font-medium">{formErrors.business_ids}</p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const columns: ColumnDefinition<Product>[] = [
        {
            key: 'name',
            label: 'Nama Produk',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nama produk...',
            className: 'font-semibold text-slate-800 dark:text-slate-100',
            render: (p) => p.name
        },
        {
            key: 'business',
            label: 'Bisnis Terkait',
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            className: 'text-slate-500 dark:text-slate-400',
            render: (p) => p.businesses && p.businesses.length > 0
                ? p.businesses.map(b => b.name).join(', ')
                : '—'
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (p) => <RowActions product={p} onEdit={openEditModal} onDelete={openDeleteModal} />
        }
    ];

    return (
        <DashboardLayout title="Produk Induk">
            <Head title="Produk Induk" />

            <div className="mx-auto max-w-7xl px-0 pt-2 pb-6 md:py-6 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="hidden md:flex mb-6 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="hidden md:block">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                                <ShoppingBag className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Produk Induk</h1>
                        </div>
                        <p className="ml-12 text-sm text-slate-500 dark:text-slate-400">
                            Kelola template data produk induk penjualan sesuai hak akses Anda.
                        </p>
                    </div>

                    <div className="hidden md:flex flex-wrap items-center gap-2">
                        <a
                            href="/products/print/excel"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                            Excel
                        </a>
                        <a
                            href="/products/print/pdf"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5 text-rose-500" />
                            PDF
                        </a>

                        <CheckPermission permissions={[UserPermission.CREATE_ANY_PRODUCT, UserPermission.CREATE_ASSOCIATED_PRODUCT, UserPermission.CREATE_OWN_PRODUCT]}>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-sky-500 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah
                            </button>
                        </CheckPermission>
                    </div>
                </div>

                <Datatable
                    ref={datatableRef}
                    apiUrl="/products/datatable"
                    columns={columns}
                    searchPlaceholder="Cari data produk..."
                    emptyMessage="Belum ada data produk"
                    emptySubMessage="Mulai dengan menambahkan produk baru."
                    printPdfUrl="/products/print/pdf"
                    printExcelUrl="/products/print/excel"
                    renderMobileCard={(product: Product) => {
                        const user = props.auth?.user as any;
                        const canEdit = userPermissions.includes(UserPermission.EDIT_ANY_PRODUCT) || 
                                        (userPermissions.includes(UserPermission.EDIT_ASSOCIATED_PRODUCT) && businesses.some(b => product.businesses?.some(pb => pb.id === b.id))) ||
                                        (userPermissions.includes(UserPermission.EDIT_OWN_PRODUCT) && product.businesses?.some(pb => pb.user_id === user?.id));
                        const canDelete = userPermissions.includes(UserPermission.DELETE_ANY_PRODUCT) || 
                                          (userPermissions.includes(UserPermission.DELETE_ASSOCIATED_PRODUCT) && businesses.some(b => product.businesses?.some(pb => pb.id === b.id))) ||
                                          (userPermissions.includes(UserPermission.DELETE_OWN_PRODUCT) && product.businesses?.some(pb => pb.user_id === user?.id));

                        return (
                            <div key={product.id} className="p-4 space-y-3">
                                {/* Header: Product Name and Icon */}
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

                                {/* Body Info: Associated Businesses */}
                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-slate-400">Bisnis Terkait</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium">
                                        {product.businesses && product.businesses.length > 0
                                            ? product.businesses.map(b => b.name).join(', ')
                                            : '—'}
                                    </div>
                                </div>

                                {/* Bottom Line: Actions */}
                                {(canEdit || canDelete) && (
                                    <div className="flex gap-3 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => openDeleteModal(product)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
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

            {/* ─── Create Modal ─── */}
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); setFetchedBusinesses([]); clearCreateErrors(); }} title="Tambah Produk Baru">
                <form onSubmit={handleCreateSubmit}>
                    {renderFormFields(createData, setCreateData, createErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); setFetchedBusinesses([]); clearCreateErrors(); }}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createProcessing}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                            {createProcessing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── Edit Modal ─── */}
            <Modal
                open={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedProduct(null); setSelectedOwnerId(''); setFetchedBusinesses([]); clearEditErrors(); }}
                title="Edit Produk"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors, true)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedProduct(null); setSelectedOwnerId(''); setFetchedBusinesses([]); clearEditErrors(); }}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-850 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={editProcessing}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                            {editProcessing ? 'Menyimpan...' : 'Perbarui'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── Delete Confirmation ─── */}
            <DeleteConfirmModal
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                productName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_ANY_PRODUCT, UserPermission.CREATE_ASSOCIATED_PRODUCT, UserPermission.CREATE_OWN_PRODUCT]}>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="md:hidden fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/35 hover:bg-sky-600 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </CheckPermission>
        </DashboardLayout>
    );
}
