<?php

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Seed standard permissions
    $permissions = [
        'Lihat Data Role Permisison',
        'Tambah Data Role Permisison',
        'Edit Data Role Permisison',
        'Hapus Data Role Permission',
        'Lihat Data Produk Keseluruhan',
        'Tambah Data Produk Keseluruhan',
    ];

    foreach ($permissions as $perm) {
        Permission::create(['name' => $perm]);
    }
});

test('unauthorized users cannot view roles page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('roles.index'));

    $response->assertStatus(403);
});

test('authorized users can view roles datatable', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Role Permisison']);

    $role = Role::create(['name' => 'Cashier', 'description' => 'Cashier Role']);

    $response = $this->actingAs($user)->getJson(route('roles.datatable'));

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Cashier');
});

test('authorized users can create role with permissions', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Role Permisison']);

    $permission = Permission::where('name', 'Lihat Data Produk Keseluruhan')->first();

    $response = $this->actingAs($user)->post(route('roles.store'), [
        'name' => 'Manager',
        'description' => 'Manager Role Description',
        'permission_ids' => [$permission->id]
    ]);

    $response->assertRedirect(route('roles.index'));
    $this->assertDatabaseHas('roles', [
        'name' => 'Manager',
        'description' => 'Manager Role Description'
    ]);

    $role = Role::where('name', 'Manager')->first();
    expect($role->permissions->first()->id)->toBe($permission->id);
});

test('authorized users can update role details and permissions', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Role Permisison']);

    $role = Role::create(['name' => 'Old Role Name']);
    $permission = Permission::where('name', 'Lihat Data Produk Keseluruhan')->first();

    $response = $this->actingAs($user)->put(route('roles.update', $role->id), [
        'name' => 'New Role Name',
        'description' => 'New Description',
        'permission_ids' => [$permission->id]
    ]);

    $response->assertRedirect(route('roles.index'));
    $this->assertDatabaseHas('roles', [
        'id' => $role->id,
        'name' => 'New Role Name',
        'description' => 'New Description'
    ]);

    $role->refresh();
    expect($role->permissions->first()->id)->toBe($permission->id);
});

test('authorized users can delete role', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Role Permission']);

    $role = Role::create(['name' => 'Role to Delete']);

    $response = $this->actingAs($user)->delete(route('roles.destroy', $role->id));

    $response->assertRedirect(route('roles.index'));
    $this->assertDatabaseMissing('roles', ['id' => $role->id]);
});
