<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Supplier;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

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
        Permission::firstOrCreate(['name' => $perm]);
    }

    $this->adminRole = Role::firstOrCreate(['name' => 'Admin']);
    $viewOwnPermission = Permission::where('name', 'Lihat Data Bisnis Pribadi')->first();
    $this->adminRole->permissions()->syncWithoutDetaching([$viewOwnPermission->id]);
});

// Requirement 1: Access control for view permissions
test('users with appropriate permission can access /suppliers endpoints', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Lihat Data Supplier Pribadi']);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Lihat Data Supplier Penempatan Bisnis']);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $unauthorized = User::factory()->create();

    foreach ([$user1, $user2, $user3] as $user) {
        $this->actingAs($user)->get(route('suppliers.index'))->assertOk();
        $this->actingAs($user)->getJson(route('suppliers.datatable'))->assertOk();
        $this->actingAs($user)->get(route('suppliers.print.pdf'))->assertOk();
        $this->actingAs($user)->get(route('suppliers.print.excel'))->assertOk();
    }

    $this->actingAs($unauthorized)->get(route('suppliers.index'))->assertStatus(403);
    $this->actingAs($unauthorized)->getJson(route('suppliers.datatable'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('suppliers.print.pdf'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('suppliers.print.excel'))->assertStatus(403);
});

// Requirement 2: Access control for store action
test('users with appropriate permission can access store action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Tambah Data Supplier Pribadi', 'Lihat Data Supplier Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Tambah Data Supplier Penempatan Bisnis', 'Lihat Data Supplier Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Tambah Data Supplier Keseluruhan', 'Lihat Data Supplier Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test store
    $this->actingAs($user1)->post(route('suppliers.store'), [
        'name' => 'Supplier 1',
        'contact_name' => 'CN 1',
        'contact_phone' => '081',
        'address' => 'Addr 1',
        'description' => 'Desc 1',
        'business_ids' => [$biz1->id]
    ])->assertRedirect(route('suppliers.index'));

    $this->actingAs($user2)->post(route('suppliers.store'), [
        'name' => 'Supplier 2',
        'contact_name' => 'CN 2',
        'contact_phone' => '082',
        'address' => 'Addr 2',
        'description' => 'Desc 2',
        'business_ids' => [$biz2->id]
    ])->assertRedirect(route('suppliers.index'));

    $this->actingAs($user3)->post(route('suppliers.store'), [
        'name' => 'Supplier 3',
        'contact_name' => 'CN 3',
        'contact_phone' => '083',
        'address' => 'Addr 3',
        'description' => 'Desc 3',
        'business_ids' => [$biz1->id]
    ])->assertRedirect(route('suppliers.index'));

    $this->actingAs($unauthorized)->post(route('suppliers.store'), [
        'name' => 'Supplier 4',
        'contact_name' => 'CN 4',
        'contact_phone' => '084',
        'address' => 'Addr 4',
        'description' => 'Desc 4',
        'business_ids' => [$biz1->id]
    ])->assertStatus(403);
});

// Requirement 3: Access control for update action
test('users with appropriate permission can access update action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Edit Data Supplier Pribadi', 'Lihat Data Supplier Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $supplier1 = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C1', 'contact_phone' => '081', 'address' => 'A1', 'description' => 'D1'
    ]);
    $supplier1->businesses()->attach($biz1->id);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Edit Data Supplier Penempatan Bisnis', 'Lihat Data Supplier Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $supplier2 = Supplier::create([
        'name' => 'S2', 'contact_name' => 'C2', 'contact_phone' => '082', 'address' => 'A2', 'description' => 'D2'
    ]);
    $supplier2->businesses()->attach($biz2->id);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Edit Data Supplier Keseluruhan', 'Lihat Data Supplier Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test updates
    $this->actingAs($user1)->put(route('suppliers.update', $supplier1->id), [
        'name' => 'Updated 1', 'contact_name' => 'C1', 'contact_phone' => '081', 'address' => 'A1', 'description' => 'D1', 'business_ids' => [$biz1->id]
    ])->assertRedirect(route('suppliers.index'));

    $this->actingAs($user2)->put(route('suppliers.update', $supplier2->id), [
        'name' => 'Updated 2', 'contact_name' => 'C2', 'contact_phone' => '082', 'address' => 'A2', 'description' => 'D2', 'business_ids' => [$biz2->id]
    ])->assertRedirect(route('suppliers.index'));

    $this->actingAs($user3)->put(route('suppliers.update', $supplier1->id), [
        'name' => 'Updated 3', 'contact_name' => 'C1', 'contact_phone' => '081', 'address' => 'A1', 'description' => 'D1', 'business_ids' => [$biz1->id]
    ])->assertRedirect(route('suppliers.index'));

    $this->actingAs($unauthorized)->put(route('suppliers.update', $supplier1->id), [
        'name' => 'Fail', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D', 'business_ids' => [$biz1->id]
    ])->assertStatus(403);
});

// Requirement 4: Access control for delete action
test('users with appropriate permission can delete suppliers', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Hapus Data Supplier Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $supplier1 = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C1', 'contact_phone' => '081', 'address' => 'A1', 'description' => 'D1'
    ]);
    $supplier1->businesses()->attach($biz1->id);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Hapus Data Supplier Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $supplier2 = Supplier::create([
        'name' => 'S2', 'contact_name' => 'C2', 'contact_phone' => '082', 'address' => 'A2', 'description' => 'D2'
    ]);
    $supplier2->businesses()->attach($biz2->id);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Hapus Data Supplier Keseluruhan']);
    $supplier3 = Supplier::create([
        'name' => 'S3', 'contact_name' => 'C3', 'contact_phone' => '083', 'address' => 'A3', 'description' => 'D3'
    ]);
    $supplier3->businesses()->attach($biz1->id);

    $unauthorized = User::factory()->create();

    // Test delete
    $this->actingAs($user1)->delete(route('suppliers.destroy', $supplier1->id))->assertRedirect(route('suppliers.index'));
    $this->actingAs($user2)->delete(route('suppliers.destroy', $supplier2->id))->assertRedirect(route('suppliers.index'));
    $this->actingAs($user3)->delete(route('suppliers.destroy', $supplier3->id))->assertRedirect(route('suppliers.index'));

    $supplier4 = Supplier::create([
        'name' => 'S4', 'contact_name' => 'C4', 'contact_phone' => '084', 'address' => 'A4', 'description' => 'D4'
    ]);
    $supplier4->businesses()->attach($biz1->id);
    $this->actingAs($unauthorized)->delete(route('suppliers.destroy', $supplier4->id))->assertStatus(403);
});

// Requirement 5: Fields in datatable response for Lihat Data Supplier Keseluruhan
test('users with Lihat Data Supplier Keseluruhan datatable response contains exactly specific attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    $supplier = Supplier::create([
        'name' => 'S', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($biz->id);

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'contact_name', 'contact_phone', 'address', 'description', 'business_names', 'business_ids', 'owner_id', 'owner_name'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 6: Fields in datatable response for Lihat Data Supplier Pribadi
test('users with Lihat Data Supplier Pribadi datatable response contains exactly specific attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Pribadi']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    $supplier = Supplier::create([
        'name' => 'S', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($biz->id);

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'contact_name', 'contact_phone', 'address', 'description', 'business_ids', 'business_names', 'owner_id'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 7: Fields in datatable response for Lihat Data Supplier Penempatan Bisnis
test('users with Lihat Data Supplier Penempatan Bisnis datatable response contains exactly specific attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Penempatan Bisnis']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);
    $supplier = Supplier::create([
        'name' => 'S', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($biz->id);

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'contact_name', 'contact_phone', 'address', 'description', 'responsible_user_ids'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 8: owner_id matches logged-in user in datatable under Lihat Data Supplier Pribadi
test('users with Lihat Data Supplier Pribadi only see suppliers with owner_id matching their own id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $s1 = Supplier::create(['name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
    $s1->businesses()->attach($ownBiz->id);

    $s2 = Supplier::create(['name' => 'S2', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
    $s2->businesses()->attach($otherBiz->id);

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['owner_id'])->toBe($user->id);
    }
});

// Requirement 9: responsible_user_ids contains logged-in user under Lihat Data Supplier Penempatan Bisnis
test('users with Lihat Data Supplier Penempatan Bisnis datatable response responsible_user_ids contains logged-in user', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Penempatan Bisnis']);

    $assocBiz = Business::create(['name' => 'Assoc', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($assocBiz->id, ['role_id' => $this->adminRole->id]);

    $s1 = Supplier::create(['name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
    $s1->businesses()->attach($assocBiz->id);

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['responsible_user_ids'])->toContain($user->id);
    }
});

// Requirement 10: owner_id can differ from logged-in user under Lihat Data Supplier Keseluruhan
test('users with Lihat Data Supplier Keseluruhan can see suppliers with owner_id different from theirs', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $s1 = Supplier::create(['name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
    $s1->businesses()->attach($ownBiz->id);

    $s2 = Supplier::create(['name' => 'S2', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
    $s2->businesses()->attach($otherBiz->id);

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $ownerIds = collect($response->json('data'))->pluck('owner_id')->unique()->toArray();
    expect($ownerIds)->toContain($otherUser->id);
});

// Requirement 11: Tambah Data Supplier Pribadi can choose own business_ids but cannot choose other user\'s business_ids
test('user with Tambah Data Supplier Pribadi can select owned business but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Supplier Pribadi', 'Lihat Data Supplier Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    // Success: select owned business
    $this->actingAs($user)->post(route('suppliers.store'), [
        'name' => 'Supplier Own',
        'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D',
        'business_ids' => [$ownBiz->id]
    ])->assertRedirect(route('suppliers.index'));

    // Forbidden: select another user's business
    $this->actingAs($user)->post(route('suppliers.store'), [
        'name' => 'Supplier Forbidden',
        'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D',
        'business_ids' => [$otherBiz->id]
    ])->assertStatus(403);
});

// Requirement 12: Tambah Data Supplier Penempatan Bisnis auto fills business_ids when associated to 1 business
test('user with Tambah Data Supplier Penempatan Bisnis auto-fills business_ids when associated with exactly one business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Supplier Penempatan Bisnis', 'Lihat Data Supplier Penempatan Bisnis']);

    $biz = Business::create(['name' => 'Only One', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);

    // Send empty business_ids, it should auto fill to the only associated business
    $response = $this->actingAs($user)->post(route('suppliers.store'), [
        'name' => 'Supplier Auto',
        'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D',
        'business_ids' => []
    ]);

    $response->assertRedirect(route('suppliers.index'));
    
    $supplier = Supplier::where('name', 'Supplier Auto')->first();
    expect($supplier->businesses->pluck('id')->toArray())->toContain($biz->id);
});

// Requirement 13: Tambah Data Supplier Keseluruhan stores business_ids exactly as requested
test('user with Tambah Data Supplier Keseluruhan stores business_ids exactly as requested', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Supplier Keseluruhan', 'Lihat Data Supplier Keseluruhan']);

    $biz = Business::create(['name' => 'Admin Biz', 'description' => 'Desc', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('suppliers.store'), [
        'name' => 'Supplier Admin',
        'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D',
        'business_ids' => [$biz->id]
    ]);

    $response->assertRedirect(route('suppliers.index'));
    
    $supplier = Supplier::where('name', 'Supplier Admin')->first();
    expect($supplier->businesses->pluck('id')->toArray())->toContain($biz->id);
});

// Requirement 14: name, contact_name, contact_phone, address, and description are required
test('all core supplier attributes are required when storing a supplier', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Supplier Pribadi']);

    $response = $this->actingAs($user)->post(route('suppliers.store'), [
        'name' => '',
        'contact_name' => '',
        'contact_phone' => '',
        'address' => '',
        'description' => ''
    ]);

    $response->assertSessionHasErrors(['name', 'contact_name', 'contact_phone', 'address', 'description']);
});

// Requirement 15: business_ids is required for Tambah Data Supplier Pribadi and Tambah Data Supplier Keseluruhan
test('business_ids is required for Tambah Data Supplier Pribadi and Tambah Data Supplier Keseluruhan', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Tambah Data Supplier Pribadi']);

    $userAll = User::factory()->create();
    $userAll->assignPermissions(['Tambah Data Supplier Keseluruhan', 'Lihat Data Supplier Keseluruhan']);

    // For Pribadi
    $this->actingAs($userOwn)->post(route('suppliers.store'), [
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
        // business_ids is missing
    ])->assertSessionHasErrors(['business_ids']);

    // For Keseluruhan
    $this->actingAs($userAll)->post(route('suppliers.store'), [
        'name' => 'S2', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
        // business_ids is missing
    ])->assertSessionHasErrors(['business_ids']);
});

// Requirement 16: supplier data exists in response/props (suppliers index contains business/users lists)
test('supplier index passes businesses list and user options in props', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Pribadi']);

    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('suppliers.index'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('suppliers/index')
        ->has('businesses')
        ->has('users')
    );
});

// Requirement 17: Edit Data Supplier Pribadi can choose owned business_ids but cannot update to other user\'s business_ids
test('user with Edit Data Supplier Pribadi can select owned businesses on update but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Supplier Pribadi', 'Lihat Data Supplier Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz1 = Business::create(['name' => 'Own Biz 1', 'description' => 'Desc', 'user_id' => $user->id]);
    $ownBiz2 = Business::create(['name' => 'Own Biz 2', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $supplier = Supplier::create([
        'name' => 'My Supplier', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($ownBiz1->id);

    // Success: update to another owned business
    $this->actingAs($user)->put(route('suppliers.update', $supplier->id), [
        'name' => 'Updated Supplier',
        'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D',
        'business_ids' => [$ownBiz2->id]
    ])->assertRedirect(route('suppliers.index'));

    expect($supplier->fresh()->businesses->pluck('id')->toArray())->toContain($ownBiz2->id);

    // Forbidden: update to another user's business
    $this->actingAs($user)->put(route('suppliers.update', $supplier->id), [
        'name' => 'Updated Supplier',
        'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D',
        'business_ids' => [$otherBiz->id]
    ])->assertStatus(403);
});

// Requirement 18: Edit Data Supplier Keseluruhan can change business_ids via request
test('user with Edit Data Supplier Keseluruhan can update business_ids via request', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Supplier Keseluruhan', 'Lihat Data Supplier Keseluruhan']);

    $biz1 = Business::create(['name' => 'Biz 1', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Biz 2', 'description' => 'Desc', 'user_id' => null]);

    $supplier = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($biz1->id);

    $response = $this->actingAs($admin)->put(route('suppliers.update', $supplier->id), [
        'name' => 'Updated',
        'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D',
        'business_ids' => [$biz2->id]
    ]);

    $response->assertRedirect(route('suppliers.index'));
    expect($supplier->fresh()->businesses->pluck('id')->toArray())->toContain($biz2->id);
});

// Requirement 19: Edit Data Supplier Pribadi cannot update supplier belonging to other user\'s business
test('user with Edit Data Supplier Pribadi cannot update supplier belonging to other user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Supplier Pribadi', 'Lihat Data Supplier Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    
    $supplier = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($otherBiz->id);

    $response = $this->actingAs($user)->put(route('suppliers.update', $supplier->id), [
        'name' => 'Try Update', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D', 'business_ids' => [$otherBiz->id]
    ]);
    $response->assertStatus(403);
});

// Requirement 20: Edit Data Supplier Penempatan Bisnis cannot update supplier they do not manage
test('user with Edit Data Supplier Penempatan Bisnis cannot update supplier from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Supplier Penempatan Bisnis', 'Lihat Data Supplier Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $supplier = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($unassociatedBiz->id);

    $response = $this->actingAs($user)->put(route('suppliers.update', $supplier->id), [
        'name' => 'Try Update', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D', 'business_ids' => [$unassociatedBiz->id]
    ]);
    $response->assertStatus(403);
});

// Requirement 21: Hapus Data Supplier Pribadi cannot delete other user\'s supplier
test('user with Hapus Data Supplier Pribadi cannot delete other user\'s supplier', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Supplier Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $supplier = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($otherBiz->id);

    $response = $this->actingAs($user)->delete(route('suppliers.destroy', $supplier->id));
    $response->assertStatus(403);
});

// Requirement 22: Hapus Data Supplier Penempatan Bisnis cannot delete supplier they do not manage
test('user with Hapus Data Supplier Penempatan Bisnis cannot delete supplier from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Supplier Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $supplier = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($unassociatedBiz->id);

    $response = $this->actingAs($user)->delete(route('suppliers.destroy', $supplier->id));
    $response->assertStatus(403);
});

// Requirement 23: Hapus Data Supplier Keseluruhan can delete any supplier
test('user with Hapus Data Supplier Keseluruhan can delete any supplier', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Supplier Keseluruhan']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $supplier = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($otherBiz->id);

    $response = $this->actingAs($admin)->delete(route('suppliers.destroy', $supplier->id));
    $response->assertRedirect(route('suppliers.index'));
    $this->assertSoftDeleted('suppliers', ['id' => $supplier->id]);
});

// Requirement 24: deleted_at is filled upon deletion
test('deleted_at is filled when supplier is deleted', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Supplier Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $supplier = Supplier::create([
        'name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D'
    ]);
    $supplier->businesses()->attach($biz->id);

    $this->actingAs($admin)->delete(route('suppliers.destroy', $supplier->id));

    $deleted = Supplier::onlyTrashed()->find($supplier->id);
    expect($deleted->deleted_at)->not->toBeNull();
});

// Requirement 25 & 26: Global search filters based on permission level
test('global search filters appropriately based on permission settings', function () {
    // Pribadi
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Lihat Data Supplier Pribadi']);

    $ownBiz = Business::create(['name' => 'Apple Business', 'description' => 'Desc', 'user_id' => $userOwn->id]);

    $s1 = Supplier::create(['name' => 'Citrus Supp', 'contact_name' => 'John', 'contact_phone' => '08123', 'address' => 'Addr 1', 'description' => 'D1']);
    $s1->businesses()->attach($ownBiz->id);

    $s2 = Supplier::create(['name' => 'Banana Supp', 'contact_name' => 'Jane', 'contact_phone' => '08555', 'address' => 'Addr 2', 'description' => 'D2']);
    $s2->businesses()->attach($ownBiz->id);

    // Search by contact_phone
    $response1 = $this->actingAs($userOwn)->getJson(route('suppliers.datatable', ['search' => '08555']));
    expect($response1->json('data'))->toHaveCount(1);
    expect($response1->json('data')[0]['name'])->toBe('Banana Supp');

    // Search by business_names
    $response2 = $this->actingAs($userOwn)->getJson(route('suppliers.datatable', ['search' => 'Apple']));
    expect($response2->json('data'))->toHaveCount(2);
});

// Requirement 27: Individual search filters properly
test('individual search on business_names, name, contact_name, and contact_phone filters correctly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $biz1 = Business::create(['name' => 'Target Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Normal Business', 'description' => 'Desc', 'user_id' => null]);

    $s1 = Supplier::create(['name' => 'UniqueName', 'contact_name' => 'Normal C', 'contact_phone' => '081', 'address' => 'A1', 'description' => 'D1']);
    $s1->businesses()->attach($biz2->id);

    $s2 = Supplier::create(['name' => 'NormalName', 'contact_name' => 'UniqueC', 'contact_phone' => '081', 'address' => 'A2', 'description' => 'D2']);
    $s2->businesses()->attach($biz2->id);

    $s3 = Supplier::create(['name' => 'Another', 'contact_name' => 'Normal C', 'contact_phone' => '083Unique', 'address' => 'A3', 'description' => 'D3']);
    $s3->businesses()->attach($biz2->id);

    $s4 = Supplier::create(['name' => 'TargetSupplier', 'contact_name' => 'Normal C', 'contact_phone' => '081', 'address' => 'A4', 'description' => 'D4']);
    $s4->businesses()->attach($biz1->id);

    // Filter by name
    $responseName = $this->actingAs($user)->getJson(route('suppliers.datatable', ['name' => 'UniqueName']));
    expect($responseName->json('data'))->toHaveCount(1);
    expect($responseName->json('data')[0]['name'])->toBe('UniqueName');

    // Filter by contact_name
    $responseContact = $this->actingAs($user)->getJson(route('suppliers.datatable', ['contact_name' => 'UniqueC']));
    expect($responseContact->json('data'))->toHaveCount(1);
    expect($responseContact->json('data')[0]['name'])->toBe('NormalName');

    // Filter by contact_phone
    $responsePhone = $this->actingAs($user)->getJson(route('suppliers.datatable', ['contact_phone' => '083Unique']));
    expect($responsePhone->json('data'))->toHaveCount(1);
    expect($responsePhone->json('data')[0]['name'])->toBe('Another');

    // Filter by business name
    $responseBiz = $this->actingAs($user)->getJson(route('suppliers.datatable', ['business_names' => 'Target Business']));
    expect($responseBiz->json('data'))->toHaveCount(1);
    expect($responseBiz->json('data')[0]['name'])->toBe('TargetSupplier');
});

// Requirement 28: Limit parameter limits returned suppliers
test('limit parameter limits count of suppliers returned', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    for ($i = 0; $i < 5; $i++) {
        $s = Supplier::create(['name' => "Supplier $i", 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
        $s->businesses()->attach($biz->id);
    }

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable', ['limit' => 2]));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

// Requirement 29: Page parameter switches pages
test('page parameter switches paginated pages', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $s1 = Supplier::create(['name' => 'S1', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
    $s1->businesses()->attach($biz->id);
    $s2 = Supplier::create(['name' => 'S2', 'contact_name' => 'C', 'contact_phone' => '08', 'address' => 'A', 'description' => 'D']);
    $s2->businesses()->attach($biz->id);

    $responsePage1 = $this->actingAs($user)->getJson(route('suppliers.datatable', ['limit' => 1, 'page' => 1, 'sort_by' => 'id', 'sort_type' => 'asc']));
    $responsePage2 = $this->actingAs($user)->getJson(route('suppliers.datatable', ['limit' => 1, 'page' => 2, 'sort_by' => 'id', 'sort_type' => 'asc']));

    expect($responsePage1->json('data'))->toHaveCount(1);
    expect($responsePage2->json('data'))->toHaveCount(1);

    expect($responsePage1->json('data')[0]['name'])->toBe('S1');
    expect($responsePage2->json('data')[0]['name'])->toBe('S2');
});

// Requirement 30: PDF prints return a PDF file
test('print pdf produces a pdf file', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $response = $this->actingAs($user)->get(route('suppliers.print.pdf'));
    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');

    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.pdf');
});

// Requirement 31: Excel prints return a .xlsx file and have correct columns
test('print excel produces a .xlsx file and has correct columns', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $biz = Business::create(['name' => 'ExcelBiz', 'description' => 'Desc', 'user_id' => null]);
    $s = Supplier::create(['name' => 'ExcelSupplier', 'contact_name' => 'C', 'contact_phone' => 'P', 'address' => 'A', 'description' => 'D']);
    $s->businesses()->attach($biz->id);

    $response = $this->actingAs($user)->get(route('suppliers.print.excel'));
    $response->assertOk();
    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.xlsx');

    // Simulate mapping array to check the columns
    $data = Supplier::with('businesses')->get();
    $item = [
        'No' => 1,
        'Nama Supplier' => $data[0]->name,
        'Nama Kontak' => $data[0]->contact_name ?: '-',
        'Telepon Kontak' => $data[0]->contact_phone ?: '-',
        'Alamat' => $data[0]->address ?: '-',
        'Deskripsi' => $data[0]->description ?: '-',
        'Bisnis Terkait' => $data[0]->businesses->pluck('name')->implode(', ') ?: '-',
    ];
    expect(array_keys($item))->toBe(['No', 'Nama Supplier', 'Nama Kontak', 'Telepon Kontak', 'Alamat', 'Deskripsi', 'Bisnis Terkait']);
});

// Requirement 32: Suppliers of deleted businesses do not show up in the datatable
test('suppliers from deleted businesses do not show up in the datatable if all their businesses are deleted', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $biz1 = Business::create(['name' => 'Active Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Deleted Business', 'description' => 'Desc', 'user_id' => null]);

    $s1 = Supplier::create(['name' => 'Active Supplier', 'contact_name' => 'C', 'contact_phone' => 'P', 'address' => 'A', 'description' => 'D']);
    $s1->businesses()->attach($biz1->id);

    $s2 = Supplier::create(['name' => 'Deleted Supplier', 'contact_name' => 'C', 'contact_phone' => 'P', 'address' => 'A', 'description' => 'D']);
    $s2->businesses()->attach($biz2->id);

    // Soft delete the second business
    $biz2->delete();

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Active Supplier');
});

test('supplier with multiple businesses remains visible if only one business is deleted, but the deleted business is excluded from the response', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Supplier Keseluruhan']);

    $activeBiz = Business::create(['name' => 'Active Business', 'description' => 'Desc', 'user_id' => null]);
    $deletedBiz = Business::create(['name' => 'Deleted Business', 'description' => 'Desc', 'user_id' => null]);

    $supplier = Supplier::create(['name' => 'Shared Supplier', 'contact_name' => 'C', 'contact_phone' => 'P', 'address' => 'A', 'description' => 'D']);
    $supplier->businesses()->attach([$activeBiz->id, $deletedBiz->id]);

    // Soft delete one of the businesses
    $deletedBiz->delete();

    $response = $this->actingAs($user)->getJson(route('suppliers.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    
    // The supplier should still be present
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Shared Supplier');

    // The business_names and business_ids in the response should only list the active business
    expect($data[0]['business_names'])->toBe('Active Business');
    expect($data[0]['business_ids'])->toBe([$activeBiz->id]);
});
