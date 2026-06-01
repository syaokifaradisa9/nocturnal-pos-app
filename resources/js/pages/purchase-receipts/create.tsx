import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, FileText, ClipboardCheck, Package, Plus, Trash2, PackageX } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';

interface Supplier {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
    business?: {
        name: string;
    };
}

interface User {
    id: number;
    name: string;
}

interface ProductItemMeasurement {
    id: number;
    label: string;
    product_item_id: number;
}

interface ReceiptItem {
    product_item_measurement_id: string;
    quantity: string;
    unit_cost: string;
    expired_date: string;
}

interface ReceiptReject {
    product_item_measurement_id: string;
    quantity: string;
    reason: string;
}

interface CreateProps {
    suppliers: Supplier[];
    branches: Branch[];
    users?: User[];
    productItemMeasurements: ProductItemMeasurement[];
}

export default function Create({ suppliers = [], branches = [], users = [], productItemMeasurements = [] }: CreateProps) {
    const { props: pageProps } = usePage();
    const userPermissions = (pageProps.auth?.user as any)?.permissions || [];
    const hasViewAny = userPermissions.includes('Lihat Data Penerimaan Barang Keseluruhan');

    const today = new Date().toISOString().split('T')[0];

    const [fetchedSuppliers, setFetchedSuppliers] = useState<Supplier[]>(hasViewAny ? [] : suppliers);
    const [fetchedBranches, setFetchedBranches] = useState<Branch[]>(hasViewAny ? [] : branches);
    const [isFetching, setIsFetching] = useState(false);
    const [selectedOwnerId, setSelectedOwnerId] = useState('');

    const [items, setItems] = useState<ReceiptItem[]>([]);
    const [rejects, setRejects] = useState<ReceiptReject[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        supplier_id: '',
        branch_id: '',
        receipt_number: '',
        receipt_date: today,
        status: 'Draft',
        notes: '',
        items: [] as ReceiptItem[],
        rejects: [] as ReceiptReject[]
    });

    const handleOwnerChange = async (ownerId: string) => {
        setSelectedOwnerId(ownerId);
        setData(prev => ({
            ...prev,
            supplier_id: '',
            branch_id: ''
        }));

        if (!ownerId) {
            setFetchedSuppliers([]);
            setFetchedBranches([]);
            return;
        }

        setIsFetching(true);
        try {
            const response = await fetch(`/purchase-receipts/owner-data?user_id=${ownerId}`);
            if (response.ok) {
                const resData = await response.json();
                setFetchedSuppliers(resData.suppliers || []);
                setFetchedBranches(resData.branches || []);
            } else {
                setFetchedSuppliers([]);
                setFetchedBranches([]);
            }
        } catch (error) {
            console.error('Error fetching owner data:', error);
            setFetchedSuppliers([]);
            setFetchedBranches([]);
        } finally {
            setIsFetching(false);
        }
    };

    const addItem = () => {
        const newItem: ReceiptItem = {
            product_item_measurement_id: '',
            quantity: '',
            unit_cost: '',
            expired_date: ''
        };
        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        setData('items', updatedItems);
    };

    const removeItem = (index: number) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
        setData('items', updatedItems);
    };

    const updateItem = (index: number, field: keyof ReceiptItem, value: string) => {
        const updatedItems = [...items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        setItems(updatedItems);
        setData('items', updatedItems);
    };

    const addReject = () => {
        const newReject: ReceiptReject = {
            product_item_measurement_id: '',
            quantity: '',
            reason: ''
        };
        const updatedRejects = [...rejects, newReject];
        setRejects(updatedRejects);
        setData('rejects', updatedRejects);
    };

    const removeReject = (index: number) => {
        const updatedRejects = rejects.filter((_, i) => i !== index);
        setRejects(updatedRejects);
        setData('rejects', updatedRejects);
    };

    const updateReject = (index: number, field: keyof ReceiptReject, value: string) => {
        const updatedRejects = [...rejects];
        updatedRejects[index] = { ...updatedRejects[index], [field]: value };
        setRejects(updatedRejects);
        setData('rejects', updatedRejects);
    };

    const submitForm = (statusValue: 'Draft' | 'Review') => {
        data.status = statusValue;
        data.items = items;
        data.rejects = rejects;
        post('/purchase-receipts/store');
    };

    // Get allowed product_item_ids based on the currently selected items
    const allowedProductItemIds = items
        .map(item => {
            const measurement = productItemMeasurements.find(m => String(m.id) === item.product_item_measurement_id);
            return measurement ? measurement.product_item_id : null;
        })
        .filter((id): id is number => id !== null);

    // Filter productItemMeasurements for the reject select options
    const filteredRejectMeasurements = productItemMeasurements.filter(m => 
        allowedProductItemIds.includes(m.product_item_id)
    );

    return (
        <DashboardLayout title="Tambah Penerimaan Barang Baru">
            <Head title="Tambah Penerimaan Barang" />

            <div className="mx-auto max-w-5xl w-full px-4 py-6 sm:px-6 lg:px-8">
                {/* Header back link */}
                <div className="mb-6">
                    <Link
                        href="/purchase-receipts"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
                    </Link>
                </div>

                {/* ─── Form Card: Penerimaan Barang ─── */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-300">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 md:px-8 py-5 dark:border-slate-800 dark:bg-slate-900/50 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <ClipboardCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Penerimaan Barang</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Isi detail informasi untuk penerimaan barang masuk ke gudang / cabang.</p>
                        </div>
                    </div>

                    <form onSubmit={(e) => e.preventDefault()} className="p-6 md:p-8 space-y-6">
                        {/* Pilih Owner Selector (Admin only) */}
                        {hasViewAny && users && users.length > 0 && (
                            <FormSelect
                                name="owner_id"
                                label="Pilih Owner"
                                value={selectedOwnerId}
                                onChange={(e) => handleOwnerChange(e.target.value)}
                            >
                                <option value="">Pilih Owner</option>
                                {users.map((owner) => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name}
                                    </option>
                                ))}
                            </FormSelect>
                        )}

                        {isFetching && (
                            <div className="text-xs font-medium text-slate-550 animate-pulse py-2">
                                Memuat data supplier & cabang...
                            </div>
                        )}

                        {(!hasViewAny || (hasViewAny && selectedOwnerId && !isFetching)) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Supplier Select */}
                                <FormSelect
                                    name="supplier_id"
                                    label="Supplier"
                                    value={data.supplier_id}
                                    onChange={(e) => setData('supplier_id', e.target.value)}
                                    error={errors.supplier_id}
                                >
                                    <option value="">Pilih Supplier</option>
                                    {fetchedSuppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                        </option>
                                    ))}
                                </FormSelect>

                                {/* Branch Select */}
                                <FormSelect
                                    name="branch_id"
                                    label="Cabang"
                                    value={data.branch_id}
                                    onChange={(e) => setData('branch_id', e.target.value)}
                                    error={errors.branch_id}
                                >
                                    <option value="">Pilih Cabang</option>
                                    {fetchedBranches.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name} {b.business ? `(${b.business.name})` : ''}
                                        </option>
                                    ))}
                                </FormSelect>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Receipt Number */}
                            <FormInput
                                name="receipt_number"
                                label="Nomor Pengiriman (Opsional)"
                                placeholder="Masukkan nomor pengiriman..."
                                value={data.receipt_number}
                                onChange={(e) => setData('receipt_number', e.target.value)}
                                error={errors.receipt_number}
                            />

                            {/* Receipt Date */}
                            <FormInput
                                name="receipt_date"
                                label="Tanggal Penerimaan"
                                type="date"
                                value={data.receipt_date}
                                onChange={(e) => setData('receipt_date', e.target.value)}
                                error={errors.receipt_date}
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <label htmlFor="notes" className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                                Catatan
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                placeholder="Tulis catatan tambahan di sini..."
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="block w-full min-h-[100px] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                            />
                            {errors.notes && (
                                <p className="mt-1.5 text-xs text-rose-500 font-medium">{errors.notes}</p>
                            )}
                        </div>
                    </form>
                </div>

                {/* ─── Form Card: Pendataan Barang (Items) ─── */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-300">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 md:px-8 py-5 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pendataan Barang</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tambahkan detail barang yang diterima pada penerimaan ini.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Barang
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                                    <Package className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada barang ditambahkan</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Klik tombol "Tambah Barang" untuk menambahkan item penerimaan.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div
                                        key={index}
                                        className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/50 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
                                    >
                                        {/* Item number badge + delete */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="inline-flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                    {index + 1}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Item #{index + 1}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                            {/* Product Item Measurement Select */}
                                            <div className="md:col-span-2">
                                                <FormSelect
                                                    name={`items_${index}_product`}
                                                    label="Produk"
                                                    value={item.product_item_measurement_id}
                                                    onChange={(e) => updateItem(index, 'product_item_measurement_id', e.target.value)}
                                                    error={(errors as any)?.[`items.${index}.product_item_measurement_id`]}
                                                >
                                                    <option value="">Pilih Produk</option>
                                                    {productItemMeasurements.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.label}
                                                        </option>
                                                    ))}
                                                </FormSelect>
                                            </div>

                                            {/* Quantity */}
                                            <FormInput
                                                name={`items_${index}_quantity`}
                                                label="Jumlah / Quantity Total Penerimaan"
                                                type="number"
                                                step="0.0001"
                                                min="0"
                                                placeholder="0"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                error={(errors as any)?.[`items.${index}.quantity`]}
                                            />

                                            {/* Unit Cost */}
                                            <FormInput
                                                name={`items_${index}_unit_cost`}
                                                label="Harga Satuan"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0"
                                                value={item.unit_cost}
                                                onChange={(e) => updateItem(index, 'unit_cost', e.target.value)}
                                                error={(errors as any)?.[`items.${index}.unit_cost`]}
                                            />

                                            {/* Expired Date */}
                                            <FormInput
                                                name={`items_${index}_expired_date`}
                                                label="Tanggal Kadaluarsa"
                                                type="date"
                                                value={item.expired_date}
                                                onChange={(e) => updateItem(index, 'expired_date', e.target.value)}
                                                error={(errors as any)?.[`items.${index}.expired_date`]}
                                            />

                                            {/* Subtotal display */}
                                            <div className="space-y-1.5">
                                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    Subtotal
                                                </label>
                                                <div className="flex items-center h-[42px] rounded-xl border border-slate-200 bg-slate-100 px-3.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                                    {item.quantity && item.unit_cost
                                                        ? `Rp ${(parseFloat(item.quantity) * parseFloat(item.unit_cost)).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                                        : 'Rp 0,00'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Grand total */}
                                {items.length > 0 && (
                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 px-6 py-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Total Keseluruhan</span>
                                        <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                            Rp {items.reduce((total, item) => {
                                                const qty = parseFloat(item.quantity) || 0;
                                                const cost = parseFloat(item.unit_cost) || 0;
                                                return total + (qty * cost);
                                            }, 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Form Card: Pendataan Barang Reject (Rejects) ─── */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-300">
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 md:px-8 py-5 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10">
                                <PackageX className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pendataan Barang Reject</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Tambahkan detail barang yang ditolak / reject pada penerimaan ini.</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addReject}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Tambah Barang Reject
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {rejects.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
                                    <PackageX className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada barang reject ditambahkan</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Klik tombol "Tambah Barang Reject" untuk menambahkan item reject.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rejects.map((reject, index) => (
                                    <div
                                        key={index}
                                        className="relative rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/50 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600"
                                    >
                                        {/* Reject item number badge + delete */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="inline-flex items-center gap-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-xs font-bold text-rose-600 dark:text-rose-400">
                                                    {index + 1}
                                                </span>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Item Reject #{index + 1}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeReject(index)}
                                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Hapus
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                            {/* Product Item Measurement Select */}
                                            <div className="md:col-span-2">
                                                <FormSelect
                                                    name={`rejects_${index}_product`}
                                                    label="Produk"
                                                    value={reject.product_item_measurement_id}
                                                    onChange={(e) => updateReject(index, 'product_item_measurement_id', e.target.value)}
                                                    error={(errors as any)?.[`rejects.${index}.product_item_measurement_id`]}
                                                >
                                                    <option value="">Pilih Produk</option>
                                                    {filteredRejectMeasurements.map((m) => (
                                                        <option key={m.id} value={m.id}>
                                                            {m.label}
                                                        </option>
                                                    ))}
                                                </FormSelect>
                                            </div>

                                            {/* Quantity */}
                                            <FormInput
                                                name={`rejects_${index}_quantity`}
                                                label="Jumlah / Quantity Reject"
                                                type="number"
                                                step="0.0001"
                                                min="0"
                                                placeholder="0"
                                                value={reject.quantity}
                                                onChange={(e) => updateReject(index, 'quantity', e.target.value)}
                                                error={(errors as any)?.[`rejects.${index}.quantity`]}
                                            />

                                            {/* Reason */}
                                            <FormInput
                                                name={`rejects_${index}_reason`}
                                                label="Alasan"
                                                placeholder="Masukkan alasan reject..."
                                                value={reject.reason}
                                                onChange={(e) => updateReject(index, 'reason', e.target.value)}
                                                error={(errors as any)?.[`rejects.${index}.reason`]}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Actions Footer ─── */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 px-6 md:px-8 py-5">
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                        <Link
                            href="/purchase-receipts"
                            className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                        >
                            Batal
                        </Link>

                        <button
                            type="button"
                            onClick={() => submitForm('Draft')}
                            disabled={processing}
                            className="rounded-xl border border-slate-350 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        >
                            Simpan Sebagai Draft
                        </button>

                        <button
                            type="button"
                            onClick={() => submitForm('Review')}
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        >
                            <Save className="h-4 w-4" />
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
