<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Product;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;

use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed standard permissions
    $permissions = [
        'Lihat Data Bisnis Pribadi',
        'Lihat Data Bisnis Keseluruhan',
        'Tambah Data Bisnis Pribadi',
        'Tambah Data Bisnis Keseluruhan',

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
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
});


test('unauthorized users cannot view products page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('products.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Produk Pribadi can only see products from owned business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Produk Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $ownProduct = Product::create(['name' => 'Own Product']);
    $ownProduct->businesses()->attach($ownBusiness->id);

    $otherProduct = Product::create(['name' => 'Other Product']);
    $otherProduct->businesses()->attach($otherBusiness->id);

    $response = $this->actingAs($user)
        ->getJson(route('products.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Own Product');
});

test('users with Lihat Data Produk Penempatan Bisnis can see associated businesses products', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Produk Penempatan Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    // Associate user
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $assocProduct = Product::create(['name' => 'Assoc Product']);
    $assocProduct->businesses()->attach($assocBusiness->id);

    $otherProduct = Product::create(['name' => 'Other Product']);
    $otherProduct->businesses()->attach($otherBusiness->id);

    $response = $this->actingAs($user)
        ->getJson(route('products.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Assoc Product');
});

test('users with Lihat Data Produk Keseluruhan can see all products', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Produk Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);

    $product1 = Product::create(['name' => 'Product 1']);
    $product1->businesses()->attach($business->id);

    $product2 = Product::create(['name' => 'Product 2']);
    $product2->businesses()->attach($business->id);

    $response = $this->actingAs($user)
        ->getJson(route('products.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
});

test('users can create product associated with owned business automatically if having Tambah Data Produk Pribadi', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Produk Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('products.store'), [
        'name' => 'Auto Product',
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseHas('products', [
        'name' => 'Auto Product',
    ]);

    $product = Product::where('name', 'Auto Product')->first();
    expect($product->businesses->first()->id)->toBe($ownBusiness->id);
});

test('users can create product associated with single associated business automatically if having Tambah Data Produk Penempatan Bisnis', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Produk Penempatan Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $response = $this->actingAs($user)->post(route('products.store'), [
        'name' => 'Assoc Auto Product',
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseHas('products', [
        'name' => 'Assoc Auto Product',
    ]);

    $product = Product::where('name', 'Assoc Auto Product')->first();
    expect($product->businesses->first()->id)->toBe($assocBusiness->id);
});

test('admins can create product and select any business if having Tambah Data Produk Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Produk Keseluruhan', 'Lihat Data Produk Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('products.store'), [
        'name' => 'Admin Selected Product',
        'business_ids' => [$business->id],
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseHas('products', [
        'name' => 'Admin Selected Product',
    ]);

    $product = Product::where('name', 'Admin Selected Product')->first();
    expect($product->businesses->first()->id)->toBe($business->id);
});

test('users with Edit Data Produk Pribadi can update their product name', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Produk Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $product = Product::create(['name' => 'Original Name']);
    $product->businesses()->attach($ownBusiness->id);

    $response = $this->actingAs($user)->put(route('products.update', $product->id), [
        'name' => 'Updated Name',
    ]);

    $response->assertRedirect(route('products.index'));
    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'name' => 'Updated Name',
    ]);
});

test('users with Edit Data Produk Pribadi cannot update other product name', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Produk Pribadi']);

    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);
    $product = Product::create(['name' => 'Original Name']);
    $product->businesses()->attach($otherBusiness->id);

    $response = $this->actingAs($user)->put(route('products.update', $product->id), [
        'name' => 'Updated Name',
    ]);

    $response->assertStatus(403);
});

test('users can delete product if they have permission', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Produk Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);
    $product = Product::create(['name' => 'Product to Delete']);
    $product->businesses()->attach($business->id);

    $response = $this->actingAs($user)->delete(route('products.destroy', $product->id));

    $response->assertRedirect(route('products.index'));
    $this->assertSoftDeleted('products', ['id' => $product->id]);
});
