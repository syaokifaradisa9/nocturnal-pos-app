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
        ];

        foreach ($permissions as $permissionName) {
            Permission::updateOrCreate(
                ['name' => $permissionName],
                ['description' => 'Izin untuk ' . $permissionName]
            );
        }

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'username' => 'testuser',
            'password' => Hash::make('password'),
        ]);

        // Assign all permissions directly to the test user
        $user->assignPermissions($permissions);

        // Create a default role
        $adminRole = \App\Models\Role::firstOrCreate(
            ['name' => 'Admin'],
            ['description' => 'Administrator role']
        );

        // Seed some sample businesses
        $business1 = Business::create([
            'user_id' => $user->id,
            'name' => 'Nocturnal Studio',
            'description' => 'Bisnis pribadi yang berfokus pada software development.',
        ]);

        $business2 = Business::create([
            'user_id' => null,
            'name' => 'Global Retail POS',
            'description' => 'Bisnis retail waralaba berskala nasional.',
        ]);

        // Link Test User to Business 1 (makes it "Pribadi") via pivot table
        $user->businesses()->attach($business1->id, ['role_id' => $adminRole->id]);
    }
}
