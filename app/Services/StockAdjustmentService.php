<?php

namespace App\Services;

use App\DTOs\StockAdjustmentDTO;
use App\Models\StockAdjustment;
use App\Models\User;
use App\Repositories\StockAdjustmentRepository;
use App\Repositories\StockAdjustmentItemRepository;
use App\Repositories\InventoryBatchRepository;
use App\Repositories\BranchRepository;
use App\Repositories\BusinessRepository;
use App\Enums\UserPermission;
use App\Enums\StockAdjustmentStatus;
use App\Enums\InventoryBatchStatus;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class StockAdjustmentService
{
    public function __construct(
        protected StockAdjustmentRepository $repository,
        protected StockAdjustmentItemRepository $itemRepository,
        protected InventoryBatchRepository $inventoryBatchRepository,
        protected BranchRepository $branchRepository,
        protected BusinessRepository $businessRepository
    ) {}

    /**
     * Get authorized stock adjustment by ID.
     */
    public function getAuthorizedAdjustment(int $id, User $user): StockAdjustment
    {
        $adjustment = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::VIEW_ANY_STOCK_ADJUSTMENT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $adjustmentBusinessId = $adjustment->branch?->business_id;
            if (in_array($adjustmentBusinessId, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_STOCK_ADJUSTMENT)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            $adjustmentBusinessId = $adjustment->branch?->business_id;
            if (in_array($adjustmentBusinessId, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengakses data stock opname ini.');
        }

        return $adjustment;
    }

    /**
     * Get branch selections for current user.
     */
    public function getBranchSelections(User $user): array
    {
        if ($user->hasPermission(UserPermission::VIEW_ANY_STOCK_ADJUSTMENT)) {
            return $this->branchRepository->query()->with('business')->get()->toArray();
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_STOCK_ADJUSTMENT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            return $this->branchRepository->query()
                ->whereIn('business_id', $associatedBusinessIds)
                ->with('business')
                ->get()
                ->toArray();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_STOCK_ADJUSTMENT)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            return $this->branchRepository->query()
                ->whereIn('business_id', $ownedBusinessIds)
                ->with('business')
                ->get()
                ->toArray();
        }
        return [];
    }

    /**
     * Get active inventory batches for a specific branch.
     */
    public function getActiveBatchesForBranch(int $branchId): array
    {
        return $this->inventoryBatchRepository->query()
            ->whereHas('purchaseReceiptItem.purchaseReceipt', function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            })
            ->where('status', InventoryBatchStatus::ACTIVE)
            ->with([
                'productItemMeasurement.productItem',
                'productItemMeasurement.measurementUnit',
                'productItemMeasurement.targetMeasurementUnit'
            ])
            ->get()
            ->map(function ($batch) {
                $prodName = $batch->productItemMeasurement?->productItem?->name ?? '—';
                $unitName = $batch->productItemMeasurement?->measurementUnit?->name ?? '—';
                $conversionRate = $batch->productItemMeasurement?->conversion_rate;
                $targetUnit = $batch->productItemMeasurement?->targetMeasurementUnit?->name;

                $label = "{$prodName} {$unitName}";
                if ($conversionRate && $targetUnit && (float)$conversionRate != 1.0) {
                    $formattedRate = rtrim(rtrim(number_format((float) $conversionRate, 4), '0'), '.');
                    $label .= " ({$formattedRate} {$targetUnit})";
                }

                return [
                    'id' => $batch->id,
                    'batch_number' => $batch->batch_number,
                    'label' => "{$batch->batch_number} - {$label}",
                    'product_label' => $label,
                    'current_quantity' => (float) $batch->current_quantity,
                    'expired_date' => $batch->expired_date ? $batch->expired_date->format('Y-m-d') : null,
                ];
            })
            ->toArray();
    }

    /**
     * Create Stock Adjustment.
     */
    public function create(StockAdjustmentDTO $dto, User $user): StockAdjustment
    {
        return DB::transaction(function () use ($dto, $user) {
            $data = $dto->toArray();
            $date = $data['adjustment_date'] ?? today()->format('Y-m-d');
            
            $ymd = \Carbon\Carbon::parse($date)->format('ymd');
            $count = $this->repository->query()->whereDate('created_at', today())->count();
            $adjustmentNumber = 'SA-' . $ymd . '-' . ($count + 1);

            $data['adjustment_number'] = $adjustmentNumber;
            $data['user_id'] = $user->id;

            $adjustment = $this->repository->create($data);

            if (!empty($dto->items)) {
                $this->itemRepository->createMany($adjustment->id, $dto->items);
                
                if ($adjustment->status === StockAdjustmentStatus::ADJUSTED) {
                    $this->applyStockAdjustment($dto->items);
                }
            }

            return $adjustment;
        });
    }

    /**
     * Update Stock Adjustment (only if Draft).
     */
    public function update(int $id, StockAdjustmentDTO $dto, User $user): StockAdjustment
    {
        $adjustment = $this->getAuthorizedAdjustment($id, $user);

        if ($adjustment->status !== StockAdjustmentStatus::DRAFT) {
            throw new \Exception('Hanya penyesuaian stok berstatus Draft yang dapat diperbarui.');
        }

        return DB::transaction(function () use ($id, $dto) {
            $data = $dto->toArray();
            $adjustment = $this->repository->update($id, $data);

            $this->itemRepository->deleteByAdjustmentId($id);

            if (!empty($dto->items)) {
                $this->itemRepository->createMany($adjustment->id, $dto->items);

                if ($adjustment->status === StockAdjustmentStatus::ADJUSTED) {
                    $this->applyStockAdjustment($dto->items);
                }
            }

            return $adjustment;
        });
    }

    /**
     * Delete Stock Adjustment.
     */
    public function delete(int $id, User $user): bool
    {
        $adjustment = $this->getAuthorizedAdjustment($id, $user);

        if ($adjustment->status !== StockAdjustmentStatus::DRAFT) {
            throw new \Exception('Hanya penyesuaian stok berstatus Draft yang dapat dihapus.');
        }

        return $this->repository->delete($id);
    }

    /**
     * Apply stock adjustments to inventory batches.
     */
    protected function applyStockAdjustment(array $items): void
    {
        foreach ($items as $item) {
            $batch = $this->inventoryBatchRepository->findOrFail($item['inventory_batch_id']);
            $newQty = $item['physical_quantity'];

            $batchData = ['current_quantity' => $newQty];
            if ($newQty <= 0) {
                $batchData['status'] = InventoryBatchStatus::EXHAUSTED;
            } else {
                $batchData['status'] = InventoryBatchStatus::ACTIVE;
            }

            $this->inventoryBatchRepository->update($batch->id, $batchData);
        }
    }
}
