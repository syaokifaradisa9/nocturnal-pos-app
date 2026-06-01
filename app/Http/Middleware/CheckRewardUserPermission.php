<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRewardUserPermission
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
            'index' => [UserPermission::VIEW_ANY_REWARD, UserPermission::VIEW_ASSOCIATED_REWARD, UserPermission::VIEW_OWN_REWARD],
            'datatable' => [UserPermission::VIEW_ANY_REWARD, UserPermission::VIEW_ASSOCIATED_REWARD, UserPermission::VIEW_OWN_REWARD],
            'ownerBusinesses' => [UserPermission::VIEW_ANY_REWARD, UserPermission::CREATE_ANY_REWARD, UserPermission::EDIT_ANY_REWARD],
            'printPdf' => [UserPermission::VIEW_ANY_REWARD, UserPermission::VIEW_ASSOCIATED_REWARD, UserPermission::VIEW_OWN_REWARD],
            'printExcel' => [UserPermission::VIEW_ANY_REWARD, UserPermission::VIEW_ASSOCIATED_REWARD, UserPermission::VIEW_OWN_REWARD],
            'create' => [UserPermission::CREATE_ANY_REWARD, UserPermission::CREATE_ASSOCIATED_REWARD, UserPermission::CREATE_OWN_REWARD],
            'store' => [UserPermission::CREATE_ANY_REWARD, UserPermission::CREATE_ASSOCIATED_REWARD, UserPermission::CREATE_OWN_REWARD],
            'edit' => [UserPermission::EDIT_ANY_REWARD, UserPermission::EDIT_ASSOCIATED_REWARD, UserPermission::EDIT_OWN_REWARD],
            'update' => [UserPermission::EDIT_ANY_REWARD, UserPermission::EDIT_ASSOCIATED_REWARD, UserPermission::EDIT_OWN_REWARD],
            'destroy' => [UserPermission::DELETE_ANY_REWARD, UserPermission::DELETE_ASSOCIATED_REWARD, UserPermission::DELETE_OWN_REWARD],
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
