<!DOCTYPE html>
<html>
<head>
    <title>Laporan Transaksi Produk</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 14px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fcfcfc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
    </style>
</head>
<body>
    <h1>Laporan Transaksi Produk - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 10%">Invoice</th>
                <th style="width: 15%">Tanggal</th>
                <th style="width: 10%">Bisnis</th>
                <th style="width: 10%">Cabang</th>
                <th style="width: 25%">Produk</th>
                <th style="width: 10%">Satuan</th>
                <th style="width: 5%" class="text-center">Qty</th>
                <th style="width: 10%" class="text-right">Sub Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $index => $row)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>#{{ $row->transaction_id }}</td>
                    <td>{{ $row->transaction && $row->transaction->created_at ? $row->transaction->created_at->format('Y-m-d H:i:s') : '-' }}</td>
                    <td>{{ $row->transaction && $row->transaction->branch && $row->transaction->branch->business ? $row->transaction->branch->business->name : '-' }}</td>
                    <td>{{ $row->transaction && $row->transaction->branch ? $row->transaction->branch->name : '-' }}</td>
                    <td>{{ $row->product_name }}</td>
                    <td>{{ $row->measurement_name }}</td>
                    <td class="text-center">{{ (float) $row->quantity }}</td>
                    <td class="text-right">Rp {{ number_format($row->quantity * $row->price, 2, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
