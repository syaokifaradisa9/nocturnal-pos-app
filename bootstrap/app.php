<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->redirectTo(
            guests: '/auth/login',
            users: '/dashboard'
        );

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'business.permission' => \App\Http\Middleware\CheckBusinessUserPermission::class,
            'branch.permission' => \App\Http\Middleware\CheckBranchUserPermission::class,
            'product.permission' => \App\Http\Middleware\CheckProductUserPermission::class,
            'supplier.permission' => \App\Http\Middleware\CheckSupplierUserPermission::class,
            'role.permission' => \App\Http\Middleware\CheckRoleUserPermission::class,
            'customer.permission' => \App\Http\Middleware\CheckCustomerUserPermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
