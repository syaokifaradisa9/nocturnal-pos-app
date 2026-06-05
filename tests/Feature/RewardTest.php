<?php

use App\Models\User;
use App\Models\Business;
use App\Models\Reward;
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
        Permission::firstOrCreate(['name' => $perm]);
    }

    $this->adminRole = Role::firstOrCreate(['name' => 'Admin']);
    $viewOwnPermission = Permission::where('name', 'Lihat Data Bisnis Pribadi')->first();
    $this->adminRole->permissions()->syncWithoutDetaching([$viewOwnPermission->id]);
});

// Test Case 1: Menjamin pengguna dengan izin yang sesuai dapat mengakses endpoint index, datatable, cetak PDF, dan cetak Excel
test('users with appropriate permission can access /rewards endpoints', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Lihat Data Reward Pribadi']);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Lihat Data Reward Penempatan Bisnis']);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $unauthorized = User::factory()->create();

    foreach ([$user1, $user2, $user3] as $user) {
        $this->actingAs($user)->get(route('rewards.index'))->assertOk();
        $this->actingAs($user)->getJson(route('rewards.datatable'))->assertOk();
        $this->actingAs($user)->get(route('rewards.print.pdf'))->assertOk();
        $this->actingAs($user)->get(route('rewards.print.excel'))->assertOk();
    }

    $this->actingAs($unauthorized)->get(route('rewards.index'))->assertStatus(403);
    $this->actingAs($unauthorized)->getJson(route('rewards.datatable'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('rewards.print.pdf'))->assertStatus(403);
    $this->actingAs($unauthorized)->get(route('rewards.print.excel'))->assertStatus(403);
});

// Test Case 2: Menjamin pengguna dengan izin tambah data dapat melakukan aksi penyimpanan (store)
test('users with appropriate permission can access store action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Tambah Data Reward Pribadi', 'Lihat Data Reward Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Tambah Data Reward Penempatan Bisnis', 'Lihat Data Reward Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Tambah Data Reward Keseluruhan', 'Lihat Data Reward Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test store
    $this->actingAs($user1)->post(route('rewards.store'), [
        'name' => 'Reward 1',
        'description' => 'Coffee',
        'minimum_point' => 50,
        'business_id' => $biz1->id
    ])->assertRedirect(route('rewards.index'));

    $this->actingAs($user2)->post(route('rewards.store'), [
        'name' => 'Reward 2',
        'description' => 'Tea',
        'minimum_point' => 100,
        'business_id' => $biz2->id
    ])->assertRedirect(route('rewards.index'));

    $this->actingAs($user3)->post(route('rewards.store'), [
        'name' => 'Reward 3',
        'description' => 'Snack',
        'minimum_point' => 150,
        'business_id' => $biz1->id
    ])->assertRedirect(route('rewards.index'));

    $this->actingAs($unauthorized)->post(route('rewards.store'), [
        'name' => 'Reward 4',
        'description' => 'Drink',
        'minimum_point' => 200,
        'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Test Case 3: Menjamin pengguna dengan izin edit data dapat memicu aksi pembaruan (update)
test('users with appropriate permission can access update action', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Edit Data Reward Pribadi', 'Lihat Data Reward Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $reward1 = Reward::create([
        'name' => 'R1', 'description' => 'Desc 1', 'minimum_point' => 50, 'business_id' => $biz1->id
    ]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Edit Data Reward Penempatan Bisnis', 'Lihat Data Reward Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $reward2 = Reward::create([
        'name' => 'R2', 'description' => 'Desc 2', 'minimum_point' => 100, 'business_id' => $biz2->id
    ]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Edit Data Reward Keseluruhan', 'Lihat Data Reward Keseluruhan']);

    $unauthorized = User::factory()->create();

    // Test updates
    $this->actingAs($user1)->put(route('rewards.update', $reward1->id), [
        'name' => 'Updated 1', 'description' => 'Desc 1', 'minimum_point' => 60, 'business_id' => $biz1->id
    ])->assertRedirect(route('rewards.index'));

    $this->actingAs($user2)->put(route('rewards.update', $reward2->id), [
        'name' => 'Updated 2', 'description' => 'Desc 2', 'minimum_point' => 110, 'business_id' => $biz2->id
    ])->assertRedirect(route('rewards.index'));

    $this->actingAs($user3)->put(route('rewards.update', $reward1->id), [
        'name' => 'Updated 3', 'description' => 'Desc 1', 'minimum_point' => 120, 'business_id' => $biz1->id
    ])->assertRedirect(route('rewards.index'));

    $this->actingAs($unauthorized)->put(route('rewards.update', $reward1->id), [
        'name' => 'Fail', 'description' => 'Fail', 'minimum_point' => 999, 'business_id' => $biz1->id
    ])->assertStatus(403);
});

// Test Case 4: Menjamin pengguna dengan izin hapus data dapat menghapus reward
test('users with appropriate permission can delete rewards', function () {
    $user1 = User::factory()->create();
    $user1->assignPermissions(['Hapus Data Reward Pribadi']);
    $biz1 = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user1->id]);
    $reward1 = Reward::create([
        'name' => 'R1', 'description' => 'Desc 1', 'minimum_point' => 50, 'business_id' => $biz1->id
    ]);

    $user2 = User::factory()->create();
    $user2->assignPermissions(['Hapus Data Reward Penempatan Bisnis']);
    $biz2 = Business::create(['name' => 'Assoc Biz', 'description' => 'Desc', 'user_id' => null]);
    $user2->businesses()->attach($biz2->id, ['role_id' => $this->adminRole->id]);
    $reward2 = Reward::create([
        'name' => 'R2', 'description' => 'Desc 2', 'minimum_point' => 100, 'business_id' => $biz2->id
    ]);

    $user3 = User::factory()->create();
    $user3->assignPermissions(['Hapus Data Reward Keseluruhan']);
    $reward3 = Reward::create([
        'name' => 'R3', 'description' => 'Desc 3', 'minimum_point' => 150, 'business_id' => $biz1->id
    ]);

    $unauthorized = User::factory()->create();

    // Test delete
    $this->actingAs($user1)->delete(route('rewards.destroy', $reward1->id))->assertRedirect(route('rewards.index'));
    $this->actingAs($user2)->delete(route('rewards.destroy', $reward2->id))->assertRedirect(route('rewards.index'));
    $this->actingAs($user3)->delete(route('rewards.destroy', $reward3->id))->assertRedirect(route('rewards.index'));

    $reward4 = Reward::create([
        'name' => 'R4', 'description' => 'Desc 4', 'minimum_point' => 200, 'business_id' => $biz1->id
    ]);
    $this->actingAs($unauthorized)->delete(route('rewards.destroy', $reward4->id))->assertStatus(403);
});

// Test Case 5: Memastikan respons datatable minimal memiliki atribut utama id, name, description, minimum_point, business_id, dan business
test('reward datatable response contains expected attributes', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);
    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    Reward::create([
        'name' => 'R', 'description' => 'D', 'minimum_point' => 50, 'business_id' => $biz->id
    ]);

    $response = $this->actingAs($user)->getJson(route('rewards.datatable'));
    $response->assertOk();

    $item = $response->json('data')[0];
    expect($item)->toHaveKeys(['id', 'name', 'description', 'minimum_point', 'business_id', 'business']);
});

// Test Case 6: Memastikan pengguna dengan izin Lihat Data Reward Pribadi hanya melihat data dari bisnis miliknya sendiri
test('users with Lihat Data Reward Pribadi only see rewards with owner_id matching their own id', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    Reward::create(['name' => 'R1', 'description' => 'D', 'minimum_point' => 50, 'business_id' => $ownBiz->id]);
    Reward::create(['name' => 'R2', 'description' => 'D', 'minimum_point' => 100, 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('rewards.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['business']['user_id'])->toBe($user->id);
    }
});

// Test Case 7: Memastikan pengguna dengan izin Lihat Data Reward Penempatan Bisnis hanya melihat data dari bisnis yang ditugaskan kepada mereka
test('users with Lihat Data Reward Penempatan Bisnis datatable response business contains logged-in user association', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Penempatan Bisnis']);

    $assocBiz = Business::create(['name' => 'Assoc', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($assocBiz->id, ['role_id' => $this->adminRole->id]);

    Reward::create(['name' => 'R1', 'description' => 'D', 'minimum_point' => 50, 'business_id' => $assocBiz->id]);

    $response = $this->actingAs($user)->getJson(route('rewards.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->not->toBeEmpty();
    foreach ($data as $item) {
        expect($item['business_id'])->toBe($assocBiz->id);
    }
});

// Test Case 8: Memastikan pengguna dengan izin Lihat Data Reward Keseluruhan dapat melihat data dari semua bisnis
test('users with Lihat Data Reward Keseluruhan can see rewards with owner_id different from theirs', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    Reward::create(['name' => 'R1', 'description' => 'D', 'minimum_point' => 50, 'business_id' => $ownBiz->id]);
    Reward::create(['name' => 'R2', 'description' => 'D', 'minimum_point' => 100, 'business_id' => $otherBiz->id]);

    $response = $this->actingAs($user)->getJson(route('rewards.datatable'));
    $response->assertOk();

    $businessOwnerIds = collect($response->json('data'))->pluck('business.user_id')->unique()->toArray();
    expect($businessOwnerIds)->toContain($otherUser->id);
});

// Test Case 9: Memastikan pengguna dengan izin Tambah Data Reward Pribadi hanya dapat memilih bisnis miliknya sendiri
test('user with Tambah Data Reward Pribadi can select owned business but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Reward Pribadi', 'Lihat Data Reward Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz = Business::create(['name' => 'Own Biz', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    // Success: select owned business
    $this->actingAs($user)->post(route('rewards.store'), [
        'name' => 'Reward Own',
        'description' => 'Desc',
        'minimum_point' => 50,
        'business_id' => $ownBiz->id
    ])->assertRedirect(route('rewards.index'));

    // Forbidden: select another user's business
    $this->actingAs($user)->post(route('rewards.store'), [
        'name' => 'Reward Forbidden',
        'description' => 'Desc',
        'minimum_point' => 50,
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Test Case 10: Memastikan sistem otomatis mengisi business_id jika pengguna berizin Penempatan Bisnis terasosiasi dengan tepat satu bisnis
test('user with Tambah Data Reward Penempatan Bisnis auto-fills business_id when associated with exactly one business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Reward Penempatan Bisnis', 'Lihat Data Reward Penempatan Bisnis']);

    $biz = Business::create(['name' => 'Only One', 'description' => 'Desc', 'user_id' => null]);
    $user->businesses()->attach($biz->id, ['role_id' => $this->adminRole->id]);

    // Send empty business_id, it should auto fill to the only associated business
    $response = $this->actingAs($user)->post(route('rewards.store'), [
        'name' => 'Reward Auto',
        'description' => 'Desc',
        'minimum_point' => 50,
        'business_id' => ''
    ]);

    $response->assertRedirect(route('rewards.index'));
    
    $reward = Reward::where('name', 'Reward Auto')->first();
    expect($reward->business_id)->toBe($biz->id);
});

// Test Case 11: Memastikan pengguna dengan izin Tambah Data Reward Keseluruhan dapat menyimpan bisnis sesuai request
test('user with Tambah Data Reward Keseluruhan stores business_id exactly as requested', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Tambah Data Reward Keseluruhan', 'Lihat Data Reward Keseluruhan']);

    $biz = Business::create(['name' => 'Admin Biz', 'description' => 'Desc', 'user_id' => null]);

    $response = $this->actingAs($admin)->post(route('rewards.store'), [
        'name' => 'Reward Admin',
        'description' => 'Desc',
        'minimum_point' => 50,
        'business_id' => $biz->id
    ]);

    $response->assertRedirect(route('rewards.index'));
    
    $reward = Reward::where('name', 'Reward Admin')->first();
    expect($reward->business_id)->toBe($biz->id);
});

// Test Case 12: Memastikan field name dan minimum_point wajib diisi, sedangkan description bersifat opsional
test('reward attributes validation rules work properly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Tambah Data Reward Pribadi']);
    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->post(route('rewards.store'), [
        'name' => '',
        'description' => '',
        'minimum_point' => null
    ]);

    $response->assertSessionHasErrors(['name', 'minimum_point']);

    // Check description nullable
    $this->actingAs($user)->post(route('rewards.store'), [
        'name' => 'Omitted Desc',
        'description' => null,
        'minimum_point' => 10,
        'business_id' => $biz->id
    ])->assertRedirect(route('rewards.index'));

    $reward = Reward::where('name', 'Omitted Desc')->first();
    expect($reward->description)->toBeNull();
});

// Test Case 13: Memastikan business_id wajib diisi untuk izin Pribadi (jika memiliki > 1 bisnis) dan Keseluruhan
test('business_id is required for Tambah Data Reward Pribadi and Tambah Data Reward Keseluruhan', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Tambah Data Reward Pribadi', 'Lihat Data Reward Pribadi']);
    Business::create(['name' => 'Biz 1', 'user_id' => $userOwn->id]);
    Business::create(['name' => 'Biz 2', 'user_id' => $userOwn->id]);

    $userAll = User::factory()->create();
    $userAll->assignPermissions(['Tambah Data Reward Keseluruhan', 'Lihat Data Reward Keseluruhan']);

    // For Pribadi
    $this->actingAs($userOwn)->post(route('rewards.store'), [
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);

    // For Keseluruhan
    $this->actingAs($userAll)->post(route('rewards.store'), [
        'name' => 'R2', 'description' => 'D', 'minimum_point' => 10
        // business_id is missing
    ])->assertSessionHasErrors(['business_id']);
});

// Test Case 14: Memastikan halaman index reward mengirimkan daftar bisnis dan pilihan user di properti Inertia (props)
test('reward index passes businesses list and user options in props', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Pribadi']);

    $biz = Business::create(['name' => 'Own', 'description' => 'Desc', 'user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('rewards.index'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('rewards/index')
        ->has('businesses')
        ->has('users')
    );
});

// Test Case 15: Memastikan pengguna dengan izin Edit Data Reward Pribadi tidak dapat memindahkan ke bisnis milik orang lain saat update
test('user with Edit Data Reward Pribadi can select owned business on update but not another user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Reward Pribadi', 'Lihat Data Reward Pribadi']);

    $otherUser = User::factory()->create();

    $ownBiz1 = Business::create(['name' => 'Own Biz 1', 'description' => 'Desc', 'user_id' => $user->id]);
    $ownBiz2 = Business::create(['name' => 'Own Biz 2', 'description' => 'Desc', 'user_id' => $user->id]);
    $otherBiz = Business::create(['name' => 'Other Biz', 'description' => 'Desc', 'user_id' => $otherUser->id]);

    $reward = Reward::create([
        'name' => 'My Reward', 'description' => 'Desc', 'minimum_point' => 10, 'business_id' => $ownBiz1->id
    ]);

    // Success: update to another owned business
    $this->actingAs($user)->put(route('rewards.update', $reward->id), [
        'name' => 'Updated Reward',
        'description' => 'Desc',
        'minimum_point' => 10,
        'business_id' => $ownBiz2->id
    ])->assertRedirect(route('rewards.index'));

    expect($reward->fresh()->business_id)->toBe($ownBiz2->id);

    // Forbidden: update to another user's business
    $this->actingAs($user)->put(route('rewards.update', $reward->id), [
        'name' => 'Updated Reward',
        'description' => 'Desc',
        'minimum_point' => 10,
        'business_id' => $otherBiz->id
    ])->assertStatus(403);
});

// Test Case 16: Memastikan pengguna dengan izin Edit Data Reward Keseluruhan dapat mengubah ID Bisnis melalui request
test('user with Edit Data Reward Keseluruhan can update business_id via request', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Edit Data Reward Keseluruhan', 'Lihat Data Reward Keseluruhan']);

    $biz1 = Business::create(['name' => 'Biz 1', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Biz 2', 'description' => 'Desc', 'user_id' => null]);

    $reward = Reward::create([
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $biz1->id
    ]);

    $response = $this->actingAs($admin)->put(route('rewards.update', $reward->id), [
        'name' => 'Updated',
        'description' => 'D',
        'minimum_point' => 10,
        'business_id' => $biz2->id
    ]);

    $response->assertRedirect(route('rewards.index'));
    expect($reward->fresh()->business_id)->toBe($biz2->id);
});

// Test Case 17: Memastikan pengguna dengan izin Edit Data Reward Pribadi tidak dapat memperbarui reward dari bisnis milik orang lain
test('user with Edit Data Reward Pribadi cannot update reward belonging to other user\'s business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Reward Pribadi', 'Lihat Data Reward Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    
    $reward = Reward::create([
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($user)->put(route('rewards.update', $reward->id), [
        'name' => 'Try Update', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $otherBiz->id
    ]);
    $response->assertStatus(403);
});

// Test Case 18: Memastikan pengguna dengan izin Edit Data Reward Penempatan Bisnis tidak dapat memperbarui reward dari bisnis yang tidak terasosiasi
test('user with Edit Data Reward Penempatan Bisnis cannot update reward from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Edit Data Reward Penempatan Bisnis', 'Lihat Data Reward Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $reward = Reward::create([
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $unassociatedBiz->id
    ]);

    $response = $this->actingAs($user)->put(route('rewards.update', $reward->id), [
        'name' => 'Try Update', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $unassociatedBiz->id
    ]);
    $response->assertStatus(403);
});

// Test Case 19: Memastikan pengguna dengan izin Hapus Data Reward Pribadi tidak dapat menghapus reward dari bisnis milik orang lain
test('user with Hapus Data Reward Pribadi cannot delete other user\'s reward', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Reward Pribadi']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $reward = Reward::create([
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($user)->delete(route('rewards.destroy', $reward->id));
    $response->assertStatus(403);
});

// Test Case 20: Memastikan pengguna dengan izin Hapus Data Reward Penempatan Bisnis tidak dapat menghapus reward dari bisnis yang tidak terasosiasi
test('user with Hapus Data Reward Penempatan Bisnis cannot delete reward from unassociated business', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Hapus Data Reward Penempatan Bisnis']);

    $unassociatedBiz = Business::create(['name' => 'Unassociated', 'description' => 'Desc', 'user_id' => null]);
    $reward = Reward::create([
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $unassociatedBiz->id
    ]);

    $response = $this->actingAs($user)->delete(route('rewards.destroy', $reward->id));
    $response->assertStatus(403);
});

// Test Case 21: Memastikan pengguna dengan izin Hapus Data Reward Keseluruhan bebas menghapus reward manapun
test('user with Hapus Data Reward Keseluruhan can delete any reward', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Reward Keseluruhan']);

    $otherUser = User::factory()->create();
    $otherBiz = Business::create(['name' => 'Other', 'description' => 'Desc', 'user_id' => $otherUser->id]);
    $reward = Reward::create([
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $otherBiz->id
    ]);

    $response = $this->actingAs($admin)->delete(route('rewards.destroy', $reward->id));
    $response->assertRedirect(route('rewards.index'));
    $this->assertSoftDeleted('rewards', ['id' => $reward->id]);
});

// Test Case 22: Memastikan deleted_at terisi saat data reward dihapus (soft delete)
test('deleted_at is filled when reward is deleted', function () {
    $admin = User::factory()->create();
    $admin->assignPermissions(['Hapus Data Reward Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    $reward = Reward::create([
        'name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $biz->id
    ]);

    $this->actingAs($admin)->delete(route('rewards.destroy', $reward->id));

    $deleted = Reward::onlyTrashed()->find($reward->id);
    expect($deleted->deleted_at)->not->toBeNull();
});

// Test Case 23: Memastikan pencarian global menyaring hasil dengan benar berdasarkan tingkat hak akses Pribadi
test('global search filters appropriately based on permission settings for Pribadi', function () {
    $userOwn = User::factory()->create();
    $userOwn->assignPermissions(['Lihat Data Reward Pribadi']);

    $ownBiz = Business::create(['name' => 'Apple Business', 'description' => 'Desc', 'user_id' => $userOwn->id]);

    Reward::create(['name' => 'Citrus Reward', 'description' => 'Fruit', 'minimum_point' => 10, 'business_id' => $ownBiz->id]);
    Reward::create(['name' => 'Banana Reward', 'description' => 'Yellow', 'minimum_point' => 20, 'business_id' => $ownBiz->id]);

    // Search by description
    $response1 = $this->actingAs($userOwn)->getJson(route('rewards.datatable', ['search' => 'Yellow']));
    expect($response1->json('data'))->toHaveCount(1);
    expect($response1->json('data')[0]['name'])->toBe('Banana Reward');

    // Search by business name
    $response2 = $this->actingAs($userOwn)->getJson(route('rewards.datatable', ['search' => 'Apple']));
    expect($response2->json('data'))->toHaveCount(2);
});

// Test Case 24: Memastikan pencarian global menyaring hasil dengan benar berdasarkan tingkat hak akses Keseluruhan
test('global search filters appropriately based on permission settings for Keseluruhan', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $biz = Business::create(['name' => 'Cherry Business', 'description' => 'Desc', 'user_id' => null]);

    Reward::create(['name' => 'Watermelon Reward', 'description' => 'Fruit', 'minimum_point' => 10, 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->getJson(route('rewards.datatable', ['search' => 'Cherry']));
    expect($response->json('data'))->toHaveCount(1);
    expect($response->json('data')[0]['name'])->toBe('Watermelon Reward');
});

// Test Case 25: Memastikan pencarian per kolom spesifik menyaring data dengan benar
test('individual search on business, name, and description filters correctly', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $biz1 = Business::create(['name' => 'Target Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Normal Business', 'description' => 'Desc', 'user_id' => null]);

    Reward::create(['name' => 'UniqueName', 'description' => 'Normal D', 'minimum_point' => 10, 'business_id' => $biz2->id]);
    Reward::create(['name' => 'NormalName', 'description' => 'UniqueDesc', 'minimum_point' => 10, 'business_id' => $biz2->id]);
    Reward::create(['name' => 'TargetReward', 'description' => 'Normal D', 'minimum_point' => 10, 'business_id' => $biz1->id]);

    // Filter by name
    $responseName = $this->actingAs($user)->getJson(route('rewards.datatable', ['name' => 'UniqueName']));
    expect($responseName->json('data'))->toHaveCount(1);
    expect($responseName->json('data')[0]['name'])->toBe('UniqueName');

    // Filter by description
    $responseDesc = $this->actingAs($user)->getJson(route('rewards.datatable', ['description' => 'UniqueDesc']));
    expect($responseDesc->json('data'))->toHaveCount(1);
    expect($responseDesc->json('data')[0]['name'])->toBe('NormalName');

    // Filter by business name
    $responseBiz = $this->actingAs($user)->getJson(route('rewards.datatable', ['business' => 'Target Business']));
    expect($responseBiz->json('data'))->toHaveCount(1);
    expect($responseBiz->json('data')[0]['name'])->toBe('TargetReward');
});

// Test Case 26: Memastikan parameter limit membatasi jumlah data yang dikembalikan pada datatable
test('limit parameter limits count of rewards returned', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    for ($i = 0; $i < 5; $i++) {
        Reward::create(['name' => "Reward $i", 'description' => 'D', 'minimum_point' => 10, 'business_id' => $biz->id]);
    }

    $response = $this->actingAs($user)->getJson(route('rewards.datatable', ['limit' => 2]));
    $response->assertOk();
    expect($response->json('data'))->toHaveCount(2);
});

// Test Case 27: Memastikan parameter page berpindah halaman pada data paginasi
test('page parameter switches paginated pages', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $biz = Business::create(['name' => 'Biz', 'description' => 'Desc', 'user_id' => null]);
    Reward::create(['name' => 'R1', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $biz->id]);
    Reward::create(['name' => 'R2', 'description' => 'D', 'minimum_point' => 20, 'business_id' => $biz->id]);

    $responsePage1 = $this->actingAs($user)->getJson(route('rewards.datatable', ['limit' => 1, 'page' => 1, 'sort_by' => 'id', 'sort_type' => 'asc']));
    $responsePage2 = $this->actingAs($user)->getJson(route('rewards.datatable', ['limit' => 1, 'page' => 2, 'sort_by' => 'id', 'sort_type' => 'asc']));

    expect($responsePage1->json('data'))->toHaveCount(1);
    expect($responsePage2->json('data'))->toHaveCount(1);

    expect($responsePage1->json('data')[0]['name'])->toBe('R1');
    expect($responsePage2->json('data')[0]['name'])->toBe('R2');
});

// Test Case 28: Memastikan ekspor PDF mengembalikan berkas PDF yang valid
test('print pdf produces a pdf file', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $response = $this->actingAs($user)->get(route('rewards.print.pdf'));
    $response->assertOk();
    $response->assertHeader('Content-Type', 'application/pdf');

    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.pdf');
});

// Test Case 29: Memastikan ekspor Excel mengembalikan berkas .xlsx dengan header kolom yang sesuai
test('print excel produces a .xlsx file and has correct columns', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $biz = Business::create(['name' => 'ExcelBiz', 'description' => 'Desc', 'user_id' => null]);
    Reward::create(['name' => 'ExcelReward', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $biz->id]);

    $response = $this->actingAs($user)->get(route('rewards.print.excel'));
    $response->assertOk();
    $disposition = $response->headers->get('Content-Disposition');
    expect($disposition)->toContain('.xlsx');

    // Simulate mapping array to check the columns
    $data = Reward::with('business')->get();
    $item = [
        'No' => 1,
        'Nama Reward' => $data[0]->name,
        'Deskripsi' => $data[0]->description ?: '-',
        'Poin Minimum' => $data[0]->minimum_point,
        'Bisnis Terkait' => $data[0]->business ? $data[0]->business->name : '-',
        'Tanggal Dibuat' => $data[0]->created_at ? $data[0]->created_at->format('Y-m-d H:i:s') : '-',
    ];
    expect(array_keys($item))->toBe(['No', 'Nama Reward', 'Deskripsi', 'Poin Minimum', 'Bisnis Terkait', 'Tanggal Dibuat']);
});

// Test Case 30: Memastikan reward dari bisnis yang sudah dihapus tidak muncul di datatable
test('rewards from deleted businesses do not show up in the datatable', function () {
    $user = User::factory()->create();
    $user->assignPermissions(['Lihat Data Reward Keseluruhan']);

    $biz1 = Business::create(['name' => 'Active Business', 'description' => 'Desc', 'user_id' => null]);
    $biz2 = Business::create(['name' => 'Deleted Business', 'description' => 'Desc', 'user_id' => null]);

    Reward::create(['name' => 'Active Reward', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $biz1->id]);
    Reward::create(['name' => 'Deleted Reward', 'description' => 'D', 'minimum_point' => 10, 'business_id' => $biz2->id]);

    // Soft delete the second business
    $biz2->delete();

    $response = $this->actingAs($user)->getJson(route('rewards.datatable'));
    $response->assertOk();

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['name'])->toBe('Active Reward');
});
