<?php

use App\Models\User;
use App\Models\Business;
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
        'Edit Data Bisnis Pribadi',
        'Edit Data Bisnis Keseluruhan',
        'Hapus Data Bisnis Pribadi',
        'Hapus Data Bisnis Keseluruhan',
    ];

    foreach ($permissions as $perm) {
        Permission::firstOrCreate(['name' => $perm]);
    }

    $this->adminRole = Role::firstOrCreate(['name' => 'Admin']);
    $viewOwnPermission = Permission::where('name', 'Lihat Data Bisnis Pribadi')->first();
    $this->adminRole->permissions()->syncWithoutDetaching([$viewOwnPermission->id]);
});

// Requirement 1: Access control for view permissions
test('users with Lihat Data Bisnis Pribadi or Lihat Data Bisnis Keseluruhan can access /business index, datatable, print/pdf, and excel', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Lihat Data Bisnis Pribadi']);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    $user3 = User::factory()->create(); // No permission

    foreach ([$user1, $user2] as $user) {
        $this->actingAs($user)->get(route('businesses.index'))->assertOk();
        $this->actingAs($user)->getJson(route('businesses.datatable'))->assertOk();
        $this->actingAs($user)->get(route('businesses.print.pdf'))->assertOk();
        $this->actingAs($user)->get(route('businesses.print.excel'))->assertOk();
    }

    // No permission should be forbidden
    $this->actingAs($user3)->get(route('businesses.index'))->assertStatus(403);
    $this->actingAs($user3)->getJson(route('businesses.datatable'))->assertStatus(403);
    $this->actingAs($user3)->get(route('businesses.print.pdf'))->assertStatus(403);
    $this->actingAs($user3)->get(route('businesses.print.excel'))->assertStatus(403);
});

// Requirement 2: Access control for create permissions
test('users with Tambah Data Bisnis Pribadi or Tambah Data Bisnis Keseluruhan can access create and store', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Tambah Data Bisnis Pribadi']);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Tambah Data Bisnis Keseluruhan', 'Lihat Data Bisnis Keseluruhan']); // needs view to select user

    $user3 = User::factory()->create(); // No permission

    $this->actingAs($user1)->get(route('businesses.create'))->assertOk();
    $this->actingAs($user2)->get(route('businesses.create'))->assertOk();
    $this->actingAs($user3)->get(route('businesses.create'))->assertStatus(403);

    // Test store access (valid input to verify permission check passes)
    $this->actingAs($user1)->post(route('businesses.store'), [
        'name' => 'Store Test 1',
        'description' => 'Desc 1'
    ])->assertRedirect(route('businesses.index'));

    $otherUser = User::factory()->create();
    $this->actingAs($user2)->post(route('businesses.store'), [
        'name' => 'Store Test 2',
        'description' => 'Desc 2',
        'user_id' => $otherUser->id
    ])->assertRedirect(route('businesses.index'));

    $this->actingAs($user3)->post(route('businesses.store'), [
        'name' => 'Store Test 3',
        'description' => 'Desc 3'
    ])->assertStatus(403);
});

// Requirement 3: Access control for edit/update permissions
test('users with Edit Data Bisnis Pribadi or Edit Data Bisnis Keseluruhan can access edit form and update action', function () {
    $owner = User::factory()->create();
    $owner->assignPermissions(['Edit Data Bisnis Pribadi', 'Lihat Data Bisnis Pribadi']);

    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Bisnis Keseluruhan', 'Lihat Data Bisnis Keseluruhan']);

    $unauthorized = User::factory()->create(); // No edit permission

    $business = Business::create(['name' => 'Test Business', 'description' => 'Desc', 'user_id' => $owner->id]);

    // Owner can access edit/update
    $this->actingAs($owner)->get(route('businesses.edit', $business->id))->assertOk();
    $this->actingAs($owner)->put(route('businesses.update', $business->id), [
        'name' => 'Updated by Owner',
        'description' => 'Updated Desc'
    ])->assertRedirect(route('businesses.index'));

    // Admin can access edit/update
    $this->actingAs($admin)->get(route('businesses.edit', $business->id))->assertOk();
    $this->actingAs($admin)->put(route('businesses.update', $business->id), [
        'name' => 'Updated by Admin',
        'description' => 'Admin Updated Desc',
        'user_id' => $owner->id
    ])->assertRedirect(route('businesses.index'));

    // Unauthorized cannot access edit/update
    $this->actingAs($unauthorized)->get(route('businesses.edit', $business->id))->assertStatus(403);
    $this->actingAs($unauthorized)->put(route('businesses.update', $business->id), [
        'name' => 'Fail',
        'description' => 'Fail'
    ])->assertStatus(403);
});

// Requirement 4: Access control for delete permission
test('users with Hapus Data Bisnis Pribadi or Hapus Data Bisnis Keseluruhan can access delete route', function () {
    $owner = User::factory()->create();
    $owner->assignPermissions(['Hapus Data Bisnis Pribadi']);

    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Bisnis Keseluruhan']);

    $unauthorized = User::factory()->create();

    $biz1 = Business::create(['name' => 'Biz 1', 'description' => 'Desc', 'user_id' => $owner->id]);
    $biz2 = Business::create(['name' => 'Biz 2', 'description' => 'Desc', 'user_id' => $owner->id]);

    // Owner deletes own
    $this->actingAs($owner)->delete(route('businesses.destroy', $biz1->id))->assertRedirect(route('businesses.index'));
    
    // Admin deletes any
    $this->actingAs($admin)->delete(route('businesses.destroy', $biz2->id))->assertRedirect(route('businesses.index'));

    // Unauthorized cannot delete
    $biz3 = Business::create(['name' => 'Biz 3', 'description' => 'Desc', 'user_id' => $owner->id]);
    $this->actingAs($unauthorized)->delete(route('businesses.destroy', $biz3->id))->assertStatus(403);
});

// Requirement 5: Fields for Lihat Data Bisnis Keseluruhan in datatable
test('users with Lihat Data Bisnis Keseluruhan datatable response contains exactly id, name, description, owner_name, and owner_id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    Business::create(['name' => 'B1', 'description' => 'D1', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->getJson(route('businesses.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'description', 'owner_name', 'owner_id'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 6: Fields for Lihat Data Bisnis Pribadi in datatable
test('users with Lihat Data Bisnis Pribadi datatable response contains exactly id, name, description, and owner_id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Pribadi']);

    Business::create(['name' => 'B1', 'description' => 'D1', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->getJson(route('businesses.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    $keys = array_keys($item);
    sort($keys);

    $expectedKeys = ['id', 'name', 'description', 'owner_id'];
    sort($expectedKeys);

    expect($keys)->toBe($expectedKeys);
});

// Requirement 8: All owner_id matches logged-in user under Lihat Data Bisnis Pribadi
test('users with Lihat Data Bisnis Pribadi only see businesses with owner_id matching their own id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Pribadi']);

    $otherUser = User::factory()->create();

    Business::create(['name' => 'B1', 'description' => 'D1', 'user_id' => $user->id]);
    Business::create(['name' => 'B2', 'description' => 'D2', 'user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->getJson(route('businesses.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['owner_id'])->toBe($user->id);
    }
});

// Requirement 9: owner_id can differ from logged-in user under Lihat Data Bisnis Keseluruhan
test('users with Lihat Data Bisnis Keseluruhan can see businesses with owner_id different from theirs', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    $otherUser = User::factory()->create();

    Business::create(['name' => 'B1', 'description' => 'D1', 'user_id' => $user->id]);
    Business::create(['name' => 'B2', 'description' => 'D2', 'user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->getJson(route('businesses.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    $ownerIds = collect($data)->pluck('owner_id')->unique()->toArray();

    expect($ownerIds)->toContain($otherUser->id);
});

// Requirement 10: user_id automatically forced to logged-in user under Tambah Data Bisnis Pribadi
test('user with Tambah Data Bisnis Pribadi has user_id auto-filled to logged-in user even if sent otherwise in request', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Bisnis Pribadi']);

    $otherUser = User::factory()->create();

    $response = $this->actingAs($user)->post(route('businesses.store'), [
        'name' => 'My Business',
        'description' => 'My description',
        'user_id' => $otherUser->id // Attempting to set different user_id
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', [
        'name' => 'My Business',
        'user_id' => $user->id
    ]);
});

// Requirement 11: user_id can be sent and saved from request under Tambah Data Bisnis Keseluruhan
test('user with Tambah Data Bisnis Keseluruhan can specify user_id and it is stored as requested', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Bisnis Keseluruhan', 'Lihat Data Bisnis Keseluruhan']);

    $otherUser = User::factory()->create();

    $response = $this->actingAs($admin)->post(route('businesses.store'), [
        'name' => 'Admin Created Business',
        'description' => 'Some description',
        'user_id' => $otherUser->id
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', [
        'name' => 'Admin Created Business',
        'user_id' => $otherUser->id
    ]);
});

// Requirement 12: name and description are required
test('name and description are required when storing a business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Bisnis Pribadi']);

    $response = $this->actingAs($user)->post(route('businesses.store'), [
        'name' => '',
        'description' => ''
    ]);

    $response->assertSessionHasErrors(['name', 'description']);
});

// Requirement 13: user_id is required for user with Tambah Data Keseluruhan
test('user_id is required for user with Tambah Data Bisnis Keseluruhan', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Bisnis Keseluruhan', 'Lihat Data Bisnis Keseluruhan']);

    $response = $this->actingAs($admin)->post(route('businesses.store'), [
        'name' => 'Admin Business',
        'description' => 'Admin Desc',
        // user_id is missing
    ]);

    $response->assertSessionHasErrors(['user_id']);
});

// Requirement 14: business data is passed as props in edit form
test('business data exists as inertia props in edit page', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Bisnis Pribadi', 'Lihat Data Bisnis Pribadi']);

    $business = Business::create(['name' => 'Edit Prop Test', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('businesses.edit', $business->id));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('businesses/create')
        ->has('business')
        ->where('business.id', $business->id)
    );
});

// Requirement 15: Edit Data Bisnis Pribadi forces user_id to logged-in user on update
test('user with Edit Data Bisnis Pribadi has user_id locked to logged-in user on update', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Bisnis Pribadi', 'Lihat Data Bisnis Pribadi']);

    $otherUser = User::factory()->create();

    $business = Business::create(['name' => 'Own Business', 'description' => 'Old Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->put(route('businesses.update', $business->id), [
        'name' => 'Updated Business',
        'description' => 'New Desc',
        'user_id' => $otherUser->id // attempting to steal/change owner
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', [
        'id' => $business->id,
        'name' => 'Updated Business',
        'user_id' => $user->id // remains unchanged
    ]);
});

// Requirement 16: Edit Data Bisnis Keseluruhan can change user_id on update
test('user with Edit Data Bisnis Keseluruhan can change user_id on update', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Bisnis Keseluruhan', 'Lihat Data Bisnis Keseluruhan']);

    $otherUser = User::factory()->create();

    $business = Business::create(['name' => 'Old Business', 'description' => 'Old Desc', 'user_id' => $admin->id]);

    $response = $this->actingAs($admin)->put(route('businesses.update', $business->id), [
        'name' => 'Transferred Business',
        'description' => 'New Desc',
        'user_id' => $otherUser->id // transferring ownership
    ]);

    $response->assertRedirect(route('businesses.index'));
    $this->assertDatabaseHas('businesses', [
        'id' => $business->id,
        'name' => 'Transferred Business',
        'user_id' => $otherUser->id
    ]);
});

// Requirement 17: Edit Data Bisnis Pribadi cannot access other user\'s edit form
test('user with Edit Data Bisnis Pribadi cannot view edit form of other user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Bisnis Pribadi', 'Lihat Data Bisnis Pribadi']);

    $otherUser = User::factory()->create();
    $otherBusiness = Business::create(['name' => 'Other Business', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->get(route('businesses.edit', $otherBusiness->id));
    $response->assertStatus(403);
});

// Requirement 18: Hapus Data Bisnis Pribadi cannot delete other user\'s business
test('user with Hapus Data Bisnis Pribadi cannot delete other user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Bisnis Pribadi']);

    $otherUser = User::factory()->create();
    $otherBusiness = Business::create(['name' => 'Other Business', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $response = $this->actingAs($user)->delete(route('businesses.destroy', $otherBusiness->id));
    $response->assertStatus(403);
    $this->assertDatabaseHas('businesses', ['id' => $otherBusiness->id, 'deleted_at' => null]);
});

// Requirement 19: Hapus Data Bisnis Keseluruhan can delete any business
test('user with Hapus Data Bisnis Keseluruhan can delete any business', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Bisnis Keseluruhan']);

    $otherUser = User::factory()->create();
    $otherBusiness = Business::create(['name' => 'Other Business', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $response = $this->actingAs($admin)->delete(route('businesses.destroy', $otherBusiness->id));
    $response->assertRedirect(route('businesses.index'));
    $this->assertSoftDeleted('businesses', ['id' => $otherBusiness->id]);
});

// Requirement 20: deleted_at is filled upon deletion
test('deleted_at field is filled when business is deleted', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Bisnis Keseluruhan']);

    $business = Business::create(['name' => 'To Be Deleted', 'description' => 'Desc', 'user_id' => $admin->id]);

    $this->actingAs($admin)->delete(route('businesses.destroy', $business->id));

    $deletedBusiness = Business::onlyTrashed()->find($business->id);
    expect($deletedBusiness->deleted_at)->not->toBeNull();
});

// Requirement 21: Global search filters name and description under Lihat Data Bisnis Pribadi
test('global search filters name and description for user with Lihat Data Bisnis Pribadi', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Pribadi']);

    Business::create(['name' => 'Apple Shop', 'description' => 'Selling fruits', 'user_id' => $user->id]);
    Business::create(['name' => 'Banana Store', 'description' => 'Selling yellow things', 'user_id' => $user->id]);
    Business::create(['name' => 'Orange Shop', 'description' => 'Selling citrus fruits', 'user_id' => $user->id]);

    // Search matches name
    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['search' => 'Apple']));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('Apple Shop');

    // Search matches description
    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['search' => 'citrus']));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('Orange Shop');
});

// Requirement 22: Global search filters name, description, and owner.name under Lihat Data Bisnis Keseluruhan
test('global search filters name, description, and owner name for user with Lihat Data Bisnis Keseluruhan', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    $owner1 = User::factory()->create(['name' => 'John Doe']);
    $owner2 = User::factory()->create(['name' => 'Jane Smith']);

    Business::create(['name' => 'Alpha', 'description' => 'First business', 'user_id' => $owner1->id]);
    Business::create(['name' => 'Beta', 'description' => 'Second business', 'user_id' => $owner2->id]);

    // Search by owner name
    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['search' => 'John']));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('Alpha');

    // Search by description
    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['search' => 'Second']));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('Beta');
});

// Requirement 23: Individual search filters name, description, and owner_name
test('individual search on name, description, and owner filters properly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    $owner = User::factory()->create(['name' => 'Owner Name Test']);

    Business::create(['name' => 'UniqueName', 'description' => 'Normal desc', 'user_id' => $user->id]);
    Business::create(['name' => 'Normal name', 'description' => 'UniqueDescription', 'user_id' => $user->id]);
    Business::create(['name' => 'Another name', 'description' => 'Another desc', 'user_id' => $owner->id]);

    // Filter by name
    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['name' => 'UniqueName']));
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('UniqueName');

    // Filter by description
    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['description' => 'UniqueDescription']));
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['description'])->toBe('UniqueDescription');

    // Filter by owner
    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['owner' => 'Owner Name Test']));
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['owner_name'])->toBe('Owner Name Test');
});

// Requirement 24: Limit filters maximum business count
test('limit parameter limits the count of businesses returned', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    for ($i = 0; $i < 5; $i++) {
        Business::create(['name' => "Biz $i", 'description' => 'Desc', 'user_id' => $user->id]);
    }

    $response = $this->actingAs($user)->getJson(route('businesses.datatable', ['limit' => 2]));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

// Requirement 25: Page parameter handles pagination page transitions
test('page parameter switches paginated pages', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    // Order by ID asc to make assertions reliable
    Business::create(['name' => "Biz 1", 'description' => 'Desc', 'user_id' => $user->id]);
    Business::create(['name' => "Biz 2", 'description' => 'Desc', 'user_id' => $user->id]);

    $responsePage1 = $this->actingAs($user)->getJson(route('businesses.datatable', ['limit' => 1, 'page' => 1, 'sort_by' => 'id', 'sort_type' => 'asc']));
    $responsePage2 = $this->actingAs($user)->getJson(route('businesses.datatable', ['limit' => 1, 'page' => 2, 'sort_by' => 'id', 'sort_type' => 'asc']));

    expect($responsePage1->json('data'))->toHaveCount(1);
    expect($responsePage2->json('data'))->toHaveCount(1);

    expect($responsePage1->json('data')[0]['name'])->toBe('Biz 1');
    expect($responsePage2->json('data')[0]['name'])->toBe('Biz 2');
});

// Requirement 26: PDF prints return a PDF extension file
test('print pdf produces a pdf file', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Bisnis Keseluruhan']);

    $response = $this->actingAs($user)->get(route('businesses.print.pdf'));
    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');

    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.pdf');
});

// Requirement 27: Excel prints return a .xlsx file and have correct columns
test('print excel produces a .xlsx file and has correct columns', function () {
    $userOverall = User::factory()->create();
    $userOverall->assignPermissions(['Lihat Data Bisnis Keseluruhan', 'Lihat Data Bisnis Pribadi']);

    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Lihat Data Bisnis Pribadi']);

    // Create dummy business
    Business::create(['name' => 'ExcelBiz', 'description' => 'ExcelDesc', 'user_id' => $userOverall->id]);

    // Verify .xlsx extension in headers for overall user
    $response = $this->actingAs($userOverall)->get(route('businesses.print.excel'));
    $response->assertOk();
    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.xlsx');

    // Verify .xlsx extension in headers for own user
    $response2 = $this->actingAs($userOwn)->get(route('businesses.print.excel'));
    $response2->assertOk();
    $disposition2 = $response2->headers->get('Content-Disposition');
    expect($disposition2)->toContain('.xlsx');

    $data = Business::with('owner')->get();
    
    // Check columns and order for overall permission (No, Owner, Bisnis, Deskripsi)
    $itemOverall = [
        'No' => 1,
        'Owner' => $data[0]->owner ? $data[0]->owner->name : 'Global',
        'Bisnis' => $data[0]->name,
        'Deskripsi' => $data[0]->description ?? '-',
    ];
    expect(array_keys($itemOverall))->toBe(['No', 'Owner', 'Bisnis', 'Deskripsi']);

    // Check columns and order for own permission (No, Bisnis, Deskripsi)
    $itemOwn = [
        'No' => 1,
        'Bisnis' => $data[0]->name,
        'Deskripsi' => $data[0]->description ?? '-',
    ];
    expect(array_keys($itemOwn))->toBe(['No', 'Bisnis', 'Deskripsi']);
});

test('storing a business with a name that was previously soft deleted under the same user restores the record and updates the description', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Bisnis Pribadi', 'Lihat Data Bisnis Pribadi', 'Hapus Data Bisnis Pribadi']);

    // Create a business and then delete it
    $business = Business::create(['name' => 'Restorable Business', 'description' => 'Old description', 'user_id' => $user->id]);
    $this->actingAs($user)->delete(route('businesses.destroy', $business->id));

    $this->assertSoftDeleted('businesses', ['id' => $business->id]);

    // Now try to store it again with same name but new description
    $response = $this->actingAs($user)->post(route('businesses.store'), [
        'name' => 'Restorable Business',
        'description' => 'New restored description'
    ]);

    $response->assertRedirect(route('businesses.index'));
    
    // Check that it was restored (not soft deleted anymore)
    $this->assertDatabaseHas('businesses', [
        'id' => $business->id,
        'name' => 'Restorable Business',
        'description' => 'New restored description',
        'deleted_at' => null
    ]);

    // Check count is still 1 (no duplicate row was created)
    expect(Business::onlyTrashed()->count())->toBe(0);
    expect(Business::count())->toBe(1);
});
