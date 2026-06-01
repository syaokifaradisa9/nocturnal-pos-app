<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckProductItemUserPermission
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
            'index' => [UserPermission::VIEW_ANY_PRODUCT_ITEM, UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM, UserPermission::VIEW_OWN_PRODUCT_ITEM],
            'datatable' => [UserPermission::VIEW_ANY_PRODUCT_ITEM, UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM, UserPermission::VIEW_OWN_PRODUCT_ITEM],
            'ownerBusinesses' => [UserPermission::VIEW_ANY_PRODUCT_ITEM, UserPermission::CREATE_ANY_PRODUCT_ITEM, UserPermission::EDIT_ANY_PRODUCT_ITEM],
            'ownerProducts' => [UserPermission::VIEW_ANY_PRODUCT_ITEM, UserPermission::CREATE_ANY_PRODUCT_ITEM, UserPermission::EDIT_ANY_PRODUCT_ITEM],
            'printPdf' => [UserPermission::VIEW_ANY_PRODUCT_ITEM, UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM, UserPermission::VIEW_OWN_PRODUCT_ITEM],
            'printExcel' => [UserPermission::VIEW_ANY_PRODUCT_ITEM, UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM, UserPermission::VIEW_OWN_PRODUCT_ITEM],
            'create' => [UserPermission::CREATE_ANY_PRODUCT_ITEM, UserPermission::CREATE_ASSOCIATED_PRODUCT_ITEM, UserPermission::CREATE_OWN_PRODUCT_ITEM],
            'store' => [UserPermission::CREATE_ANY_PRODUCT_ITEM, UserPermission::CREATE_ASSOCIATED_PRODUCT_ITEM, UserPermission::CREATE_OWN_PRODUCT_ITEM],
            'edit' => [UserPermission::EDIT_ANY_PRODUCT_ITEM, UserPermission::EDIT_ASSOCIATED_PRODUCT_ITEM, UserPermission::EDIT_OWN_PRODUCT_ITEM],
            'update' => [UserPermission::EDIT_ANY_PRODUCT_ITEM, UserPermission::EDIT_ASSOCIATED_PRODUCT_ITEM, UserPermission::EDIT_OWN_PRODUCT_ITEM],
            'destroy' => [UserPermission::DELETE_ANY_PRODUCT_ITEM, UserPermission::DELETE_ASSOCIATED_PRODUCT_ITEM, UserPermission::DELETE_OWN_PRODUCT_ITEM],
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
