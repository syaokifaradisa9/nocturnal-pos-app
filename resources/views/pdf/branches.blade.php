<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data Cabang</title>
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
    <h1>Daftar Cabang - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 25%">Nama Cabang</th>
                <th style="width: 25%">Bisnis</th>
                <th style="width: 25%">Alamat</th>
                <th style="width: 10%">Jam Buka</th>
                <th style="width: 10%">Jam Tutup</th>
            </tr>
        </thead>
        <tbody>
            @foreach($branches as $index => $branch)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $branch->name }}</td>
                    <td>{{ $branch->business ? $branch->business->name : '-' }}</td>
                    <td>{{ $branch->address }}</td>
                    <td>{{ $branch->opening_time ?? '-' }}</td>
                    <td>{{ $branch->end_time ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
