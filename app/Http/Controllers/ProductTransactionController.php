<?php

namespace App\Http\Controllers;

use App\Enums\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use App\Http\Requests\DatatableRequest;
use App\Services\ProductTransactionDatatableService;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ProductTransactionController extends Controller
{
    /**
     * Display the product transactions list page.
     */
    public function list(Request $request): Response
    {
        return Inertia::render('product-transactions/index');
    }

    /**
     * Return datatable JSON data for product transactions.
     */
    public function datatable(DatatableRequest $request, ProductTransactionDatatableService $datatableService): JsonResponse
    {
        return response()->json($datatableService->getDatatable($request));
    }

    /**
     * Export to Excel.
     */
    public function printExcel(DatatableRequest $request, ProductTransactionDatatableService $datatableService): SymfonyResponse
    {
        return $datatableService->printExcel($request);
    }

    /**
     * Export/Print to PDF.
     */
    public function printPdf(DatatableRequest $request, ProductTransactionDatatableService $datatableService): SymfonyResponse
    {
        return $datatableService->printPdf($request);
    }
}
