<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data Satuan Produk</title>
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
    <h1>Daftar Satuan Produk - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 25%">Nama Satuan</th>
                <th style="width: 15%">Nama Pendek</th>
                <th style="width: 25%">Deskripsi</th>
                <th style="width: 15%">Desimal</th>
                <th style="width: 15%">Bisnis Terkait</th>
            </tr>
        </thead>
        <tbody>
            @foreach($units as $index => $unit)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $unit->name }}</td>
                    <td>{{ $unit->short_name }}</td>
                    <td>{{ $unit->description ?: '-' }}</td>
                    <td>{{ $unit->allow_decimal ? 'Ya' : 'Tidak' }}</td>
                    <td>{{ $unit->business ? $unit->business->name : '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
