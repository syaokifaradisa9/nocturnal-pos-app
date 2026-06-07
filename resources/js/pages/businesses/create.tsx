import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { UserPermission } from '../../types';
import FormInput from '../../components/forms/FormInput';
import FormTextArea from '../../components/forms/FormTextArea';
import FormSelect from '../../components/forms/FormSelect';

interface CreateProps {
    business?: {
        id: number;
        name: string;
        description: string | null;
        user_id?: number | null;
    };
    users?: { id: number; name: string }[];
}

export default function Create({ business, users = [] }: CreateProps) {
    const isEdit = !!business;
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];
    const hasViewAnyBusiness = userPermissions.includes(
        UserPermission.VIEW_ANY_BUSINESS,
    );

    const { data, setData, post, put, processing, errors } = useForm({
        name: business?.name || '',
        description: business?.description || '',
        user_id: business?.user_id ? String(business.user_id) : '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/businesses/${business.id}/update`);
        } else {
            post('/businesses/store');
        }
    };

    return (
        <DashboardLayout>
            <Head title={isEdit ? 'Edit Bisnis' : 'Tambah Bisnis'} />
            <div className="mx-auto max-w-2xl px-4 py-8">
                <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                    {isEdit ? 'Edit Bisnis' : 'Tambah Bisnis Baru'}
                </h1>
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                    <FormInput
                        name="name"
                        label="Nama Bisnis"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                    />

                    <FormTextArea
                        name="description"
                        label="Deskripsi"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={4}
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
                            <option value="">Pilih Owner...</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </FormSelect>
                    )}

                    <div className="flex justify-end gap-3">
                        <a
                            href="/businesses"
                            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            Kembali
                        </a>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                        >
                            {isEdit ? 'Perbarui' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
