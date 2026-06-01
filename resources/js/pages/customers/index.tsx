import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, FileSpreadsheet, FileText, Users } from 'lucide-react';
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

interface Customer {
    id: number;
    name: string;
    phone: string | null;
    current_point: number;
    business_id: number;
    business?: Business | null;
    created_at: string;
}

interface IndexProps {
    businesses?: Business[];
    users?: User[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({ open, onClose, onConfirm, customerName, isProcessing }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    customerName: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Customer">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus customer <strong className="text-slate-900 dark:text-white">{customerName}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                    Batal
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                >
                    {isProcessing ? 'Menghapus...' : 'Hapus'}
                </button>
            </div>
        </Modal>
    );
}

/* ──────────────────────── Row Action Menu ──────────────────────── */
function RowActions({ customer, onEdit, onDelete }: {
    customer: Customer;
    onEdit: (c: Customer) => void;
    onDelete: (c: Customer) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_ANY_CUSTOMER, UserPermission.EDIT_ASSOCIATED_CUSTOMER, UserPermission.EDIT_OWN_CUSTOMER]}>
                <div className="relative group/edit">
                    <button
                        onClick={() => onEdit(customer)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/edit:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Edit Customer
                        <div className="absolute top-full right-3.5 h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 dark:bg-slate-800" />
                    </div>
                </div>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ANY_CUSTOMER, UserPermission.DELETE_ASSOCIATED_CUSTOMER, UserPermission.DELETE_OWN_CUSTOMER]}>
                <div className="relative group/delete">
                    <button
                        onClick={() => onDelete(customer)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/delete:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Hapus Customer
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

    const hasCreateAnyCustomer = userPermissions.includes(UserPermission.CREATE_ANY_CUSTOMER);
    const hasCreateAssociatedCustomer = userPermissions.includes(UserPermission.CREATE_ASSOCIATED_CUSTOMER);
    const hasCreateOwnCustomer = userPermissions.includes(UserPermission.CREATE_OWN_CUSTOMER);

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
    const [fetchedBusinesses, setFetchedBusinesses] = useState<Business[]>([]);
    const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(false);

    /* Create Form */
    const { 
        data: createData, 
        setData: setCreateData, 
        post: postCreate, 
        reset: resetCreate, 
        errors: createErrors, 
        processing: createProcessing, 
        clearErrors: clearCreateErrors 
    } = useForm({
        name: '',
        phone: '',
        current_point: 0,
        business_id: ''
    });

    /* Edit Form */
    const { 
        data: editData, 
        setData: setEditData, 
        put: putEdit, 
        reset: resetEdit, 
        errors: editErrors, 
        processing: editProcessing, 
        clearErrors: clearEditErrors 
    } = useForm({
        name: '',
        phone: '',
        current_point: 0,
        business_id: ''
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/customers/store', {
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
        if (!selectedCustomer) return;
        putEdit(`/customers/${selectedCustomer.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedCustomer(null);
                setSelectedOwnerId('');
                setFetchedBusinesses([]);
                datatableRef.current?.fetchData();
            }
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/customers/${deleteTarget.id}/delete`, {
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

    const openDeleteModal = (customer: Customer) => {
        setDeleteTarget(customer);
    };

    const openEditModal = async (customer: Customer) => {
        const ownerId = customer.business?.user_id ? String(customer.business.user_id) : '';
        setSelectedCustomer(customer);
        setEditData({
            name: customer.name,
            phone: customer.phone || '',
            current_point: customer.current_point,
            business_id: String(customer.business_id)
        });
        setSelectedOwnerId(ownerId);

        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(`/customers/owner-businesses?user_id=${ownerId}`);
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

    const handleOwnerChange = async (ownerId: string, setFormData: (key: string, value: any) => void) => {
        setSelectedOwnerId(ownerId);
        setFormData('business_id', '');
        
        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(`/customers/owner-businesses?user_id=${ownerId}`);
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
        formErrors: any
    ) => {
        const showOwnerSelector = hasCreateAnyCustomer;
        const showBusinessSelector = hasCreateAnyCustomer 
            ? (selectedOwnerId !== '')
            : (hasCreateAssociatedCustomer ? (businesses.length > 1) : hasCreateOwnCustomer ? (businesses.length > 1) : false);

        const displayBusinesses = hasCreateAnyCustomer ? fetchedBusinesses : businesses;

        return (
            <div className="space-y-4 pt-2">
                <FormInput
                    name="name"
                    label="Nama Customer"
                    value={formData.name}
                    onChange={(e) => setFormData('name', e.target.value)}
                    error={formErrors.name}
                />

                <FormInput
                    name="phone"
                    label="Telepon Customer"
                    value={formData.phone}
                    onChange={(e) => setFormData('phone', e.target.value)}
                    error={formErrors.phone}
                />

                <FormInput
                    name="current_point"
                    label="Poin"
                    type="number"
                    value={formData.current_point}
                    onChange={(e) => setFormData('current_point', e.target.value)}
                    error={formErrors.current_point}
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

                {!isFetchingBusinesses && (showBusinessSelector || !showOwnerSelector) && displayBusinesses.length > 0 && (
                    <FormSelect
                        name="business_id"
                        label="Pilih Bisnis"
                        value={formData.business_id}
                        onChange={(e) => setFormData('business_id', e.target.value)}
                        error={formErrors.business_id}
                    >
                        <option value="">Pilih Bisnis</option>
                        {displayBusinesses.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </FormSelect>
                )}
            </div>
        );
    };

    const columns: ColumnDefinition<Customer>[] = [
        {
            key: 'name',
            label: 'Nama Customer',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nama customer...',
            className: 'font-semibold text-slate-800 dark:text-slate-100',
            render: (c) => c.name
        },
        {
            key: 'phone',
            label: 'Telepon',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nomor telepon...',
            className: 'text-slate-600 dark:text-slate-300',
            render: (c) => c.phone || '—'
        },
        {
            key: 'current_point',
            label: 'Poin Saat Ini',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari poin...',
            className: 'text-slate-600 dark:text-slate-300',
            render: (c) => (
                <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    {c.current_point} Poin
                </span>
            )
        },
        {
            key: 'business',
            label: 'Bisnis Terkait',
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            className: 'text-slate-500 dark:text-slate-400',
            render: (c) => c.business ? c.business.name : '—'
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (c) => <RowActions customer={c} onEdit={openEditModal} onDelete={openDeleteModal} />
        }
    ];

    return (
        <DashboardLayout title="Data Customer">
            <Head title="Data Customer" />

            <div className="mx-auto max-w-7xl px-0 pt-2 pb-6 md:py-6 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="hidden md:flex mb-6 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="hidden md:block">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                                <Users className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Data Customer</h1>
                        </div>
                        <p className="ml-12 text-sm text-slate-500 dark:text-slate-400">
                            Kelola data customer dan loyalitas poin sesuai hak akses Anda.
                        </p>
                    </div>

                    <div className="hidden md:flex flex-wrap items-center gap-2">
                        <a
                            href="/customers/print/excel"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                            Excel
                        </a>
                        <a
                            href="/customers/print/pdf"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5 text-rose-500" />
                            PDF
                        </a>

                        <CheckPermission permissions={[UserPermission.CREATE_ANY_CUSTOMER, UserPermission.CREATE_ASSOCIATED_CUSTOMER, UserPermission.CREATE_OWN_CUSTOMER]}>
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
                    apiUrl="/customers/datatable"
                    columns={columns}
                    searchPlaceholder="Cari data customer..."
                    emptyMessage="Belum ada data customer"
                    emptySubMessage="Mulai dengan menambahkan customer baru."
                    printPdfUrl="/customers/print/pdf"
                    printExcelUrl="/customers/print/excel"
                    renderMobileCard={(customer: Customer) => {
                        const user = props.auth?.user as any;
                        const canEdit = userPermissions.includes(UserPermission.EDIT_ANY_CUSTOMER) || 
                                        (userPermissions.includes(UserPermission.EDIT_ASSOCIATED_CUSTOMER) && businesses.some(b => customer.business_id === b.id)) ||
                                        (userPermissions.includes(UserPermission.EDIT_OWN_CUSTOMER) && customer.business?.user_id === user?.id);
                        const canDelete = userPermissions.includes(UserPermission.DELETE_ANY_CUSTOMER) || 
                                          (userPermissions.includes(UserPermission.DELETE_ASSOCIATED_CUSTOMER) && businesses.some(b => customer.business_id === b.id)) ||
                                          (userPermissions.includes(UserPermission.DELETE_OWN_CUSTOMER) && customer.business?.user_id === user?.id);

                        return (
                            <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3.5">
                                {/* Top Line */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/20 shrink-0">
                                            <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                                            {customer.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-slate-400">Telepon</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">{customer.phone || '—'}</div>

                                    <div className="text-slate-400">Poin Saat Ini</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">{customer.current_point} Poin</div>

                                    <div className="text-slate-400">Bisnis Terkait</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">
                                        {customer.business ? customer.business.name : '—'}
                                    </div>
                                </div>

                                {/* Actions */}
                                {(canEdit || canDelete) && (
                                    <div className="flex gap-3 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEditModal(customer)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => setDeleteTarget(customer)}
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
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); setFetchedBusinesses([]); clearCreateErrors(); }} title="Tambah Customer Baru">
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
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedCustomer(null); setSelectedOwnerId(''); setFetchedBusinesses([]); clearEditErrors(); }}
                title="Edit Customer"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedCustomer(null); setSelectedOwnerId(''); setFetchedBusinesses([]); clearEditErrors(); }}
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
                customerName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_ANY_CUSTOMER, UserPermission.CREATE_ASSOCIATED_CUSTOMER, UserPermission.CREATE_OWN_CUSTOMER]}>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="md:hidden fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-white shadow-lg shadow-sky-500/35 hover:bg-sky-600 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </CheckPermission>
        </DashboardLayout>
    );
}
