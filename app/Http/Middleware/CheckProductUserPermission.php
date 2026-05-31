<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckProductUserPermission
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
            'index' => [UserPermission::VIEW_ANY_PRODUCT, UserPermission::VIEW_ASSOCIATED_PRODUCT, UserPermission::VIEW_OWN_PRODUCT],
            'datatable' => [UserPermission::VIEW_ANY_PRODUCT, UserPermission::VIEW_ASSOCIATED_PRODUCT, UserPermission::VIEW_OWN_PRODUCT],
            'printPdf' => [UserPermission::VIEW_ANY_PRODUCT, UserPermission::VIEW_ASSOCIATED_PRODUCT, UserPermission::VIEW_OWN_PRODUCT],
            'printExcel' => [UserPermission::VIEW_ANY_PRODUCT, UserPermission::VIEW_ASSOCIATED_PRODUCT, UserPermission::VIEW_OWN_PRODUCT],
            'create' => [UserPermission::CREATE_ANY_PRODUCT, UserPermission::CREATE_ASSOCIATED_PRODUCT, UserPermission::CREATE_OWN_PRODUCT],
            'store' => [UserPermission::CREATE_ANY_PRODUCT, UserPermission::CREATE_ASSOCIATED_PRODUCT, UserPermission::CREATE_OWN_PRODUCT],
            'edit' => [UserPermission::EDIT_ANY_PRODUCT, UserPermission::EDIT_ASSOCIATED_PRODUCT, UserPermission::EDIT_OWN_PRODUCT],
            'update' => [UserPermission::EDIT_ANY_PRODUCT, UserPermission::EDIT_ASSOCIATED_PRODUCT, UserPermission::EDIT_OWN_PRODUCT],
            'destroy' => [UserPermission::DELETE_ANY_PRODUCT, UserPermission::DELETE_ASSOCIATED_PRODUCT, UserPermission::DELETE_OWN_PRODUCT],
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
