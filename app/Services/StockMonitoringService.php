<?php

namespace App\Services;

use App\Repositories\InventoryBatchRepository;
use App\Models\User;
use App\Enums\UserPermission;
use Illuminate\Support\Facades\DB;

class StockMonitoringService
{
    public function __construct(
        protected InventoryBatchRepository $inventoryBatchRepository
    ) {}

    /**
     * Get grouped stock data based on expired date and user scoping.
     */
    public function getGroupedStockData(User $user): array
    {
        $query = $this->inventoryBatchRepository->query()->with([
            'productItemMeasurement.productItem',
            'productItemMeasurement.measurementUnit',
            'productItemMeasurement.targetMeasurementUnit',
            'purchaseReceiptItem.purchaseReceipt.branch.business'
        ]);

        if ($user->hasPermission(UserPermission::VIEW_ANY_PURCHASE_RECEIPT)) {
            // No extra filter
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $query->whereHas('purchaseReceiptItem.purchaseReceipt.branch', function ($q) use ($associatedBusinessIds) {
                $q->whereIn('business_id', $associatedBusinessIds);
            });
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PURCHASE_RECEIPT)) {
            $ownedBusinessIds = DB::table('businesses')->where('user_id', $user->id)->pluck('id')->toArray();
            $query->whereHas('purchaseReceiptItem.purchaseReceipt.branch', function ($q) use ($ownedBusinessIds) {
                $q->whereIn('business_id', $ownedBusinessIds);
            });
        } else {
            return [];
        }

        $batches = $query->get();

        $grouped = $batches->groupBy(function ($batch) {
            return $batch->expired_date ? $batch->expired_date->format('Y-m-d') : 'Tanpa Tanggal Kadaluarsa';
        });

        $sortedGrouped = [];
        $noExpired = null;

        foreach ($grouped as $date => $items) {
            if ($date === 'Tanpa Tanggal Kadaluarsa') {
                $noExpired = [
                    'expired_date' => $date,
                    'items' => $items->values()
                ];
            } else {
                $sortedGrouped[$date] = [
                    'expired_date' => $date,
                    'items' => $items->values()
                ];
            }
        }

        ksort($sortedGrouped);
        $result = array_values($sortedGrouped);
        if ($noExpired) {
            $result[] = $noExpired;
        }

        return $result;
    }
}
