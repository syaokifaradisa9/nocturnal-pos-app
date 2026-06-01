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
    }
}
