<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Permission;
use App\Models\Business;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $permissions = [
            'Lihat Data Bisnis Pribadi',
            'Lihat Data Bisnis Keseluruhan',
            'Tambah Data Bisnis Pribadi',
            'Tambah Data Bisnis Keseluruhan',
            'Edit Data Bisnis Pribadi',
            'Edit Data Bisnis Keseluruhan',
            'Hapus Data Bisnis Pribadi',
            'Hapus Data Bisnis Keseluruhan',

            'Lihat Data Cabang Keseluruhan',
            'Lihat Data Cabang Penanggungjawab Bisnis',
            'Lihat Data Cabang Pribadi',
            'Tambah Data Cabang Keseluruhan',
            'Tambah Data Cabang Penanggungjawab Bisnis',
            'Tambah Data Cabang Pribadi',
            'Edit Data Cabang Keseluruhan',
            'Edit Data Cabang Penanggungjawab Bisnis',
            'Edit Data Cabang Pribadi',
            'Hapus Data Cabang Keseluruhan',
            'Hapus Data Cabang Penanggungjawab Bisnis',
            'Hapus Data Cabang Pribadi',

            'Lihat Data Produk Keseluruhan',
            'Lihat Data Produk Penempatan Bisnis',
            'Lihat Data Produk Pribadi',
            'Tambah Data Produk Keseluruhan',
            'Tambah Data Produk Penempatan Bisnis',
            'Tambah Data Produk Pribadi',
            'Edit Data Produk Keseluruhan',
            'Edit Data Produk Penempatan Bisnis',
            'Edit Data Produk Pribadi',
            'Hapus Data Produk Keseluruhan',
            'Hapus Data Produk Penempatan Bisnis',
            'Hapus Data Produk Pribadi',

            'Lihat Data Supplier Keseluruhan',
            'Lihat Data Supplier Penempatan Bisnis',
            'Lihat Data Supplier Pribadi',
            'Tambah Data Supplier Keseluruhan',
            'Tambah Data Supplier Penempatan Bisnis',
            'Tambah Data Supplier Pribadi',
            'Edit Data Supplier Keseluruhan',
            'Edit Data Supplier Penempatan Bisnis',
            'Edit Data Supplier Pribadi',
            'Hapus Data Supplier Keseluruhan',
            'Hapus Data Supplier Penempatan Bisnis',
            'Hapus Data Supplier Pribadi',

            'Lihat Data Role Permisison',
            'Tambah Data Role Permisison',
            'Edit Data Role Permisison',
            'Hapus Data Role Permission',

            'Lihat Data Customer Keseluruhan',
            'Lihat Data Customer Penempatan Bisnis',
            'Lihat Data Customer Pribadi',
            'Tambah Data Customer Keseluruhan',
            'Tambah Data Customer Penempatan Bisnis',
            'Tambah Data Customer Pribadi',
            'Edit Data Customer Keseluruhan',
            'Edit Data Customer Penempatan Bisnis',
            'Edit Data Customer Pribadi',
            'Hapus Data Customer Keseluruhan',
            'Hapus Data Customer Penempatan Bisnis',
            'Hapus Data Customer Pribadi',

            'Lihat Data Satuan Produk Keseluruhan',
            'Lihat Data Satuan Produk Penempatan Bisnis',
            'Lihat Data Satuan Produk Pribadi',
            'Tambah Data Satuan Produk Keseluruhan',
            'Tambah Data Satuan Produk Penempatan Bisnis',
            'Tambah Data Satuan Produk Pribadi',
            'Edit Data Satuan Produk Keseluruhan',
            'Edit Data Satuan Produk Penempatan Bisnis',
            'Edit Data Satuan Produk Pribadi',
            'Hapus Data Satuan Produk Keseluruhan',
            'Hapus Data Satuan Produk Penempatan Bisnis',
            'Hapus Data Satuan Produk Pribadi',

            'Lihat Data Reward Keseluruhan',
            'Lihat Data Reward Penempatan Bisnis',
            'Lihat Data Reward Pribadi',
            'Tambah Data Reward Keseluruhan',
            'Tambah Data Reward Penempatan Bisnis',
            'Tambah Data Reward Pribadi',
            'Edit Data Reward Keseluruhan',
            'Edit Data Reward Penempatan Bisnis',
            'Edit Data Reward Pribadi',
            'Hapus Data Reward Keseluruhan',
            'Hapus Data Reward Penempatan Bisnis',
            'Hapus Data Reward Pribadi',

            'Lihat Data Item Produk Keseluruhan',
            'Lihat Data Item Produk Penempatan Bisnis',
            'Lihat Data Item Produk Pribadi',
            'Tambah Data Item Produk Keseluruhan',
            'Tambah Data Item Produk Penempatan Bisnis',
            'Tambah Data Item Produk Pribadi',
            'Edit Data Item Produk Keseluruhan',
            'Edit Data Item Produk Penempatan Bisnis',
            'Edit Data Item Produk Pribadi',
            'Hapus Data Item Produk Keseluruhan',
            'Hapus Data Item Produk Penempatan Bisnis',
            'Hapus Data Item Produk Pribadi',

            'Lihat Data Penerimaan Barang Keseluruhan',
            'Lihat Data Penerimaan Barang Pribadi',
            'Lihat Data Penerimaan Barang Penempatan Bisnis',
            'Konfirmasi Data Penerimaan Barang',

            'Lihat Data Stock Opname Keseluruhan',
            'Lihat Data Stock Opname Pribadi',
            'Lihat Data Stock Opname Penempatan Bisnis',

            'Lihat Data User',
            'Tambah Data User',
            'Edit Data User',
            'Hapus Data User',
            'Manajemen Kasir',
        ];

        foreach ($permissions as $permissionName) {
            Permission::updateOrCreate(
                ['name' => $permissionName],
                ['description' => 'Izin untuk ' . $permissionName]
            );
        }

        $user = User::where('username', 'testuser')->first();
        if (!$user) {
            $user = User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'username' => 'testuser',
                'password' => Hash::make('password'),
            ]);
        }

        // Assign all permissions directly to the test user
        $user->assignPermissions($permissions);

        // Create a default role
        $adminRole = \App\Models\Role::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Administrator role']
        );

        // Seed some sample businesses
        $business1 = Business::firstOrCreate(
            ['name' => 'Nocturnal Studio'],
            [
                'user_id' => $user->id,
                'description' => 'Bisnis pribadi yang berfokus pada software development.',
            ]
        );

        $business2 = Business::firstOrCreate(
            ['name' => 'Global Retail POS'],
            [
                'user_id' => null,
                'description' => 'Bisnis retail waralaba berskala nasional.',
            ]
        );

        // Link Test User to Business 1 (makes it "Pribadi") via pivot table if not already linked
        if (!$user->businesses()->where('businesses.id', $business1->id)->exists()) {
            $user->businesses()->attach($business1->id, ['role_id' => $adminRole->id]);
        }

        // Seed Product Units
        $unitKg = \App\Models\ProductUnit::firstOrCreate(
            ['name' => 'Kilogram', 'business_id' => $business1->id],
            ['short_name' => 'Kg']
        );
        $unitKarung = \App\Models\ProductUnit::firstOrCreate(
            ['name' => 'Karung', 'business_id' => $business1->id],
            ['short_name' => 'Krg']
        );
        $unitButir = \App\Models\ProductUnit::firstOrCreate(
            ['name' => 'Butir', 'business_id' => $business1->id],
            ['short_name' => 'Btr']
        );
        $unitRak = \App\Models\ProductUnit::firstOrCreate(
            ['name' => 'Rak', 'business_id' => $business1->id],
            ['short_name' => 'Rak']
        );

        // Seed Products (Induk)
        $prodBeras = \App\Models\Product::firstOrCreate(['name' => 'Beras']);
        $prodTelur = \App\Models\Product::firstOrCreate(['name' => 'Telur']);

        // Sync businesses to products
        if (!$prodBeras->businesses()->where('businesses.id', $business1->id)->exists()) {
            $prodBeras->businesses()->attach($business1->id);
        }
        if (!$prodTelur->businesses()->where('businesses.id', $business1->id)->exists()) {
            $prodTelur->businesses()->attach($business1->id);
        }

        // Seed Product Items (Varian) & Measurements
        // 1. Beras Mayang
        $itemBerasMayang = \App\Models\ProductItem::firstOrCreate(
            ['product_id' => $prodBeras->id, 'name' => 'Beras Mayang'],
            ['is_active' => true]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemBerasMayang->id, 'measurement_unit_id' => $unitKg->id],
            ['is_base_unit' => true, 'conversion_rate' => 1.0000]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemBerasMayang->id, 'measurement_unit_id' => $unitKarung->id],
            ['is_base_unit' => false, 'conversion_rate' => 10.0000, 'target_measurement_unit_id' => $unitKg->id] // Karung 10kg
        );

        // 2. Beras Lopo Ijo
        $itemBerasLopoIjo = \App\Models\ProductItem::firstOrCreate(
            ['product_id' => $prodBeras->id, 'name' => 'Beras Lopo Ijo'],
            ['is_active' => true]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemBerasLopoIjo->id, 'measurement_unit_id' => $unitKg->id],
            ['is_base_unit' => true, 'conversion_rate' => 1.0000]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemBerasLopoIjo->id, 'measurement_unit_id' => $unitKarung->id],
            ['is_base_unit' => false, 'conversion_rate' => 25.0000, 'target_measurement_unit_id' => $unitKg->id] // Karung 25kg
        );

        // 3. Telur Ayam
        $itemTelurAyam = \App\Models\ProductItem::firstOrCreate(
            ['product_id' => $prodTelur->id, 'name' => 'Telur Ayam'],
            ['is_active' => true]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemTelurAyam->id, 'measurement_unit_id' => $unitButir->id],
            ['is_base_unit' => true, 'conversion_rate' => 1.0000]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemTelurAyam->id, 'measurement_unit_id' => $unitRak->id],
            ['is_base_unit' => false, 'conversion_rate' => 30.0000, 'target_measurement_unit_id' => $unitButir->id] // 1 Rak = 30 Butir
        );

        // 4. Telur Ayam Kampung
        $itemTelurAyamKampung = \App\Models\ProductItem::firstOrCreate(
            ['product_id' => $prodTelur->id, 'name' => 'Telur Ayam Kampung'],
            ['is_active' => true]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemTelurAyamKampung->id, 'measurement_unit_id' => $unitButir->id],
            ['is_base_unit' => true, 'conversion_rate' => 1.0000]
        );
        \App\Models\ProductItemMeasurement::firstOrCreate(
            ['product_item_id' => $itemTelurAyamKampung->id, 'measurement_unit_id' => $unitRak->id],
            ['is_base_unit' => false, 'conversion_rate' => 30.0000, 'target_measurement_unit_id' => $unitButir->id] // 1 Rak = 30 Butir
        );

        // 5. Seed Branches
        $branchDago = \App\Models\Branch::firstOrCreate(
            ['name' => 'Nocturnal POS - Cabang Dago', 'business_id' => $business1->id],
            ['address' => 'Jl. Ir. H. Juanda No. 123, Coblong, Bandung', 'opening_time' => '08:00:00', 'end_time' => '22:00:00']
        );

        $branchPasteur = \App\Models\Branch::firstOrCreate(
            ['name' => 'Nocturnal POS - Cabang Pasteur', 'business_id' => $business1->id],
            ['address' => 'Jl. Dr. Djunjunan No. 45, Cicendo, Bandung', 'opening_time' => '09:00:00', 'end_time' => '21:00:00']
        );

        $branchSurabaya = \App\Models\Branch::firstOrCreate(
            ['name' => 'Global Retail POS - Cabang Surabaya', 'business_id' => $business2->id],
            ['address' => 'Jl. Raya Darmo No. 88, Tegalsari, Surabaya', 'opening_time' => '07:00:00', 'end_time' => '23:00:00']
        );

        // Link testuser to Dago & Pasteur branches
        if (!$user->branches()->where('branches.id', $branchDago->id)->exists()) {
            $user->branches()->attach($branchDago->id, ['role_id' => $adminRole->id]);
        }
        if (!$user->branches()->where('branches.id', $branchPasteur->id)->exists()) {
            $user->branches()->attach($branchPasteur->id, ['role_id' => $adminRole->id]);
        }

        // 6. Seed Suppliers
        $supSinarJaya = \App\Models\Supplier::firstOrCreate(
            ['name' => 'PT. Sinar Jaya Sembako'],
            [
                'contact_name' => 'Budi Santoso',
                'contact_phone' => '081234567890',
                'address' => 'Kawasan Industri Candi Blok A No. 5, Semarang',
                'description' => 'Supplier utama beras premium, gula pasir, dan minyak goreng.'
            ]
        );

        $supTaniMakmur = \App\Models\Supplier::firstOrCreate(
            ['name' => 'CV. Tani Makmur'],
            [
                'contact_name' => 'Joko Widodo',
                'contact_phone' => '081398765432',
                'address' => 'Jl. Tani Mulya No. 12, Klaten',
                'description' => 'Koperasi tani penyedia telur ayam berkualitas langsung dari peternak.'
            ]
        );

        $supSumberPangan = \App\Models\Supplier::firstOrCreate(
            ['name' => 'PT. Sumber Pangan Nusantara'],
            [
                'contact_name' => 'Hendra Wijaya',
                'contact_phone' => '081122334455',
                'address' => 'Kawasan Pergudangan Pluit Blok B-12, Jakarta Utara',
                'description' => 'Distributor sembako nasional dan bahan makanan pokok.'
            ]
        );

        // Sync suppliers to business
        if (!$supSinarJaya->businesses()->where('businesses.id', $business1->id)->exists()) {
            $supSinarJaya->businesses()->attach($business1->id);
        }
        if (!$supTaniMakmur->businesses()->where('businesses.id', $business1->id)->exists()) {
            $supTaniMakmur->businesses()->attach($business1->id);
        }
        if (!$supSumberPangan->businesses()->where('businesses.id', $business1->id)->exists()) {
            $supSumberPangan->businesses()->attach($business1->id);
        }

        // 7. Seed Purchase Receipts & Items
        // Get measurement mappings
        $measBerasMayangKg = \App\Models\ProductItemMeasurement::where('product_item_id', $itemBerasMayang->id)->where('measurement_unit_id', $unitKg->id)->first();
        $measBerasMayangKrg = \App\Models\ProductItemMeasurement::where('product_item_id', $itemBerasMayang->id)->where('measurement_unit_id', $unitKarung->id)->first();
        $measTelurAyamBtr = \App\Models\ProductItemMeasurement::where('product_item_id', $itemTelurAyam->id)->where('measurement_unit_id', $unitButir->id)->first();
        $measTelurAyamRak = \App\Models\ProductItemMeasurement::where('product_item_id', $itemTelurAyam->id)->where('measurement_unit_id', $unitRak->id)->first();
        $measBerasLopoIjoKg = \App\Models\ProductItemMeasurement::where('product_item_id', $itemBerasLopoIjo->id)->where('measurement_unit_id', $unitKg->id)->first();
        $measTelurAyamKampungBtr = \App\Models\ProductItemMeasurement::where('product_item_id', $itemTelurAyamKampung->id)->where('measurement_unit_id', $unitButir->id)->first();

        // Receipt 1: Confirmed (Produces inventory batches)
        $receipt1 = \App\Models\PurchaseReceipt::firstOrCreate(
            ['receipt_number' => 'PR-260601-001'],
            [
                'supplier_id' => $supSinarJaya->id,
                'branch_id' => $branchDago->id,
                'receipt_date' => '2026-06-01',
                'status' => 'Confirmed',
                'notes' => 'Penerimaan stok bulanan awal untuk Cabang Dago. Kualitas beras sangat baik.'
            ]
        );

        // Add items for Receipt 1
        $item1_1 = \App\Models\PurchaseReceiptItem::firstOrCreate(
            ['purchase_receipt_id' => $receipt1->id, 'product_item_measurement_id' => $measBerasMayangKg->id],
            ['quantity' => 200, 'unit_cost' => 12000.00, 'expired_date' => '2026-12-01']
        );
        $item1_2 = \App\Models\PurchaseReceiptItem::firstOrCreate(
            ['purchase_receipt_id' => $receipt1->id, 'product_item_measurement_id' => $measBerasMayangKrg->id],
            ['quantity' => 20, 'unit_cost' => 110000.00, 'expired_date' => '2026-12-01']
        );
        $item1_3 = \App\Models\PurchaseReceiptItem::firstOrCreate(
            ['purchase_receipt_id' => $receipt1->id, 'product_item_measurement_id' => $measTelurAyamBtr->id],
            ['quantity' => 1000, 'unit_cost' => 1500.00, 'expired_date' => '2026-06-30']
        );
        $item1_4 = \App\Models\PurchaseReceiptItem::firstOrCreate(
            ['purchase_receipt_id' => $receipt1->id, 'product_item_measurement_id' => $measTelurAyamRak->id],
            ['quantity' => 50, 'unit_cost' => 43000.00, 'expired_date' => '2026-06-30']
        );

        // Create inventory batches for Confirmed Receipt 1
        $batchNo1 = '2606011';
        \App\Models\InventoryBatch::firstOrCreate(
            ['purchase_receipt_item_id' => $item1_1->id],
            [
                'product_item_measurement_id' => $measBerasMayangKg->id,
                'batch_number' => $batchNo1,
                'initial_quantity' => 200,
                'current_quantity' => 200,
                'unit_cost' => 12000.00,
                'expired_date' => '2026-12-01',
                'status' => \App\Enums\InventoryBatchStatus::ACTIVE
            ]
        );
        \App\Models\InventoryBatch::firstOrCreate(
            ['purchase_receipt_item_id' => $item1_2->id],
            [
                'product_item_measurement_id' => $measBerasMayangKrg->id,
                'batch_number' => $batchNo1,
                'initial_quantity' => 20,
                'current_quantity' => 20,
                'unit_cost' => 110000.00,
                'expired_date' => '2026-12-01',
                'status' => \App\Enums\InventoryBatchStatus::ACTIVE
            ]
        );
        \App\Models\InventoryBatch::firstOrCreate(
            ['purchase_receipt_item_id' => $item1_3->id],
            [
                'product_item_measurement_id' => $measTelurAyamBtr->id,
                'batch_number' => $batchNo1,
                'initial_quantity' => 1000,
                'current_quantity' => 1000,
                'unit_cost' => 1500.00,
                'expired_date' => '2026-06-30',
                'status' => \App\Enums\InventoryBatchStatus::ACTIVE
            ]
        );
        \App\Models\InventoryBatch::firstOrCreate(
            ['purchase_receipt_item_id' => $item1_4->id],
            [
                'product_item_measurement_id' => $measTelurAyamRak->id,
                'batch_number' => $batchNo1,
                'initial_quantity' => 50,
                'current_quantity' => 50,
                'unit_cost' => 43000.00,
                'expired_date' => '2026-06-30',
                'status' => \App\Enums\InventoryBatchStatus::ACTIVE
            ]
        );

        // Receipt 2: Confirmed (Produces inventory batches)
        $receipt2 = \App\Models\PurchaseReceipt::firstOrCreate(
            ['receipt_number' => 'PR-260601-002'],
            [
                'supplier_id' => $supTaniMakmur->id,
                'branch_id' => $branchPasteur->id,
                'receipt_date' => '2026-06-01',
                'status' => 'Confirmed',
                'notes' => 'Penerimaan telur ayam kampung dan beras Lopo Ijo untuk Cabang Pasteur.'
            ]
        );

        // Add items for Receipt 2
        $item2_1 = \App\Models\PurchaseReceiptItem::firstOrCreate(
            ['purchase_receipt_id' => $receipt2->id, 'product_item_measurement_id' => $measBerasLopoIjoKg->id],
            ['quantity' => 150, 'unit_cost' => 13000.00, 'expired_date' => '2027-01-15']
        );
        $item2_2 = \App\Models\PurchaseReceiptItem::firstOrCreate(
            ['purchase_receipt_id' => $receipt2->id, 'product_item_measurement_id' => $measTelurAyamKampungBtr->id],
            ['quantity' => 500, 'unit_cost' => 2500.00, 'expired_date' => '2026-06-25']
        );

        // Create inventory batches for Confirmed Receipt 2
        $batchNo2 = '2606012';
        \App\Models\InventoryBatch::firstOrCreate(
            ['purchase_receipt_item_id' => $item2_1->id],
            [
                'product_item_measurement_id' => $measBerasLopoIjoKg->id,
                'batch_number' => $batchNo2,
                'initial_quantity' => 150,
                'current_quantity' => 150,
                'unit_cost' => 13000.00,
                'expired_date' => '2027-01-15',
                'status' => \App\Enums\InventoryBatchStatus::ACTIVE
            ]
        );
        \App\Models\InventoryBatch::firstOrCreate(
            ['purchase_receipt_item_id' => $item2_2->id],
            [
                'product_item_measurement_id' => $measTelurAyamKampungBtr->id,
                'batch_number' => $batchNo2,
                'initial_quantity' => 500,
                'current_quantity' => 500,
                'unit_cost' => 2500.00,
                'expired_date' => '2026-06-25',
                'status' => \App\Enums\InventoryBatchStatus::ACTIVE
            ]
        );

        // Receipt 3: Draft (Does not produce inventory batches)
        $receipt3 = \App\Models\PurchaseReceipt::firstOrCreate(
            ['receipt_number' => 'PR-260601-003'],
            [
                'supplier_id' => $supSumberPangan->id,
                'branch_id' => $branchDago->id,
                'receipt_date' => '2026-06-01',
                'status' => 'Draft',
                'notes' => 'Pengiriman beras Mayang tambahan dari PT. Sumber Pangan Nusantara.'
            ]
        );
        \App\Models\PurchaseReceiptItem::firstOrCreate(
            ['purchase_receipt_id' => $receipt3->id, 'product_item_measurement_id' => $measBerasMayangKg->id],
            ['quantity' => 100, 'unit_cost' => 12500.00, 'expired_date' => '2026-12-15']
        );

        // Update image URLs
        $itemBerasMayang->update(['image_url' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400']);
        $itemBerasLopoIjo->update(['image_url' => 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400']);
        $itemTelurAyam->update(['image_url' => 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400']);
        $itemTelurAyamKampung->update(['image_url' => 'https://images.unsplash.com/photo-1516448424440-9dbca97779c1?w=400']);

        // Create Price Tierings
        // 1. Beras Mayang Kg
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measBerasMayangKg->id, 'minimum' => 1],
            ['price' => 13000.00]
        );
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measBerasMayangKg->id, 'minimum' => 10],
            ['price' => 12500.00]
        );
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measBerasMayangKg->id, 'minimum' => 50],
            ['price' => 12000.00]
        );

        // 2. Beras Mayang Krg
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measBerasMayangKrg->id, 'minimum' => 1],
            ['price' => 125000.00]
        );
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measBerasMayangKrg->id, 'minimum' => 5],
            ['price' => 120000.00]
        );

        // 3. Telur Ayam Btr
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measTelurAyamBtr->id, 'minimum' => 1],
            ['price' => 2000.00]
        );
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measTelurAyamBtr->id, 'minimum' => 30],
            ['price' => 1800.00]
        );

        // 4. Telur Ayam Rak
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measTelurAyamRak->id, 'minimum' => 1],
            ['price' => 55000.00]
        );
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measTelurAyamRak->id, 'minimum' => 5],
            ['price' => 52000.00]
        );

        // 5. Beras Lopo Ijo Kg
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measBerasLopoIjoKg->id, 'minimum' => 1],
            ['price' => 14000.00]
        );
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measBerasLopoIjoKg->id, 'minimum' => 10],
            ['price' => 13500.00]
        );

        // 6. Telur Ayam Kampung Btr
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measTelurAyamKampungBtr->id, 'minimum' => 1],
            ['price' => 3000.00]
        );
        \App\Models\ProductPriceTiering::updateOrCreate(
            ['product_item_measurement_id' => $measTelurAyamKampungBtr->id, 'minimum' => 10],
            ['price' => 2800.00]
        );
    }
}
