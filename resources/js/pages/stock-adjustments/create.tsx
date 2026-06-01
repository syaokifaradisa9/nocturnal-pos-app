import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, FileText, ClipboardList, CheckCircle, Package, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';

interface Branch {
    id: number;
    name: string;
    business?: {
        name: string;
    };
}

interface InventoryBatch {
    id: number;
    batch_number: string;
    label: string;
    product_label: string;
    current_quantity: number;
    expired_date: string | null;
}

interface CreateProps {
    branches: Branch[];
}

interface SelectedItem {
    inventory_batch_id: number;
    batch_number: string;
    product_label: string;
    current_quantity: number;
    physical_quantity: string;
    expired_date: string | null;
    note: string;
}

export default function Create({ branches = [] }: CreateProps) {
    const today = new Date().toISOString().split('T')[0];
    const [batches, setBatches] = useState<InventoryBatch[]>([]);
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        branch_id: '',
        adjustment_date: today,
        notes: '',
        status: 'Draft',
        items: [] as any[]
    });

    const handleBranchChange = async (branchId: string) => {
        setData('branch_id', branchId);
        setBatches([]);
        setSelectedItems([]);

        if (!branchId) return;

        setIsFetching(true);
        try {
            const response = await fetch(`/stock-adjustments/branch-batches?branch_id=${branchId}`);
            if (response.ok) {
                const resData = await response.json();
                setBatches(resData || []);
                
                // Prefill all active batches for this branch
                const initialItems = (resData || []).map((batch: InventoryBatch) => ({
                    inventory_batch_id: batch.id,
                    batch_number: batch.batch_number,
                    product_label: batch.product_label,
                    current_quantity: batch.current_quantity,
                    physical_quantity: '0', // Default to 0
                    expired_date: batch.expired_date,
                    note: ''
                }));
                setSelectedItems(initialItems);
            }
        } catch (error) {
            console.error('Error fetching branch batches:', error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleQtyChange = (idx: number, val: string) => {
        const updated = [...selectedItems];
        updated[idx].physical_quantity = val;
        setSelectedItems(updated);
    };

    const handleNoteChange = (idx: number, val: string) => {
        const updated = [...selectedItems];
        updated[idx].note = val;
        setSelectedItems(updated);
    };

    const handleSubmit = (status: 'Draft' | 'Adjusted') => {
        const itemsPayload = selectedItems.map(item => ({
            inventory_batch_id: item.inventory_batch_id,
            current_quantity: item.current_quantity,
            physical_quantity: parseFloat(item.physical_quantity) || 0,
            note: item.note
        }));

        router.post('/stock-adjustments/store', {
            ...data,
            status,
            items: itemsPayload
        });
    };

    return (
        <DashboardLayout title="Tambah Stock Opname">
            <Head title="Tambah Stock Opname" />

            <div className="mx-auto max-w-5xl w-full px-4 py-6 sm:px-6 lg:px-8">
                {/* Back Link */}
                <div className="mb-6">
                    <Link
                        href="/stock-adjustments"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
                    </Link>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-300">
                    {/* Header Inside Card */}
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-900/50 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <ClipboardList className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tambah Stock Opname</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Buat rekonsiliasi audit stok fisik baru untuk cabang Anda.</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormSelect
                                label="Cabang"
                                id="branch_id"
                                value={data.branch_id}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                error={errors.branch_id}
                                required
                            >
                                <option value="">Pilih Cabang</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} {b.business ? `(${b.business.name})` : ''}
                                    </option>
                                ))}
                            </FormSelect>

                            <FormInput
                                type="date"
                                label="Tanggal Stock Opname"
                                id="adjustment_date"
                                value={data.adjustment_date}
                                onChange={(e) => setData('adjustment_date', e.target.value)}
                                error={errors.adjustment_date}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="notes" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                Catatan / Keterangan
                            </label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white ${
                                    errors.notes ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
                                }`}
                                placeholder="Tuliskan catatan opsional..."
                            />
                            {errors.notes && (
                                <span className="text-[10px] font-medium text-rose-500">{errors.notes}</span>
                            )}
                        </div>

                        {/* Table Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Audit Stok Barang
                                </span>
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {selectedItems.length} Item Terbaca
                                </span>
                            </div>

                            {isFetching ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic">Membaca data batch cabang...</p>
                            ) : selectedItems.length === 0 ? (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                                    {data.branch_id ? 'Cabang ini tidak memiliki batch stok aktif untuk diaudit.' : 'Pilih cabang terlebih dahulu untuk menampilkan batch barang.'}
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-550 font-semibold uppercase">
                                            <tr>
                                                <th className="px-4 py-3">No</th>
                                                <th className="px-4 py-3">Nomor Batch</th>
                                                <th className="px-4 py-3">Tanggal Kadaluarsa</th>
                                                <th className="px-4 py-3">Produk</th>
                                                <th className="px-4 py-3 text-right" style={{ width: '120px' }}>Stok Fisik</th>
                                                <th className="px-4 py-3" style={{ width: '200px' }}>Catatan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/10">
                                            {selectedItems.map((item, idx) => (
                                                <tr key={item.inventory_batch_id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30">
                                                    <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                                                        {item.batch_number}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                                        {item.expired_date || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                        {item.product_label}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            min="0"
                                                            value={item.physical_quantity}
                                                            onChange={(e) => handleQtyChange(idx, e.target.value)}
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-right text-xs text-slate-900 font-bold focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                                                            required
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <input
                                                            type="text"
                                                            value={item.note}
                                                            onChange={(e) => handleNoteChange(idx, e.target.value)}
                                                            placeholder="Catatan..."
                                                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Penjelasan Status Konfirmasi */}
                        <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/40 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
                            <div>
                                <span className="font-bold">Info:</span> Menyimpan sebagai **Draft** memungkinkan Anda mengedit data opname nanti. Memilih **Terapkan Penyesuaian** akan mengunci data dan secara langsung memutakhirkan level stok fisik di database.
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
                            <Link
                                href="/stock-adjustments"
                                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="button"
                                onClick={() => handleSubmit('Draft')}
                                disabled={processing || selectedItems.length === 0}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Sebagai Draft'}
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSubmit('Adjusted')}
                                disabled={processing || selectedItems.length === 0}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50 transition-colors"
                            >
                                <CheckCircle className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Terapkan Penyesuaian'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
