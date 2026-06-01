<!DOCTYPE html>
<html>
<head>
    <title>Laporan Stock Opname</title>
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
    <h1>Laporan Stock Opname - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 20%">Nomor Penyesuaian</th>
                <th style="width: 15%">Tanggal</th>
                <th style="width: 25%">Cabang</th>
                <th style="width: 15%">Operator</th>
                <th style="width: 10%">Status</th>
                <th style="width: 10%">Catatan</th>
            </tr>
        </thead>
        <tbody>
            @foreach($adjustments as $index => $row)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $row->adjustment_number }}</td>
                    <td>{{ $row->adjustment_date ? $row->adjustment_date->format('Y-m-d') : '-' }}</td>
                    <td>{{ $row->branch ? $row->branch->name . ' (' . ($row->branch->business?->name) . ')' : '-' }}</td>
                    <td>{{ $row->user?->name ?: '-' }}</td>
                    <td>{{ $row->status->value }}</td>
                    <td>{{ $row->notes ?: '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
