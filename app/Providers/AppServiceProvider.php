<?php

namespace App\Providers;

use App\Repositories\BusinessRepository;
use App\Repositories\EloquentBusinessRepository;
use App\Repositories\RoleRepository;
use App\Repositories\EloquentRoleRepository;
use App\Repositories\UserRepository;
use App\Repositories\EloquentUserRepository;
use App\Repositories\BranchRepository;
use App\Repositories\EloquentBranchRepository;
use App\Repositories\ProductRepository;
use App\Repositories\EloquentProductRepository;
use App\Repositories\SupplierRepository;
use App\Repositories\EloquentSupplierRepository;
use App\Repositories\CustomerRepository;
use App\Repositories\EloquentCustomerRepository;
use App\Repositories\ProductUnitRepository;
use App\Repositories\EloquentProductUnitRepository;
use App\Repositories\RewardRepository;
use App\Repositories\EloquentRewardRepository;
use App\Repositories\PermissionRepository;
use App\Repositories\EloquentPermissionRepository;
use App\Repositories\TransactionRepository;
use App\Repositories\EloquentTransactionRepository;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        \Laravel\Fortify\Fortify::ignoreRoutes();

        $this->app->singleton(
            TransactionRepository::class,
            EloquentTransactionRepository::class
        );

        $this->app->singleton(
            PermissionRepository::class,
            EloquentPermissionRepository::class
        );

        $this->app->singleton(
            BusinessRepository::class,
            EloquentBusinessRepository::class
        );

        $this->app->singleton(
            RoleRepository::class,
            EloquentRoleRepository::class
        );

        $this->app->singleton(
            UserRepository::class,
            EloquentUserRepository::class
        );

        $this->app->singleton(
            BranchRepository::class,
            EloquentBranchRepository::class
        );

        $this->app->singleton(
            ProductRepository::class,
            EloquentProductRepository::class
        );

        $this->app->singleton(
            SupplierRepository::class,
            EloquentSupplierRepository::class
        );

        $this->app->singleton(
            CustomerRepository::class,
            EloquentCustomerRepository::class
        );

        $this->app->singleton(
            ProductUnitRepository::class,
            EloquentProductUnitRepository::class
        );

        $this->app->singleton(
            RewardRepository::class,
            EloquentRewardRepository::class
        );

        $this->app->singleton(
            \App\Repositories\PurchaseReceiptRepository::class,
            \App\Repositories\EloquentPurchaseReceiptRepository::class
        );

        $this->app->singleton(
            \App\Repositories\PurchaseReceiptItemRepository::class,
            \App\Repositories\EloquentPurchaseReceiptItemRepository::class
        );

        $this->app->singleton(
            \App\Repositories\PurchaseReceiptRejectRepository::class,
            \App\Repositories\EloquentPurchaseReceiptRejectRepository::class
        );

        $this->app->singleton(
            \App\Repositories\InventoryBatchRepository::class,
            \App\Repositories\EloquentInventoryBatchRepository::class
        );

        $this->app->singleton(
            \App\Repositories\StockAdjustmentRepository::class,
            \App\Repositories\EloquentStockAdjustmentRepository::class
        );

        $this->app->singleton(
            \App\Repositories\StockAdjustmentItemRepository::class,
            \App\Repositories\EloquentStockAdjustmentItemRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
