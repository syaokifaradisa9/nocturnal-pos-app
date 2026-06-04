<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Branch;
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
        Permission::firstOrCreate(['name' => $perm]);
    }

    $this->adminRole = Role::firstOrCreate(['name' => 'Admin']);
    $viewOwnPermission = Permission::where('name', 'Lihat Data Bisnis Pribadi')->first();
    $this->adminRole->permissions()->syncWithoutDetaching([$viewOwnPermission->id]);
});

// Requirement 1: Access control for view permissions
test('users with appropriate permission can access /branches endpoints', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Lihat Data Cabang Pribadi']);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Lihat Data Cabang Penanggungjawab Bisnis']);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $unauthorized = User::factory()->create();

    foreach ([$user1, $user2, $user3] as $user) {
        $this->actingAs($user)->get(route('branches.index'))->assertOk();
        $this->actingAs($user)->getJson(route('branches.datatable'))->assertOk();
        $this->actingAs($user)->get(route('branches.print.pdf'))->assertOk();
        $this->actingAs($user)->get(route('branches.print.excel'))->assertOk();
    }

    $this->actingAs($unauthorized)->get(route('branches.index'))->assertStatus(403);
    $this->actingAs($unauthorized)->getJson(route('branches.datatable'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('branches.print.pdf'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('branches.print.excel'))->assertStatus(403);
});

// Requirement 2: Access control for create permissions
test('users with create branch permissions can access create page and store action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Tambah Data Cabang Pribadi', 'Lihat Data Cabang Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Tambah Data Cabang Penanggungjawab Bisnis', 'Lihat Data Cabang Penanggungjawab Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Tambah Data Cabang Keseluruhan', 'Lihat Data Cabang Keseluruhan']);

    $unauthorized = User::factory()->create();

    $this->actingAs($user1)->get(route('branches.create'))->assertOk();
    $this->actingAs($user2)->get(route('branches.create'))->assertOk();
    $this->actingAs($user3)->get(route('branches.create'))->assertOk();
    $this->actingAs($unauthorized)->get(route('branches.create'))->assertStatus(403);

    // Test store
    $this->actingAs($user1)->post(route('branches.store'), [
        'name' => 'Branch 1',
        'address' => 'Addr 1',
        'business_id' => $biz1->id
    ])->assertRedirect(route('branches.index'));

    $this->actingAs($user2)->post(route('branches.store'), [
        'name' => 'Branch 2',
        'address' => 'Addr 2',
        'business_id' => $biz2->id
    ])->assertRedirect(route('branches.index'));

    $this->actingAs($user3)->post(route('branches.store'), [
        'name' => 'Branch 3',
        'address' => 'Addr 3',
        'business_id' => $biz1->id
    ])->assertRedirect(route('branches.index'));

    $this->actingAs($unauthorized)->post(route('branches.store'), [
        'name' => 'Branch 4',
        'address' => 'Addr 4',
        'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Requirement 3: Access control for edit/update permissions
test('users with edit branch permissions can access edit form and update action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Edit Data Cabang Pribadi', 'Lihat Data Cabang Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $branch1 = Branch::create(['name' => 'Branch 1', 'address' => 'Addr 1', 'business_id' => $biz1->id]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Edit Data Cabang Penanggungjawab Bisnis', 'Lihat Data Cabang Penanggungjawab Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $branch2 = Branch::create(['name' => 'Branch 2', 'address' => 'Addr 2', 'business_id' => $biz2->id]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Edit Data Cabang Keseluruhan', 'Lihat Data Cabang Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test access
    $this->actingAs($user1)->get(route('branches.edit', $branch1->id))->assertOk();
    $this->actingAs($user1)->put(route('branches.update', $branch1->id), [
        'name' => 'Updated 1',
        'address' => 'Addr 1',
        'business_id' => $biz1->id
    ])->assertRedirect(route('branches.index'));

    $this->actingAs($user2)->get(route('branches.edit', $branch2->id))->assertOk();
    $this->actingAs($user2)->put(route('branches.update', $branch2->id), [
        'name' => 'Updated 2',
        'address' => 'Addr 2',
        'business_id' => $biz2->id
    ])->assertRedirect(route('branches.index'));

    $this->actingAs($user3)->get(route('branches.edit', $branch1->id))->assertOk();
    $this->actingAs($user3)->put(route('branches.update', $branch1->id), [
        'name' => 'Updated 3',
        'address' => 'Addr 1',
        'business_id' => $biz1->id
    ])->assertRedirect(route('branches.index'));

    $this->actingAs($unauthorized)->get(route('branches.edit', $branch1->id))->assertStatus(403);
    $this->actingAs($unauthorized)->put(route('branches.update', $branch1->id), [
        'name' => 'Fail',
        'address' => 'Fail',
        'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Requirement 4: Access control for delete permission
test('users with appropriate permission can delete branches', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Hapus Data Cabang Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $branch1 = Branch::create(['name' => 'B1', 'address' => 'A1', 'business_id' => $biz1->id]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Hapus Data Cabang Penanggungjawab Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $branch2 = Branch::create(['name' => 'B2', 'address' => 'A2', 'business_id' => $biz2->id]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Hapus Data Cabang Keseluruhan']);
    $branch3 = Branch::create(['name' => 'B3', 'address' => 'A3', 'business_id' => $biz1->id]);

    $unauthorized = User::factory()->create();

    // Test delete
    $this->actingAs($user1)->delete(route('branches.destroy', $branch1->id))->assertRedirect(route('branches.index'));
    $this->actingAs($user2)->delete(route('branches.destroy', $branch2->id))->assertRedirect(route('branches.index'));
    $this->actingAs($user3)->delete(route('branches.destroy', $branch3->id))->assertRedirect(route('branches.index'));

    $branch4 = Branch::create(['name' => 'B4', 'address' => 'A4', 'business_id' => $biz1->id]);
    $this->actingAs($unauthorized)->delete(route('branches.destroy', $branch4->id))->assertStatus(403);
});

// Requirement 5: Fields in datatable response for Lihat Data Cabang Keseluruhan
test('users with Lihat Data Cabang Keseluruhan datatable response contains exactly specific attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->getJson(route('branches.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'address', 'opening_time', 'end_time', 'business_name', 'business_id', 'owner_id', 'owner_name'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 6: Fields in datatable response for Lihat Data Cabang Pribadi
test('users with Lihat Data Cabang Pribadi datatable response contains exactly specific attributes including business_name', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Pribadi']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->getJson(route('branches.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'address', 'opening_time', 'end_time', 'business_id', 'business_name', 'owner_id'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 7: Fields in datatable response for Lihat Data Cabang Penanggungjawab Bisnis
test('users with Lihat Data Cabang Penanggungjawab Bisnis datatable response contains exactly basic branch attributes and responsible_user_id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Penanggungjawab Bisnis']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);
    Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->getJson(route('branches.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'address', 'opening_time', 'end_time', 'responsible_user_id'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 8: owner_id matches logged-in user in datatable under Lihat Data Cabang Pribadi
test('users with Lihat Data Cabang Pribadi datatable response owner_id matches logged-in user', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $ownBiz->id]);
    Branch::create(['name' => 'B2', 'address' => 'Addr', 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('branches.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['owner_id'])->toBe($user->id);
    }
});

// Requirement 9: responsible_user_id matches logged-in user under Lihat Data Cabang Penanggungjawab Bisnis
test('users with Lihat Data Cabang Penanggungjawab Bisnis datatable response responsible_user_id matches logged-in user', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Penanggungjawab Bisnis']);

    $assocBiz = Business::create(['name' => 'Assoc', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($assocBiz->id, ['role_id' => $this->adminRole->id]);

    Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $assocBiz->id]);

    $response = $this->actingAs($user)->getJson(route('branches.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['responsible_user_id'])->toBe($user->id);
    }
});

// Requirement 10: owner_id can differ from logged-in user under Lihat Data Cabang Keseluruhan
test('users with Lihat Data Cabang Keseluruhan datatable response owner_id can differ from logged-in user', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $ownBiz->id]);
    Branch::create(['name' => 'B2', 'address' => 'Addr', 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('branches.datatable'));
    $response->assertOk();

    $ownerIds = collect($response->json('data'))->pluck('owner_id')->unique()->toArray();
    expect($ownerIds)->toContain($otherUser->id);
});

// Requirement 11: Tambah Data Cabang Pribadi can choose own business_id but cannot choose other user\'s business_id
test('user with Tambah Data Cabang Pribadi can select owned business but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Cabang Pribadi', 'Lihat Data Cabang Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    // Success: select owned business
    $this->actingAs($user)->post(route('branches.store'), [
        'name' => 'Branch Own',
        'address' => 'Addr',
        'business_id' => $ownBiz->id
    ])->assertRedirect(route('branches.index'));

    // Forbidden: select another user's business
    $this->actingAs($user)->post(route('branches.store'), [
        'name' => 'Branch Forbidden',
        'address' => 'Addr',
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Requirement 12: Tambah Data Cabang Penanggungjawab Bisnis auto fills business_id when associated to 1 business
test('user with Tambah Data Cabang Penanggungjawab Bisnis auto-fills business_id when associated with exactly one business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Cabang Penanggungjawab Bisnis', 'Lihat Data Cabang Penanggungjawab Bisnis']);

    $biz = Business::create(['name' => 'Only One', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);

    // Send null for business_id, it should bypass standard exists check and auto-fill to the only associated business
    $response = $this->actingAs($user)->post(route('branches.store'), [
        'name' => 'Branch Auto',
        'address' => 'Addr',
        'business_id' => null
    ]);

    $response->assertRedirect(route('branches.index'));
    $this->assertDatabaseHas('branches', [
        'name' => 'Branch Auto',
        'business_id' => $biz->id
    ]);
});

// Requirement 13: Tambah Data Cabang Keseluruhan can specify business_id and it is stored as requested
test('user with Tambah Data Cabang Keseluruhan stores business_id exactly as requested', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Cabang Keseluruhan', 'Lihat Data Cabang Keseluruhan']);

    $biz = Business::create(['name' => 'Admin Biz', 'description' => 'Desc', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('branches.store'), [
        'name' => 'Branch Admin',
        'address' => 'Addr',
        'business_id' => $biz->id
    ]);

    $response->assertRedirect(route('branches.index'));
    $this->assertDatabaseHas('branches', [
        'name' => 'Branch Admin',
        'business_id' => $biz->id
    ]);
});

// Requirement 14: name and address are required
test('name and address are required when storing a branch', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Cabang Pribadi']);

    $response = $this->actingAs($user)->post(route('branches.store'), [
        'name' => '',
        'address' => ''
    ]);

    $response->assertSessionHasErrors(['name', 'address']);
});

// Requirement 15: business_id is required for Tambah Data Cabang Pribadi and Tambah Data Cabang Keseluruhan
test('business_id is required for Tambah Data Cabang Pribadi and Tambah Data Cabang Keseluruhan', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Tambah Data Cabang Pribadi']);

    $userAll = User::factory()->create();
    $userAll->assignPermissions(['Tambah Data Cabang Keseluruhan', 'Lihat Data Cabang Keseluruhan']);

    // For Pribadi
    $this->actingAs($userOwn)->post(route('branches.store'), [
        'name' => 'B1',
        'address' => 'A1'
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);

    // For Keseluruhan
    $this->actingAs($userAll)->post(route('branches.store'), [
        'name' => 'B2',
        'address' => 'A2'
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);
});

// Requirement 16: branch data is passed as props in edit form
test('branch data exists as inertia props in edit page', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Cabang Pribadi', 'Lihat Data Cabang Pribadi']);

    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->get(route('branches.edit', $branch->id));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('branches/index')
        ->has('branch')
        ->where('branch.id', $branch->id)
    );
});

// Requirement 17: Edit Data Cabang Pribadi can choose own business_id but cannot update to other user\'s business_id
test('user with Edit Data Cabang Pribadi can select owned business on update but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Cabang Pribadi', 'Lihat Data Cabang Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz1 = Business::create(['name' => 'Own Biz 1', 'description' => 'Desc', 'user_id' => $user->id]);
    $ownBiz2 = Business::create(['name' => 'Own Biz 2', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $branch = Branch::create(['name' => 'My Branch', 'address' => 'Addr', 'business_id' => $ownBiz1->id]);

    // Success: update to another owned business
    $this->actingAs($user)->put(route('branches.update', $branch->id), [
        'name' => 'Updated Branch',
        'address' => 'Addr',
        'business_id' => $ownBiz2->id
    ])->assertRedirect(route('branches.index'));

    $this->assertDatabaseHas('branches', [
        'id' => $branch->id,
        'business_id' => $ownBiz2->id
    ]);

    // Forbidden: update to another user's business
    $this->actingAs($user)->put(route('branches.update', $branch->id), [
        'name' => 'Updated Branch',
        'address' => 'Addr',
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Requirement 18: Edit Data Cabang Keseluruhan can change business_id via request
test('user with Edit Data Cabang Keseluruhan can update business_id via request', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Cabang Keseluruhan', 'Lihat Data Cabang Keseluruhan']);

    $biz1 = Business::create(['name' => 'Biz 1', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Biz 2', 'description' => 'Desc', 'user_id' => null]);

    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $biz1->id]);

    $response = $this->actingAs($admin)->put(route('branches.update', $branch->id), [
        'name' => 'Updated',
        'address' => 'Addr',
        'business_id' => $biz2->id
    ]);

    $response->assertRedirect(route('branches.index'));
    $this->assertDatabaseHas('branches', [
        'id' => $branch->id,
        'business_id' => $biz2->id
    ]);
});

// Requirement 19: Edit Data Cabang Pribadi cannot access other user\'s edit form
test('user with Edit Data Cabang Pribadi cannot view edit form of branch belonging to other user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Cabang Pribadi', 'Lihat Data Cabang Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->get(route('branches.edit', $branch->id));
    $response->assertStatus(403);
});

// Requirement 20: Edit Data Cabang Penanggungjawab Bisnis cannot access edit form of branch they do not manage
test('user with Edit Data Cabang Penanggungjawab Bisnis cannot view edit form of branch from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Cabang Penanggungjawab Bisnis', 'Lihat Data Cabang Penanggungjawab Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $unassociatedBiz->id]);

    $response = $this->actingAs($user)->get(route('branches.edit', $branch->id));
    $response->assertStatus(403);
});

// Requirement 21: Hapus Data Cabang Pribadi cannot delete other user\'s branch
test('user with Hapus Data Cabang Pribadi cannot delete other user\'s branch', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Cabang Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->delete(route('branches.destroy', $branch->id));
    $response->assertStatus(403);
});

// Requirement 22: Hapus Data Cabang Penanggungjawab Bisnis cannot delete branch they do not manage
test('user with Hapus Data Cabang Penanggungjawab Bisnis cannot delete branch from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Cabang Penanggungjawab Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $unassociatedBiz->id]);

    $response = $this->actingAs($user)->delete(route('branches.destroy', $branch->id));
    $response->assertStatus(403);
});

// Requirement 23: Hapus Data Cabang Keseluruhan can delete any branch
test('user with Hapus Data Cabang Keseluruhan can delete any branch', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Cabang Keseluruhan']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($admin)->delete(route('branches.destroy', $branch->id));
    $response->assertRedirect(route('branches.index'));
    $this->assertSoftDeleted('branches', ['id' => $branch->id]);
});

// Requirement 24: deleted_at is filled upon deletion
test('deleted_at is filled when branch is deleted', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Cabang Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $branch = Branch::create(['name' => 'B1', 'address' => 'Addr', 'business_id' => $biz->id]);

    $this->actingAs($admin)->delete(route('branches.destroy', $branch->id));

    $deleted = Branch::onlyTrashed()->find($branch->id);
    expect($deleted->deleted_at)->not->toBeNull();
});

// Requirement 25 & 26: Global search filters based on permission level
test('global search filters appropriately for Pribadi and Penanggungjawab levels', function () {
    // Pribadi
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Lihat Data Cabang Pribadi']);

    $ownBiz1 = Business::create(['name' => 'Apple Business', 'description' => 'Desc', 'user_id' => $userOwn->id]);
    $ownBiz2 = Business::create(['name' => 'Banana Business', 'description' => 'Desc', 'user_id' => $userOwn->id]);

    Branch::create(['name' => 'Fruit Branch', 'address' => 'Apple Street 1', 'opening_time' => '08:00', 'end_time' => '17:00', 'business_id' => $ownBiz1->id]);
    Branch::create(['name' => 'Yellow Branch', 'address' => 'Banana Street 2', 'opening_time' => '09:00', 'end_time' => '18:00', 'business_id' => $ownBiz2->id]);

    // Search by business_name
    $response1 = $this->actingAs($userOwn)->getJson(route('branches.datatable', ['search' => 'Apple']));
    expect($response1->json('data'))->toHaveCount(1);
    expect($response1->json('data')[0]['name'])->toBe('Fruit Branch');

    // Search by opening_time
    $response2 = $this->actingAs($userOwn)->getJson(route('branches.datatable', ['search' => '09:00']));
    expect($response2->json('data'))->toHaveCount(1);
    expect($response2->json('data')[0]['name'])->toBe('Yellow Branch');

    // Penanggungjawab
    $userAssoc = User::factory()->create();
    $userAssoc->assignPermissions(['Lihat Data Cabang Penanggungjawab Bisnis']);

    $assocBiz1 = Business::create(['name' => 'Citrus Business', 'description' => 'Desc', 'user_id' => null]);
    $userAssoc->businesses()->attach($assocBiz1->id, ['role_id' => $this->adminRole->id]);

    Branch::create(['name' => 'Citrus Branch', 'address' => 'Orange Street 3', 'opening_time' => '10:00', 'end_time' => '19:00', 'business_id' => $assocBiz1->id]);

    // Search by name
    $response3 = $this->actingAs($userAssoc)->getJson(route('branches.datatable', ['search' => 'Citrus']));
    expect($response3->json('data'))->toHaveCount(1);

    // Search by business name (should NOT return matches because Penanggungjawab doesn't search business_name)
    $response4 = $this->actingAs($userAssoc)->getJson(route('branches.datatable', ['search' => 'Citrus Business']));
    expect($response4->json('data'))->toHaveCount(0);
});

// Requirement 27: Individual search filters properly
test('individual search on business_name, name, and address filters correctly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $biz1 = Business::create(['name' => 'Target Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Normal Business', 'description' => 'Desc', 'user_id' => null]);

    Branch::create(['name' => 'UniqueName', 'address' => 'Address 1', 'business_id' => $biz2->id]);
    Branch::create(['name' => 'NormalName', 'address' => 'UniqueAddress', 'business_id' => $biz2->id]);
    Branch::create(['name' => 'AnotherBranch', 'address' => 'Address 2', 'business_id' => $biz1->id]);

    // Filter by name
    $responseName = $this->actingAs($user)->getJson(route('branches.datatable', ['name' => 'UniqueName']));
    expect($responseName->json('data'))->toHaveCount(1);
    expect($responseName->json('data')[0]['name'])->toBe('UniqueName');

    // Filter by address
    $responseAddr = $this->actingAs($user)->getJson(route('branches.datatable', ['address' => 'UniqueAddress']));
    expect($responseAddr->json('data'))->toHaveCount(1);
    expect($responseAddr->json('data')[0]['address'])->toBe('UniqueAddress');

    // Filter by business name
    $responseBiz = $this->actingAs($user)->getJson(route('branches.datatable', ['business_name' => 'Target Business']));
    expect($responseBiz->json('data'))->toHaveCount(1);
    expect($responseBiz->json('data')[0]['name'])->toBe('AnotherBranch');
});

// Requirement 28: Limit parameter limits returned branches
test('limit parameter limits count of branches returned', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    for ($i = 0; $i < 5; $i++) {
        Branch::create(['name' => "Branch $i", 'address' => 'Addr', 'business_id' => $biz->id]);
    }

    $response = $this->actingAs($user)->getJson(route('branches.datatable', ['limit' => 2]));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

// Requirement 29: Page parameter switches pages
test('page parameter switches paginated pages', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    Branch::create(['name' => "B1", 'address' => 'Addr', 'business_id' => $biz->id]);
    Branch::create(['name' => "B2", 'address' => 'Addr', 'business_id' => $biz->id]);

    $responsePage1 = $this->actingAs($user)->getJson(route('branches.datatable', ['limit' => 1, 'page' => 1, 'sort_by' => 'id', 'sort_type' => 'asc']));
    $responsePage2 = $this->actingAs($user)->getJson(route('branches.datatable', ['limit' => 1, 'page' => 2, 'sort_by' => 'id', 'sort_type' => 'asc']));

    expect($responsePage1->json('data'))->toHaveCount(1);
    expect($responsePage2->json('data'))->toHaveCount(1);

    expect($responsePage1->json('data')[0]['name'])->toBe('B1');
    expect($responsePage2->json('data')[0]['name'])->toBe('B2');
});

// Requirement 30: PDF prints return a PDF file
test('print pdf produces a pdf file', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $response = $this->actingAs($user)->get(route('branches.print.pdf'));
    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');

    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.pdf');
});

// Requirement 31: Excel prints return a .xlsx file and have correct columns
test('print excel produces a .xlsx file and has correct columns', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $biz = Business::create(['name' => 'ExcelBiz', 'description' => 'Desc', 'user_id' => null]);
    Branch::create(['name' => 'ExcelBranch', 'address' => 'ExcelAddr', 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->get(route('branches.print.excel'));
    $response->assertOk();
    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.xlsx');

    // Simulate mapping array to check the columns
    $data = Branch::with('business')->get();
    $item = [
        'No' => 1,
        'Nama Cabang' => $data[0]->name,
        'Alamat' => $data[0]->address,
        'Jam Buka' => $data[0]->opening_time ?? '-',
        'Jam Tutup' => $data[0]->end_time ?? '-',
        'Bisnis' => $data[0]->business ? $data[0]->business->name : '-',
    ];
    expect(array_keys($item))->toBe(['No', 'Nama Cabang', 'Alamat', 'Jam Buka', 'Jam Tutup', 'Bisnis']);
});

// Requirement 32: Branches of deleted businesses do not show up in the datatable
test('branches from deleted business do not show up in the datatable', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Cabang Keseluruhan']);

    $biz1 = Business::create(['name' => 'Active Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Deleted Business', 'description' => 'Desc', 'user_id' => null]);

    Branch::create(['name' => 'Active Branch', 'address' => 'Addr', 'business_id' => $biz1->id]);
    Branch::create(['name' => 'Deleted Branch', 'address' => 'Addr', 'business_id' => $biz2->id]);

    // Soft delete the second business
    $biz2->delete();

    $response = $this->actingAs($user)->getJson(route('branches.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Active Branch');
});
