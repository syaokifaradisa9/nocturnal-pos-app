import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, FileSpreadsheet, FileText, MoreHorizontal, Building2 } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import { UserPermission } from '../../types';
import FormInput from '../../components/forms/FormInput';
import FormTextArea from '../../components/forms/FormTextArea';
import FormSelect from '../../components/forms/FormSelect';

interface Business {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    owner: {
        id: number;
        name: string;
    } | null;
}

interface IndexProps {
    users?: { id: number; name: string }[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({ open, onClose, onConfirm, businessName, isProcessing }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    businessName: string;
    isProcessing: boolean;
}) {
    if (!open) return null;
    return (
        <Modal open={open} onClose={onClose} title="Hapus Bisnis">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
                <Trash2 className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-700 dark:text-slate-300">"{businessName}"</span>?
            </p>
            <div className="flex gap-3">
                <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
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
function RowActions({ business, onEdit, onDelete }: {
    business: Business;
    onEdit: (b: Business) => void;
    onDelete: (b: Business) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_ANY_BUSINESS, UserPermission.EDIT_OWN_BUSINESS]}>
                <div className="relative group/edit">
                    <button
                        onClick={() => onEdit(business)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/edit:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Edit Bisnis
                        <div className="absolute top-full right-3.5 h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 dark:bg-slate-800" />
                    </div>
                </div>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ANY_BUSINESS, UserPermission.DELETE_OWN_BUSINESS]}>
                <div className="relative group/delete">
                    <button
                        onClick={() => onDelete(business)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="hidden group-hover/delete:block pointer-events-none absolute bottom-full right-0 z-30 mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-slate-800">
                        Hapus Bisnis
                        <div className="absolute top-full right-3.5 h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-slate-950 dark:bg-slate-800" />
                    </div>
                </div>
            </CheckPermission>
        </div>
    );
}

/* ──────────────────────── Main Page ──────────────────────── */
export default function Index({ users = [] }: IndexProps) {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];
    const hasViewAnyBusiness = userPermissions.includes(UserPermission.VIEW_ANY_BUSINESS);

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    /* Create Form */
    const { data: createData, setData: setCreateData, post: postCreate, reset: resetCreate, errors: createErrors, processing: createProcessing, clearErrors: clearCreateErrors } = useForm({
        name: '', description: '', user_id: ''
    });

    /* Edit Form */
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, errors: editErrors, processing: editProcessing, clearErrors: clearEditErrors } = useForm({
        name: '', description: '', user_id: ''
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/businesses/store', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                datatableRef.current?.fetchData();
            }
        });
    };

    const openEditModal = (business: Business) => {
        setSelectedBusiness(business);
        setEditData({
            name: business.name,
            description: business.description || '',
            user_id: business.owner ? String(business.owner.id) : ''
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBusiness) return;
        putEdit(`/businesses/${selectedBusiness.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedBusiness(null);
                datatableRef.current?.fetchData();
            }
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/businesses/${deleteTarget.id}/delete`, {
            onSuccess: () => {
                setDeleteTarget(null);
                setIsDeleting(false);
                datatableRef.current?.fetchData();
            },
            onError: () => setIsDeleting(false)
        });
    };

    /* ────── Form Fields (shared between create & edit) ────── */
    const renderFormFields = (
        data: typeof createData,
        setData: typeof setCreateData,
        errors: typeof createErrors
    ) => (
        <div className="space-y-4">
            <FormInput
                name="name"
                label="Nama Bisnis"
                value={data.name}
                onChange={(e) => setData('name', e.target.value)}
                placeholder="Masukkan nama bisnis..."
                error={errors.name}
            />

            <FormTextArea
                name="description"
                label="Deskripsi"
                value={data.description}
                onChange={(e) => setData('description', e.target.value)}
                placeholder="Deskripsi singkat tentang bisnis ini..."
                rows={3}
                className="resize-none"
                error={errors.description}
            />

            {hasViewAnyBusiness && users && users.length > 0 && (
                <FormSelect
                    name="user_id"
                    label="Owner"
                    value={data.user_id}
                    onChange={(e) => setData('user_id', e.target.value)}
                    error={errors.user_id}
                >
                    <option value="">Pilih owner...</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </FormSelect>
            )}
        </div>
    );

    // Columns Definition for Datatable
    const columns: ColumnDefinition<Business>[] = [
        {
            key: 'no',
            label: 'No',
            sortable: true,
            sortKey: 'id',
            className: 'whitespace-nowrap text-slate-400 tabular-nums',
            render: (_, i, metaFrom) => (metaFrom || 1) + i
        },
        {
            key: 'owner',
            label: 'Owner',
            searchable: true,
            searchPlaceholder: 'Cari owner...',
            sortable: true,
            sortKey: 'user_id',
            render: (b) => b.owner ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                    {b.owner.name}
                </span>
            ) : (
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    Global
                </span>
            ),
            visible: hasViewAnyBusiness
        },
        {
            key: 'name',
            label: 'Nama Bisnis',
            searchable: true,
            searchPlaceholder: 'Cari nama...',
            sortable: true,
            className: 'whitespace-nowrap font-semibold text-slate-900 dark:text-white'
        },
        {
            key: 'description',
            label: 'Deskripsi',
            searchable: true,
            searchPlaceholder: 'Cari deskripsi...',
            sortable: true,
            className: 'text-slate-500 dark:text-slate-400 max-w-xs truncate',
            render: (b) => b.description || '—'
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (b) => <RowActions business={b} onEdit={openEditModal} onDelete={setDeleteTarget} />
        }
    ];

    return (
        <DashboardLayout title="Data Bisnis">
            <Head title="Data Bisnis" />

            <div className="mx-auto max-w-7xl px-0 pt-2 pb-6 md:py-6 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <div className="hidden md:flex mb-6 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="hidden md:block">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
                                <Building2 className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Data Bisnis</h1>
                        </div>
                        <p className="ml-12 text-sm text-slate-500 dark:text-slate-400">
                            Kelola data bisnis sesuai hak akses Anda.
                        </p>
                    </div>

                    <div className="hidden md:flex flex-wrap items-center gap-2">
                        <a
                            href="/businesses/print/excel"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                            Excel
                        </a>
                        <a
                            href="/businesses/print/pdf"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <FileText className="h-3.5 w-3.5 text-rose-500" />
                            PDF
                        </a>

                        <CheckPermission permissions={[UserPermission.CREATE_ANY_BUSINESS, UserPermission.CREATE_OWN_BUSINESS]}>
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

                {/* ─── Reusable Datatable Component ─── */}
                <Datatable
                    ref={datatableRef}
                    apiUrl="/businesses/datatable"
                    columns={columns}
                    searchPlaceholder="Cari bisnis..."
                    emptyMessage="Belum ada data bisnis"
                    emptySubMessage="Mulai dengan menambahkan bisnis baru."
                    printPdfUrl="/businesses/print/pdf"
                    printExcelUrl="/businesses/print/excel"
                    renderMobileCard={(business: Business) => {
                        const user = props.auth?.user as any;
                        const canEdit = userPermissions.includes(UserPermission.EDIT_ANY_BUSINESS) || 
                                        (userPermissions.includes(UserPermission.EDIT_OWN_BUSINESS) && business.owner?.id === user?.id);
                        const canDelete = userPermissions.includes(UserPermission.DELETE_ANY_BUSINESS) || 
                                          (userPermissions.includes(UserPermission.DELETE_OWN_BUSINESS) && business.owner?.id === user?.id);

                        return (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3.5">
                                {/* Top Line: Title & Owner badge */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                            {business.name}
                                        </h3>
                                    </div>
                                    <div className="shrink-0">
                                        {business.owner ? (
                                            <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                                                {business.owner.name}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                Global
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Middle Line: Description */}
                                {business.description && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {business.description}
                                    </div>
                                )}

                                {/* Bottom Line: Actions */}
                                {(canEdit || canDelete) && (
                                    <div className="flex gap-3 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEditModal(business)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => setDeleteTarget(business)}
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
            {/* ─── Create Modal ─── */}
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); clearCreateErrors(); }} title="Tambah Bisnis Baru">
                <form onSubmit={handleCreateSubmit}>
                    {renderFormFields(createData, setCreateData, createErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsCreateModalOpen(false); resetCreate(); clearCreateErrors(); }}
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
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedBusiness(null); clearEditErrors(); }}
                title="Edit Bisnis"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedBusiness(null); clearEditErrors(); }}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
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
                businessName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_ANY_BUSINESS, UserPermission.CREATE_OWN_BUSINESS]}>
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
