<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data Bisnis</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 12px 15px; text-align: left; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fcfcfc; }
    </style>
</head>
<body>
    <h1>Daftar Bisnis - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 10%">No</th>
                @if($hasOverall)
                    <th style="width: 40%">Owner</th>
                    <th style="width: 50%">Nama Bisnis</th>
                @else
                    <th style="width: 90%">Nama Bisnis</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @foreach($businesses as $index => $business)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    @if($hasOverall)
                        <td>{{ $business->owner ? $business->owner->name : 'Global' }}</td>
                    @endif
                    <td>{{ $business->name }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
