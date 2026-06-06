<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data User</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; font-size: 24px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 12px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fcfcfc; }
    </style>
</head>
<body>
    <h1>Daftar User - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 5%">No</th>
                <th style="width: 20%">Nama</th>
                <th style="width: 20%">Email</th>
                <th style="width: 15%">Username</th>
                <th style="width: 15%">Telepon</th>
                <th style="width: 25%">Bisnis</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $index => $user)
                @php
                    $firstBusiness = $user->businesses->first();
                @endphp
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $user->name }}</td>
                    <td>{{ $user->email }}</td>
                    <td>{{ $user->username ?? '-' }}</td>
                    <td>{{ $user->phone ?? '-' }}</td>
                    <td>{{ $firstBusiness ? $firstBusiness->name : '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
