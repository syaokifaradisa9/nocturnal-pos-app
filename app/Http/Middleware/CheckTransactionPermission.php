<?php

namespace App\Http\Middleware;

use App\Enums\UserPermission;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTransactionPermission
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

        if (
            $user->hasPermission(UserPermission::VIEW_ANY_TRANSACTION) ||
            $user->hasPermission(UserPermission::VIEW_OWN_TRANSACTION) ||
            $user->hasPermission(UserPermission::VIEW_ASSOCIATED_TRANSACTION)
        ) {
            return $next($request);
        }

        abort(403, 'Anda tidak memiliki izin untuk mengakses halaman ini.');
    }
}
