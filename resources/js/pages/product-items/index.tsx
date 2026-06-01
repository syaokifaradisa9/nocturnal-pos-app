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

interface ProductItem {
    id?: number;
    product_id?: number;
    measurement_unit_id: number | string;
    is_base_unit: boolean;
    conversion_rate: string | number;
    is_active?: boolean;
    measurement_unit?: {
        id: number;
        name: string;
        short_name: string;
    };
}

interface Product {
    id: number;
    name: string;
    businesses?: Business[];
    items?: ProductItem[];
    created_at: string;
}

interface ProductUnit {
    id: number;
    name: string;
    short_name: string;
    business_id: number;
}

interface IndexProps {
    businesses?: Business[];
    users?: User[];
    product_units?: ProductUnit[];
    products?: { id: number; name: string }[];
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

/* ──────────────────────── Row Action Menu ──────────────────────── */
function RowActions({ product, onEdit, onDelete }: {
    product: Product;
    onEdit: (p: Product) => void;
    onDelete: (p: Product) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_ANY_PRODUCT_ITEM, UserPermission.EDIT_ASSOCIATED_PRODUCT_ITEM, UserPermission.EDIT_OWN_PRODUCT_ITEM]}>
                <div className="relative group/edit">
                    <button
                        onClick={() => onEdit(product)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/edit:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Edit Item Produk
                        <div className="absolute top-full right-3.5 h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 dark:bg-slate-800" />
                    </div>
                </div>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ANY_PRODUCT_ITEM, UserPermission.DELETE_ASSOCIATED_PRODUCT_ITEM, UserPermission.DELETE_OWN_PRODUCT_ITEM]}>
                <div className="relative group/delete">
                    <button
                        onClick={() => onDelete(product)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/delete:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Hapus Item Produk
                        <div className="absolute top-full right-3.5 h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 dark:bg-slate-800" />
                    </div>
                </div>
            </CheckPermission>
        </div>
    );
}

/* ──────────────────────── Main Page ──────────────────────── */
export default function Index({ businesses = [], users = [], product_units = [], products = [] }: IndexProps) {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];

    // Determines create forms permissions:
    const hasCreateAnyProductItem = userPermissions.includes(UserPermission.CREATE_ANY_PRODUCT_ITEM);
    const hasCreateAssociatedProductItem = userPermissions.includes(UserPermission.CREATE_ASSOCIATED_PRODUCT_ITEM);

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Selected owner state for dynamic filtering in CREATE_ANY_PRODUCT_ITEM
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
    const [fetchedBusinesses, setFetchedBusinesses] = useState<Business[]>([]);
    const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(false);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
    const [fetchedProducts, setFetchedProducts] = useState<{ id: number; name: string }[]>([]);
    const [isFetchingProducts, setIsFetchingProducts] = useState(false);

    /* Create Form */
    const { data: createData, setData: setCreateData, post: postCreate, reset: resetCreate, errors: createErrors, processing: createProcessing, clearErrors: clearCreateErrors } = useForm({
        product_id: '',
        items: [
            { measurement_unit_id: '', is_base_unit: true, conversion_rate: '1', is_active: true }
        ] as any[]
    });

    /* Edit Form */
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, errors: editErrors, processing: editProcessing, clearErrors: clearEditErrors } = useForm({
        product_id: '',
        items: [] as any[]
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/product-items/store', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                setSelectedOwnerId('');
                setFetchedBusinesses([]);
                setSelectedBusinessId('');
                setFetchedProducts([]);
                datatableRef.current?.fetchData();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        putEdit(`/product-items/${selectedProduct.id}/update`, {
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

    const openEditModal = async (product: Product) => {
        const mappedItems = product.items ? product.items.map((item: any) => ({
            measurement_unit_id: item.measurement_unit_id,
            is_base_unit: !!item.is_base_unit,
            conversion_rate: String(item.conversion_rate),
            is_active: !!item.is_active
        })) : [];

        setSelectedProduct(product);
        setEditData({
            product_id: String(product.id),
            items: mappedItems.length > 0 ? mappedItems : [
                { measurement_unit_id: '', is_base_unit: true, conversion_rate: '1', is_active: true }
            ]
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (product: Product) => {
        setDeleteTarget(product);
    };

    const handleOwnerChange = async (ownerId: string, setFormData: (key: string, value: any) => void) => {
        setSelectedOwnerId(ownerId);
        setSelectedBusinessId('');
        setFormData('product_id', '');
        setFetchedProducts([]);
        
        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(`/product-items/owner-businesses?user_id=${ownerId}`);
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

    const handleBusinessChange = async (businessId: string, setFormData: (key: string, value: any) => void) => {
        setSelectedBusinessId(businessId);
        setFormData('product_id', '');

        if (businessId) {
            setIsFetchingProducts(true);
            try {
                const response = await fetch(`/product-items/owner-products?business_id=${businessId}`);
                if (response.ok) {
                    const data = await response.json();
                    setFetchedProducts(data);
                } else {
                    setFetchedProducts([]);
                }
            } catch (error) {
                console.error('Error fetching products:', error);
                setFetchedProducts([]);
            } finally {
                setIsFetchingProducts(false);
            }
        } else {
            setFetchedProducts([]);
        }
    };

    const renderFormFields = (
        formData: any,
        setFormData: (key: string, value: any) => void,
        formErrors: any,
        isEdit: boolean = false
    ) => {
        const showOwnerSelector = !isEdit && hasCreateAnyProductItem;
        const displayProducts = hasCreateAnyProductItem ? fetchedProducts : (products || []);

        const addUnitItem = () => {
            const currentItems = formData.items || [];
            setFormData('items', [...currentItems, { measurement_unit_id: '', is_base_unit: false, conversion_rate: '1', is_active: true }]);
        };

        const removeUnitItem = (index: number) => {
            const currentItems = formData.items || [];
            if (currentItems.length <= 1) return;
            setFormData('items', currentItems.filter((_: any, i: number) => i !== index));
        };

        const updateUnitItem = (index: number, key: string, value: any) => {
            const currentItems = [...(formData.items || [])];
            if (key === 'is_base_unit' && value === true) {
                currentItems.forEach((item, i) => {
                    item.is_base_unit = i === index;
                    if (i === index) {
                        item.conversion_rate = '1';
                    }
                });
            } else {
                currentItems[index][key] = value;
            }
            setFormData('items', currentItems);
        };

        return (
            <div className="space-y-4 pt-2">
                {/* Step 1: Owner selector (admin only, create mode) */}
                {showOwnerSelector && (
                    <FormSelect
                        name="owner_id"
                        label="Pilih Owner"
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

                {/* Step 2: Business selector (admin only, after owner selected) */}
                {showOwnerSelector && isFetchingBusinesses && (
                    <div className="text-xs font-medium text-slate-500 animate-pulse py-2">
                        Memuat data bisnis...
                    </div>
                )}

                {showOwnerSelector && !isFetchingBusinesses && selectedOwnerId && (
                    <FormSelect
                        name="business_id"
                        label="Pilih Bisnis"
                        value={selectedBusinessId}
                        onChange={(e) => handleBusinessChange(e.target.value, setFormData)}
                    >
                        <option value="">Pilih Bisnis</option>
                        {fetchedBusinesses.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </FormSelect>
                )}

                {/* Step 3: Product selector */}
                {isFetchingProducts && (
                    <div className="text-xs font-medium text-slate-500 animate-pulse py-2">
                        Memuat data produk...
                    </div>
                )}

                {isEdit ? (
                    <FormInput
                        name="name"
                        label="Produk"
                        value={selectedProduct?.name || ''}
                        disabled
                        onChange={() => {}}
                    />
                ) : (
                    (!showOwnerSelector || (showOwnerSelector && selectedBusinessId && !isFetchingProducts)) && (
                        <FormSelect
                            name="product_id"
                            label="Pilih Produk"
                            value={formData.product_id}
                            onChange={(e) => setFormData('product_id', e.target.value)}
                            error={formErrors.product_id}
                        >
                            <option value="">Pilih Produk</option>
                            {displayProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </FormSelect>
                    )
                )}

                {/* Step 3: Unit & Conversion items */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Satuan & Konversi Kemasan</span>
                        <button
                            type="button"
                            onClick={addUnitItem}
                            className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                        >
                            <Plus className="h-3 w-3" /> Tambah Satuan
                        </button>
                    </div>

                    <div className="space-y-3">
                        {(formData.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                    <div className="sm:col-span-5">
                                        <FormSelect
                                            name={`items.${idx}.measurement_unit_id`}
                                            label="Satuan Unit"
                                            value={item.measurement_unit_id}
                                            onChange={(e) => updateUnitItem(idx, 'measurement_unit_id', e.target.value)}
                                            error={formErrors[`items.${idx}.measurement_unit_id`]}
                                        >
                                            <option value="">Pilih Satuan</option>
                                            {(product_units || []).map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.short_name})
                                                </option>
                                            ))}
                                        </FormSelect>
                                    </div>
                                    <div className="sm:col-span-4">
                                        <FormInput
                                            name={`items.${idx}.conversion_rate`}
                                            label="Faktor Konversi ke Base"
                                            type="number"
                                            step="0.0001"
                                            disabled={item.is_base_unit}
                                            value={item.conversion_rate}
                                            onChange={(e) => updateUnitItem(idx, 'conversion_rate', e.target.value)}
                                            error={formErrors[`items.${idx}.conversion_rate`]}
                                        />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center justify-center pb-2.5">
                                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-700 dark:text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={item.is_base_unit}
                                                onChange={(e) => updateUnitItem(idx, 'is_base_unit', e.target.checked)}
                                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                                            />
                                            <span>Base Unit</span>
                                        </label>
                                    </div>
                                    <div className="sm:col-span-1 flex justify-end pb-1.5">
                                        <button
                                            type="button"
                                            onClick={() => removeUnitItem(idx)}
                                            disabled={(formData.items || []).length <= 1}
                                            className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 disabled:opacity-30 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
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
            key: 'items',
            label: 'Daftar Unit Kemasan',
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
                                {item.measurement_unit?.short_name || 'Unit'}: {parseFloat(item.conversion_rate)}
                                {item.is_base_unit && ' (Base)'}
                            </span>
                        ))}
                    </div>
                );
            }
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
        <DashboardLayout title="Item & Kemasan Produk">
            <Head title="Item & Kemasan Produk" />

            <div className="mx-auto max-w-7xl px-0 pt-2 pb-6 md:py-6 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="hidden md:flex mb-6 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="hidden md:block">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                                <ShoppingBag className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Item & Kemasan Produk</h1>
                        </div>
                        <p className="ml-12 text-sm text-slate-500 dark:text-slate-400">
                            Kelola packaging/kemasan item produk dan faktor konversinya ke base unit.
                        </p>
                    </div>

                    <div className="hidden md:flex flex-wrap items-center gap-2">
                        <a
                            href="/product-items/print/excel"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                            Excel
                        </a>
                        <a
                            href="/product-items/print/pdf"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5 text-rose-500" />
                            PDF
                        </a>

                        <CheckPermission permissions={[UserPermission.CREATE_ANY_PRODUCT_ITEM, UserPermission.CREATE_ASSOCIATED_PRODUCT_ITEM, UserPermission.CREATE_OWN_PRODUCT_ITEM]}>
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
                    apiUrl="/product-items/datatable"
                    columns={columns}
                    searchPlaceholder="Cari item produk..."
                    emptyMessage="Belum ada data item produk"
                    emptySubMessage="Mulai dengan menambahkan item produk baru."
                    printPdfUrl="/product-items/print/pdf"
                    printExcelUrl="/product-items/print/excel"
                    renderMobileCard={(product: Product) => {
                        const user = props.auth?.user as any;
                        const canEdit = userPermissions.includes(UserPermission.EDIT_ANY_PRODUCT_ITEM) || 
                                        (userPermissions.includes(UserPermission.EDIT_ASSOCIATED_PRODUCT_ITEM) && businesses.some(b => product.businesses?.some(pb => pb.id === b.id))) ||
                                        (userPermissions.includes(UserPermission.EDIT_OWN_PRODUCT_ITEM) && product.businesses?.some(pb => pb.user_id === user?.id));
                        const canDelete = userPermissions.includes(UserPermission.DELETE_ANY_PRODUCT_ITEM) || 
                                          (userPermissions.includes(UserPermission.DELETE_ASSOCIATED_PRODUCT_ITEM) && businesses.some(b => product.businesses?.some(pb => pb.id === b.id))) ||
                                          (userPermissions.includes(UserPermission.DELETE_OWN_PRODUCT_ITEM) && product.businesses?.some(pb => pb.user_id === user?.id));

                        return (
                            <div key={product.id} className="p-4 space-y-3">
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
                                                    {item.measurement_unit?.short_name || 'Unit'}: {parseFloat(item.conversion_rate)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

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
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); setFetchedBusinesses([]); setSelectedBusinessId(''); setFetchedProducts([]); clearCreateErrors(); }} title="Tambah Item Produk Baru">
                <form onSubmit={handleCreateSubmit}>
                    {renderFormFields(createData, setCreateData, createErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); setFetchedBusinesses([]); setSelectedBusinessId(''); setFetchedProducts([]); clearCreateErrors(); }}
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
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedProduct(null); setSelectedOwnerId(''); setFetchedBusinesses([]); setSelectedBusinessId(''); setFetchedProducts([]); clearEditErrors(); }}
                title="Edit Item Produk"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors, true)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedProduct(null); setSelectedOwnerId(''); setFetchedBusinesses([]); setSelectedBusinessId(''); setFetchedProducts([]); clearEditErrors(); }}
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
            <CheckPermission permissions={[UserPermission.CREATE_ANY_PRODUCT_ITEM, UserPermission.CREATE_ASSOCIATED_PRODUCT_ITEM, UserPermission.CREATE_OWN_PRODUCT_ITEM]}>
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
