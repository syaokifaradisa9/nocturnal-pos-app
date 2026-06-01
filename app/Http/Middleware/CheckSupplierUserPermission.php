<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSupplierUserPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401);
        }

        $action = $request->route()->getActionMethod();

        $permissionMap = [
            'index' => [UserPermission::VIEW_ANY_SUPPLIER, UserPermission::VIEW_ASSOCIATED_SUPPLIER, UserPermission::VIEW_OWN_SUPPLIER],
            'datatable' => [UserPermission::VIEW_ANY_SUPPLIER, UserPermission::VIEW_ASSOCIATED_SUPPLIER, UserPermission::VIEW_OWN_SUPPLIER],
            'ownerBusinesses' => [UserPermission::VIEW_ANY_SUPPLIER, UserPermission::CREATE_ANY_SUPPLIER, UserPermission::EDIT_ANY_SUPPLIER],
            'printPdf' => [UserPermission::VIEW_ANY_SUPPLIER, UserPermission::VIEW_ASSOCIATED_SUPPLIER, UserPermission::VIEW_OWN_SUPPLIER],
            'printExcel' => [UserPermission::VIEW_ANY_SUPPLIER, UserPermission::VIEW_ASSOCIATED_SUPPLIER, UserPermission::VIEW_OWN_SUPPLIER],
            'create' => [UserPermission::CREATE_ANY_SUPPLIER, UserPermission::CREATE_ASSOCIATED_SUPPLIER, UserPermission::CREATE_OWN_SUPPLIER],
            'store' => [UserPermission::CREATE_ANY_SUPPLIER, UserPermission::CREATE_ASSOCIATED_SUPPLIER, UserPermission::CREATE_OWN_SUPPLIER],
            'edit' => [UserPermission::EDIT_ANY_SUPPLIER, UserPermission::EDIT_ASSOCIATED_SUPPLIER, UserPermission::EDIT_OWN_SUPPLIER],
            'update' => [UserPermission::EDIT_ANY_SUPPLIER, UserPermission::EDIT_ASSOCIATED_SUPPLIER, UserPermission::EDIT_OWN_SUPPLIER],
            'destroy' => [UserPermission::DELETE_ANY_SUPPLIER, UserPermission::DELETE_ASSOCIATED_SUPPLIER, UserPermission::DELETE_OWN_SUPPLIER],
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
