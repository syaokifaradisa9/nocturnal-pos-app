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
            ['is_base_unit' => false, 'conversion_rate' => 10.0000] // Karung 10kg
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
            ['is_base_unit' => false, 'conversion_rate' => 25.0000] // Karung 25kg
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
            ['is_base_unit' => false, 'conversion_rate' => 30.0000] // 1 Rak = 30 Butir
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
            ['is_base_unit' => false, 'conversion_rate' => 30.0000] // 1 Rak = 30 Butir
        );
    }
}
