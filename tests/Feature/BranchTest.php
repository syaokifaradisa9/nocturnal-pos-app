<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Branch;
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
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }

    $this->adminRole = Role::create(['name' => 'Admin']);
});

test('unauthorized users cannot view branches page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('branches.index'));

    $response->assertStatus(403);
});

test('users with Lihat Data Cabang Pribadi can only see branch from owned business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    $ownBranch = Branch::create(['name' => 'Own Branch', 'address' => 'Addr 1', 'business_id' => $ownBusiness->id]);
    $otherBranch = Branch::create(['name' => 'Other Branch', 'address' => 'Addr 2', 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('branches.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Own Branch');
});

test('users with Lihat Data Cabang Penanggungjawab Bisnis can see associated businesses branch', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Penanggungjawab Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);

    // Associate user
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $assocBranch = Branch::create(['name' => 'Assoc Branch', 'address' => 'Addr 1', 'business_id' => $assocBusiness->id]);
    $otherBranch = Branch::create(['name' => 'Other Branch', 'address' => 'Addr 2', 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)
        ->getJson(route('branches.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Assoc Branch');
});

test('users with Lihat Data Cabang Keseluruhan can see all branches', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);
    Branch::create(['name' => 'Branch 1', 'address' => 'Addr 1', 'business_id' => $business->id]);
    Branch::create(['name' => 'Branch 2', 'address' => 'Addr 2', 'business_id' => $business->id]);

    $response = $this->actingAs($user)
        ->getJson(route('branches.datatable'));

    $response->assertOk();
    $data = $response->json('data');

    expect($data)->toHaveCount(2);
});

test('users can create branch associated with owned business automatically if having Tambah Data Cabang Pribadi', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Cabang Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('branches.store'), [
        'name' => 'Auto Branch',
        'address' => 'Branch address',
    ]);

    $response->assertRedirect(route('branches.index'));
    $this->assertDatabaseHas('branches', [
        'name' => 'Auto Branch',
        'business_id' => $ownBusiness->id,
    ]);
});

test('users can create branch associated with single associated business automatically if having Tambah Data Cabang Penanggungjawab Bisnis', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Cabang Penanggungjawab Bisnis']);

    $assocBusiness = Business::create(['name' => 'Assoc Business', 'user_id' => null]);
    $user->businesses()->attach($assocBusiness->id, ['role_id' => $this->adminRole->id]);

    $response = $this->actingAs($user)->post(route('branches.store'), [
        'name' => 'Assoc Auto Branch',
        'address' => 'Branch address',
    ]);

    $response->assertRedirect(route('branches.index'));
    $this->assertDatabaseHas('branches', [
        'name' => 'Assoc Auto Branch',
        'business_id' => $assocBusiness->id,
    ]);
});

test('admins can create branch and select any business if having Tambah Data Cabang Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Cabang Keseluruhan', 'Lihat Data Cabang Keseluruhan']);

    $business = Business::create(['name' => 'Any Business', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('branches.store'), [
        'name' => 'Admin Selected Branch',
        'address' => 'Selected address',
        'business_id' => $business->id,
    ]);

    $response->assertRedirect(route('branches.index'));
    $this->assertDatabaseHas('branches', [
        'name' => 'Admin Selected Branch',
        'business_id' => $business->id,
    ]);
});

test('users with Edit Data Cabang Pribadi can update their branch', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Cabang Pribadi']);

    $ownBusiness = Business::create(['name' => 'Own Business', 'user_id' => $user->id]);
    $branch = Branch::create(['name' => 'Original Name', 'address' => 'Old Addr', 'business_id' => $ownBusiness->id]);

    $response = $this->actingAs($user)->put(route('branches.update', $branch->id), [
        'name' => 'Updated Name',
        'address' => 'New Addr',
    ]);

    $response->assertRedirect(route('branches.index'));
    $this->assertDatabaseHas('branches', [
        'id' => $branch->id,
        'name' => 'Updated Name',
        'address' => 'New Addr',
    ]);
});

test('users with Edit Data Cabang Pribadi cannot update other branch', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Cabang Pribadi']);

    $otherBusiness = Business::create(['name' => 'Other Business', 'user_id' => null]);
    $branch = Branch::create(['name' => 'Original Name', 'address' => 'Old Addr', 'business_id' => $otherBusiness->id]);

    $response = $this->actingAs($user)->put(route('branches.update', $branch->id), [
        'name' => 'Updated Name',
        'address' => 'New Addr',
    ]);

    $response->assertStatus(403);
});

test('users can delete branch if they have permission', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Cabang Keseluruhan']);

    $business = Business::create(['name' => 'Business', 'user_id' => null]);
    $branch = Branch::create(['name' => 'Branch to Delete', 'address' => 'Addr', 'business_id' => $business->id]);

    $response = $this->actingAs($user)->delete(route('branches.destroy', $branch->id));

    $response->assertRedirect(route('branches.index'));
    $this->assertSoftDeleted('branches', ['id' => $branch->id]);
});
