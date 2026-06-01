<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data Reward</title>
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
    <h1>Daftar Reward - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 30%">Nama Reward</th>
                <th style="width: 35%">Deskripsi</th>
                <th style="width: 15%">Poin Minimum</th>
                <th style="width: 15%">Bisnis Terkait</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rewards as $index => $reward)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $reward->name }}</td>
                    <td>{{ $reward->description ?: '-' }}</td>
                    <td>{{ $reward->minimum_point }} Poin</td>
                    <td>{{ $reward->business ? $reward->business->name : '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
