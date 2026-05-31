<?php

namespace App\Providers;

use App\Repositories\BusinessRepository;
use App\Repositories\EloquentBusinessRepository;
use App\Repositories\RoleRepository;
use App\Repositories\EloquentRoleRepository;
use App\Repositories\UserRepository;
use App\Repositories\EloquentUserRepository;
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
