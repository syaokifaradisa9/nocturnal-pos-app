<?php

namespace App\Services;

use App\Models\Transaction;
use App\Models\User;
use App\Enums\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SalesReportService
{
    /**
     * Compile sales report data based on permission scope and filters.
     */
    public function getReportData(User $user, Request $request): array
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $branchId = $request->input('branch_id');
        $businessId = $request->input('business_id');

        // Base Query
        $query = Transaction::where('status', 'completed')
            ->with(['items.productItemMeasurement', 'branch.business']);

        // Scope by permission
        if ($user->hasPermission(UserPermission::VIEW_ANY_TRANSACTION)) {
            // No permission filter
        } elseif ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_TRANSACTION)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $query->whereHas('branch', function ($q) use ($associatedBusinessIds) {
                $q->whereIn('business_id', $associatedBusinessIds);
            });
        } elseif ($user->hasPermission(UserPermission::VIEW_OWN_TRANSACTION)) {
            $query->whereHas('branch.business', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } else {
            $query->whereRaw('1 = 0');
        }

        // Apply filters
        if ($startDate) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate) {
            $query->whereDate('created_at', '<=', $endDate);
        }
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }
        if ($businessId) {
            $query->whereHas('branch', function ($q) use ($businessId) {
                $q->where('business_id', $businessId);
            });
        }

        $transactions = $query->orderBy('created_at', 'asc')->get();

        // 1. Fetch latest unit costs for profit calculations (to avoid N+1 queries)
        $latestBatchCosts = DB::table('inventory_batches')
            ->select('product_item_measurement_id', 'unit_cost')
            ->whereIn('id', function($q) {
                $q->select(DB::raw('MAX(id)'))
                  ->from('inventory_batches')
                  ->groupBy('product_item_measurement_id');
            })
            ->pluck('unit_cost', 'product_item_measurement_id')
            ->toArray();

        // 2. Fetch Active Stock Asset Value
        $stockQuery = \App\Models\InventoryBatch::where('status', \App\Enums\InventoryBatchStatus::ACTIVE->value);

        if ($user->hasPermission(UserPermission::VIEW_ANY_TRANSACTION)) {
            // No filter
        } elseif ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_TRANSACTION)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $stockQuery->whereHas('purchaseReceiptItem.purchaseReceipt.branch', function ($q) use ($associatedBusinessIds) {
                $q->whereIn('business_id', $associatedBusinessIds);
            });
        } elseif ($user->hasPermission(UserPermission::VIEW_OWN_TRANSACTION)) {
            $stockQuery->whereHas('purchaseReceiptItem.purchaseReceipt.branch.business', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        } else {
            $stockQuery->whereRaw('1 = 0');
        }

        if ($branchId) {
            $stockQuery->whereHas('purchaseReceiptItem.purchaseReceipt', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        if ($businessId) {
            $stockQuery->whereHas('purchaseReceiptItem.purchaseReceipt.branch', function ($q) use ($businessId) {
                $q->where('business_id', $businessId);
            });
        }

        $activeBatches = $stockQuery->get();
        $totalStockAssetValue = 0;
        foreach ($activeBatches as $batch) {
            $totalStockAssetValue += ((float) $batch->current_quantity * (float) $batch->unit_cost);
        }

        // Variables for aggregation
        $totalGrossRevenue = 0;
        $totalProfit = 0;
        $totalCustomers = 0;

        $totalGrossSales = 0;
        $totalDiscounts = 0;
        $totalCogs = 0;
        $totalCustomers = 0;

        $revenueByPayment = [];
        $profitByPayment = [];
        $paymentCount = [];

        $productQuantities = [];
        $productRevenues = [];
        $productProfits = [];
        $productNames = [];
        $monthlyTrends = [];
        $dayAnalysis = [
            'Minggu' => 0, 'Senin' => 0, 'Selasa' => 0, 'Rabu' => 0,
            'Kamis' => 0, 'Jumat' => 0, 'Sabtu' => 0
        ];
        $hourAnalysis = array_fill(0, 24, 0);

        $customerSet = [];

        foreach ($transactions as $tx) {
            $subtotal = 0;
            $cost = 0;

            foreach ($tx->items as $item) {
                $qty = (float) $item->quantity;
                $price = (float) $item->price;
                $subtotal += ($qty * $price);

                // COGS (Harga Modal) calculation
                $unitCost = isset($latestBatchCosts[$item->product_item_measurement_id]) 
                    ? (float) $latestBatchCosts[$item->product_item_measurement_id] 
                    : 0.0;
                $cost += ($qty * $unitCost);

                // Product sales accumulation by product_item_measurement_id
                $mId = $item->product_item_measurement_id ?: 0;
                $displayName = $item->product_name . ' (' . $item->measurement_name . ')';

                $productQuantities[$mId] = ($productQuantities[$mId] ?? 0) + $qty;
                $productRevenues[$mId] = ($productRevenues[$mId] ?? 0) + ($qty * $price);
                $productProfits[$mId] = ($productProfits[$mId] ?? 0) + (($price - $unitCost) * $qty);
                $productNames[$mId] = $displayName;
            }

            $discount = (float) $tx->discount_price;
            $revenue = $subtotal - $discount;
            $profit = $revenue - $cost;

            $totalGrossRevenue += $revenue;
            $totalProfit += $profit;

            $totalGrossSales += $subtotal;
            $totalDiscounts += $discount;
            $totalCogs += $cost;

            // Payment method breakdown
            $payMethod = $tx->payment_method ?: 'Lainnya';
            $revenueByPayment[$payMethod] = ($revenueByPayment[$payMethod] ?? 0) + $revenue;
            $profitByPayment[$payMethod] = ($profitByPayment[$payMethod] ?? 0) + $profit;
            $paymentCount[$payMethod] = ($paymentCount[$payMethod] ?? 0) + 1;

            // Monthly Trend
            $monthKey = $tx->created_at->format('Y-m'); // e.g. "2026-06"
            if (!isset($monthlyTrends[$monthKey])) {
                $monthlyTrends[$monthKey] = [
                    'month' => $tx->created_at->translatedFormat('F Y'),
                    'revenue' => 0,
                    'profit' => 0,
                    'customer_ids' => []
                ];
            }
            $monthlyTrends[$monthKey]['revenue'] += $revenue;
            $monthlyTrends[$monthKey]['profit'] += $profit;
            if ($tx->customer_id) {
                $monthlyTrends[$monthKey]['customer_ids'][$tx->customer_id] = true;
                $customerSet[$tx->customer_id] = true;
            } else {
                // Walk-in customers treated as unique per transaction if guest
                $monthlyTrends[$monthKey]['customer_ids']['guest_' . $tx->id] = true;
                $customerSet['guest_' . $tx->id] = true;
            }

            // Busy Day
            $dayName = $tx->created_at->translatedFormat('l'); // e.g. "Senin"
            if (array_key_exists($dayName, $dayAnalysis)) {
                $dayAnalysis[$dayName]++;
            } else {
                // Fallback translations if locale isn't fully translated
                $dayMap = [
                    'Sunday' => 'Minggu', 'Monday' => 'Senin', 'Tuesday' => 'Selasa',
                    'Wednesday' => 'Rabu', 'Thursday' => 'Kamis', 'Friday' => 'Jumat',
                    'Saturday' => 'Sabtu'
                ];
                $englishDay = $tx->created_at->format('l');
                $mappedDay = $dayMap[$englishDay] ?? $englishDay;
                $dayAnalysis[$mappedDay] = ($dayAnalysis[$mappedDay] ?? 0) + 1;
            }

            // Busy Hour
            $hour = (int) $tx->created_at->format('H');
            $hourAnalysis[$hour]++;
        }

        // Format Monthly Trends
        $formattedMonthlyTrends = [];
        ksort($monthlyTrends);
        foreach ($monthlyTrends as $mKey => $mData) {
            $formattedMonthlyTrends[] = [
                'period' => $mData['month'],
                'revenue' => round($mData['revenue'], 2),
                'profit' => round($mData['profit'], 2),
                'customers' => count($mData['customer_ids'])
            ];
        }

        // 1. Format Product rankings (by Quantity)
        arsort($productQuantities);
        $topProducts = [];
        $count = 0;
        foreach ($productQuantities as $mId => $qty) {
            if ($count >= 5) break;
            $topProducts[] = [
                'name' => $productNames[$mId] ?? 'Unknown Item', 
                'quantity' => $qty,
                'revenue' => round($productRevenues[$mId] ?? 0, 2),
                'profit' => round($productProfits[$mId] ?? 0, 2)
            ];
            $count++;
        }

        asort($productQuantities);
        $bottomProducts = [];
        $count = 0;
        foreach ($productQuantities as $mId => $qty) {
            if ($count >= 5) break;
            $bottomProducts[] = [
                'name' => $productNames[$mId] ?? 'Unknown Item', 
                'quantity' => $qty,
                'revenue' => round($productRevenues[$mId] ?? 0, 2),
                'profit' => round($productProfits[$mId] ?? 0, 2)
            ];
            $count++;
        }

        // 2. Format Product rankings (by Revenue)
        arsort($productRevenues);
        $topRevenueProducts = [];
        $count = 0;
        foreach ($productRevenues as $mId => $rev) {
            if ($count >= 5) break;
            $topRevenueProducts[] = [
                'name' => $productNames[$mId] ?? 'Unknown Item', 
                'quantity' => $productQuantities[$mId] ?? 0,
                'revenue' => round($rev, 2),
                'profit' => round($productProfits[$mId] ?? 0, 2)
            ];
            $count++;
        }

        asort($productRevenues);
        $bottomRevenueProducts = [];
        $count = 0;
        foreach ($productRevenues as $mId => $rev) {
            if ($count >= 5) break;
            $bottomRevenueProducts[] = [
                'name' => $productNames[$mId] ?? 'Unknown Item', 
                'quantity' => $productQuantities[$mId] ?? 0,
                'revenue' => round($rev, 2),
                'profit' => round($productProfits[$mId] ?? 0, 2)
            ];
            $count++;
        }

        // 3. Format Product rankings (by Profit)
        arsort($productProfits);
        $topProfitProducts = [];
        $count = 0;
        foreach ($productProfits as $mId => $prof) {
            if ($count >= 5) break;
            $topProfitProducts[] = [
                'name' => $productNames[$mId] ?? 'Unknown Item', 
                'quantity' => $productQuantities[$mId] ?? 0,
                'revenue' => round($productRevenues[$mId] ?? 0, 2),
                'profit' => round($prof, 2)
            ];
            $count++;
        }

        asort($productProfits);
        $bottomProfitProducts = [];
        $count = 0;
        foreach ($productProfits as $mId => $prof) {
            if ($count >= 5) break;
            $bottomProfitProducts[] = [
                'name' => $productNames[$mId] ?? 'Unknown Item', 
                'quantity' => $productQuantities[$mId] ?? 0,
                'revenue' => round($productRevenues[$mId] ?? 0, 2),
                'profit' => round($prof, 2)
            ];
            $count++;
        }

        // Format Payment Methods Comparison
        $formattedPayments = [];
        foreach ($paymentCount as $method => $txCount) {
            $formattedPayments[] = [
                'method' => $method,
                'count' => $txCount,
                'revenue' => round($revenueByPayment[$method] ?? 0, 2),
                'profit' => round($profitByPayment[$method] ?? 0, 2)
            ];
        }

        // Format Busy Days
        $formattedDays = [];
        foreach ($dayAnalysis as $day => $txCount) {
            $formattedDays[] = ['day' => $day, 'count' => $txCount];
        }

        // Format Busy Hours
        $formattedHours = [];
        foreach ($hourAnalysis as $hr => $txCount) {
            $formattedHours[] = [
                'hour' => sprintf('%02d:00', $hr),
                'count' => $txCount
            ];
        }

        return [
            'summary' => [
                'total_gross_revenue' => round($totalGrossRevenue, 2),
                'total_profit' => round($totalProfit, 2),
                'total_transactions' => $transactions->count(),
                'total_customers' => count($customerSet),
                'revenue_by_payment' => $revenueByPayment,
                'profit_by_payment' => $profitByPayment,
                
                // New P&L & Asset fields
                'gross_sales_revenue' => round($totalGrossSales, 2),
                'total_discounts' => round($totalDiscounts, 2),
                'net_sales_revenue' => round($totalGrossRevenue, 2),
                'total_cogs' => round($totalCogs, 2),
                'net_profit' => round($totalProfit, 2),
                'total_stock_asset_value' => round($totalStockAssetValue, 2)
            ],
            'top_products' => $topProducts,
            'bottom_products' => $bottomProducts,
            'top_revenue_products' => $topRevenueProducts,
            'bottom_revenue_products' => $bottomRevenueProducts,
            'top_profit_products' => $topProfitProducts,
            'bottom_profit_products' => $bottomProfitProducts,
            'monthly_trends' => $formattedMonthlyTrends,
            'payment_methods' => $formattedPayments,
            'busy_days' => $formattedDays,
            'busy_hours' => $formattedHours
        ];
    }
}
