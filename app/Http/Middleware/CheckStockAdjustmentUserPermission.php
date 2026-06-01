<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStockAdjustmentUserPermission
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401);
        }

        $action = $request->route()->getActionMethod();

        $permissionMap = [
            'index' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'datatable' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'printPdf' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'printExcel' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'create' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'branchBatches' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'store' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'show' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
            'destroy' => [UserPermission::VIEW_ANY_STOCK_ADJUSTMENT, UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT, UserPermission::VIEW_OWN_STOCK_ADJUSTMENT],
        ];

        $requiredPermissions = $permissionMap[$action] ?? [];

        foreach ($requiredPermissions as $permission) {
            if ($user->hasPermission($permission)) {
                return $next($request);
            }
        }

        abort(403, 'Anda tidak memiliki izin untuk mengakses halaman ini.');
    }
}
