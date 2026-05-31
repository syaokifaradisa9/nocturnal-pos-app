<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

Route::get('/auth/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/auth/verify', [LoginController::class, 'login'])->name('auth.verify');
Route::match(['get', 'post'], '/auth/logout', [LoginController::class, 'logout'])->name('logout');
