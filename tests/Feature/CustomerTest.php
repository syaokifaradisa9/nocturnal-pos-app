<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Customer;
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

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
});

test('unauthorized users cannot view customers page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('customers.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Customer Pribadi can only see customers from owned business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $ownCustomer = Customer::create(['name' => 'Own Customer', 'phone' => '1234', 'current_point' => 10, 'business_id' => $ownBusiness->id]);
    $otherCustomer = Customer::create(['name' => 'Other Customer', 'phone' => '5678', 'current_point' => 20, 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('customers.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Own Customer');
});

test('users with Lihat Data Customer Penempatan Bisnis can see associated businesses customers', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Penempatan Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    // Associate user
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $assocCustomer = Customer::create(['name' => 'Assoc Customer', 'phone' => '1234', 'current_point' => 10, 'business_id' => $assocBusiness->id]);
    $otherCustomer = Customer::create(['name' => 'Other Customer', 'phone' => '5678', 'current_point' => 20, 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('customers.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Assoc Customer');
});

test('users with Lihat Data Customer Keseluruhan can see all customers', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);

    Customer::create(['name' => 'Customer 1', 'phone' => '123', 'current_point' => 0, 'business_id' => $business->id]);
    Customer::create(['name' => 'Customer 2', 'phone' => '456', 'current_point' => 0, 'business_id' => $business->id]);

    $response = $this->actingAs($user)
        ->getJson(route('customers.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
});

test('admins can create customer and select any business if having Tambah Data Customer Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Customer Keseluruhan', 'Lihat Data Customer Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('customers.store'), [
        'name' => 'Admin Selected Customer',
        'phone' => '0812345678',
        'current_point' => 50,
        'business_id' => $business->id,
    ]);

    $response->assertRedirect(route('customers.index'));
    $this->assertDatabaseHas('customers', [
        'name' => 'Admin Selected Customer',
        'phone' => '0812345678',
        'current_point' => 50,
        'business_id' => $business->id,
    ]);
});

test('admins can fetch businesses by owner id for customer form', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Customer Keseluruhan']);

    $owner = User::factory()->create();
    $business = Business::create(['name' => 'Owner Business', 'user_id' => $owner->id]);

    $response = $this->actingAs($admin)
        ->getJson(route('customers.owner_businesses', ['user_id' => $owner->id]));

    $response->assertOk();
    $data = $response->json();
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Owner Business');
});
