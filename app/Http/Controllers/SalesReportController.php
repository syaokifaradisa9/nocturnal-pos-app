<?php

namespace App\Http\Controllers;

use App\Services\SalesReportService;
use App\Enums\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class SalesReportController extends Controller
{
    public function __construct(
        protected SalesReportService $service
    ) {}

    /**
     * Render Sales Report index page.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH->value) || $user->hasPermission(UserPermission::VIEW_ANY_BUSINESS->value)) {
            $branches = \App\Models\Branch::with('business')->get();
        } else {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $branches = \App\Models\Branch::whereIn('business_id', $associatedBusinessIds)
                ->orWhereHas('business', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->orWhereIn('id', $user->branches()->pluck('branches.id')->toArray())
                ->with('business')
                ->get();
        }

        $mappedBranches = $branches->map(function($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'business_id' => $b->business_id,
                'business_name' => $b->business ? $b->business->name : '',
                'label' => $b->business ? "{$b->business->name} {$b->name}" : $b->name
            ];
        })->values()->toArray();

        return Inertia::render('sales-reports/index', [
            'branches' => $mappedBranches
        ]);
    }

    /**
     * Get JSON report data.
     */
    public function data(Request $request): JsonResponse
    {
        $user = Auth::user();
        $reportData = $this->service->getReportData($user, $request);
        return response()->json($reportData);
    }
}
