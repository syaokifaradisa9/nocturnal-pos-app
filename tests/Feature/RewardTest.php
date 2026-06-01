<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Reward;
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
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
});

test('unauthorized users cannot view rewards page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('rewards.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Reward Pribadi can only see rewards from owned business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $ownReward = Reward::create(['name' => 'Free Coffee', 'description' => 'A cup of espresso', 'minimum_point' => 50, 'business_id' => $ownBusiness->id]);
    $otherReward = Reward::create(['name' => 'Discount 10%', 'description' => 'Shopping discount', 'minimum_point' => 100, 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('rewards.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Free Coffee');
});

test('users with Lihat Data Reward Penempatan Bisnis can see associated businesses rewards', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Penempatan Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    // Associate user
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $assocReward = Reward::create(['name' => 'Free Coffee', 'description' => 'A cup of espresso', 'minimum_point' => 50, 'business_id' => $assocBusiness->id]);
    $otherReward = Reward::create(['name' => 'Discount 10%', 'description' => 'Shopping discount', 'minimum_point' => 100, 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('rewards.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Free Coffee');
});

test('users with Lihat Data Reward Keseluruhan can see all rewards', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);

    Reward::create(['name' => 'Free Coffee', 'description' => 'A cup of espresso', 'minimum_point' => 50, 'business_id' => $business->id]);
    Reward::create(['name' => 'Discount 10%', 'description' => 'Shopping discount', 'minimum_point' => 100, 'business_id' => $business->id]);

    $response = $this->actingAs($user)
        ->getJson(route('rewards.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
});

test('admins can create reward and select any business if having Tambah Data Reward Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Reward Keseluruhan', 'Lihat Data Reward Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('rewards.store'), [
        'name' => 'T-Shirt',
        'description' => 'Exclusive merchandise',
        'minimum_point' => 120,
        'business_id' => $business->id,
    ]);

    $response->assertRedirect(route('rewards.index'));
    $this->assertDatabaseHas('rewards', [
        'name' => 'T-Shirt',
        'description' => 'Exclusive merchandise',
        'minimum_point' => 120,
        'business_id' => $business->id,
    ]);
});

test('admins can fetch businesses by owner id for reward form', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Reward Keseluruhan']);

    $owner = User::factory()->create();
    $business = Business::create(['name' => 'Owner Business', 'user_id' => $owner->id]);

    $response = $this->actingAs($admin)
        ->getJson(route('rewards.owner_businesses', ['user_id' => $owner->id]));

    $response->assertOk();
    $data = $response->json();
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Owner Business');
});
