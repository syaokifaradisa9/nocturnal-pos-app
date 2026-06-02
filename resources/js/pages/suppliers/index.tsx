import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import Tooltip from '../../components/commons/Tooltip';
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

interface Supplier {
    id: number;
    name: string;
    contact_name: string | null;
    contact_phone: string | null;
    address: string | null;
    description: string | null;
    businesses?: Business[];
    created_at: string;
}

interface IndexProps {
    businesses?: Business[];
    users?: User[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({ open, onClose, onConfirm, supplierName, isProcessing }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    supplierName: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Supplier">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus supplier <strong className="text-slate-900 dark:text-white">{supplierName}</strong>? Tindakan ini tidak dapat dibatalkan.
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
function RowActions({ supplier, onEdit, onDelete }: {
    supplier: Supplier;
    onEdit: (s: Supplier) => void;
    onDelete: (s: Supplier) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_ANY_SUPPLIER, UserPermission.EDIT_ASSOCIATED_SUPPLIER, UserPermission.EDIT_OWN_SUPPLIER]}>
                <Tooltip content="Edit Supplier">
                    <button
                        onClick={() => onEdit(supplier)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </Tooltip>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ANY_SUPPLIER, UserPermission.DELETE_ASSOCIATED_SUPPLIER, UserPermission.DELETE_OWN_SUPPLIER]}>
                <Tooltip content="Hapus Supplier">
                    <button
                        onClick={() => onDelete(supplier)}
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
export default function Index({ businesses = [], users = [] }: IndexProps) {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];

    const hasCreateAnySupplier = userPermissions.includes(UserPermission.CREATE_ANY_SUPPLIER);
    const hasCreateAssociatedSupplier = userPermissions.includes(UserPermission.CREATE_ASSOCIATED_SUPPLIER);

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
    const [fetchedBusinesses, setFetchedBusinesses] = useState<Business[]>([]);
    const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(false);

    /* Create Form */
    const { data: createData, setData: setCreateData, post: postCreate, reset: resetCreate, errors: createErrors, processing: createProcessing, clearErrors: clearCreateErrors } = useForm({
        name: '', contact_name: '', contact_phone: '', address: '', description: '', business_ids: [] as number[]
    });

    /* Edit Form */
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, errors: editErrors, processing: editProcessing, clearErrors: clearEditErrors } = useForm({
        name: '', contact_name: '', contact_phone: '', address: '', description: '', business_ids: [] as number[]
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/suppliers/store', {
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
        if (!selectedSupplier) return;
        putEdit(`/suppliers/${selectedSupplier.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedSupplier(null);
                setSelectedOwnerId('');
                setFetchedBusinesses([]);
                datatableRef.current?.fetchData();
            }
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/suppliers/${deleteTarget.id}/delete`, {
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

    const openEditModal = async (supplier: Supplier) => {
        const associatedBusinessIds = supplier.businesses ? supplier.businesses.map(b => b.id) : [];
        const ownerId = supplier.businesses && supplier.businesses.length > 0
            ? String(supplier.businesses[0].user_id || '')
            : '';
        setSelectedSupplier(supplier);
        setEditData({
            name: supplier.name,
            contact_name: supplier.contact_name || '',
            contact_phone: supplier.contact_phone || '',
            address: supplier.address || '',
            description: supplier.description || '',
            business_ids: associatedBusinessIds
        });
        setSelectedOwnerId(ownerId);

        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(`/suppliers/owner-businesses?user_id=${ownerId}`);
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

    const openDeleteModal = (supplier: Supplier) => {
        setDeleteTarget(supplier);
    };

    const handleOwnerChange = async (ownerId: string, setFormData: (key: string, value: any) => void) => {
        setSelectedOwnerId(ownerId);
        setFormData('business_ids', []);
        
        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(`/suppliers/owner-businesses?user_id=${ownerId}`);
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
        const showOwnerSelector = hasCreateAnySupplier;
        const showBusinessSelector = hasCreateAnySupplier 
            ? (selectedOwnerId !== '')
            : (isEdit ? false : (hasCreateAssociatedSupplier && businesses.length > 1));

        const displayBusinesses = hasCreateAnySupplier ? fetchedBusinesses : businesses;

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

                <FormInput
                    name="name"
                    label="Nama Supplier"
                    value={formData.name}
                    onChange={(e) => setFormData('name', e.target.value)}
                    placeholder="Masukkan nama supplier..."
                    error={formErrors.name}
                />

                <FormInput
                    name="contact_name"
                    label="Nama Kontak"
                    value={formData.contact_name}
                    onChange={(e) => setFormData('contact_name', e.target.value)}
                    placeholder="Masukkan nama kontak..."
                    error={formErrors.contact_name}
                />

                <FormInput
                    name="contact_phone"
                    label="Telepon Kontak"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData('contact_phone', e.target.value)}
                    placeholder="Masukkan nomor telepon kontak..."
                    error={formErrors.contact_phone}
                />

                <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Alamat
                    </label>
                    <textarea
                        name="address"
                        value={formData.address}
                        onChange={(e) => setFormData('address', e.target.value)}
                        placeholder="Masukkan alamat lengkap supplier..."
                        className="w-full min-h-[80px] rounded-xl border border-slate-200 p-3 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    {formErrors.address && (
                        <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.address}</p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Deskripsi
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => setFormData('description', e.target.value)}
                        placeholder="Masukkan deskripsi singkat tentang supplier..."
                        className="w-full min-h-[80px] rounded-xl border border-slate-200 p-3 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    {formErrors.description && (
                        <p className="mt-1 text-xs text-rose-500 font-medium">{formErrors.description}</p>
                    )}
                </div>
            </div>
        );
    };

    const columns: ColumnDefinition<Supplier>[] = [
        {
            key: 'name',
            label: 'Nama Supplier',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nama supplier...',
            className: 'font-semibold text-slate-800 dark:text-slate-100',
            render: (s) => s.name
        },
        {
            key: 'contact_name',
            label: 'Nama Kontak',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nama kontak...',
            className: 'text-slate-600 dark:text-slate-300',
            render: (s) => s.contact_name || '—'
        },
        {
            key: 'contact_phone',
            label: 'Telepon',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nomor telepon...',
            className: 'text-slate-600 dark:text-slate-300',
            render: (s) => s.contact_phone || '—'
        },
        {
            key: 'business',
            label: 'Bisnis Terkait',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            className: 'text-slate-500 dark:text-slate-400',
            render: (s) => s.businesses && s.businesses.length > 0
                ? s.businesses.map(b => b.name).join(', ')
                : '—'
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (s) => <RowActions supplier={s} onEdit={openEditModal} onDelete={openDeleteModal} />
        }
    ];

    return (
        <DashboardLayout title="Data Supplier">
            <Head title="Data Supplier" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 md:pt-6 md:pb-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Data Supplier"
                    icon={Truck}
                    badge="Master"
                    description="Kelola data supplier penjualan sesuai hak akses Anda."
                    excelUrl="/suppliers/print/excel"
                    pdfUrl="/suppliers/print/pdf"
                    actions={
                        <CheckPermission permissions={[UserPermission.CREATE_ANY_SUPPLIER, UserPermission.CREATE_ASSOCIATED_SUPPLIER, UserPermission.CREATE_OWN_SUPPLIER]}>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors focus:outline-none"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah Supplier
                            </button>
                        </CheckPermission>
                    }
                />

                <Datatable
                    ref={datatableRef}
                    apiUrl="/suppliers/datatable"
                    columns={columns}
                    searchPlaceholder="Cari data supplier..."
                    emptyMessage="Belum ada data supplier"
                    emptySubMessage="Mulai dengan menambahkan supplier baru."
                    printPdfUrl="/suppliers/print/pdf"
                    printExcelUrl="/suppliers/print/excel"
                    renderMobileCard={(supplier: Supplier) => {
                        const user = props.auth?.user as any;
                        const canEdit = userPermissions.includes(UserPermission.EDIT_ANY_SUPPLIER) || 
                                        (userPermissions.includes(UserPermission.EDIT_ASSOCIATED_SUPPLIER) && businesses.some(b => supplier.businesses?.some(pb => pb.id === b.id))) ||
                                        (userPermissions.includes(UserPermission.EDIT_OWN_SUPPLIER) && supplier.businesses?.some(pb => pb.user_id === user?.id));
                        const canDelete = userPermissions.includes(UserPermission.DELETE_ANY_SUPPLIER) || 
                                          (userPermissions.includes(UserPermission.DELETE_ASSOCIATED_SUPPLIER) && businesses.some(b => supplier.businesses?.some(pb => pb.id === b.id))) ||
                                          (userPermissions.includes(UserPermission.DELETE_OWN_SUPPLIER) && supplier.businesses?.some(pb => pb.user_id === user?.id));

                        return (
                            <div key={supplier.id} className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3.5">
                                {/* Top Line: Title & Icon */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/20 shrink-0">
                                            <Truck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                                            {supplier.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Body Info: Details */}
                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-slate-400">Nama Kontak</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">{supplier.contact_name || '—'}</div>

                                    <div className="text-slate-400">Telepon</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">{supplier.contact_phone || '—'}</div>

                                    <div className="text-slate-400">Alamat</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">{supplier.address || '—'}</div>

                                    <div className="text-slate-400">Bisnis Terkait</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">
                                        {supplier.businesses && supplier.businesses.length > 0
                                            ? supplier.businesses.map(b => b.name).join(', ')
                                            : '—'}
                                    </div>
                                </div>

                                {/* Description */}
                                {supplier.description && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-55 dark:border-slate-800/40 pt-2.5">
                                        {supplier.description}
                                    </div>
                                )}

                                {/* Bottom Line: Actions */}
                                {(canEdit || canDelete) && (
                                    <div className="flex gap-3 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEditModal(supplier)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => openDeleteModal(supplier)}
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
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); setFetchedBusinesses([]); clearCreateErrors(); }} title="Tambah Supplier Baru">
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
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedSupplier(null); setSelectedOwnerId(''); setFetchedBusinesses([]); clearEditErrors(); }}
                title="Edit Supplier"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors, true)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedSupplier(null); setSelectedOwnerId(''); setFetchedBusinesses([]); clearEditErrors(); }}
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
                supplierName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_ANY_SUPPLIER, UserPermission.CREATE_ASSOCIATED_SUPPLIER, UserPermission.CREATE_OWN_SUPPLIER]}>
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
