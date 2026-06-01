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

    Route::controller(\App\Http\Controllers\BusinessController::class)
        ->prefix('businesses')
        ->name('businesses.')
        ->middleware('business.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/create', 'create')->name('create');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });

            Route::prefix('{id}')->group(function () {
                Route::get('/edit', 'edit')->name('edit');
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });

    Route::controller(\App\Http\Controllers\BranchController::class)
        ->prefix('branches')
        ->name('branches.')
        ->middleware('branch.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/create', 'create')->name('create');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });

            Route::prefix('{id}')->group(function () {
                Route::get('/edit', 'edit')->name('edit');
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });

    Route::controller(\App\Http\Controllers\ProductController::class)
        ->prefix('products')
        ->name('products.')
        ->middleware('product.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/owner-businesses', 'ownerBusinesses')->name('owner_businesses');
            Route::get('/create', 'create')->name('create');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });

            Route::prefix('{id}')->group(function () {
                Route::get('/edit', 'edit')->name('edit');
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });

    Route::controller(\App\Http\Controllers\SupplierController::class)
        ->prefix('suppliers')
        ->name('suppliers.')
        ->middleware('supplier.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/owner-businesses', 'ownerBusinesses')->name('owner_businesses');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });

            Route::prefix('{id}')->group(function () {
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });

    Route::controller(\App\Http\Controllers\RoleController::class)
        ->prefix('roles')
        ->name('roles.')
        ->middleware('role.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::post('/store', 'store')->name('store');
            Route::prefix('{id}')->group(function () {
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });

    Route::controller(\App\Http\Controllers\CustomerController::class)
        ->prefix('customers')
        ->name('customers.')
        ->middleware('customer.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/owner-businesses', 'ownerBusinesses')->name('owner_businesses');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });

            Route::prefix('{id}')->group(function () {
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });

    Route::controller(\App\Http\Controllers\ProductUnitController::class)
        ->prefix('product-units')
        ->name('product_units.')
        ->middleware('product_unit.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/owner-businesses', 'ownerBusinesses')->name('owner_businesses');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });

            Route::prefix('{id}')->group(function () {
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });

    Route::controller(\App\Http\Controllers\RewardController::class)
        ->prefix('rewards')
        ->name('rewards.')
        ->middleware('reward.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/owner-businesses', 'ownerBusinesses')->name('owner_businesses');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });

            Route::prefix('{id}')->group(function () {
                Route::put('/update', 'update')->name('update');
                Route::delete('/delete', 'destroy')->name('destroy');
            });
        });
});

Route::get('/auth/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/auth/verify', [LoginController::class, 'login'])->name('auth.verify');
Route::match(['get', 'post'], '/auth/logout', [LoginController::class, 'logout'])->name('logout');
