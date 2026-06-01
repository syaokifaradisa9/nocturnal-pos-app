<?php

namespace App\Http\Controllers;

use App\DTOs\RewardDTO;
use App\Http\Requests\RewardRequest;
use App\Services\RewardService;
use App\Services\RewardDatatableService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;

class RewardController extends Controller
{
    public function __construct(
        protected RewardService $service,
        protected RewardDatatableService $datatableService
    ) {}

    /**
     * Display the rewards page.
     */
    public function index(Request $request): Response
    {
        $selection = $this->service->getSelectionData(Auth::user());

        return Inertia::render('rewards/index', [
            'businesses' => $selection['businesses'],
            'users' => $selection['users']
        ]);
    }

    /**
     * Return datatable JSON data.
     */
    public function datatable(DatatableRequest $request): JsonResponse
    {
        return response()->json($this->datatableService->getDatatable($request));
    }

    /**
     * Get businesses by owner (user) ID.
     */
    public function ownerBusinesses(Request $request): JsonResponse
    {
        $userId = $request->query('user_id');
        if (!$userId) {
            return response()->json([]);
        }

        $businesses = $this->service->getBusinessesByUserId((int) $userId);
        return response()->json($businesses);
    }

    /**
     * Export to Excel CSV.
     */
    public function printExcel(DatatableRequest $request): SymfonyResponse
    {
        return $this->datatableService->printExcel($request);
    }

    /**
     * Export/Print to PDF.
     */
    public function printPdf(DatatableRequest $request): SymfonyResponse
    {
        return $this->datatableService->printPdf($request);
    }

    /**
     * Store a newly created reward.
     */
    public function store(RewardRequest $request)
    {
        $dto = RewardDTO::fromRequest($request);
        $this->service->create($dto, Auth::user());

        return redirect()->route('rewards.index')
            ->with('success', 'Reward berhasil dibuat.');
    }

    /**
     * Update the specified reward.
     */
    public function update(RewardRequest $request, int $id)
    {
        $dto = RewardDTO::fromRequest($request);
        $this->service->update($id, $dto, Auth::user());

        return redirect()->route('rewards.index')
            ->with('success', 'Reward berhasil diperbarui.');
    }

    /**
     * Remove the specified reward.
     */
    public function destroy(Request $request, int $id)
    {
        $this->service->delete($id, Auth::user());

        return redirect()->route('rewards.index')
            ->with('success', 'Reward berhasil dihapus.');
    }
}
