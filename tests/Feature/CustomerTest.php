<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Customer;
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
        Permission::firstOrCreate(['name' => $perm]);
    }

    $this->adminRole = Role::firstOrCreate(['name' => 'Admin']);
    $viewOwnPermission = Permission::where('name', 'Lihat Data Bisnis Pribadi')->first();
    $this->adminRole->permissions()->syncWithoutDetaching([$viewOwnPermission->id]);
});

// Requirement 1: Access control for view permissions
test('users with appropriate permission can access /customers endpoints', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Lihat Data Customer Pribadi']);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Lihat Data Customer Penempatan Bisnis']);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $unauthorized = User::factory()->create();

    foreach ([$user1, $user2, $user3] as $user) {
        $this->actingAs($user)->get(route('customers.index'))->assertOk();
        $this->actingAs($user)->getJson(route('customers.datatable'))->assertOk();
        $this->actingAs($user)->get(route('customers.print.pdf'))->assertOk();
        $this->actingAs($user)->get(route('customers.print.excel'))->assertOk();
    }

    $this->actingAs($unauthorized)->get(route('customers.index'))->assertStatus(403);
    $this->actingAs($unauthorized)->getJson(route('customers.datatable'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('customers.print.pdf'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('customers.print.excel'))->assertStatus(403);
});

// Requirement 2: Access control for store action
test('users with appropriate permission can access store action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Tambah Data Customer Pribadi', 'Lihat Data Customer Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Tambah Data Customer Penempatan Bisnis', 'Lihat Data Customer Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Tambah Data Customer Keseluruhan', 'Lihat Data Customer Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test store
    $this->actingAs($user1)->post(route('customers.store'), [
        'name' => 'Customer 1',
        'phone' => '12345',
        'current_point' => 10,
        'business_id' => $biz1->id
    ])->assertRedirect(route('customers.index'));

    $this->actingAs($user2)->post(route('customers.store'), [
        'name' => 'Customer 2',
        'phone' => '67890',
        'current_point' => 20,
        'business_id' => $biz2->id
    ])->assertRedirect(route('customers.index'));

    $this->actingAs($user3)->post(route('customers.store'), [
        'name' => 'Customer 3',
        'phone' => '54321',
        'current_point' => 30,
        'business_id' => $biz1->id
    ])->assertRedirect(route('customers.index'));

    $this->actingAs($unauthorized)->post(route('customers.store'), [
        'name' => 'Customer 4',
        'phone' => '09876',
        'current_point' => 40,
        'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Requirement 3: Access control for update action
test('users with appropriate permission can access update action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Edit Data Customer Pribadi', 'Lihat Data Customer Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $cust1 = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $biz1->id
    ]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Edit Data Customer Penempatan Bisnis', 'Lihat Data Customer Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $cust2 = Customer::create([
        'name' => 'C2', 'phone' => '456', 'current_point' => 20, 'business_id' => $biz2->id
    ]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Edit Data Customer Keseluruhan', 'Lihat Data Customer Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test updates
    $this->actingAs($user1)->put(route('customers.update', $cust1->id), [
        'name' => 'Updated 1', 'phone' => '123', 'current_point' => 15, 'business_id' => $biz1->id
    ])->assertRedirect(route('customers.index'));

    $this->actingAs($user2)->put(route('customers.update', $cust2->id), [
        'name' => 'Updated 2', 'phone' => '456', 'current_point' => 25, 'business_id' => $biz2->id
    ])->assertRedirect(route('customers.index'));

    $this->actingAs($user3)->put(route('customers.update', $cust1->id), [
        'name' => 'Updated 3', 'phone' => '123', 'current_point' => 35, 'business_id' => $biz1->id
    ])->assertRedirect(route('customers.index'));

    $this->actingAs($unauthorized)->put(route('customers.update', $cust1->id), [
        'name' => 'Fail', 'phone' => '999', 'current_point' => 99, 'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Requirement 4: Access control for delete action
test('users with appropriate permission can delete customers', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Hapus Data Customer Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $cust1 = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $biz1->id
    ]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Hapus Data Customer Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $cust2 = Customer::create([
        'name' => 'C2', 'phone' => '456', 'current_point' => 20, 'business_id' => $biz2->id
    ]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Hapus Data Customer Keseluruhan']);
    $cust3 = Customer::create([
        'name' => 'C3', 'phone' => '789', 'current_point' => 30, 'business_id' => $biz1->id
    ]);

    $unauthorized = User::factory()->create();

    // Test delete
    $this->actingAs($user1)->delete(route('customers.destroy', $cust1->id))->assertRedirect(route('customers.index'));
    $this->actingAs($user2)->delete(route('customers.destroy', $cust2->id))->assertRedirect(route('customers.index'));
    $this->actingAs($user3)->delete(route('customers.destroy', $cust3->id))->assertRedirect(route('customers.index'));

    $cust4 = Customer::create([
        'name' => 'C4', 'phone' => '000', 'current_point' => 40, 'business_id' => $biz1->id
    ]);
    $this->actingAs($unauthorized)->delete(route('customers.destroy', $cust4->id))->assertStatus(403);
});

// Requirement 5, 6 & 7: Datatable response attributes
test('customer datatable response contains expected attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    Customer::create([
        'name' => 'C', 'phone' => '123', 'current_point' => 10, 'business_id' => $biz->id
    ]);

    $response = $this->actingAs($user)->getJson(route('customers.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    expect($item)->toHaveKeys(['id', 'name', 'phone', 'current_point', 'business_id', 'business']);
});

// Requirement 8: owner_id matches logged-in user in datatable under Lihat Data Customer Pribadi
test('users with Lihat Data Customer Pribadi only see customers with owner_id matching their own id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    Customer::create(['name' => 'C1', 'phone' => '1', 'current_point' => 10, 'business_id' => $ownBiz->id]);
    Customer::create(['name' => 'C2', 'phone' => '2', 'current_point' => 20, 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('customers.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['business']['user_id'])->toBe($user->id);
    }
});

// Requirement 9: responsible_user_id contains logged-in user under Lihat Data Customer Penempatan Bisnis
test('users with Lihat Data Customer Penempatan Bisnis datatable response business contains logged-in user association', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Penempatan Bisnis']);

    $assocBiz = Business::create(['name' => 'Assoc', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($assocBiz->id, ['role_id' => $this->adminRole->id]);

    Customer::create(['name' => 'C1', 'phone' => '1', 'current_point' => 10, 'business_id' => $assocBiz->id]);

    $response = $this->actingAs($user)->getJson(route('customers.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    // Verify that the business returned actually has relationship or id matching our assocBiz
    foreach ($data as $item) {
        expect($item['business_id'])->toBe($assocBiz->id);
    }
});

// Requirement 10: owner_id can differ from logged-in user under Lihat Data Customer Keseluruhan
test('users with Lihat Data Customer Keseluruhan can see customers with owner_id different from theirs', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    Customer::create(['name' => 'C1', 'phone' => '1', 'current_point' => 10, 'business_id' => $ownBiz->id]);
    Customer::create(['name' => 'C2', 'phone' => '2', 'current_point' => 20, 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('customers.datatable'));
    $response->assertOk();

    $businessOwnerIds = collect($response->json('data'))->pluck('business.user_id')->unique()->toArray();
    expect($businessOwnerIds)->toContain($otherUser->id);
});

// Requirement 11: Tambah Data Customer Pribadi can choose own business_id but cannot choose other user\'s business_id
test('user with Tambah Data Customer Pribadi can select owned business but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Customer Pribadi', 'Lihat Data Customer Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    // Success: select owned business
    $this->actingAs($user)->post(route('customers.store'), [
        'name' => 'Customer Own',
        'phone' => '123',
        'current_point' => 10,
        'business_id' => $ownBiz->id
    ])->assertRedirect(route('customers.index'));

    // Forbidden: select another user's business
    $this->actingAs($user)->post(route('customers.store'), [
        'name' => 'Customer Forbidden',
        'phone' => '456',
        'current_point' => 10,
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Requirement 12: Tambah Data Customer Penempatan Bisnis auto fills business_id when associated to 1 business
test('user with Tambah Data Customer Penempatan Bisnis auto-fills business_id when associated with exactly one business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Customer Penempatan Bisnis', 'Lihat Data Customer Penempatan Bisnis']);

    $biz = Business::create(['name' => 'Only One', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);

    // Send empty business_id, it should auto fill to the only associated business
    $response = $this->actingAs($user)->post(route('customers.store'), [
        'name' => 'Customer Auto',
        'phone' => '123',
        'current_point' => 10,
        'business_id' => ''
    ]);

    $response->assertRedirect(route('customers.index'));
    
    $customer = Customer::where('name', 'Customer Auto')->first();
    expect($customer->business_id)->toBe($biz->id);
});

// Requirement 13: Tambah Data Customer Keseluruhan stores business_id exactly as requested
test('user with Tambah Data Customer Keseluruhan stores business_id exactly as requested', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Customer Keseluruhan', 'Lihat Data Customer Keseluruhan']);

    $biz = Business::create(['name' => 'Admin Biz', 'description' => 'Desc', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('customers.store'), [
        'name' => 'Customer Admin',
        'phone' => '123',
        'current_point' => 10,
        'business_id' => $biz->id
    ]);

    $response->assertRedirect(route('customers.index'));
    
    $customer = Customer::where('name', 'Customer Admin')->first();
    expect($customer->business_id)->toBe($biz->id);
});

// Requirement 14: name is required, phone is nullable, and current_point defaults to 0 if null/empty
test('customer attributes validation rules work properly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Customer Pribadi']);
    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('customers.store'), [
        'name' => '',
        'phone' => '',
        'current_point' => null
    ]);

    $response->assertSessionHasErrors(['name']);

    // Check current_point defaulting to 0 when omitted/null
    $this->actingAs($user)->post(route('customers.store'), [
        'name' => 'Omitted Point',
        'phone' => null,
        'current_point' => null,
        'business_id' => $biz->id
    ])->assertRedirect(route('customers.index'));

    $customer = Customer::where('name', 'Omitted Point')->first();
    expect($customer->current_point)->toBe(0);
});

// Requirement 15: business_id is required for Tambah Data Customer Pribadi and Tambah Data Customer Keseluruhan
test('business_id is required for Tambah Data Customer Pribadi and Tambah Data Customer Keseluruhan', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Tambah Data Customer Pribadi', 'Lihat Data Customer Pribadi']);
    Business::create(['name' => 'Biz 1', 'user_id' => $userOwn->id]);
    Business::create(['name' => 'Biz 2', 'user_id' => $userOwn->id]);

    $userAll = User::factory()->create();
    $userAll->assignPermissions(['Tambah Data Customer Keseluruhan', 'Lihat Data Customer Keseluruhan']);

    // For Pribadi
    $this->actingAs($userOwn)->post(route('customers.store'), [
        'name' => 'C1', 'phone' => '123', 'current_point' => 10
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);

    // For Keseluruhan
    $this->actingAs($userAll)->post(route('customers.store'), [
        'name' => 'C2', 'phone' => '456', 'current_point' => 10
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);
});

// Requirement 16: customer selection data exists in response/props
test('customer index passes businesses list and user options in props', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Pribadi']);

    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('customers.index'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('customers/index')
        ->has('businesses')
        ->has('users')
    );
});

// Requirement 17: Edit Data Customer Pribadi can choose owned business_id but cannot update to other user\'s business_id
test('user with Edit Data Customer Pribadi can select owned business on update but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Customer Pribadi', 'Lihat Data Customer Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz1 = Business::create(['name' => 'Own Biz 1', 'description' => 'Desc', 'user_id' => $user->id]);
    $ownBiz2 = Business::create(['name' => 'Own Biz 2', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $customer = Customer::create([
        'name' => 'My Customer', 'phone' => '123', 'current_point' => 10, 'business_id' => $ownBiz1->id
    ]);

    // Success: update to another owned business
    $this->actingAs($user)->put(route('customers.update', $customer->id), [
        'name' => 'Updated Customer',
        'phone' => '123',
        'current_point' => 10,
        'business_id' => $ownBiz2->id
    ])->assertRedirect(route('customers.index'));

    expect($customer->fresh()->business_id)->toBe($ownBiz2->id);

    // Forbidden: update to another user's business
    $this->actingAs($user)->put(route('customers.update', $customer->id), [
        'name' => 'Updated Customer',
        'phone' => '123',
        'current_point' => 10,
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Requirement 18: Edit Data Customer Keseluruhan can change business_id via request
test('user with Edit Data Customer Keseluruhan can update business_id via request', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Customer Keseluruhan', 'Lihat Data Customer Keseluruhan']);

    $biz1 = Business::create(['name' => 'Biz 1', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Biz 2', 'description' => 'Desc', 'user_id' => null]);

    $customer = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $biz1->id
    ]);

    $response = $this->actingAs($admin)->put(route('customers.update', $customer->id), [
        'name' => 'Updated',
        'phone' => '123',
        'current_point' => 10,
        'business_id' => $biz2->id
    ]);

    $response->assertRedirect(route('customers.index'));
    expect($customer->fresh()->business_id)->toBe($biz2->id);
});

// Requirement 19: Edit Data Customer Pribadi cannot update customer belonging to other user\'s business
test('user with Edit Data Customer Pribadi cannot update customer belonging to other user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Customer Pribadi', 'Lihat Data Customer Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    
    $customer = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($user)->put(route('customers.update', $customer->id), [
        'name' => 'Try Update', 'phone' => '123', 'current_point' => 10, 'business_id' => $otherBiz->id
    ]);
    $response->assertStatus(403);
});

// Requirement 20: Edit Data Customer Penempatan Bisnis cannot update customer they do not manage
test('user with Edit Data Customer Penempatan Bisnis cannot update customer from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Customer Penempatan Bisnis', 'Lihat Data Customer Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $customer = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $unassociatedBiz->id
    ]);

    $response = $this->actingAs($user)->put(route('customers.update', $customer->id), [
        'name' => 'Try Update', 'phone' => '123', 'current_point' => 10, 'business_id' => $unassociatedBiz->id
    ]);
    $response->assertStatus(403);
});

// Requirement 21: Hapus Data Customer Pribadi cannot delete other user\'s customer
test('user with Hapus Data Customer Pribadi cannot delete other user\'s customer', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Customer Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $customer = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($user)->delete(route('customers.destroy', $customer->id));
    $response->assertStatus(403);
});

// Requirement 22: Hapus Data Customer Penempatan Bisnis cannot delete customer they do not manage
test('user with Hapus Data Customer Penempatan Bisnis cannot delete customer from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Customer Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $customer = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $unassociatedBiz->id
    ]);

    $response = $this->actingAs($user)->delete(route('customers.destroy', $customer->id));
    $response->assertStatus(403);
});

// Requirement 23: Hapus Data Customer Keseluruhan can delete any customer
test('user with Hapus Data Customer Keseluruhan can delete any customer', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Customer Keseluruhan']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $customer = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($admin)->delete(route('customers.destroy', $customer->id));
    $response->assertRedirect(route('customers.index'));
    $this->assertSoftDeleted('customers', ['id' => $customer->id]);
});

// Requirement 24: deleted_at is filled upon deletion
test('deleted_at is filled when customer is deleted', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Customer Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $customer = Customer::create([
        'name' => 'C1', 'phone' => '123', 'current_point' => 10, 'business_id' => $biz->id
    ]);

    $this->actingAs($admin)->delete(route('customers.destroy', $customer->id));

    $deleted = Customer::onlyTrashed()->find($customer->id);
    expect($deleted->deleted_at)->not->toBeNull();
});

// Requirement 25: Global search filters appropriately based on permission settings (Pribadi)
test('global search filters appropriately based on permission settings for Pribadi', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Lihat Data Customer Pribadi']);

    $ownBiz = Business::create(['name' => 'Apple Business', 'description' => 'Desc', 'user_id' => $userOwn->id]);

    Customer::create(['name' => 'Citrus Customer', 'phone' => '1111', 'current_point' => 10, 'business_id' => $ownBiz->id]);
    Customer::create(['name' => 'Banana Customer', 'phone' => '2222', 'current_point' => 20, 'business_id' => $ownBiz->id]);

    // Search by phone
    $response1 = $this->actingAs($userOwn)->getJson(route('customers.datatable', ['search' => '2222']));
    expect($response1->json('data'))->toHaveCount(1);
    expect($response1->json('data')[0]['name'])->toBe('Banana Customer');

    // Search by business name
    $response2 = $this->actingAs($userOwn)->getJson(route('customers.datatable', ['search' => 'Apple']));
    expect($response2->json('data'))->toHaveCount(2);
});

// Requirement 26: Global search filters appropriately based on permission settings (Keseluruhan)
test('global search filters appropriately based on permission settings for Keseluruhan', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $biz = Business::create(['name' => 'Cherry Business', 'description' => 'Desc', 'user_id' => null]);

    Customer::create(['name' => 'Watermelon Customer', 'phone' => '3333', 'current_point' => 10, 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->getJson(route('customers.datatable', ['search' => 'Cherry']));
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('Watermelon Customer');
});

// Requirement 27: Individual search filters properly
test('individual search on business, name, and phone filters correctly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $biz1 = Business::create(['name' => 'Target Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Normal Business', 'description' => 'Desc', 'user_id' => null]);

    Customer::create(['name' => 'UniqueName', 'phone' => '111', 'current_point' => 10, 'business_id' => $biz2->id]);
    Customer::create(['name' => 'NormalName', 'phone' => 'UniquePhone', 'current_point' => 10, 'business_id' => $biz2->id]);
    Customer::create(['name' => 'TargetCustomer', 'phone' => '222', 'current_point' => 10, 'business_id' => $biz1->id]);

    // Filter by name
    $responseName = $this->actingAs($user)->getJson(route('customers.datatable', ['name' => 'UniqueName']));
    expect($responseName->json('data'))->toHaveCount(1);
    expect($responseName->json('data')[0]['name'])->toBe('UniqueName');

    // Filter by phone
    $responsePhone = $this->actingAs($user)->getJson(route('customers.datatable', ['phone' => 'UniquePhone']));
    expect($responsePhone->json('data'))->toHaveCount(1);
    expect($responsePhone->json('data')[0]['name'])->toBe('NormalName');

    // Filter by business name
    $responseBiz = $this->actingAs($user)->getJson(route('customers.datatable', ['business' => 'Target Business']));
    expect($responseBiz->json('data'))->toHaveCount(1);
    expect($responseBiz->json('data')[0]['name'])->toBe('TargetCustomer');
});

// Requirement 28: Limit parameter limits returned customers
test('limit parameter limits count of customers returned', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    for ($i = 0; $i < 5; $i++) {
        Customer::create(['name' => "Customer $i", 'phone' => "Phone $i", 'current_point' => 10, 'business_id' => $biz->id]);
    }

    $response = $this->actingAs($user)->getJson(route('customers.datatable', ['limit' => 2]));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

// Requirement 29: Page parameter switches pages
test('page parameter switches paginated pages', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    Customer::create(['name' => 'C1', 'phone' => '1', 'current_point' => 10, 'business_id' => $biz->id]);
    Customer::create(['name' => 'C2', 'phone' => '2', 'current_point' => 20, 'business_id' => $biz->id]);

    $responsePage1 = $this->actingAs($user)->getJson(route('customers.datatable', ['limit' => 1, 'page' => 1, 'sort_by' => 'id', 'sort_type' => 'asc']));
    $responsePage2 = $this->actingAs($user)->getJson(route('customers.datatable', ['limit' => 1, 'page' => 2, 'sort_by' => 'id', 'sort_type' => 'asc']));

    expect($responsePage1->json('data'))->toHaveCount(1);
    expect($responsePage2->json('data'))->toHaveCount(1);

    expect($responsePage1->json('data')[0]['name'])->toBe('C1');
    expect($responsePage2->json('data')[0]['name'])->toBe('C2');
});

// Requirement 30: PDF prints return a PDF file
test('print pdf produces a pdf file', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $response = $this->actingAs($user)->get(route('customers.print.pdf'));
    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');

    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.pdf');
});

// Requirement 31: Excel prints return a .xlsx file and have correct columns
test('print excel produces a .xlsx file and has correct columns', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $biz = Business::create(['name' => 'ExcelBiz', 'description' => 'Desc', 'user_id' => null]);
    Customer::create(['name' => 'ExcelCustomer', 'phone' => '12345', 'current_point' => 10, 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->get(route('customers.print.excel'));
    $response->assertOk();
    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.xlsx');

    // Simulate mapping array to check the columns
    $data = Customer::with('business')->get();
    $item = [
        'No' => 1,
        'Nama Customer' => $data[0]->name,
        'Telepon' => $data[0]->phone ?: '-',
        'Poin Saat Ini' => $data[0]->current_point,
        'Bisnis Terkait' => $data[0]->business ? $data[0]->business->name : '-',
        'Tanggal Dibuat' => $data[0]->created_at ? $data[0]->created_at->format('Y-m-d H:i:s') : '-',
    ];
    expect(array_keys($item))->toBe(['No', 'Nama Customer', 'Telepon', 'Poin Saat Ini', 'Bisnis Terkait', 'Tanggal Dibuat']);
});

// Requirement 32: Customers of deleted businesses do not show up in the datatable
test('customers from deleted businesses do not show up in the datatable', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Customer Keseluruhan']);

    $biz1 = Business::create(['name' => 'Active Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Deleted Business', 'description' => 'Desc', 'user_id' => null]);

    Customer::create(['name' => 'Active Customer', 'phone' => '123', 'current_point' => 10, 'business_id' => $biz1->id]);
    Customer::create(['name' => 'Deleted Customer', 'phone' => '456', 'current_point' => 10, 'business_id' => $biz2->id]);

    // Soft delete the second business
    $biz2->delete();

    $response = $this->actingAs($user)->getJson(route('customers.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Active Customer');
});
