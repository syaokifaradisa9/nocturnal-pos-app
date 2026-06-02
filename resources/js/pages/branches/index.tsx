import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Building, MapPin, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import Tooltip from '../../components/commons/Tooltip';
import { UserPermission } from '../../types';
import FormInput from '../../components/forms/FormInput';
import FormTextArea from '../../components/forms/FormTextArea';
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

interface Branch {
    id: number;
    name: string;
    address: string;
    opening_time: string | null;
    end_time: string | null;
    business_id: number;
    business?: Business | null;
    created_at: string;
}

interface IndexProps {
    businesses?: Business[];
    users?: User[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({ open, onClose, onConfirm, branchName, isProcessing }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    branchName: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Cabang">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus cabang <strong className="text-slate-900 dark:text-white">{branchName}</strong>? Tindakan ini tidak dapat dibatalkan.
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
function RowActions({ branch, onEdit, onDelete }: {
    branch: Branch;
    onEdit: (b: Branch) => void;
    onDelete: (b: Branch) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_ANY_BRANCH, UserPermission.EDIT_ASSOCIATED_BRANCH, UserPermission.EDIT_OWN_BRANCH]}>
                <Tooltip content="Edit Cabang">
                    <button
                        onClick={() => onEdit(branch)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </Tooltip>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ANY_BRANCH, UserPermission.DELETE_ASSOCIATED_BRANCH, UserPermission.DELETE_OWN_BRANCH]}>
                <Tooltip content="Hapus Cabang">
                    <button
                        onClick={() => onDelete(branch)}
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
    const hasViewAnyBranch = userPermissions.includes(UserPermission.VIEW_ANY_BRANCH);

    // Determines create forms permissions:
    const hasCreateAnyBranch = userPermissions.includes(UserPermission.CREATE_ANY_BRANCH);
    const hasCreateAssociatedBranch = userPermissions.includes(UserPermission.CREATE_ASSOCIATED_BRANCH);
    const hasCreateOwnBranch = userPermissions.includes(UserPermission.CREATE_OWN_BRANCH);

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Selected owner state for dynamic filtering in CREATE_ANY_BRANCH
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');

    /* Create Form */
    const { data: createData, setData: setCreateData, post: postCreate, reset: resetCreate, errors: createErrors, processing: createProcessing, clearErrors: clearCreateErrors } = useForm({
        name: '', address: '', opening_time: '', end_time: '', business_id: ''
    });

    /* Edit Form */
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, errors: editErrors, processing: editProcessing, clearErrors: clearEditErrors } = useForm({
        name: '', address: '', opening_time: '', end_time: '', business_id: ''
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/branches/store', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                setSelectedOwnerId('');
                datatableRef.current?.fetchData();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBranch) return;
        putEdit(`/branches/${selectedBranch.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedBranch(null);
                datatableRef.current?.fetchData();
            }
        });
    };

    const openEditModal = (branch: Branch) => {
        setSelectedBranch(branch);
        // Find owner ID if hasViewAnyBranch
        if (hasViewAnyBranch && branch.business && branch.business.user_id) {
            setSelectedOwnerId(String(branch.business.user_id));
        }
        setDataEditValues(branch);
        setIsEditModalOpen(true);
    };

    const setDataEditValues = (branch: Branch) => {
        setEditData({
            name: branch.name,
            address: branch.address,
            opening_time: branch.opening_time || '',
            end_time: branch.end_time || '',
            business_id: String(branch.business_id)
        });
    };

    const openDeleteModal = (branch: Branch) => {
        setDeleteTarget(branch);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/branches/${deleteTarget.id}/delete`, {
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
                datatableRef.current?.fetchData();
            },
            onError: () => setIsDeleting(false)
        });
    };

    // Filter businesses based on selected Owner (for CREATE_ANY_BRANCH)
    const filteredBusinesses = React.useMemo(() => {
        if (hasCreateAnyBranch) {
            if (!selectedOwnerId) return [];
            return businesses.filter(b => b.user_id === Number(selectedOwnerId));
        }
        return businesses;
    }, [businesses, selectedOwnerId, hasCreateAnyBranch]);

    /* ────── Form Fields (shared between create & edit) ────── */
    const renderFormFields = (
        data: typeof createData,
        setData: typeof setCreateData,
        errors: typeof createErrors,
        isEditMode = false
    ) => {
        // Determine whether to show business select:
        // - Tambah Data Cabang Keseluruhan: show Owner select & Business select
        // - Tambah Data Cabang Penanggungjawab Bisnis: if businesses.length > 1 show Business select, else hide
        // - Tambah data Cabang Pribadi: hide Business select
        const showOwnerSelect = hasCreateAnyBranch;
        
        let showBusinessSelect = false;
        if (hasCreateAnyBranch) {
            showBusinessSelect = !!selectedOwnerId;
        } else if (hasCreateAssociatedBranch) {
            showBusinessSelect = businesses.length > 1;
        } else if (hasCreateOwnBranch) {
            showBusinessSelect = false;
        }

        return (
            <div className="space-y-4">
                {/* Owner Select (Only for Create/Edit Any Branch) */}
                {showOwnerSelect && (
                    <FormSelect
                        name="owner_id"
                        label="Owner Bisnis"
                        value={selectedOwnerId}
                        onChange={(e) => {
                            setSelectedOwnerId(e.target.value);
                            setData('business_id', ''); // Reset selected business when owner changes
                        }}
                        error={errors.business_id}
                    >
                        <option value="">Pilih Owner...</option>
                        {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </FormSelect>
                )}

                {/* Business Select */}
                {showBusinessSelect && (
                    <FormSelect
                        name="business_id"
                        label="Pilih Bisnis"
                        value={data.business_id}
                        onChange={(e) => setData('business_id', e.target.value)}
                        error={errors.business_id}
                    >
                        <option value="">Pilih Bisnis...</option>
                        {filteredBusinesses.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </FormSelect>
                )}

                <FormInput
                    name="name"
                    label="Nama Cabang"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Masukkan nama cabang..."
                    error={errors.name}
                />

                <FormTextArea
                    name="address"
                    label="Alamat Cabang"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                    placeholder="Masukkan alamat lengkap cabang..."
                    rows={3}
                    className="resize-none"
                    error={errors.address}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        type="time"
                        name="opening_time"
                        label="Jam Buka"
                        value={data.opening_time}
                        onChange={(e) => setData('opening_time', e.target.value)}
                        error={errors.opening_time}
                    />

                    <FormInput
                        type="time"
                        name="end_time"
                        label="Jam Tutup"
                        value={data.end_time}
                        onChange={(e) => setData('end_time', e.target.value)}
                        error={errors.end_time}
                    />
                </div>
            </div>
        );
    };

    // Columns Definition for Datatable
    const columns: ColumnDefinition<Branch>[] = [
        {
            key: 'name',
            label: 'Nama Cabang',
            searchable: true,
            searchPlaceholder: 'Cari cabang...',
            sortable: true,
            className: 'font-semibold text-slate-900 dark:text-white',
        },
        {
            key: 'business',
            label: 'Bisnis',
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            sortable: true,
            sortKey: 'business_id',
            render: (b) => b.business ? (
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    <span>{b.business.name}</span>
                </div>
            ) : '-'
        },
        {
            key: 'address',
            label: 'Alamat',
            searchable: true,
            searchPlaceholder: 'Cari alamat...',
            sortable: true,
            render: (b) => (
                <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                    <span className="line-clamp-2 max-w-xs">{b.address}</span>
                </div>
            )
        },
        {
            key: 'hours',
            label: 'Jam Operasional',
            render: (b) => {
                const formatTime = (timeStr: string | null) => {
                    if (!timeStr) return '';
                    return timeStr.substring(0, 5);
                };
                return (
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{b.opening_time ? `${formatTime(b.opening_time)} - ${formatTime(b.end_time)}` : '24 Jam'}</span>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (b) => <RowActions branch={b} onEdit={openEditModal} onDelete={openDeleteModal} />
        }
    ];

    return (
        <DashboardLayout title="Data Cabang">
            <Head title="Data Cabang" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 md:pt-6 md:pb-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Data Cabang"
                    icon={Building}
                    badge="Master"
                    description="Kelola data cabang sesuai hak akses Anda."
                    excelUrl="/branches/print/excel"
                    pdfUrl="/branches/print/pdf"
                    actions={
                        <CheckPermission permissions={[UserPermission.CREATE_ANY_BRANCH, UserPermission.CREATE_ASSOCIATED_BRANCH, UserPermission.CREATE_OWN_BRANCH]}>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors focus:outline-none"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah Cabang
                            </button>
                        </CheckPermission>
                    }
                />

                <Datatable
                    ref={datatableRef}
                    apiUrl="/branches/datatable"
                        columns={columns}
                        searchPlaceholder="Cari data cabang..."
                        emptyMessage="Belum ada data cabang"
                        emptySubMessage="Mulai dengan menambahkan cabang baru."
                        printPdfUrl="/branches/print/pdf"
                        printExcelUrl="/branches/print/excel"
                        renderMobileCard={(branch: Branch) => {
                            const user = props.auth?.user as any;
                            const canEdit = userPermissions.includes(UserPermission.EDIT_ANY_BRANCH) || 
                                            (userPermissions.includes(UserPermission.EDIT_ASSOCIATED_BRANCH) && businesses.some(b => b.id === branch.business_id)) ||
                                            (userPermissions.includes(UserPermission.EDIT_OWN_BRANCH) && branch.business?.user_id === user?.id);
                            const canDelete = userPermissions.includes(UserPermission.DELETE_ANY_BRANCH) || 
                                              (userPermissions.includes(UserPermission.DELETE_ASSOCIATED_BRANCH) && businesses.some(b => b.id === branch.business_id)) ||
                                              (userPermissions.includes(UserPermission.DELETE_OWN_BRANCH) && branch.business?.user_id === user?.id);

                            return (
                                <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3.5">
                                    {/* Top Line: Title & Business badge */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                                {branch.name}
                                            </h3>
                                        </div>
                                        {branch.business && (
                                            <div className="shrink-0">
                                                <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                                                    {branch.business.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle Line: Address & Hours */}
                                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 leading-relaxed">
                                        <div className="flex items-start gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                                            <span>{branch.address}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            <span>{branch.opening_time ? `${branch.opening_time.substring(0, 5)} - ${(branch.end_time || '').substring(0, 5)}` : '24 Jam'}</span>
                                        </div>
                                    </div>

                                    {/* Bottom Line: Actions */}
                                    {(canEdit || canDelete) && (
                                        <div className="flex gap-3 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                            {canEdit && (
                                                <button
                                                    onClick={() => openEditModal(branch)}
                                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                    Edit
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => openDeleteModal(branch)}
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
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); clearCreateErrors(); }} title="Tambah Cabang Baru">
                <form onSubmit={handleCreateSubmit}>
                    {renderFormFields(createData, setCreateData, createErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsCreateModalOpen(false); resetCreate(); setSelectedOwnerId(''); clearCreateErrors(); }}
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
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedBranch(null); clearEditErrors(); }}
                title="Edit Cabang"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors, true)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedBranch(null); clearEditErrors(); }}
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
                branchName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_ANY_BRANCH, UserPermission.CREATE_ASSOCIATED_BRANCH, UserPermission.CREATE_OWN_BRANCH]}>
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
