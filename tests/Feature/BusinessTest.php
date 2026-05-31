<?php

use App\Models\User;
use App\Models\Business;
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
        'Edit Data Bisnis Pribadi',
        'Edit Data Bisnis Keseluruhan',
        'Hapus Data Bisnis Pribadi',
        'Hapus Data Bisnis Keseluruhan',
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
    $viewOwnPermission = Permission::where('name', 'Lihat Data Bisnis Pribadi')->first();
    $this->adminRole->permissions()->attach($viewOwnPermission->id);
});

test('unauthorized users cannot view businesses page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('businesses.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Bisnis Pribadi can only see their own business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $response = $this->actingAs($user)
        ->getJson(route('businesses.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Own Business');
});

test('users with Lihat Data Bisnis Keseluruhan can see all businesses', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $response = $this->actingAs($user)
        ->getJson(route('businesses.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
});

test('users can create business and it gets automatically associated to them', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Bisnis Pribadi']);

    $response = $this->actingAs($user)->post(route('businesses.store'), [
        'name' => 'New Business',
        'description' => 'New description'
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', ['name' => 'New Business', 'user_id' => $user->id]);

    $business = Business::where('name', 'New Business')->first();
    expect($user->businesses()->where('businesses.id', $business->id)->exists())->toBeTrue();
});

test('admins can create business for another user and that user gets associated', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Bisnis Keseluruhan', 'Lihat Data Bisnis Keseluruhan']);

    $otherUser = User::factory()->create();

    $response = $this->actingAs($admin)->post(route('businesses.store'), [
        'name' => 'Admin Created Business',
        'description' => 'Admin description',
        'user_id' => $otherUser->id
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', ['name' => 'Admin Created Business', 'user_id' => $otherUser->id]);

    $business = Business::where('name', 'Admin Created Business')->first();
    // The other user should be associated with the business
    expect($otherUser->businesses()->where('businesses.id', $business->id)->exists())->toBeTrue();
    // The admin should NOT be associated with the business
    expect($admin->businesses()->where('businesses.id', $business->id)->exists())->toBeFalse();
});

test('users cannot update other businesses if they only have Edit Data Bisnis Pribadi', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Bisnis Pribadi']);

    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $response = $this->actingAs($user)->put(route('businesses.update', $otherBusiness->id), [
        'name' => 'Updated Name'
    ]);

    $response->assertStatus(403);
});

test('users can update their own business if they have Edit Data Bisnis Pribadi', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Bisnis Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->put(route('businesses.update', $ownBusiness->id), [
        'name' => 'Updated Name'
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', [
        'id' => $ownBusiness->id,
        'name' => 'Updated Name'
    ]);
});

test('users with Edit Data Bisnis Keseluruhan can update any business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Bisnis Keseluruhan']);

    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $response = $this->actingAs($user)->put(route('businesses.update', $otherBusiness->id), [
        'name' => 'Updated Name'
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', [
        'id' => $otherBusiness->id,
        'name' => 'Updated Name'
    ]);
});

test('users can soft delete business and retrieve it with softDeletes behavior', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Bisnis Keseluruhan']);

    $business = Business::create(['name' => 'Business to Delete', 'user_id' => null]);

    $response = $this->actingAs($user)->delete(route('businesses.destroy', $business->id));

    $response->assertRedirect(route('businesses.index'));
    $this->assertSoftDeleted('businesses', ['id' => $business->id]);
});
