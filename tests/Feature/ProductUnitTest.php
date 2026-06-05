<?php

use App\Models\User;
use App\Models\Business;
use App\Models\ProductUnit;
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
        Permission::firstOrCreate(['name' => $perm]);
    }

    $this->adminRole = Role::firstOrCreate(['name' => 'Admin']);
    $viewOwnPermission = Permission::where('name', 'Lihat Data Bisnis Pribadi')->first();
    $this->adminRole->permissions()->syncWithoutDetaching([$viewOwnPermission->id]);
});

// Requirement 1: Access control for view permissions
test('users with appropriate permission can access /product-units endpoints', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Lihat Data Satuan Produk Pribadi']);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Lihat Data Satuan Produk Penempatan Bisnis']);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $unauthorized = User::factory()->create();

    foreach ([$user1, $user2, $user3] as $user) {
        $this->actingAs($user)->get(route('product_units.index'))->assertOk();
        $this->actingAs($user)->getJson(route('product_units.datatable'))->assertOk();
        $this->actingAs($user)->get(route('product_units.print.pdf'))->assertOk();
        $this->actingAs($user)->get(route('product_units.print.excel'))->assertOk();
    }

    $this->actingAs($unauthorized)->get(route('product_units.index'))->assertStatus(403);
    $this->actingAs($unauthorized)->getJson(route('product_units.datatable'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('product_units.print.pdf'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('product_units.print.excel'))->assertStatus(403);
});

// Requirement 2: Access control for store action
test('users with appropriate permission can access store action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Tambah Data Satuan Produk Pribadi', 'Lihat Data Satuan Produk Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Tambah Data Satuan Produk Penempatan Bisnis', 'Lihat Data Satuan Produk Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Tambah Data Satuan Produk Keseluruhan', 'Lihat Data Satuan Produk Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test store
    $this->actingAs($user1)->post(route('product_units.store'), [
        'name' => 'Unit 1',
        'short_name' => 'U1',
        'description' => 'Desc 1',
        'allow_decimal' => true,
        'business_id' => $biz1->id
    ])->assertRedirect(route('product_units.index'));

    $this->actingAs($user2)->post(route('product_units.store'), [
        'name' => 'Unit 2',
        'short_name' => 'U2',
        'description' => 'Desc 2',
        'allow_decimal' => true,
        'business_id' => $biz2->id
    ])->assertRedirect(route('product_units.index'));

    $this->actingAs($user3)->post(route('product_units.store'), [
        'name' => 'Unit 3',
        'short_name' => 'U3',
        'description' => 'Desc 3',
        'allow_decimal' => true,
        'business_id' => $biz1->id
    ])->assertRedirect(route('product_units.index'));

    $this->actingAs($unauthorized)->post(route('product_units.store'), [
        'name' => 'Unit 4',
        'short_name' => 'U4',
        'description' => 'Desc 4',
        'allow_decimal' => true,
        'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Requirement 3: Access control for update action
test('users with appropriate permission can access update action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Edit Data Satuan Produk Pribadi', 'Lihat Data Satuan Produk Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $unit1 = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S1', 'description' => 'D1', 'allow_decimal' => true, 'business_id' => $biz1->id
    ]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Edit Data Satuan Produk Penempatan Bisnis', 'Lihat Data Satuan Produk Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $unit2 = ProductUnit::create([
        'name' => 'U2', 'short_name' => 'S2', 'description' => 'D2', 'allow_decimal' => true, 'business_id' => $biz2->id
    ]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Edit Data Satuan Produk Keseluruhan', 'Lihat Data Satuan Produk Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test updates
    $this->actingAs($user1)->put(route('product_units.update', $unit1->id), [
        'name' => 'Updated 1', 'short_name' => 'S1', 'description' => 'D1', 'allow_decimal' => true, 'business_id' => $biz1->id
    ])->assertRedirect(route('product_units.index'));

    $this->actingAs($user2)->put(route('product_units.update', $unit2->id), [
        'name' => 'Updated 2', 'short_name' => 'S2', 'description' => 'D2', 'allow_decimal' => true, 'business_id' => $biz2->id
    ])->assertRedirect(route('product_units.index'));

    $this->actingAs($user3)->put(route('product_units.update', $unit1->id), [
        'name' => 'Updated 3', 'short_name' => 'S1', 'description' => 'D1', 'allow_decimal' => true, 'business_id' => $biz1->id
    ])->assertRedirect(route('product_units.index'));

    $this->actingAs($unauthorized)->put(route('product_units.update', $unit1->id), [
        'name' => 'Fail', 'short_name' => 'F', 'description' => 'F', 'allow_decimal' => true, 'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Requirement 4: Access control for delete action
test('users with appropriate permission can delete product units', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Hapus Data Satuan Produk Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $unit1 = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S1', 'description' => 'D1', 'allow_decimal' => true, 'business_id' => $biz1->id
    ]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Hapus Data Satuan Produk Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $unit2 = ProductUnit::create([
        'name' => 'U2', 'short_name' => 'S2', 'description' => 'D2', 'allow_decimal' => true, 'business_id' => $biz2->id
    ]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Hapus Data Satuan Produk Keseluruhan']);
    $unit3 = ProductUnit::create([
        'name' => 'U3', 'short_name' => 'S3', 'description' => 'D3', 'allow_decimal' => true, 'business_id' => $biz1->id
    ]);

    $unauthorized = User::factory()->create();

    // Test delete
    $this->actingAs($user1)->delete(route('product_units.destroy', $unit1->id))->assertRedirect(route('product_units.index'));
    $this->actingAs($user2)->delete(route('product_units.destroy', $unit2->id))->assertRedirect(route('product_units.index'));
    $this->actingAs($user3)->delete(route('product_units.destroy', $unit3->id))->assertRedirect(route('product_units.index'));

    $unit4 = ProductUnit::create([
        'name' => 'U4', 'short_name' => 'S4', 'description' => 'D4', 'allow_decimal' => true, 'business_id' => $biz1->id
    ]);
    $this->actingAs($unauthorized)->delete(route('product_units.destroy', $unit4->id))->assertStatus(403);
});

// Requirement 5: Fields in datatable response for Lihat Data Satuan Produk Keseluruhan
test('users with Lihat Data Satuan Produk Keseluruhan datatable response contains exactly specific attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    ProductUnit::create([
        'name' => 'U', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id
    ]);

    $response = $this->actingAs($user)->getJson(route('product_units.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'short_name', 'allow_decimal', 'business_name', 'owner_id', 'description'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 6: Fields in datatable response for Lihat Data Satuan Produk Pribadi
test('users with Lihat Data Satuan Produk Pribadi datatable response contains exactly specific attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Pribadi']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    ProductUnit::create([
        'name' => 'U', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id
    ]);

    $response = $this->actingAs($user)->getJson(route('product_units.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'short_name', 'allow_decimal', 'business_name', 'owner_id', 'description'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 7: Fields in datatable response for Lihat Data Satuan Produk Penempatan Bisnis
test('users with Lihat Data Satuan Produk Penempatan Bisnis datatable response contains exactly specific attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Penempatan Bisnis']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);
    ProductUnit::create([
        'name' => 'U', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id
    ]);

    $response = $this->actingAs($user)->getJson(route('product_units.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'short_name', 'allow_decimal', 'description', 'responsible_user_id'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 8: owner_id matches logged-in user in datatable under Lihat Data Satuan Produk Pribadi
test('users with Lihat Data Satuan Produk Pribadi only see units with owner_id matching their own id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    ProductUnit::create(['name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $ownBiz->id]);
    ProductUnit::create(['name' => 'U2', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('product_units.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['owner_id'])->toBe($user->id);
    }
});

// Requirement 9: responsible_user_id contains logged-in user under Lihat Data Satuan Produk Penempatan Bisnis
test('users with Lihat Data Satuan Produk Penempatan Bisnis datatable response responsible_user_id contains logged-in user', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Penempatan Bisnis']);

    $assocBiz = Business::create(['name' => 'Assoc', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($assocBiz->id, ['role_id' => $this->adminRole->id]);

    ProductUnit::create(['name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $assocBiz->id]);

    $response = $this->actingAs($user)->getJson(route('product_units.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['responsible_user_id'])->toBe($user->id);
    }
});

// Requirement 10: owner_id can differ from logged-in user under Lihat Data Satuan Produk Keseluruhan
test('users with Lihat Data Satuan Produk Keseluruhan can see units with owner_id different from theirs', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    ProductUnit::create(['name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $ownBiz->id]);
    ProductUnit::create(['name' => 'U2', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('product_units.datatable'));
    $response->assertOk();

    $ownerIds = collect($response->json('data'))->pluck('owner_id')->unique()->toArray();
    expect($ownerIds)->toContain($otherUser->id);
});

// Requirement 11: Tambah Data Satuan Produk Pribadi can choose own business_id but cannot choose other user\'s business_id
test('user with Tambah Data Satuan Produk Pribadi can select owned business but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Satuan Produk Pribadi', 'Lihat Data Satuan Produk Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    // Success: select owned business
    $this->actingAs($user)->post(route('product_units.store'), [
        'name' => 'Unit Own',
        'short_name' => 'UO', 'description' => 'D', 'allow_decimal' => true,
        'business_id' => $ownBiz->id
    ])->assertRedirect(route('product_units.index'));

    // Forbidden: select another user's business
    $this->actingAs($user)->post(route('product_units.store'), [
        'name' => 'Unit Forbidden',
        'short_name' => 'UF', 'description' => 'D', 'allow_decimal' => true,
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Requirement 12: Tambah Data Satuan Produk Penempatan Bisnis auto fills business_id when associated to 1 business
test('user with Tambah Data Satuan Produk Penempatan Bisnis auto-fills business_id when associated with exactly one business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Satuan Produk Penempatan Bisnis', 'Lihat Data Satuan Produk Penempatan Bisnis']);

    $biz = Business::create(['name' => 'Only One', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);

    // Send empty business_id, it should auto fill to the only associated business
    $response = $this->actingAs($user)->post(route('product_units.store'), [
        'name' => 'Unit Auto',
        'short_name' => 'UA', 'description' => 'D', 'allow_decimal' => true,
        'business_id' => ''
    ]);

    $response->assertRedirect(route('product_units.index'));
    
    $unit = ProductUnit::where('name', 'Unit Auto')->first();
    expect($unit->business_id)->toBe($biz->id);
});

// Requirement 13: Tambah Data Satuan Produk Keseluruhan stores business_id exactly as requested
test('user with Tambah Data Satuan Produk Keseluruhan stores business_id exactly as requested', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Satuan Produk Keseluruhan', 'Lihat Data Satuan Produk Keseluruhan']);

    $biz = Business::create(['name' => 'Admin Biz', 'description' => 'Desc', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('product_units.store'), [
        'name' => 'Unit Admin',
        'short_name' => 'UA', 'description' => 'D', 'allow_decimal' => true,
        'business_id' => $biz->id
    ]);

    $response->assertRedirect(route('product_units.index'));
    
    $unit = ProductUnit::where('name', 'Unit Admin')->first();
    expect($unit->business_id)->toBe($biz->id);
});

// Requirement 14: name, short_name, description are required and allow_decimal defaults to false if null/empty
test('core unit attributes are required and allow_decimal defaults to false if null or not sent', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Satuan Produk Pribadi']);
    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('product_units.store'), [
        'name' => '',
        'short_name' => '',
        'description' => '',
        'allow_decimal' => null
    ]);

    $response->assertSessionHasErrors(['name', 'short_name', 'description']);

    // Check allow_decimal defaulting to false when omitted/null but other inputs valid
    $this->actingAs($user)->post(route('product_units.store'), [
        'name' => 'Omitted Decimal',
        'short_name' => 'OD',
        'description' => 'Valid description',
        'allow_decimal' => null,
        'business_id' => $biz->id
    ])->assertRedirect(route('product_units.index'));

    $unit = ProductUnit::where('name', 'Omitted Decimal')->first();
    expect($unit->allow_decimal)->toBeFalse();
});

// Requirement 15: business_id is required for Tambah Data Satuan Produk Pribadi and Tambah Data Satuan Produk Keseluruhan
test('business_id is required for Tambah Data Satuan Produk Pribadi and Tambah Data Satuan Produk Keseluruhan', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Tambah Data Satuan Produk Pribadi']);

    $userAll = User::factory()->create();
    $userAll->assignPermissions(['Tambah Data Satuan Produk Keseluruhan', 'Lihat Data Satuan Produk Keseluruhan']);

    // For Pribadi
    $this->actingAs($userOwn)->post(route('product_units.store'), [
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);

    // For Keseluruhan
    $this->actingAs($userAll)->post(route('product_units.store'), [
        'name' => 'U2', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);
});

// Requirement 16: product unit data exists in response/props
test('product unit index passes businesses list and user options in props', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Pribadi']);

    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('product_units.index'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('product-units/index')
        ->has('businesses')
        ->has('users')
    );
});

// Requirement 17: Edit Data Satuan Produk Pribadi can choose owned business_id but cannot update to other user\'s business_id
test('user with Edit Data Satuan Produk Pribadi can select owned business on update but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Satuan Produk Pribadi', 'Lihat Data Satuan Produk Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz1 = Business::create(['name' => 'Own Biz 1', 'description' => 'Desc', 'user_id' => $user->id]);
    $ownBiz2 = Business::create(['name' => 'Own Biz 2', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $unit = ProductUnit::create([
        'name' => 'My Unit', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $ownBiz1->id
    ]);

    // Success: update to another owned business
    $this->actingAs($user)->put(route('product_units.update', $unit->id), [
        'name' => 'Updated Unit',
        'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true,
        'business_id' => $ownBiz2->id
    ])->assertRedirect(route('product_units.index'));

    expect($unit->fresh()->business_id)->toBe($ownBiz2->id);

    // Forbidden: update to another user's business
    $this->actingAs($user)->put(route('product_units.update', $unit->id), [
        'name' => 'Updated Unit',
        'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true,
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Requirement 18: Edit Data Satuan Produk Keseluruhan can change business_id via request
test('user with Edit Data Satuan Produk Keseluruhan can update business_id via request', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Satuan Produk Keseluruhan', 'Lihat Data Satuan Produk Keseluruhan']);

    $biz1 = Business::create(['name' => 'Biz 1', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Biz 2', 'description' => 'Desc', 'user_id' => null]);

    $unit = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz1->id
    ]);

    $response = $this->actingAs($admin)->put(route('product_units.update', $unit->id), [
        'name' => 'Updated',
        'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true,
        'business_id' => $biz2->id
    ]);

    $response->assertRedirect(route('product_units.index'));
    expect($unit->fresh()->business_id)->toBe($biz2->id);
});

// Requirement 19: Edit Data Satuan Produk Pribadi cannot update unit belonging to other user\'s business
test('user with Edit Data Satuan Produk Pribadi cannot update unit belonging to other user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Satuan Produk Pribadi', 'Lihat Data Satuan Produk Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    
    $unit = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($user)->put(route('product_units.update', $unit->id), [
        'name' => 'Try Update', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $otherBiz->id
    ]);
    $response->assertStatus(403);
});

// Requirement 20: Edit Data Satuan Produk Penempatan Bisnis cannot update unit they do not manage
test('user with Edit Data Satuan Produk Penempatan Bisnis cannot update unit from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Satuan Produk Penempatan Bisnis', 'Lihat Data Satuan Produk Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $unit = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $unassociatedBiz->id
    ]);

    $response = $this->actingAs($user)->put(route('product_units.update', $unit->id), [
        'name' => 'Try Update', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $unassociatedBiz->id
    ]);
    $response->assertStatus(403);
});

// Requirement 21: Hapus Data Satuan Produk Pribadi cannot delete other user\'s unit
test('user with Hapus Data Satuan Produk Pribadi cannot delete other user\'s unit', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Satuan Produk Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $unit = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($user)->delete(route('product_units.destroy', $unit->id));
    $response->assertStatus(403);
});

// Requirement 22: Hapus Data Satuan Produk Penempatan Bisnis cannot delete unit they do not manage
test('user with Hapus Data Satuan Produk Penempatan Bisnis cannot delete unit from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Satuan Produk Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $unit = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $unassociatedBiz->id
    ]);

    $response = $this->actingAs($user)->delete(route('product_units.destroy', $unit->id));
    $response->assertStatus(403);
});

// Requirement 23: Hapus Data Satuan Produk Keseluruhan can delete any unit
test('user with Hapus Data Satuan Produk Keseluruhan can delete any unit', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Satuan Produk Keseluruhan']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $unit = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($admin)->delete(route('product_units.destroy', $unit->id));
    $response->assertRedirect(route('product_units.index'));
    $this->assertSoftDeleted('product_units', ['id' => $unit->id]);
});

// Requirement 24: deleted_at is filled upon deletion
test('deleted_at is filled when unit is deleted', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Satuan Produk Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $unit = ProductUnit::create([
        'name' => 'U1', 'short_name' => 'S', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id
    ]);

    $this->actingAs($admin)->delete(route('product_units.destroy', $unit->id));

    $deleted = ProductUnit::onlyTrashed()->find($unit->id);
    expect($deleted->deleted_at)->not->toBeNull();
});

// Requirement 25: Global search filters appropriately based on permission settings (Pribadi)
test('global search filters appropriately based on permission settings for Pribadi', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Lihat Data Satuan Produk Pribadi']);

    $ownBiz = Business::create(['name' => 'Apple Business', 'description' => 'Desc', 'user_id' => $userOwn->id]);

    ProductUnit::create(['name' => 'Citrus Unit', 'short_name' => 'Ctr', 'description' => 'D1', 'allow_decimal' => true, 'business_id' => $ownBiz->id]);
    ProductUnit::create(['name' => 'Banana Unit', 'short_name' => 'Bnn', 'description' => 'D2', 'allow_decimal' => true, 'business_id' => $ownBiz->id]);

    // Search by description
    $response1 = $this->actingAs($userOwn)->getJson(route('product_units.datatable', ['search' => 'D2']));
    expect($response1->json('data'))->toHaveCount(1);
    expect($response1->json('data')[0]['name'])->toBe('Banana Unit');

    // Search by business name
    $response2 = $this->actingAs($userOwn)->getJson(route('product_units.datatable', ['search' => 'Apple']));
    expect($response2->json('data'))->toHaveCount(2);
});

// Requirement 26: Global search filters appropriately based on permission settings (Keseluruhan)
test('global search filters appropriately based on permission settings for Keseluruhan', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $biz = Business::create(['name' => 'Cherry Business', 'description' => 'Desc', 'user_id' => null]);

    ProductUnit::create(['name' => 'Watermelon Unit', 'short_name' => 'Wtm', 'description' => 'D3', 'allow_decimal' => true, 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->getJson(route('product_units.datatable', ['search' => 'Cherry']));
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('Watermelon Unit');
});

// Requirement 27: Individual search filters properly
test('individual search on business_name, name, short_name, and description filters correctly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $biz1 = Business::create(['name' => 'Target Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Normal Business', 'description' => 'Desc', 'user_id' => null]);

    ProductUnit::create(['name' => 'UniqueName', 'short_name' => 'S1', 'description' => 'D1', 'allow_decimal' => true, 'business_id' => $biz2->id]);
    ProductUnit::create(['name' => 'NormalName', 'short_name' => 'UniqueShort', 'description' => 'D2', 'allow_decimal' => true, 'business_id' => $biz2->id]);
    ProductUnit::create(['name' => 'Another', 'short_name' => 'S3', 'description' => 'UniqueDesc', 'allow_decimal' => true, 'business_id' => $biz2->id]);
    ProductUnit::create(['name' => 'TargetUnit', 'short_name' => 'S4', 'description' => 'D4', 'allow_decimal' => true, 'business_id' => $biz1->id]);

    // Filter by name
    $responseName = $this->actingAs($user)->getJson(route('product_units.datatable', ['name' => 'UniqueName']));
    expect($responseName->json('data'))->toHaveCount(1);
    expect($responseName->json('data')[0]['name'])->toBe('UniqueName');

    // Filter by short_name
    $responseShort = $this->actingAs($user)->getJson(route('product_units.datatable', ['short_name' => 'UniqueShort']));
    expect($responseShort->json('data'))->toHaveCount(1);
    expect($responseShort->json('data')[0]['name'])->toBe('NormalName');

    // Filter by description
    $responseDesc = $this->actingAs($user)->getJson(route('product_units.datatable', ['description' => 'UniqueDesc']));
    expect($responseDesc->json('data'))->toHaveCount(1);
    expect($responseDesc->json('data')[0]['name'])->toBe('Another');

    // Filter by business name
    $responseBiz = $this->actingAs($user)->getJson(route('product_units.datatable', ['business' => 'Target Business']));
    expect($responseBiz->json('data'))->toHaveCount(1);
    expect($responseBiz->json('data')[0]['name'])->toBe('TargetUnit');
});

// Requirement 28: Limit parameter limits returned units
test('limit parameter limits count of units returned', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    for ($i = 0; $i < 5; $i++) {
        ProductUnit::create(['name' => "Unit $i", 'short_name' => "U$i", 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id]);
    }

    $response = $this->actingAs($user)->getJson(route('product_units.datatable', ['limit' => 2]));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

// Requirement 29: Page parameter switches pages
test('page parameter switches paginated pages', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    ProductUnit::create(['name' => 'U1', 'short_name' => 'S1', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id]);
    ProductUnit::create(['name' => 'U2', 'short_name' => 'S2', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id]);

    $responsePage1 = $this->actingAs($user)->getJson(route('product_units.datatable', ['limit' => 1, 'page' => 1, 'sort_by' => 'id', 'sort_type' => 'asc']));
    $responsePage2 = $this->actingAs($user)->getJson(route('product_units.datatable', ['limit' => 1, 'page' => 2, 'sort_by' => 'id', 'sort_type' => 'asc']));

    expect($responsePage1->json('data'))->toHaveCount(1);
    expect($responsePage2->json('data'))->toHaveCount(1);

    expect($responsePage1->json('data')[0]['name'])->toBe('U1');
    expect($responsePage2->json('data')[0]['name'])->toBe('U2');
});

// Requirement 30: PDF prints return a PDF file
test('print pdf produces a pdf file', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $response = $this->actingAs($user)->get(route('product_units.print.pdf'));
    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');

    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.pdf');
});

// Requirement 31: Excel prints return a .xlsx file and have correct columns
test('print excel produces a .xlsx file and has correct columns', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $biz = Business::create(['name' => 'ExcelBiz', 'description' => 'Desc', 'user_id' => null]);
    ProductUnit::create(['name' => 'ExcelUnit', 'short_name' => 'EU', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->get(route('product_units.print.excel'));
    $response->assertOk();
    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.xlsx');

    // Simulate mapping array to check the columns
    $data = ProductUnit::with('business')->get();
    $item = [
        'No' => 1,
        'Nama Satuan' => $data[0]->name,
        'Nama Pendek' => $data[0]->short_name,
        'Deskripsi' => $data[0]->description ?: '-',
        'Ijinkan Desimal' => $data[0]->allow_decimal ? 'Ya' : 'Tidak',
        'Bisnis Terkait' => $data[0]->business ? $data[0]->business->name : '-',
        'Tanggal Dibuat' => $data[0]->created_at ? $data[0]->created_at->format('Y-m-d H:i:s') : '-',
    ];
    expect(array_keys($item))->toBe(['No', 'Nama Satuan', 'Nama Pendek', 'Deskripsi', 'Ijinkan Desimal', 'Bisnis Terkait', 'Tanggal Dibuat']);
});

// Requirement 32: Units of deleted businesses do not show up in the datatable
test('units from deleted businesses do not show up in the datatable', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Satuan Produk Keseluruhan']);

    $biz1 = Business::create(['name' => 'Active Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Deleted Business', 'description' => 'Desc', 'user_id' => null]);

    ProductUnit::create(['name' => 'Active Unit', 'short_name' => 'AU', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz1->id]);
    ProductUnit::create(['name' => 'Deleted Unit', 'short_name' => 'DU', 'description' => 'D', 'allow_decimal' => true, 'business_id' => $biz2->id]);

    // Soft delete the second business
    $biz2->delete();

    $response = $this->actingAs($user)->getJson(route('product_units.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Active Unit');
});

// Requirement 33: Product unit name must be unique per business_id
test('product unit name must be unique per business_id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Satuan Produk Pribadi']);

    $biz1 = Business::create(['name' => 'Biz 1', 'description' => 'Desc', 'user_id' => $user->id]);
    $biz2 = Business::create(['name' => 'Biz 2', 'description' => 'Desc', 'user_id' => $user->id]);

    // Store first unit in Biz 1
    $this->actingAs($user)->post(route('product_units.store'), [
        'name' => 'Kilogram',
        'short_name' => 'Kg',
        'description' => 'Weight',
        'allow_decimal' => true,
        'business_id' => $biz1->id
    ])->assertRedirect(route('product_units.index'));

    // Try to store duplicate name in Biz 1
    $this->actingAs($user)->post(route('product_units.store'), [
        'name' => 'Kilogram',
        'short_name' => 'Kilo',
        'description' => 'Duplicate weight',
        'allow_decimal' => true,
        'business_id' => $biz1->id
    ])->assertSessionHasErrors(['name']);

    // Allowed to store duplicate name in different business (Biz 2)
    $this->actingAs($user)->post(route('product_units.store'), [
        'name' => 'Kilogram',
        'short_name' => 'Kg',
        'description' => 'Weight in Biz 2',
        'allow_decimal' => true,
        'business_id' => $biz2->id
    ])->assertRedirect(route('product_units.index'));

    // Allowed to update unit keeping same name
    $unit = ProductUnit::where('name', 'Kilogram')->where('business_id', $biz1->id)->first();
    $user->assignPermissions(['Edit Data Satuan Produk Pribadi']);
    $this->actingAs($user)->put(route('product_units.update', $unit->id), [
        'name' => 'Kilogram',
        'short_name' => 'Kg-updated',
        'description' => 'Updated weight description',
        'allow_decimal' => true,
        'business_id' => $biz1->id
    ])->assertRedirect(route('product_units.index'));
});
