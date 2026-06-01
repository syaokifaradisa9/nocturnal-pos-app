<?php

namespace App\Http\Controllers;

use App\Services\StockMonitoringService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class StockMonitoringController extends Controller
{
    public function __construct(
        protected StockMonitoringService $service
    ) {}

    /**
     * Display stock monitoring page.
     */
    public function index(Request $request): Response
    {
        $groupedStocks = $this->service->getGroupedStockData(Auth::user());

        return Inertia::render('stock-monitoring/index', [
            'groupedStocks' => $groupedStocks
        ]);
    }
}
