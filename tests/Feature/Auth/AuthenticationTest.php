<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('login screen can be rendered', function () {
    $response = $this->get(route('login'));

    $response->assertOk();
});

test('users can authenticate using email', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post(route('auth.verify'), [
        'email' => 'test@example.com',
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('dashboard'));
});

test('users can authenticate using username', function () {
    $user = User::factory()->create([
        'username' => 'testuser',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post(route('auth.verify'), [
        'email' => 'testuser',
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($user);
    $response->assertRedirect(route('dashboard'));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->post(route('auth.verify'), [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
    $response->assertSessionHasErrors('email');
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('logout'));

    $response->assertRedirect(route('login'));
    $this->assertGuest();
});