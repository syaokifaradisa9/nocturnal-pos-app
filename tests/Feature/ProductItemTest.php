<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\ProductItem;
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
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
});

test('unauthorized users cannot view product items page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('product_items.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Item Produk Pribadi can only see products from owned business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Item Produk Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $ownProduct = Product::create(['name' => 'Own Product']);
    $ownProduct->businesses()->attach($ownBusiness->id);

    $otherProduct = Product::create(['name' => 'Other Product']);
    $otherProduct->businesses()->attach($otherBusiness->id);

    $response = $this->actingAs($user)
        ->getJson(route('product_items.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Own Product');
});

test('users can create product item and select business if having Tambah Data Item Produk Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Item Produk Keseluruhan', 'Lihat Data Item Produk Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);
    $product = Product::create(['name' => 'Existing Product']);
    $product->businesses()->attach($business->id);

    $unit = ProductUnit::create([
        'name' => 'Pieces',
        'short_name' => 'Pcs',
        'business_id' => $business->id,
    ]);

    $response = $this->actingAs($admin)->post(route('product_items.store'), [
        'product_id' => $product->id,
        'items' => [
            [
                'measurement_unit_id' => $unit->id,
                'is_base_unit' => true,
                'conversion_rate' => 1,
            ]
        ]
    ]);

    $response->assertRedirect(route('product_items.index'));
    $this->assertDatabaseHas('product_items', [
        'product_id' => $product->id,
        'measurement_unit_id' => $unit->id,
        'is_base_unit' => true,
        'conversion_rate' => 1.0000,
    ]);
});

test('users can update product item and packages', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Item Produk Keseluruhan', 'Lihat Data Item Produk Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);
    $unit1 = ProductUnit::create([
        'name' => 'Pieces',
        'short_name' => 'Pcs',
        'business_id' => $business->id,
    ]);
    $unit2 = ProductUnit::create([
        'name' => 'Boxes',
        'short_name' => 'Box',
        'business_id' => $business->id,
    ]);

    $product = Product::create(['name' => 'Original Name']);
    $product->businesses()->attach($business->id);

    $item = ProductItem::create([
        'product_id' => $product->id,
        'measurement_unit_id' => $unit1->id,
        'is_base_unit' => true,
        'conversion_rate' => 1.0000,
    ]);

    $response = $this->actingAs($admin)->put(route('product_items.update', $product->id), [
        'product_id' => $product->id,
        'items' => [
            [
                'measurement_unit_id' => $unit1->id,
                'is_base_unit' => true,
                'conversion_rate' => 1,
            ],
            [
                'measurement_unit_id' => $unit2->id,
                'is_base_unit' => false,
                'conversion_rate' => 24,
            ]
        ]
    ]);

    $response->assertRedirect(route('product_items.index'));
    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Original Name',
    ]);

    $this->assertDatabaseHas('product_items', [
        'product_id' => $product->id,
        'measurement_unit_id' => $unit2->id,
        'is_base_unit' => false,
        'conversion_rate' => 24.0000,
    ]);
});

test('users can delete product item', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Item Produk Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);
    $product = Product::create(['name' => 'Product to Delete']);
    $product->businesses()->attach($business->id);

    $response = $this->actingAs($admin)->delete(route('product_items.destroy', $product->id));

    $response->assertRedirect(route('product_items.index'));
    $this->assertSoftDeleted('products', ['id' => $product->id]);
});
