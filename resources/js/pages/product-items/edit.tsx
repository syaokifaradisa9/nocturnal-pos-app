import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, ShoppingBag, Save } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import { UserPermission } from '../../types';
import { usePage } from '@inertiajs/react';

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

interface ProductUnit {
    id: number;
    name: string;
    short_name: string;
    business_id: number;
}

interface ProductItem {
    id: number;
    product_id: number;
    name: string;
    is_active: boolean;
    product?: {
        id: number;
        name: string;
        businesses?: Business[];
    };
    measurements?: {
        id: number;
        product_item_id: number;
        measurement_unit_id: number | string;
        target_measurement_unit_id?: number | string | null;
        is_base_unit: boolean;
        conversion_rate: string | number;
        price_tierings?: {
            id: number;
            product_item_measurement_id: number;
            minimum: number;
            price: string | number;
        }[];
    }[];
}

interface EditProps {
    product: ProductItem;
    businesses?: Business[];
    users?: User[];
    product_units?: ProductUnit[];
    products?: { id: number; name: string }[];
}

export default function Edit({ product, businesses = [], users = [], product_units = [], products = [] }: EditProps) {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];
    const hasCreateAnyProductItem = userPermissions.includes(UserPermission.CREATE_ANY_PRODUCT_ITEM);

    const mappedItems = product.measurements ? product.measurements.map((m) => ({
        measurement_unit_id: m.measurement_unit_id,
        target_measurement_unit_id: m.target_measurement_unit_id || '',
        is_base_unit: !!m.is_base_unit,
        conversion_rate: String(Number(m.conversion_rate)),
        price_tierings: m.price_tierings ? m.price_tierings.map((t) => ({
            minimum: Number(t.minimum),
            price: String(Number(t.price)),
        })) : [],
    })) : [];

    const { data, setData, put, errors, processing } = useForm({
        product_id: String(product.product_id),
        name: product.name || '',
        items: mappedItems.length > 0 ? mappedItems : [
            { measurement_unit_id: '', target_measurement_unit_id: '', is_base_unit: true, conversion_rate: '1', price_tierings: [] }
        ] as any[]
    });

    const addUnitItem = () => {
        setData('items', [...data.items, { measurement_unit_id: '', target_measurement_unit_id: '', is_base_unit: false, conversion_rate: '1', price_tierings: [] }]);
    };

    const removeUnitItem = (index: number) => {
        if (data.items.length <= 1) return;
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const updateUnitItem = (index: number, key: string, value: any) => {
        const currentItems = [...data.items];
        if (key === 'is_base_unit' && value === true) {
            currentItems.forEach((item, i) => {
                item.is_base_unit = i === index;
                if (i === index) {
                    item.conversion_rate = '1';
                    item.target_measurement_unit_id = '';
                }
            });
        } else {
            currentItems[index][key] = value;
            if (key === 'is_base_unit' && value === false) {
                currentItems[index].conversion_rate = '1';
                currentItems[index].target_measurement_unit_id = '';
            }
        }
        setData('items', currentItems);
    };

    const getAvailableTargetUnits = (currentIdx: number) => {
        const selectedUnitIds = data.items
            .filter((item, i) => i !== currentIdx && item.measurement_unit_id)
            .map(item => Number(item.measurement_unit_id));

        return product_units.filter(unit => selectedUnitIds.includes(unit.id));
    };

    const addPriceTier = (itemIdx: number) => {
        const currentItems = [...data.items];
        const currentTiers = currentItems[itemIdx].price_tierings || [];
        currentItems[itemIdx].price_tierings = [...currentTiers, { minimum: 1, price: '0' }];
        setData('items', currentItems);
    };

    const removePriceTier = (itemIdx: number, tierIdx: number) => {
        const currentItems = [...data.items];
        currentItems[itemIdx].price_tierings = currentItems[itemIdx].price_tierings.filter((_, i: number) => i !== tierIdx);
        setData('items', currentItems);
    };

    const updatePriceTier = (itemIdx: number, tierIdx: number, key: string, value: any) => {
        const currentItems = [...data.items];
        currentItems[itemIdx].price_tierings[tierIdx][key] = value;
        setData('items', currentItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/product-items/${product.id}/update`);
    };

    return (
        <DashboardLayout title="Edit Produk Penjualan">
            <Head title="Edit Produk Penjualan" />

            <div className="mx-auto max-w-5xl w-full px-4 py-6 sm:px-6 lg:px-8">
                {/* Header back link */}
                <div className="mb-6">
                    <Link
                        href="/product-items"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-300">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <ShoppingBag className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Produk Penjualan</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Ubah data produk penjualan beserta satuan kemasan dan tier harga.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Parent Product Info (Read-only) */}
                        <FormInput
                            name="product_template"
                            label="Produk Induk (Template)"
                            value={product.product?.name || ''}
                            disabled
                            onChange={() => {}}
                        />

                        {/* Variant Name */}
                        <FormInput
                            name="name"
                            label="Nama Varian Item"
                            placeholder="Contoh: Beras Mayang, Telur Ayam Kampung"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />

                        {/* Unit & Conversion items */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Satuan & Konversi Kemasan</span>
                                <button
                                    type="button"
                                    onClick={addUnitItem}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Tambah Satuan
                                </button>
                            </div>

                            <div className="space-y-3">
                                {data.items.map((item: any, idx: number) => {
                                    const availableTargets = getAvailableTargetUnits(idx);
                                    return (
                                        <div key={idx} className="flex flex-col gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/10 hover:shadow-sm transition-all duration-300">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Satuan Kemasan #{idx + 1}</span>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.is_base_unit}
                                                            onChange={(e) => updateUnitItem(idx, 'is_base_unit', e.target.checked)}
                                                            className="h-4.5 w-4.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                                                        />
                                                        <span>Base Unit</span>
                                                    </label>
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => removeUnitItem(idx)}
                                                        disabled={data.items.length <= 1}
                                                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 disabled:opacity-30 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                                <div className={item.is_base_unit ? "md:col-span-12" : "md:col-span-4"}>
                                                    <FormSelect
                                                        name={`items.${idx}.measurement_unit_id`}
                                                        label="Satuan Unit"
                                                        value={item.measurement_unit_id}
                                                        onChange={(e) => updateUnitItem(idx, 'measurement_unit_id', e.target.value)}
                                                        error={errors[`items.${idx}.measurement_unit_id` as any]}
                                                    >
                                                        <option value="">Pilih Satuan</option>
                                                        {product_units.map((u) => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.name} ({u.short_name})
                                                            </option>
                                                        ))}
                                                    </FormSelect>
                                                </div>

                                                {!item.is_base_unit && (
                                                    <>
                                                        <div className="md:col-span-4">
                                                            <FormSelect
                                                                name={`items.${idx}.target_measurement_unit_id`}
                                                                label="Target Satuan Konversi"
                                                                value={item.target_measurement_unit_id || ''}
                                                                onChange={(e) => updateUnitItem(idx, 'target_measurement_unit_id', e.target.value)}
                                                                error={errors[`items.${idx}.target_measurement_unit_id` as any]}
                                                            >
                                                                <option value="">Pilih Target Satuan</option>
                                                                {availableTargets.map((u) => (
                                                                    <option key={u.id} value={u.id}>
                                                                        {u.name} ({u.short_name})
                                                                    </option>
                                                                ))}
                                                            </FormSelect>
                                                        </div>

                                                        <div className="md:col-span-4">
                                                            <FormInput
                                                                name={`items.${idx}.conversion_rate`}
                                                                label="Faktor Konversi ke Target"
                                                                type="number"
                                                                step="0.0001"
                                                                value={item.conversion_rate}
                                                                onChange={(e) => updateUnitItem(idx, 'conversion_rate', e.target.value)}
                                                                error={errors[`items.${idx}.conversion_rate` as any]}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Price Tiering Sub-form */}
                                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tiering Harga Grosir</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => addPriceTier(idx)}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                                    >
                                                        <Plus className="h-3 w-3" /> Tambah Tier Harga
                                                    </button>
                                                </div>

                                                {(item.price_tierings || []).length === 0 ? (
                                                    <p className="text-[11px] text-slate-400 italic">Belum ada tiering harga grosir untuk satuan ini.</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {(item.price_tierings || []).map((tier: any, tIdx: number) => (
                                                            <div key={tIdx} className="grid grid-cols-12 gap-3 items-end bg-slate-50/50 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/40">
                                                                <div className="col-span-5">
                                                                    <FormInput
                                                                        name={`items.${idx}.price_tierings.${tIdx}.minimum`}
                                                                        label="Min. Pembelian (Qty)"
                                                                        type="number"
                                                                        value={tier.minimum}
                                                                        onChange={(e) => updatePriceTier(idx, tIdx, 'minimum', e.target.value)}
                                                                        error={errors[`items.${idx}.price_tierings.${tIdx}.minimum` as any]}
                                                                    />
                                                                </div>
                                                                <div className="col-span-5">
                                                                    <FormInput
                                                                        name={`items.${idx}.price_tierings.${tIdx}.price`}
                                                                        label="Harga per Unit (Rp)"
                                                                        type="number"
                                                                        value={tier.price}
                                                                        onChange={(e) => updatePriceTier(idx, tIdx, 'price', e.target.value)}
                                                                        error={errors[`items.${idx}.price_tierings.${tIdx}.price` as any]}
                                                                    />
                                                                </div>
                                                                <div className="col-span-2 flex justify-end pb-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removePriceTier(idx, tIdx)}
                                                                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <Link
                                href="/product-items"
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Perbarui'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
