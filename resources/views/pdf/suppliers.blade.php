<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data Supplier</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 10px 12px; text-align: left; font-size: 13px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fcfcfc; }
    </style>
</head>
<body>
    <h1>Daftar Supplier - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 25%">Nama Supplier</th>
                <th style="width: 20%">Nama Kontak</th>
                <th style="width: 15%">Telepon</th>
                <th style="width: 15%">Alamat</th>
                <th style="width: 20%">Bisnis Terkait</th>
            </tr>
        </thead>
        <tbody>
            @foreach($suppliers as $index => $supplier)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $supplier->name }}</td>
                    <td>{{ $supplier->contact_name ?: '-' }}</td>
                    <td>{{ $supplier->contact_phone ?: '-' }}</td>
                    <td>{{ $supplier->address ?: '-' }}</td>
                    <td>{{ $supplier->businesses->pluck('name')->implode(', ') ?: '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
