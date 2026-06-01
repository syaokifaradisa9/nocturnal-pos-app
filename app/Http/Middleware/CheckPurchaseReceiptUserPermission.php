<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPurchaseReceiptUserPermission
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
            'index' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'datatable' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'printPdf' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'printExcel' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'create' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'ownerData' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT],
            'store' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'edit' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'update' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'show' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
            'confirm' => [UserPermission::CONFIRM_PURCHASE_RECEIPT],
            'confirmPage' => [UserPermission::CONFIRM_PURCHASE_RECEIPT],
            'destroy' => [UserPermission::VIEW_ANY_PURCHASE_RECEIPT, UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT, UserPermission::VIEW_OWN_PURCHASE_RECEIPT],
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
