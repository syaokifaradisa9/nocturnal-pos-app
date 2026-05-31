<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBusinessUserPermission
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
            'index' => [UserPermission::VIEW_ANY_BUSINESS, UserPermission::VIEW_OWN_BUSINESS],
            'datatable' => [UserPermission::VIEW_ANY_BUSINESS, UserPermission::VIEW_OWN_BUSINESS],
            'printPdf' => [UserPermission::VIEW_ANY_BUSINESS, UserPermission::VIEW_OWN_BUSINESS],
            'printExcel' => [UserPermission::VIEW_ANY_BUSINESS, UserPermission::VIEW_OWN_BUSINESS],
            'create' => [UserPermission::CREATE_ANY_BUSINESS, UserPermission::CREATE_OWN_BUSINESS],
            'store' => [UserPermission::CREATE_ANY_BUSINESS, UserPermission::CREATE_OWN_BUSINESS],
            'edit' => [UserPermission::EDIT_ANY_BUSINESS, UserPermission::EDIT_OWN_BUSINESS],
            'update' => [UserPermission::EDIT_ANY_BUSINESS, UserPermission::EDIT_OWN_BUSINESS],
            'destroy' => [UserPermission::DELETE_ANY_BUSINESS, UserPermission::DELETE_OWN_BUSINESS],
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
