<?php

use App\Models\User;
use App\Models\Business;
use App\Models\ProductUnit;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed standard permissions
    $permissions = [
        'Lihat Data Bisnis Pribadi',
        'Lihat Data Bisnis Keseluruhan',
        'Tambah Data Bisnis Pribadi',
        'Tambah Data Bisnis Keseluruhan',

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
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
});

test('unauthorized users cannot view product units page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('product_units.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Satuan Produk Pribadi can only see units from owned business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $ownUnit = ProductUnit::create(['name' => 'Kilogram', 'short_name' => 'Kg', 'description' => 'Weight', 'allow_decimal' => true, 'business_id' => $ownBusiness->id]);
    $otherUnit = ProductUnit::create(['name' => 'Piece', 'short_name' => 'Pcs', 'description' => 'Quantity', 'allow_decimal' => false, 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('product_units.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Kilogram');
});

test('users with Lihat Data Satuan Produk Penempatan Bisnis can see associated businesses units', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Penempatan Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    // Associate user
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $assocUnit = ProductUnit::create(['name' => 'Kilogram', 'short_name' => 'Kg', 'description' => 'Weight', 'allow_decimal' => true, 'business_id' => $assocBusiness->id]);
    $otherUnit = ProductUnit::create(['name' => 'Piece', 'short_name' => 'Pcs', 'description' => 'Quantity', 'allow_decimal' => false, 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('product_units.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Kilogram');
});

test('users with Lihat Data Satuan Produk Keseluruhan can see all units', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);

    ProductUnit::create(['name' => 'Kilogram', 'short_name' => 'Kg', 'description' => 'Weight', 'allow_decimal' => true, 'business_id' => $business->id]);
    ProductUnit::create(['name' => 'Piece', 'short_name' => 'Pcs', 'description' => 'Quantity', 'allow_decimal' => false, 'business_id' => $business->id]);

    $response = $this->actingAs($user)
        ->getJson(route('product_units.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
});

test('admins can create product unit and select any business if having Tambah Data Satuan Produk Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Satuan Produk Keseluruhan', 'Lihat Data Satuan Produk Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('product_units.store'), [
        'name' => 'Gram',
        'short_name' => 'g',
        'description' => 'Weight Gram',
        'allow_decimal' => true,
        'business_id' => $business->id,
    ]);

    $response->assertRedirect(route('product_units.index'));
    $this->assertDatabaseHas('product_units', [
        'name' => 'Gram',
        'short_name' => 'g',
        'allow_decimal' => true,
        'business_id' => $business->id,
    ]);
});

test('admins can fetch businesses by owner id for product unit form', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Satuan Produk Keseluruhan']);

    $owner = User::factory()->create();
    $business = Business::create(['name' => 'Owner Business', 'user_id' => $owner->id]);

    $response = $this->actingAs($admin)
        ->getJson(route('product_units.owner_businesses', ['user_id' => $owner->id]));

    $response->assertOk();
    $data = $response->json();
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Owner Business');
});
