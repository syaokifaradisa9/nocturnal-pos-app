import React, { useState, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Edit2, Trash2, Gift } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ContentHeader from '../../components/layouts/ContentHeader';
import CheckPermission from '../../components/commons/CheckPermission';
import Modal from '../../components/commons/Modal';
import Datatable, {
    ColumnDefinition,
    DatatableRef,
} from '../../components/commons/Datatable';
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

interface Reward {
    id: number;
    name: string;
    description: string | null;
    minimum_point: number;
    business_id: number;
    business?: Business | null;
    created_at: string;
}

interface IndexProps {
    businesses?: Business[];
    users?: User[];
}

/* ──────────────────────── Delete Confirmation Modal ──────────────────────── */
function DeleteConfirmModal({
    open,
    onClose,
    onConfirm,
    rewardName,
    isProcessing,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    rewardName: string;
    isProcessing: boolean;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Hapus Reward">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Apakah Anda yakin ingin menghapus reward{' '}
                    <strong className="text-slate-900 dark:text-white">
                        {rewardName}
                    </strong>
                    ? Tindakan ini tidak dapat dibatalkan.
                </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={onClose}
                    className="dark:hover:bg-slate-850 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                    Batal
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 focus:ring-2 focus:ring-rose-500/30 focus:outline-none disabled:opacity-50"
                >
                    {isProcessing ? 'Menghapus...' : 'Hapus'}
                </button>
            </div>
        </Modal>
    );
}

/* ──────────────────────── Row Action Menu ──────────────────────── */
function RowActions({
    reward,
    onEdit,
    onDelete,
}: {
    reward: Reward;
    onEdit: (r: Reward) => void;
    onDelete: (r: Reward) => void;
}) {
    return (
        <div className="flex items-center justify-end gap-1.5">
            <CheckPermission
                permissions={[
                    UserPermission.EDIT_ANY_REWARD,
                    UserPermission.EDIT_ASSOCIATED_REWARD,
                    UserPermission.EDIT_OWN_REWARD,
                ]}
            >
                <Tooltip content="Edit Reward">
                    <button
                        onClick={() => onEdit(reward)}
                        className="cursor-pointer rounded-lg p-1.5 text-sky-600 transition-colors hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-500/10"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                </Tooltip>
            </CheckPermission>

            <CheckPermission
                permissions={[
                    UserPermission.DELETE_ANY_REWARD,
                    UserPermission.DELETE_ASSOCIATED_REWARD,
                    UserPermission.DELETE_OWN_REWARD,
                ]}
            >
                <Tooltip content="Hapus Reward">
                    <button
                        onClick={() => onDelete(reward)}
                        className="cursor-pointer rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
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

    const hasCreateAnyReward = userPermissions.includes(
        UserPermission.CREATE_ANY_REWARD,
    );
    const hasCreateAssociatedReward = userPermissions.includes(
        UserPermission.CREATE_ASSOCIATED_REWARD,
    );
    const hasCreateOwnReward = userPermissions.includes(
        UserPermission.CREATE_OWN_REWARD,
    );

    const datatableRef = useRef<DatatableRef>(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Reward | null>(null);
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
        clearErrors: clearCreateErrors,
    } = useForm({
        name: '',
        description: '',
        minimum_point: 0,
        business_id: '',
    });

    /* Edit Form */
    const {
        data: editData,
        setData: setEditData,
        put: putEdit,
        reset: resetEdit,
        errors: editErrors,
        processing: editProcessing,
        clearErrors: clearEditErrors,
    } = useForm({
        name: '',
        description: '',
        minimum_point: 0,
        business_id: '',
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        postCreate('/rewards/store', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                resetCreate();
                setSelectedOwnerId('');
                setFetchedBusinesses([]);
                datatableRef.current?.fetchData();
            },
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReward) return;
        putEdit(`/rewards/${selectedReward.id}/update`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                resetEdit();
                setSelectedReward(null);
                setSelectedOwnerId('');
                setFetchedBusinesses([]);
                datatableRef.current?.fetchData();
            },
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete(`/rewards/${deleteTarget.id}/delete`, {
            onSuccess: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
                datatableRef.current?.fetchData();
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const openEditModal = async (reward: Reward) => {
        const ownerId = reward.business?.user_id
            ? String(reward.business.user_id)
            : '';
        setSelectedReward(reward);
        setEditData({
            name: reward.name,
            description: reward.description || '',
            minimum_point: reward.minimum_point,
            business_id: String(reward.business_id),
        });
        setSelectedOwnerId(ownerId);

        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(
                    `/rewards/owner-businesses?user_id=${ownerId}`,
                );
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

    const openDeleteModal = (reward: Reward) => {
        setDeleteTarget(reward);
    };

    const handleOwnerChange = async (
        ownerId: string,
        setFormData: (key: string, value: any) => void,
    ) => {
        setSelectedOwnerId(ownerId);
        setFormData('business_id', '');

        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(
                    `/rewards/owner-businesses?user_id=${ownerId}`,
                );
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
    ) => {
        const showOwnerSelector = hasCreateAnyReward;
        const showBusinessSelector = hasCreateAnyReward
            ? selectedOwnerId !== ''
            : hasCreateAssociatedReward
              ? businesses.length > 1
              : hasCreateOwnReward
                ? businesses.length > 1
                : false;

        const displayBusinesses = hasCreateAnyReward
            ? fetchedBusinesses
            : businesses;

        return (
            <div className="space-y-4 pt-2">
                {showOwnerSelector && (
                    <FormSelect
                        name="owner_id"
                        label="Pilih Owner Bisnis"
                        value={selectedOwnerId}
                        onChange={(e) =>
                            handleOwnerChange(e.target.value, setFormData)
                        }
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
                    <div className="animate-pulse py-2 text-xs font-medium text-slate-500">
                        Memuat data bisnis...
                    </div>
                )}

                {!isFetchingBusinesses &&
                    (showBusinessSelector || !showOwnerSelector) &&
                    displayBusinesses.length > 0 && (
                        <FormSelect
                            name="business_id"
                            label="Pilih Bisnis"
                            value={formData.business_id}
                            onChange={(e) =>
                                setFormData('business_id', e.target.value)
                            }
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

                <FormInput
                    name="name"
                    label="Nama Reward"
                    value={formData.name}
                    onChange={(e) => setFormData('name', e.target.value)}
                    placeholder="Masukkan nama reward (misal: Diskon 10%, Kopi Gratis)..."
                    error={formErrors.name}
                />

                <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Deskripsi
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData('description', e.target.value)
                        }
                        placeholder="Masukkan deskripsi detail reward..."
                        className="min-h-[80px] w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    {formErrors.description && (
                        <p className="mt-1 text-xs font-medium text-rose-500">
                            {formErrors.description}
                        </p>
                    )}
                </div>

                <FormInput
                    name="minimum_point"
                    label="Poin Minimum Penukaran"
                    type="number"
                    value={formData.minimum_point}
                    onChange={(e) =>
                        setFormData('minimum_point', e.target.value)
                    }
                    placeholder="Masukkan minimum poin untuk menukar..."
                    error={formErrors.minimum_point}
                />
            </div>
        );
    };

    const columns: ColumnDefinition<Reward>[] = [
        {
            key: 'name',
            label: 'Nama Reward',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari nama reward...',
            className: 'font-semibold text-slate-800 dark:text-slate-100',
            render: (r) => r.name,
        },
        {
            key: 'minimum_point',
            label: 'Poin Minimum',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari poin minimum...',
            className: 'text-slate-650 dark:text-slate-200',
            render: (r) => (
                <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                    {r.minimum_point} Poin
                </span>
            ),
        },
        {
            key: 'business',
            label: 'Bisnis Terkait',
            sortable: true,
            searchable: true,
            searchPlaceholder: 'Cari bisnis...',
            className: 'text-slate-500 dark:text-slate-400',
            render: (r) => (r.business ? r.business.name : '—'),
        },
        {
            key: 'actions',
            label: 'Aksi',
            headerClassName: 'text-right',
            className: 'whitespace-nowrap text-right',
            render: (r) => (
                <RowActions
                    reward={r}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                />
            ),
        },
    ];

    return (
        <DashboardLayout title="Reward Penukaran">
            <Head title="Reward Penukaran" />

            <div className="mx-auto max-w-7xl px-4 pt-4 pb-6 sm:px-6 md:pt-6 md:pb-8 lg:px-8">
                {/* ─── Header ─── */}
                <ContentHeader
                    title="Data Reward"
                    icon={Gift}
                    badge="Master"
                    description="Kelola reward penukaran poin customer loyalitas sesuai hak akses Anda."
                    excelUrl="/rewards/print/excel"
                    pdfUrl="/rewards/print/pdf"
                    actions={
                        <CheckPermission
                            permissions={[
                                UserPermission.CREATE_ANY_REWARD,
                                UserPermission.CREATE_ASSOCIATED_REWARD,
                                UserPermission.CREATE_OWN_REWARD,
                            ]}
                        >
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Tambah Reward
                            </button>
                        </CheckPermission>
                    }
                />

                <Datatable
                    ref={datatableRef}
                    apiUrl="/rewards/datatable"
                    columns={columns}
                    searchPlaceholder="Cari reward..."
                    emptyMessage="Belum ada reward penukaran"
                    emptySubMessage="Mulai dengan menambahkan reward penukaran baru."
                    printPdfUrl="/rewards/print/pdf"
                    printExcelUrl="/rewards/print/excel"
                    renderMobileCard={(reward: Reward) => {
                        const user = props.auth?.user as any;
                        const canEdit =
                            userPermissions.includes(
                                UserPermission.EDIT_ANY_REWARD,
                            ) ||
                            (userPermissions.includes(
                                UserPermission.EDIT_ASSOCIATED_REWARD,
                            ) &&
                                businesses.some(
                                    (b) => reward.business_id === b.id,
                                )) ||
                            (userPermissions.includes(
                                UserPermission.EDIT_OWN_REWARD,
                            ) &&
                                reward.business?.user_id === user?.id);
                        const canDelete =
                            userPermissions.includes(
                                UserPermission.DELETE_ANY_REWARD,
                            ) ||
                            (userPermissions.includes(
                                UserPermission.DELETE_ASSOCIATED_REWARD,
                            ) &&
                                businesses.some(
                                    (b) => reward.business_id === b.id,
                                )) ||
                            (userPermissions.includes(
                                UserPermission.DELETE_OWN_REWARD,
                            ) &&
                                reward.business?.user_id === user?.id);

                        return (
                            <div
                                key={reward.id}
                                className="flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                {/* Top Line */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 dark:bg-sky-500/20">
                                            <Gift className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                                        </div>
                                        <h3 className="truncate text-base leading-snug font-bold text-slate-900 dark:text-white">
                                            {reward.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-y-2 text-xs">
                                    <div className="text-slate-400">
                                        Poin Minimum
                                    </div>
                                    <div className="truncate text-right font-medium text-slate-700 dark:text-slate-300">
                                        {reward.minimum_point} Poin
                                    </div>

                                    <div className="text-slate-400">
                                        Bisnis Terkait
                                    </div>
                                    <div className="truncate text-right font-medium text-slate-700 dark:text-slate-300">
                                        {reward.business
                                            ? reward.business.name
                                            : '—'}
                                    </div>
                                </div>

                                {/* Description */}
                                {reward.description && (
                                    <div className="border-slate-55 border-t pt-2.5 text-xs leading-relaxed text-slate-500 dark:border-slate-800/40 dark:text-slate-400">
                                        {reward.description}
                                    </div>
                                )}

                                {/* Actions */}
                                {(canEdit || canDelete) && (
                                    <div className="mt-1.5 flex gap-3 border-t border-slate-100 pt-3 dark:border-slate-800/60">
                                        {canEdit && (
                                            <button
                                                onClick={() =>
                                                    openEditModal(reward)
                                                }
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white py-2 text-xs font-semibold text-sky-600 transition-colors hover:bg-sky-50 dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400 dark:hover:bg-sky-500/10"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={() =>
                                                    openDeleteModal(reward)
                                                }
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-500/10"
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
            <Modal
                open={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    resetCreate();
                    setSelectedOwnerId('');
                    setFetchedBusinesses([]);
                    clearCreateErrors();
                }}
                title="Tambah Reward Baru"
            >
                <form onSubmit={handleCreateSubmit}>
                    {renderFormFields(createData, setCreateData, createErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsCreateModalOpen(false);
                                resetCreate();
                                setSelectedOwnerId('');
                                setFetchedBusinesses([]);
                                clearCreateErrors();
                            }}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={createProcessing}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:outline-none disabled:opacity-50"
                        >
                            {createProcessing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── Edit Modal ─── */}
            <Modal
                open={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    resetEdit();
                    setSelectedReward(null);
                    setSelectedOwnerId('');
                    setFetchedBusinesses([]);
                    clearEditErrors();
                }}
                title="Edit Reward"
            >
                <form onSubmit={handleEditSubmit}>
                    {renderFormFields(editData, setEditData, editErrors)}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                resetEdit();
                                setSelectedReward(null);
                                setSelectedOwnerId('');
                                setFetchedBusinesses([]);
                                clearEditErrors();
                            }}
                            className="dark:hover:bg-slate-855 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={editProcessing}
                            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:outline-none disabled:opacity-50"
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
                rewardName={deleteTarget?.name || ''}
                isProcessing={isDeleting}
            />

            {/* Mobile Floating Action Button (FAB) */}
            <CheckPermission
                permissions={[
                    UserPermission.CREATE_ANY_REWARD,
                    UserPermission.CREATE_ASSOCIATED_REWARD,
                    UserPermission.CREATE_OWN_REWARD,
                ]}
            >
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="fixed right-6 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg shadow-sky-500/35 transition-all hover:scale-105 hover:bg-sky-600 focus:ring-2 focus:ring-sky-500/30 focus:outline-none active:scale-95 md:hidden"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </CheckPermission>
        </DashboardLayout>
    );
}
