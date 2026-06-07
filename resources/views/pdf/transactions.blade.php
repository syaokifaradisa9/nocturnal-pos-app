<!DOCTYPE html>
<html>
<head>
    <title>Laporan Transaksi Penjualan</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 14px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fcfcfc; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <h1>Laporan Transaksi Penjualan - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 10%">Invoice</th>
                <th style="width: 15%">Tanggal</th>
                <th style="width: 15%">Cabang</th>
                <th style="width: 15%">Customer</th>
                <th style="width: 10%">Metode</th>
                <th style="width: 10%">Status</th>
                <th style="width: 10%" class="text-right">Diskon</th>
                <th style="width: 10%" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $index => $transaction)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>#{{ $transaction->id }}</td>
                    <td>{{ $transaction->created_at ? $transaction->created_at->format('Y-m-d H:i:s') : '-' }}</td>
                    <td>{{ $transaction->branch ? $transaction->branch->name : '-' }}</td>
                    <td>{{ $transaction->customer ? $transaction->customer->name : 'Walk-in Customer' }}</td>
                    <td>{{ $transaction->payment_method ?: '-' }}</td>
                    <td>{{ ucfirst($transaction->status) }}</td>
                    <td class="text-right">Rp {{ number_format($transaction->discount_price, 2, ',', '.') }}</td>
                    <td class="text-right">Rp {{ number_format($transaction->total, 2, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
