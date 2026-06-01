<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckCustomerUserPermission
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
            'index' => [UserPermission::VIEW_ANY_CUSTOMER, UserPermission::VIEW_ASSOCIATED_CUSTOMER, UserPermission::VIEW_OWN_CUSTOMER],
            'datatable' => [UserPermission::VIEW_ANY_CUSTOMER, UserPermission::VIEW_ASSOCIATED_CUSTOMER, UserPermission::VIEW_OWN_CUSTOMER],
            'ownerBusinesses' => [UserPermission::VIEW_ANY_CUSTOMER, UserPermission::CREATE_ANY_CUSTOMER, UserPermission::EDIT_ANY_CUSTOMER],
            'printPdf' => [UserPermission::VIEW_ANY_CUSTOMER, UserPermission::VIEW_ASSOCIATED_CUSTOMER, UserPermission::VIEW_OWN_CUSTOMER],
            'printExcel' => [UserPermission::VIEW_ANY_CUSTOMER, UserPermission::VIEW_ASSOCIATED_CUSTOMER, UserPermission::VIEW_OWN_CUSTOMER],
            'create' => [UserPermission::CREATE_ANY_CUSTOMER, UserPermission::CREATE_ASSOCIATED_CUSTOMER, UserPermission::CREATE_OWN_CUSTOMER],
            'store' => [UserPermission::CREATE_ANY_CUSTOMER, UserPermission::CREATE_ASSOCIATED_CUSTOMER, UserPermission::CREATE_OWN_CUSTOMER],
            'edit' => [UserPermission::EDIT_ANY_CUSTOMER, UserPermission::EDIT_ASSOCIATED_CUSTOMER, UserPermission::EDIT_OWN_CUSTOMER],
            'update' => [UserPermission::EDIT_ANY_CUSTOMER, UserPermission::EDIT_ASSOCIATED_CUSTOMER, UserPermission::EDIT_OWN_CUSTOMER],
            'destroy' => [UserPermission::DELETE_ANY_CUSTOMER, UserPermission::DELETE_ASSOCIATED_CUSTOMER, UserPermission::DELETE_OWN_CUSTOMER],
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
