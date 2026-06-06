import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, ShieldCheck, Check } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, { ColumnDefinition, DatatableRef } from '../../components/commons/Datatable';
import Tooltip from '../../components/commons/Tooltip';
import { UserPermission } from '../../types';
import FormInput from '../../components/forms/FormInput';
import FormTextArea from '../../components/forms/FormTextArea';

interface Permission {
    id: number;
    name: string;
    description: string | null;
}

interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions?: Permission[];
    created_at: string;
}

interface IndexProps {
    permissions?: Permission[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({ open, onClose, onConfirm, roleName, isProcessing }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    roleName: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Role">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus role <strong className="text-slate-900 dark:text-white">{roleName}</strong>? Tindakan ini tidak dapat dibatalkan.
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
function RowActions({ role, onEdit, onDelete }: {
    role: Role;
    onEdit: (r: Role) => void;
    onDelete: (r: Role) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission permissions={[UserPermission.EDIT_ROLE]}>
                <Tooltip content="Edit Role & Izin">
                    <button
                        onClick={() => onEdit(role)}
                        className="rounded-lg p-1.5 text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors cursor-pointer"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </Tooltip>
            </CheckPermission>

            <CheckPermission permissions={[UserPermission.DELETE_ROLE]}>
                <Tooltip content="Hapus Role">
                    <button
                        onClick={() => onDelete(role)}
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
export default function Index({ permissions = [] }: IndexProps) {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    /* Create Form */
    const { data: createData, setData: setCreateData, post: postCreate, reset: resetCreate, errors: createErrors, processing: createProcessing, clearErrors: clearCreateErrors } = useForm({
        name: '', description: '', permission_ids: [] as number[]
    });

    /* Edit Form */
    const { data: editData, setData: setEditData, put: putEdit, reset: resetEdit, errors: editErrors, processing: editProcessing, clearErrors: clearEditErrors } = useForm({
        name: '', description: '', permission_ids: [] as number[]
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/roles/store', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                datatableRef.current?.fetchData();
            }
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRole) return;
        putEdit(`/roles/${selectedRole.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedRole(null);
                datatableRef.current?.fetchData();
            }
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/roles/${deleteTarget.id}/delete`, {
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

    const openEditModal = (role: Role) => {
        const pIds = role.permissions ? role.permissions.map(p => p.id) : [];
        setSelectedRole(role);
        setEditData({
            name: role.name,
            description: role.description || '',
            permission_ids: pIds
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (role: Role) => {
        setDeleteTarget(role);
    };

    // Helper to group permissions by module
    const getGroupedPermissions = () => {
        const groups: { [key: string]: Permission[] } = {};

        permissions.forEach(p => {
            const match = p.name.match(/Data\s+(\w+)/i);
            let groupName = 'Lainnya';

            if (match && match[1]) {
                const word = match[1].toLowerCase();
                if (word === 'bisnis') groupName = 'Bisnis';
                else if (word === 'cabang') groupName = 'Cabang';
                else if (word === 'produk') groupName = 'Produk';
                else if (word === 'supplier') groupName = 'Supplier';
                else if (word === 'role') groupName = 'Role';
                else if (word === 'customer') groupName = 'Customer';
                else if (word === 'satuan') groupName = 'Satuan Produk';
                else if (word === 'reward') groupName = 'Reward';
                else if (word === 'item') groupName = 'Item Produk';
                else if (word === 'penerimaan') groupName = 'Penerimaan Barang';
                else if (word === 'stock') groupName = 'Stock Opname';
                else if (word === 'user') groupName = 'User';
                else {
                    groupName = match[1].charAt(0).toUpperCase() + match[1].slice(1);
                }
            }

            if (!groups[groupName]) {
                groups[groupName] = [];
            }
            groups[groupName].push(p);
        });

        return groups;
    };

    const renderFormFields = (
        formData: any,
        setFormData: (key: string, value: any) => void,
        formErrors: any
    ) => {
        const grouped = getGroupedPermissions();

        const handleCheckboxChange = (permissionId: number, checked: boolean) => {
            const currentIds = formData.permission_ids || [];
            if (checked) {
                setFormData('permission_ids', [...currentIds, permissionId]);
            } else {
                setFormData('permission_ids', currentIds.filter((id: number) => id !== permissionId));
            }
        };

        return (
            <div className="space-y-4 pt-2">
                <FormInput
                    name="name"
                    label="Nama Role"
                    value={formData.name}
                    onChange={(e) => setFormData('name', e.target.value)}
                    placeholder="Masukkan nama role..."
                    error={formErrors.name}
                />

                <FormTextArea
                    name="description"
                    label="Deskripsi"
                    value={formData.description}
                    onChange={(e) => setFormData('description', e.target.value)}
                    placeholder="Masukkan deskripsi singkat tentang role ini..."
                    error={formErrors.description}
                />

                <div className="space-y-3 pt-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Akses Izin (Permissions)
                    </label>

                    {formErrors.permission_ids && (
                        <p className="text-xs text-rose-500 font-medium">{formErrors.permission_ids}</p>
                    )}

                    <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                        {Object.keys(grouped).map((groupName) => (
                            <div key={groupName} className="space-y-2 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {groupName}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {grouped[groupName].map((p) => {
                                        const isChecked = (formData.permission_ids || []).includes(p.id);
                                        return (
                                            <label
                                                key={p.id}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                                                    isChecked
                                                        ? 'border-sky-500 bg-sky-500/5 text-sky-900 dark:text-sky-300 dark:border-sky-500/50'
                                                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-850'
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => handleCheckboxChange(p.id, e.target.checked)}
                                                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                                                />
                                                <span className="text-xs font-medium">{p.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const columns: ColumnDefinition<Role>[] = [
        {
            key: 'name',
            label: 'Nama Role',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nama role...',
            className: 'font-semibold text-slate-800 dark:text-slate-100',
            render: (r) => r.name
        },
        {
            key: 'description',
            label: 'Deskripsi',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari deskripsi...',
            className: 'text-slate-650 dark:text-slate-400',
            render: (r) => r.description || '—'
        },
        {
            key: 'permissions_count',
            label: 'Jumlah Izin',
            sortable: true,
            className: 'text-slate-500 dark:text-slate-400',
            render: (r) => r.permissions ? r.permissions.length : 0
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (r) => <RowActions role={r} onEdit={openEditModal} onDelete={openDeleteModal} />
        }
    ];

    return (
        <DashboardLayout title="Role & Hak Akses">
            <Head title="Role & Hak Akses" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 md:pt-6 md:pb-8 sm:px-6 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Role & Hak Akses"
                    icon={ShieldCheck}
                    badge="Pengaturan"
                    description="Kelola role pengguna beserta izin akses fitur di aplikasi."
                    actions={
                        <CheckPermission permissions={[UserPermission.CREATE_ROLE]}>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-white transition-colors focus:outline-none"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah Role
                            </button>
                        </CheckPermission>
                    }
                />

                <Datatable
                    ref={datatableRef}
                    apiUrl="/roles/datatable"
                    columns={columns}
                    searchPlaceholder="Cari data role..."
                    emptyMessage="Belum ada data role"
                    emptySubMessage="Mulai dengan menambahkan role baru."
                    renderMobileCard={(role: Role) => {
                        const canEdit = userPermissions.includes(UserPermission.EDIT_ROLE);
                        const canDelete = userPermissions.includes(UserPermission.DELETE_ROLE);

                        return (
                            <div key={role.id} className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3.5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/20 shrink-0">
                                            <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                                            {role.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-slate-400">Deskripsi</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium truncate">{role.description || '—'}</div>

                                    <div className="text-slate-400">Jumlah Izin</div>
                                    <div className="text-slate-700 dark:text-slate-300 text-right font-medium">{role.permissions ? role.permissions.length : 0}</div>
                                </div>

                                {(canEdit || canDelete) && (
                                    <div className="flex gap-3 mt-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                                        {canEdit && (
                                            <button
                                                onClick={() => openEditModal(role)}
                                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10 transition-colors"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() => openDeleteModal(role)}
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
            <Modal open={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); resetCreate(); clearCreateErrors(); }} title="Tambah Role Baru" maxWidth="max-w-4xl">
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
                onClose={() => { setIsEditModalOpen(false); resetEdit(); setSelectedRole(null); clearEditErrors(); }}
                title="Edit Role & Izin"
                maxWidth="max-w-4xl"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsEditModalOpen(false); resetEdit(); setSelectedRole(null); clearEditErrors(); }}
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
                roleName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission permissions={[UserPermission.CREATE_ROLE]}>
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
