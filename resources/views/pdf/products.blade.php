<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data Produk</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 14px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fcfcfc; }
    </style>
</head>
<body>
    <h1>Daftar Produk - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 10%">No</th>
                <th style="width: 45%">Nama Produk</th>
                <th style="width: 45%">Bisnis Terkait</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $index => $product)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $product->name }}</td>
                    <td>{{ $product->businesses->pluck('name')->implode(', ') ?: '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
