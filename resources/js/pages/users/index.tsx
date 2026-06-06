import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import Tooltip from '../../components/commons/Tooltip';
import { UserPermission } from '../../types';
import FormInput from '../../components/forms/FormInput';
import FormTextArea from '../../components/forms/FormTextArea';

interface User {
    id: number;
    name: string;
    email: string;
    username: string | null;
    address: string | null;
    phone: string | null;
    business_name: string;
    business_description: string | null;
    branch_name: string;
    branch_address: string | null;
    branch_opening_time: string | null;
    branch_end_time: string | null;
    account_type: string;
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({ open, onClose, onConfirm, userName, isProcessing }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    isProcessing: boolean;
}) {
    if (!open) return null;
    return (
        <Modal open={open} onClose={onClose} title="Hapus User">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
                <Trash2 className="h-5 w-5 text-rose-500" />
            </div>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-700 dark:text-slate-300">"{userName}"</span> beserta bisnisnya? Tindakan ini tidak dapat dibatalkan.
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
function RowActions({ userItem, onEdit, onDelete }: {
    userItem: User;
    onEdit: (u: User) => void;
    onDelete: (u: User) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_USER]}>
                <Tooltip content="Edit User & Bisnis">
                    <button
                        onClick={() => onEdit(userItem)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </Tooltip>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_USER]}>
                <Tooltip content="Hapus User & Bisnis">
                    <button
                        onClick={() => onDelete(userItem)}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    /* Create Form */
    const { data: createData, setData: setCreateData, post: postCreate, reset: resetCreate, errors: createErrors, processing: createProcessing, clearErrors: clearCreateErrors } = useForm({
        name: '', 
        email: '', 
        username: '', 
        password: '', 
        address: '', 
        phone: '', 
        business_name: '', 
        business_description: '',
        branch_name: '',
        branch_address: '',
        branch_opening_time: '',
        branch_end_time: '',
        account_type: 'pebisnis'
    });

    /* Edit Form */
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, errors: editErrors, processing: editProcessing, clearErrors: clearEditErrors } = useForm({
        name: '', 
        email: '', 
        username: '', 
        password: '', 
        address: '', 
        phone: '', 
        business_name: '', 
        business_description: '',
        branch_name: '',
        branch_address: '',
        branch_opening_time: '',
        branch_end_time: '',
        account_type: 'pebisnis'
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/users/store', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                datatableRef.current?.fetchData();
            }
        });
    };

    const openEditModal = (userItem: User) => {
        setSelectedUser(userItem);
        setEditData({
            name: userItem.name,
            email: userItem.email,
            username: userItem.username || '',
            password: '',
            address: userItem.address || '',
            phone: userItem.phone || '',
            business_name: userItem.business_name,
            business_description: userItem.business_description || '',
            branch_name: userItem.branch_name || '',
            branch_address: userItem.branch_address || '',
            branch_opening_time: userItem.branch_opening_time || '',
            branch_end_time: userItem.branch_end_time || '',
            account_type: userItem.account_type || 'pebisnis'
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        putEdit(`/users/${selectedUser.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedUser(null);
                datatableRef.current?.fetchData();
            }
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/users/${deleteTarget.id}/delete`, {
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
        errors: typeof createErrors,
        isEdit: boolean = false
    ) => (
        <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Informasi User
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    name="name"
                    label="Nama Lengkap"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="Masukkan nama lengkap..."
                    error={errors.name}
                />

                <FormInput
                    name="email"
                    label="Email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    placeholder="Masukkan alamat email..."
                    error={errors.email}
                />

                <FormInput
                    name="username"
                    label="Username"
                    value={data.username}
                    onChange={(e) => setData('username', e.target.value)}
                    placeholder="Masukkan username..."
                    error={errors.username}
                />

                <FormInput
                    name="password"
                    label={isEdit ? "Password (kosongkan jika tidak diubah)" : "Password"}
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    placeholder="Masukkan password..."
                    error={errors.password}
                />

                <FormInput
                    name="phone"
                    label="Nomor Telepon"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="Masukkan nomor telepon..."
                    error={errors.phone}
                />

                <div className="md:col-span-2">
                    <FormTextArea
                        name="address"
                        label="Alamat"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        placeholder="Masukkan alamat lengkap..."
                        rows={2}
                        className="resize-none"
                        error={errors.address}
                    />
                </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-800 my-4" />

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Informasi Bisnis
            </h3>

            <div className="space-y-4">
                <FormInput
                    name="business_name"
                    label="Nama Bisnis"
                    value={data.business_name}
                    onChange={(e) => setData('business_name', e.target.value)}
                    placeholder="Masukkan nama bisnis..."
                    error={errors.business_name}
                />

                <FormTextArea
                    name="business_description"
                    label="Deskripsi Bisnis"
                    value={data.business_description}
                    onChange={(e) => setData('business_description', e.target.value)}
                    placeholder="Deskripsi singkat tentang bisnis ini..."
                    rows={2}
                    className="resize-none"
                    error={errors.business_description}
                />
            </div>

            <hr className="border-slate-100 dark:border-slate-800 my-4" />

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Cabang Pertama
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    name="branch_name"
                    label="Nama Cabang"
                    value={data.branch_name}
                    onChange={(e) => setData('branch_name', e.target.value)}
                    placeholder="Masukkan nama cabang pertama..."
                    error={errors.branch_name}
                />

                <FormInput
                    name="branch_address"
                    label="Alamat Cabang"
                    value={data.branch_address}
                    onChange={(e) => setData('branch_address', e.target.value)}
                    placeholder="Masukkan alamat cabang..."
                    error={errors.branch_address}
                />

                <FormInput
                    name="branch_opening_time"
                    label="Jam Buka"
                    type="time"
                    value={data.branch_opening_time || ''}
                    onChange={(e) => setData('branch_opening_time', e.target.value)}
                    error={errors.branch_opening_time}
                />

                <FormInput
                    name="branch_end_time"
                    label="Jam Tutup"
                    type="time"
                    value={data.branch_end_time || ''}
                    onChange={(e) => setData('branch_end_time', e.target.value)}
                    error={errors.branch_end_time}
                />
            </div>

            <hr className="border-slate-100 dark:border-slate-800 my-4" />

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Jenis Akun
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    data.account_type === 'pebisnis'
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/5 ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}>
                    <input
                        type="radio"
                        name="account_type"
                        value="pebisnis"
                        checked={data.account_type === 'pebisnis'}
                        onChange={() => setData('account_type', 'pebisnis')}
                        className="sr-only"
                    />
                    <span className="font-semibold text-sm text-slate-950 dark:text-white">Pebisnis</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Memiliki akses Lihat Data Bisnis Pribadi.
                    </span>
                </label>

                <label className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    data.account_type === 'owner_bisnis'
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/5 ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}>
                    <input
                        type="radio"
                        name="account_type"
                        value="owner_bisnis"
                        checked={data.account_type === 'owner_bisnis'}
                        onChange={() => setData('account_type', 'owner_bisnis')}
                        className="sr-only"
                    />
                    <span className="font-semibold text-sm text-slate-950 dark:text-white">Owner Bisnis</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Memiliki akses Lihat Data Cabang Pribadi (tanpa data bisnis utama).
                    </span>
                </label>

                <label className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    data.account_type === 'owner_cabang'
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/5 ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}>
                    <input
                        type="radio"
                        name="account_type"
                        value="owner_cabang"
                        checked={data.account_type === 'owner_cabang'}
                        onChange={() => setData('account_type', 'owner_cabang')}
                        className="sr-only"
                    />
                    <span className="font-semibold text-sm text-slate-950 dark:text-white">Owner Cabang</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Memiliki akses Lihat Data Produk Pribadi (tanpa data bisnis & cabang).
                    </span>
                </label>
            </div>
            {errors.account_type && (
                <p className="text-xs text-rose-500 mt-1">{errors.account_type}</p>
            )}
        </div>
    );

    // Columns Definition for Datatable
    const columns: ColumnDefinition<User>[] = [
        {
            key: 'name',
            label: 'Nama',
            searchable: true,
            searchPlaceholder: 'Cari nama...',
            sortable: true,
            className: 'whitespace-nowrap font-semibold text-slate-900 dark:text-white'
        },
        {
            key: 'email',
            label: 'Email',
            searchable: true,
            searchPlaceholder: 'Cari email...',
            sortable: true,
        },
        {
            key: 'username',
            label: 'Username',
            searchable: true,
            searchPlaceholder: 'Cari username...',
            sortable: true,
            render: (u) => u.username || '—'
        },
        {
            key: 'phone',
            label: 'Telepon',
            searchable: true,
            searchPlaceholder: 'Cari telepon...',
            sortable: true,
            render: (u) => u.phone || '—'
        },
        {
            key: 'business_name',
            label: 'Bisnis',
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            sortable: true,
            render: (u) => (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                    {u.business_name}
                </span>
            )
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (u) => <RowActions userItem={u} onEdit={openEditModal} onDelete={setDeleteTarget} />
        }
    ];

    return (
        <DashboardLayout title="Data User & Bisnis">
            <Head title="Data User & Bisnis" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 md:pt-6 md:pb-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Data User & Bisnis"
                    icon={Users}
                    badge="Master"
                    description="Kelola seluruh akun user beserta bisnis mereka dan berikan peran otomatis dengan akses terbatas."
                    excelUrl="/users/print/excel"
                    pdfUrl="/users/print/pdf"
                    actions={
                        <CheckPermission permissions={[UserPermission.CREATE_USER]}>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors focus:outline-none"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah User
                            </button>
                        </CheckPermission>
                    }
                />

                {/* ─── Reusable Datatable Component ─── */}
                <Datatable
                    ref={datatableRef}
                    apiUrl="/users/datatable"
                    columns={columns}
                    searchPlaceholder="Cari user atau bisnis..."
                    emptyMessage="Belum ada data user"
                    emptySubMessage="Mulai dengan menambahkan user dan bisnis baru."
                    printPdfUrl="/users/print/pdf"
                    printExcelUrl="/users/print/excel"
                    renderMobileCard={(userItem: User) => {
                        const canEdit = userPermissions.includes(UserPermission.EDIT_USER);
                        const canDelete = userPermissions.includes(UserPermission.DELETE_USER);

                        return (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3.5">
                                {/* Top Line: Title & Business badge */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                            {userItem.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{userItem.email}</p>
                                    </div>
                                    <div className="shrink-0">
                                        <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                                            {userItem.business_name}
                                        </span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-800/40 pt-2.5">
                                    <div>
                                        <span className="font-medium text-slate-400 dark:text-slate-500">Username:</span> {userItem.username || '—'}
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-400 dark:text-slate-500">Telepon:</span> {userItem.phone || '—'}
                                    </div>
                                </div>

                                {/* Bottom Line: Actions */}
                                {(canEdit || canDelete) && (
                                    <div className="flex gap-3 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEditModal(userItem)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => setDeleteTarget(userItem)}
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
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); clearCreateErrors(); }} title="Tambah User & Bisnis Baru" maxWidth="max-w-2xl">
                <form onSubmit={handleCreateSubmit}>
                    {renderFormFields(createData, setCreateData, createErrors)}
                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
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
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedUser(null); clearEditErrors(); }}
                title="Edit User & Bisnis"
                maxWidth="max-w-2xl"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors, true)}
                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedUser(null); clearEditErrors(); }}
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
                userName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_USER]}>
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
