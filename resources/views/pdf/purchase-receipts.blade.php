<!DOCTYPE html>
<html>
<head>
    <title>Laporan Penerimaan Barang</title>
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
    <h1>Laporan Penerimaan Barang - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 20%">Nomor Penerimaan</th>
                <th style="width: 15%">Tanggal</th>
                <th style="width: 20%">Supplier</th>
                <th style="width: 20%">Cabang</th>
                <th style="width: 10%">Status</th>
                <th style="width: 10%">Catatan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($receipts as $index => $row)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $row->receipt_number ?: '-' }}</td>
                    <td>{{ $row->receipt_date }}</td>
                    <td>{{ $row->supplier?->name ?: '-' }}</td>
                    <td>{{ $row->branch?->name ?: '-' }}</td>
                    <td>{{ $row->status }}</td>
                    <td>{{ $row->notes ?: '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
