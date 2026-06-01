<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRoleUserPermission
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
            'index' => [UserPermission::VIEW_ROLE],
            'datatable' => [UserPermission::VIEW_ROLE],
            'store' => [UserPermission::CREATE_ROLE],
            'update' => [UserPermission::EDIT_ROLE],
            'destroy' => [UserPermission::DELETE_ROLE],
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
