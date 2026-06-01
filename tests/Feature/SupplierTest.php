<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Supplier;
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
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
});

test('unauthorized users cannot view suppliers page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('suppliers.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Supplier Pribadi can only see suppliers from owned business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $ownSupplier = Supplier::create(['name' => 'Own Supplier']);
    $ownSupplier->businesses()->attach($ownBusiness->id);

    $otherSupplier = Supplier::create(['name' => 'Other Supplier']);
    $otherSupplier->businesses()->attach($otherBusiness->id);

    $response = $this->actingAs($user)
        ->getJson(route('suppliers.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Own Supplier');
});

test('users with Lihat Data Supplier Penempatan Bisnis can see associated businesses suppliers', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Penempatan Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    // Associate user
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $assocSupplier = Supplier::create(['name' => 'Assoc Supplier']);
    $assocSupplier->businesses()->attach($assocBusiness->id);

    $otherSupplier = Supplier::create(['name' => 'Other Supplier']);
    $otherSupplier->businesses()->attach($otherBusiness->id);

    $response = $this->actingAs($user)
        ->getJson(route('suppliers.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Assoc Supplier');
});

test('users with Lihat Data Supplier Keseluruhan can see all suppliers', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);

    $supplier1 = Supplier::create(['name' => 'Supplier 1']);
    $supplier1->businesses()->attach($business->id);

    $supplier2 = Supplier::create(['name' => 'Supplier 2']);
    $supplier2->businesses()->attach($business->id);

    $response = $this->actingAs($user)
        ->getJson(route('suppliers.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
});

test('admins can create supplier and select any business if having Tambah Data Supplier Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Supplier Keseluruhan', 'Lihat Data Supplier Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('suppliers.store'), [
        'name' => 'Admin Selected Supplier',
        'contact_name' => 'John Doe',
        'contact_phone' => '0812345678',
        'address' => 'Jakarta',
        'description' => 'Supplier Desk',
        'business_ids' => [$business->id],
    ]);

    $response->assertRedirect(route('suppliers.index'));
    $this->assertDatabaseHas('suppliers', [
        'name' => 'Admin Selected Supplier',
        'contact_name' => 'John Doe',
    ]);

    $supplier = Supplier::where('name', 'Admin Selected Supplier')->first();
    expect($supplier->businesses->first()->id)->toBe($business->id);
});

test('admins can fetch businesses by owner id for supplier form', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Supplier Keseluruhan']);

    $owner = User::factory()->create();
    $business = Business::create(['name' => 'Owner Business', 'user_id' => $owner->id]);

    $response = $this->actingAs($admin)
        ->getJson(route('suppliers.owner_businesses', ['user_id' => $owner->id]));

    $response->assertOk();
    $data = $response->json();
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Owner Business');
});
