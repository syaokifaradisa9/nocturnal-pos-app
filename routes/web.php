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

    Route::controller(\App\Http\Controllers\ProductItemController::class)
        ->prefix('product-items')
        ->name('product_items.')
        ->middleware('product_item.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/owner-businesses', 'ownerBusinesses')->name('owner_businesses');
            Route::get('/owner-products', 'ownerProducts')->name('owner_products');
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

    Route::controller(\App\Http\Controllers\PurchaseReceiptController::class)
        ->prefix('purchase-receipts')
        ->name('purchase-receipts.')
        ->middleware('purchase_receipt.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/create', 'create')->name('create');
            Route::get('/owner-data', 'ownerData')->name('owner_data');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });
            Route::delete('/{id}/delete', 'destroy')->name('destroy');
            Route::get('/{id}/edit', 'edit')->name('edit');
            Route::put('/{id}/update', 'update')->name('update');
            Route::get('/{id}', 'show')->name('show');
            Route::get('/{id}/confirm', 'confirmPage')->name('confirm_page');
            Route::post('/{id}/confirm', 'confirm')->name('confirm');
        });

    Route::controller(\App\Http\Controllers\StockMonitoringController::class)
        ->prefix('stock-monitoring')
        ->name('stock-monitoring.')
        ->middleware('purchase_receipt.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
        });

    Route::controller(\App\Http\Controllers\StockAdjustmentController::class)
        ->prefix('stock-adjustments')
        ->name('stock-adjustments.')
        ->middleware('stock_adjustment.permission')
        ->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/datatable', 'datatable')->name('datatable');
            Route::get('/create', 'create')->name('create');
            Route::get('/branch-batches', 'branchBatches')->name('branch_batches');
            Route::post('/store', 'store')->name('store');
            Route::prefix('print')->name('print.')->group(function () {
                Route::get('/pdf', 'printPdf')->name('pdf');
                Route::get('/excel', 'printExcel')->name('excel');
            });
            Route::delete('/{id}/delete', 'destroy')->name('destroy');
            Route::get('/{id}', 'show')->name('show');
        });
});

Route::get('/auth/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/auth/verify', [LoginController::class, 'login'])->name('auth.verify');
Route::match(['get', 'post'], '/auth/logout', [LoginController::class, 'logout'])->name('logout');
