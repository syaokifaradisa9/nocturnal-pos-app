<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckProductUnitUserPermission
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
            'index' => [UserPermission::VIEW_ANY_PRODUCT_UNIT, UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT, UserPermission::VIEW_OWN_PRODUCT_UNIT],
            'datatable' => [UserPermission::VIEW_ANY_PRODUCT_UNIT, UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT, UserPermission::VIEW_OWN_PRODUCT_UNIT],
            'ownerBusinesses' => [UserPermission::VIEW_ANY_PRODUCT_UNIT, UserPermission::CREATE_ANY_PRODUCT_UNIT, UserPermission::EDIT_ANY_PRODUCT_UNIT],
            'printPdf' => [UserPermission::VIEW_ANY_PRODUCT_UNIT, UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT, UserPermission::VIEW_OWN_PRODUCT_UNIT],
            'printExcel' => [UserPermission::VIEW_ANY_PRODUCT_UNIT, UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT, UserPermission::VIEW_OWN_PRODUCT_UNIT],
            'create' => [UserPermission::CREATE_ANY_PRODUCT_UNIT, UserPermission::CREATE_ASSOCIATED_PRODUCT_UNIT, UserPermission::CREATE_OWN_PRODUCT_UNIT],
            'store' => [UserPermission::CREATE_ANY_PRODUCT_UNIT, UserPermission::CREATE_ASSOCIATED_PRODUCT_UNIT, UserPermission::CREATE_OWN_PRODUCT_UNIT],
            'edit' => [UserPermission::EDIT_ANY_PRODUCT_UNIT, UserPermission::EDIT_ASSOCIATED_PRODUCT_UNIT, UserPermission::EDIT_OWN_PRODUCT_UNIT],
            'update' => [UserPermission::EDIT_ANY_PRODUCT_UNIT, UserPermission::EDIT_ASSOCIATED_PRODUCT_UNIT, UserPermission::EDIT_OWN_PRODUCT_UNIT],
            'destroy' => [UserPermission::DELETE_ANY_PRODUCT_UNIT, UserPermission::DELETE_ASSOCIATED_PRODUCT_UNIT, UserPermission::DELETE_OWN_PRODUCT_UNIT],
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
