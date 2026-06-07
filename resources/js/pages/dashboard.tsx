import { Head } from '@inertiajs/react';
import {
    ShoppingBag,
    TrendingUp,
    DollarSign,
    Package,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import React from 'react';
import DashboardLayout from '../components/layouts/DashboardLayout';

export default function Dashboard() {
    return (
        <DashboardLayout>
            <Head title="Dashboard" />

            {/* Main Content Area */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Greeting & Header Action */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Dashboard Utama
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Analisis penjualan dan ringkasan aktivitas toko Anda
                            hari ini.
                        </p>
                    </div>
                    <button className="flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-sky-600 dark:hover:bg-sky-500">
                        <Plus className="h-4 w-4" />
                        Transaksi Baru
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Stat Card 1 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Pendapatan Hari Ini
                            </span>
                            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold">Rp 4.850.000</h3>
                            <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                <span>+12.5% dari kemarin</span>
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Total Transaksi
                            </span>
                            <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold">142 Pesanan</h3>
                            <p className="mt-1 flex items-center text-xs text-emerald-600 dark:text-emerald-400">
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                <span>+8.2% dari kemarin</span>
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Produk Terjual
                            </span>
                            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold">358 Item</h3>
                            <p className="mt-1 flex items-center text-xs text-rose-600 dark:text-rose-400">
                                <ArrowDownRight className="mr-1 h-3 w-3" />
                                <span>-2.4% dari kemarin</span>
                            </p>
                        </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Stok Menipis
                            </span>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
                                <Package className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold">12 Produk</h3>
                            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                Butuh restock segera
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Details Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Recent Transactions Table */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-bold">
                            Transaksi Terakhir
                        </h2>
                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                            Daftar transaksi kasir terbaru.
                        </p>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
                                        <th className="py-3">No. Nota</th>
                                        <th className="py-3">Waktu</th>
                                        <th className="py-3 text-right">
                                            Total
                                        </th>
                                        <th className="py-3 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    <tr>
                                        <td className="py-3.5 font-medium text-slate-950 dark:text-white">
                                            #TRX-9482
                                        </td>
                                        <td className="py-3.5 text-slate-500 dark:text-slate-400">
                                            14:32
                                        </td>
                                        <td className="py-3.5 text-right font-medium">
                                            Rp 125.000
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/15 ring-inset dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                                                Sukses
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3.5 font-medium text-slate-950 dark:text-white">
                                            #TRX-9481
                                        </td>
                                        <td className="py-3.5 text-slate-500 dark:text-slate-400">
                                            13:15
                                        </td>
                                        <td className="py-3.5 text-right font-medium">
                                            Rp 340.000
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/15 ring-inset dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                                                Sukses
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-3.5 font-medium text-slate-950 dark:text-white">
                                            #TRX-9480
                                        </td>
                                        <td className="py-3.5 text-slate-500 dark:text-slate-400">
                                            12:04
                                        </td>
                                        <td className="py-3.5 text-right font-medium">
                                            Rp 98.500
                                        </td>
                                        <td className="py-3.5 text-center">
                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/15 ring-inset dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                                                Sukses
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stock Alert Alert Card */}
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-lg font-bold">
                            Pemberitahuan Stok
                        </h2>
                        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                            Segera restock produk-produk ini.
                        </p>

                        <ul className="space-y-4">
                            <li className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div>
                                    <h4 className="text-sm font-semibold">
                                        Kertas HVS A4 80gr
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        Supplier: Sinar Jaya
                                    </p>
                                </div>
                                <span className="rounded bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                                    Sisa 2 rim
                                </span>
                            </li>
                            <li className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                                <div>
                                    <h4 className="text-sm font-semibold">
                                        Buku Tulis Kiky 38 lbr
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        Supplier: Multi Book
                                    </p>
                                </div>
                                <span className="rounded bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                                    Sisa 5 pak
                                </span>
                            </li>
                            <li className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-semibold">
                                        Pulpen Standard AE7
                                    </h4>
                                    <p className="text-xs text-slate-400">
                                        Supplier: Alat Tulis Mas
                                    </p>
                                </div>
                                <span className="rounded bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                                    Sisa 1 box
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
