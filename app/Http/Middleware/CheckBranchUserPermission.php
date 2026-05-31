<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckBranchUserPermission
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
            'index' => [UserPermission::VIEW_ANY_BRANCH, UserPermission::VIEW_ASSOCIATED_BRANCH, UserPermission::VIEW_OWN_BRANCH],
            'datatable' => [UserPermission::VIEW_ANY_BRANCH, UserPermission::VIEW_ASSOCIATED_BRANCH, UserPermission::VIEW_OWN_BRANCH],
            'printPdf' => [UserPermission::VIEW_ANY_BRANCH, UserPermission::VIEW_ASSOCIATED_BRANCH, UserPermission::VIEW_OWN_BRANCH],
            'printExcel' => [UserPermission::VIEW_ANY_BRANCH, UserPermission::VIEW_ASSOCIATED_BRANCH, UserPermission::VIEW_OWN_BRANCH],
            'create' => [UserPermission::CREATE_ANY_BRANCH, UserPermission::CREATE_ASSOCIATED_BRANCH, UserPermission::CREATE_OWN_BRANCH],
            'store' => [UserPermission::CREATE_ANY_BRANCH, UserPermission::CREATE_ASSOCIATED_BRANCH, UserPermission::CREATE_OWN_BRANCH],
            'edit' => [UserPermission::EDIT_ANY_BRANCH, UserPermission::EDIT_ASSOCIATED_BRANCH, UserPermission::EDIT_OWN_BRANCH],
            'update' => [UserPermission::EDIT_ANY_BRANCH, UserPermission::EDIT_ASSOCIATED_BRANCH, UserPermission::EDIT_OWN_BRANCH],
            'destroy' => [UserPermission::DELETE_ANY_BRANCH, UserPermission::DELETE_ASSOCIATED_BRANCH, UserPermission::DELETE_OWN_BRANCH],
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
