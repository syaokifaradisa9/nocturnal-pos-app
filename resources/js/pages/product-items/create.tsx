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

interface CreateProps {
    businesses?: Business[];
    users?: User[];
    product_units?: ProductUnit[];
    products?: { id: number; name: string }[];
}

export default function Create({
    businesses = [],
    users = [],
    product_units = [],
    products = [],
}: CreateProps) {
    const { props } = usePage();
    const userPermissions = (props.auth?.user as any)?.permissions || [];
    const hasCreateAnyProductItem = userPermissions.includes(
        UserPermission.CREATE_ANY_PRODUCT_ITEM,
    );

    // Selected owner state for dynamic filtering in CREATE_ANY_PRODUCT_ITEM
    const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
    const [fetchedBusinesses, setFetchedBusinesses] = useState<Business[]>([]);
    const [isFetchingBusinesses, setIsFetchingBusinesses] = useState(false);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
    const [fetchedProducts, setFetchedProducts] = useState<
        { id: number; name: string }[]
    >([]);
    const [isFetchingProducts, setIsFetchingProducts] = useState(false);

    /* Create Form */
    const { data, setData, post, errors, processing } = useForm({
        product_id: '',
        name: '',
        items: [
            {
                measurement_unit_id: '',
                target_measurement_unit_id: '',
                is_base_unit: true,
                conversion_rate: '1',
                price_tierings: [],
            },
        ] as any[],
    });

    const handleOwnerChange = async (ownerId: string) => {
        setSelectedOwnerId(ownerId);
        setSelectedBusinessId('');
        setData('product_id', '');
        setFetchedProducts([]);

        if (ownerId) {
            setIsFetchingBusinesses(true);
            try {
                const response = await fetch(
                    `/product-items/owner-businesses?user_id=${ownerId}`,
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

    const handleBusinessChange = async (businessId: string) => {
        setSelectedBusinessId(businessId);
        setData('product_id', '');

        if (businessId) {
            setIsFetchingProducts(true);
            try {
                const response = await fetch(
                    `/product-items/owner-products?business_id=${businessId}`,
                );
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

    const addUnitItem = () => {
        setData('items', [
            ...data.items,
            {
                measurement_unit_id: '',
                target_measurement_unit_id: '',
                is_base_unit: false,
                conversion_rate: '1',
                price_tierings: [],
            },
        ]);
    };

    const removeUnitItem = (index: number) => {
        if (data.items.length <= 1) return;
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
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
            .map((item) => Number(item.measurement_unit_id));

        return product_units.filter((unit) =>
            selectedUnitIds.includes(unit.id),
        );
    };

    const addPriceTier = (itemIdx: number) => {
        const currentItems = [...data.items];
        const currentTiers = currentItems[itemIdx].price_tierings || [];
        currentItems[itemIdx].price_tierings = [
            ...currentTiers,
            { minimum: 1, price: '0' },
        ];
        setData('items', currentItems);
    };

    const removePriceTier = (itemIdx: number, tierIdx: number) => {
        const currentItems = [...data.items];
        currentItems[itemIdx].price_tierings = currentItems[
            itemIdx
        ].price_tierings.filter((_, i: number) => i !== tierIdx);
        setData('items', currentItems);
    };

    const updatePriceTier = (
        itemIdx: number,
        tierIdx: number,
        key: string,
        value: any,
    ) => {
        const currentItems = [...data.items];
        currentItems[itemIdx].price_tierings[tierIdx][key] = value;
        setData('items', currentItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/product-items/store');
    };

    const displayProducts = hasCreateAnyProductItem
        ? fetchedProducts
        : products || [];

    return (
        <DashboardLayout title="Tambah Produk Penjualan">
            <Head title="Tambah Produk Penjualan" />

            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                {/* Header back link */}
                <div className="mb-6">
                    <Link
                        href="/product-items"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <ShoppingBag className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Tambah Produk Penjualan
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Buat varian produk penjualan baru di bawah
                                produk induk beserta satuan kemasan dan tier
                                harga.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 p-6">
                        {/* Step 1: Owner selector (admin only, create mode) */}
                        {hasCreateAnyProductItem && (
                            <FormSelect
                                name="owner_id"
                                label="Pilih Owner"
                                value={selectedOwnerId}
                                onChange={(e) =>
                                    handleOwnerChange(e.target.value)
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

                        {/* Step 2: Business selector (admin only, after owner selected) */}
                        {hasCreateAnyProductItem && isFetchingBusinesses && (
                            <div className="animate-pulse py-2 text-xs font-medium text-slate-500">
                                Memuat data bisnis...
                            </div>
                        )}

                        {hasCreateAnyProductItem &&
                            !isFetchingBusinesses &&
                            selectedOwnerId && (
                                <FormSelect
                                    name="business_id"
                                    label="Pilih Bisnis"
                                    value={selectedBusinessId}
                                    onChange={(e) =>
                                        handleBusinessChange(e.target.value)
                                    }
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
                            <div className="animate-pulse py-2 text-xs font-medium text-slate-500">
                                Memuat data produk...
                            </div>
                        )}

                        {(!hasCreateAnyProductItem ||
                            (hasCreateAnyProductItem &&
                                selectedBusinessId &&
                                !isFetchingProducts)) && (
                            <FormSelect
                                name="product_id"
                                label="Pilih Produk Induk (Template)"
                                value={data.product_id}
                                onChange={(e) =>
                                    setData('product_id', e.target.value)
                                }
                                error={errors.product_id}
                            >
                                <option value="">Pilih Produk Induk</option>
                                {displayProducts.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </FormSelect>
                        )}

                        {/* Step 4: Variant Name */}
                        <FormInput
                            name="name"
                            label="Nama Varian Item"
                            placeholder="Contoh: Beras Mayang, Telur Ayam Kampung"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />

                        {/* Step 5: Unit & Conversion items */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                    Satuan & Konversi Kemasan
                                </span>
                                <button
                                    type="button"
                                    onClick={addUnitItem}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                                >
                                    <Plus className="h-3.5 w-3.5" /> Tambah
                                    Satuan
                                </button>
                            </div>

                            <div className="space-y-3">
                                {data.items.map((item: any, idx: number) => {
                                    const availableTargets =
                                        getAvailableTargetUnits(idx);
                                    return (
                                        <div
                                            key={idx}
                                            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/30 p-5 transition-all duration-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/10"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                                    Satuan Kemasan #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-3">
                                                    <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 select-none dark:text-slate-300">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                item.is_base_unit
                                                            }
                                                            onChange={(e) =>
                                                                updateUnitItem(
                                                                    idx,
                                                                    'is_base_unit',
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className="h-4.5 w-4.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
                                                        />
                                                        <span>Base Unit</span>
                                                    </label>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeUnitItem(idx)
                                                        }
                                                        disabled={
                                                            data.items.length <=
                                                            1
                                                        }
                                                        className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-30 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                                                <div
                                                    className={
                                                        item.is_base_unit
                                                            ? 'md:col-span-12'
                                                            : 'md:col-span-4'
                                                    }
                                                >
                                                    <FormSelect
                                                        name={`items.${idx}.measurement_unit_id`}
                                                        label="Satuan Unit"
                                                        value={
                                                            item.measurement_unit_id
                                                        }
                                                        onChange={(e) =>
                                                            updateUnitItem(
                                                                idx,
                                                                'measurement_unit_id',
                                                                e.target.value,
                                                            )
                                                        }
                                                        error={
                                                            errors[
                                                                `items.${idx}.measurement_unit_id` as any
                                                            ]
                                                        }
                                                    >
                                                        <option value="">
                                                            Pilih Satuan
                                                        </option>
                                                        {product_units.map(
                                                            (u) => (
                                                                <option
                                                                    key={u.id}
                                                                    value={u.id}
                                                                >
                                                                    {u.name} (
                                                                    {
                                                                        u.short_name
                                                                    }
                                                                    )
                                                                </option>
                                                            ),
                                                        )}
                                                    </FormSelect>
                                                </div>

                                                {!item.is_base_unit && (
                                                    <>
                                                        <div className="md:col-span-4">
                                                            <FormSelect
                                                                name={`items.${idx}.target_measurement_unit_id`}
                                                                label="Target Satuan Konversi"
                                                                value={
                                                                    item.target_measurement_unit_id ||
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    updateUnitItem(
                                                                        idx,
                                                                        'target_measurement_unit_id',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                error={
                                                                    errors[
                                                                        `items.${idx}.target_measurement_unit_id` as any
                                                                    ]
                                                                }
                                                            >
                                                                <option value="">
                                                                    Pilih Target
                                                                    Satuan
                                                                </option>
                                                                {availableTargets.map(
                                                                    (u) => (
                                                                        <option
                                                                            key={
                                                                                u.id
                                                                            }
                                                                            value={
                                                                                u.id
                                                                            }
                                                                        >
                                                                            {
                                                                                u.name
                                                                            }{' '}
                                                                            (
                                                                            {
                                                                                u.short_name
                                                                            }
                                                                            )
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </FormSelect>
                                                        </div>

                                                        <div className="md:col-span-4">
                                                            <FormInput
                                                                name={`items.${idx}.conversion_rate`}
                                                                label="Faktor Konversi ke Target"
                                                                type="number"
                                                                step="0.0001"
                                                                value={
                                                                    item.conversion_rate
                                                                }
                                                                onChange={(e) =>
                                                                    updateUnitItem(
                                                                        idx,
                                                                        'conversion_rate',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                error={
                                                                    errors[
                                                                        `items.${idx}.conversion_rate` as any
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Price Tiering Sub-form */}
                                            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                                                        Tiering Harga Grosir
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            addPriceTier(idx)
                                                        }
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                                                    >
                                                        <Plus className="h-3 w-3" />{' '}
                                                        Tambah Tier Harga
                                                    </button>
                                                </div>

                                                {(item.price_tierings || [])
                                                    .length === 0 ? (
                                                    <p className="text-[11px] text-slate-400 italic">
                                                        Belum ada tiering harga
                                                        grosir untuk satuan ini.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {(
                                                            item.price_tierings ||
                                                            []
                                                        ).map(
                                                            (
                                                                tier: any,
                                                                tIdx: number,
                                                            ) => (
                                                                <div
                                                                    key={tIdx}
                                                                    className="grid grid-cols-12 items-end gap-3 rounded-xl border border-slate-200/60 bg-slate-50/50 p-2.5 dark:border-slate-800/40 dark:bg-slate-900/20"
                                                                >
                                                                    <div className="col-span-5">
                                                                        <FormInput
                                                                            name={`items.${idx}.price_tierings.${tIdx}.minimum`}
                                                                            label="Min. Pembelian (Qty)"
                                                                            type="number"
                                                                            value={
                                                                                tier.minimum
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updatePriceTier(
                                                                                    idx,
                                                                                    tIdx,
                                                                                    'minimum',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            error={
                                                                                errors[
                                                                                    `items.${idx}.price_tierings.${tIdx}.minimum` as any
                                                                                ]
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-5">
                                                                        <FormInput
                                                                            name={`items.${idx}.price_tierings.${tIdx}.price`}
                                                                            label="Harga per Unit (Rp)"
                                                                            type="number"
                                                                            value={
                                                                                tier.price
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updatePriceTier(
                                                                                    idx,
                                                                                    tIdx,
                                                                                    'price',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            error={
                                                                                errors[
                                                                                    `items.${idx}.price_tierings.${tIdx}.price` as any
                                                                                ]
                                                                            }
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2 flex justify-end pb-1.5">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                removePriceTier(
                                                                                    idx,
                                                                                    tIdx,
                                                                                )
                                                                            }
                                                                            className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
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
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-500 focus:ring-2 focus:ring-sky-500/30 focus:outline-none disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
