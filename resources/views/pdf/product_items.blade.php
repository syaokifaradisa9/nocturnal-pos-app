<!DOCTYPE html>
<html>
<head>
    <title>Laporan Data Item Produk</title>
    <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h1 { text-align: center; font-size: 22px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; font-size: 12px; }
        th { background-color: #f8f9fa; font-weight: bold; }
        tr:nth-child(even) { background-color: #fcfcfc; }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            border-radius: 4px;
            margin-right: 4px;
            background-color: #e3f2fd;
            color: #0d47a1;
        }
        .badge-base {
            background-color: #e8f5e9;
            color: #1b5e20;
        }
    </style>
</head>
<body>
    <h1>Daftar Item & Satuan Kemasan Produk - Nocturnal POS</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 8%">No</th>
                <th style="width: 32%">Nama Produk</th>
                <th style="width: 35%">Satuan Unit & Konversi</th>
                <th style="width: 25%">Bisnis Terkait</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $index => $product)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td><strong>{{ $product->name }}</strong></td>
                    <td>
                        @foreach($product->items as $item)
                            <span class="badge {{ $item->is_base_unit ? 'badge-base' : '' }}">
                                {{ $item->measurementUnit ? $item->measurementUnit->short_name : 'Unit' }}: 
                                @if($item->is_base_unit)
                                    1 (Base)
                                @elseif($item->targetMeasurementUnit)
                                    {{ floatval($item->conversion_rate) }} {{ $item->targetMeasurementUnit->short_name }}
                                @else
                                    {{ floatval($item->conversion_rate) }}
                                @endif
                            </span>
                        @endforeach
                    </td>
                    <td>{{ $product->businesses->pluck('name')->implode(', ') ?: '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
