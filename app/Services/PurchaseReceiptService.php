<?php

namespace App\Services;

use App\DTOs\PurchaseReceiptDTO;
use App\Models\PurchaseReceipt;
use App\Models\User;
use App\Repositories\PurchaseReceiptRepository;
use App\Repositories\PurchaseReceiptItemRepository;
use App\Repositories\SupplierRepository;
use App\Repositories\BranchRepository;
use App\Repositories\BusinessRepository;
use App\Enums\UserPermission;
use App\Repositories\UserRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class PurchaseReceiptService
{
    public function __construct(
        protected PurchaseReceiptRepository $repository,
        protected PurchaseReceiptItemRepository $itemRepository,
        protected \App\Repositories\PurchaseReceiptRejectRepository $rejectRepository,
        protected \App\Repositories\InventoryBatchRepository $inventoryBatchRepository,
        protected SupplierRepository $supplierRepository,
        protected BranchRepository $branchRepository,
        protected BusinessRepository $businessRepository,
        protected UserRepository $userRepository
    ) {}

    /**
     * Get authorized purchase receipt by ID.
     */
    public function getAuthorizedReceipt(int $id, User $user): PurchaseReceipt
    {
        $receipt = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::VIEW_ANY_PURCHASE_RECEIPT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $receiptBusinessId = $receipt->branch?->business_id;
            if (in_array($receiptBusinessId, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PURCHASE_RECEIPT)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            $receiptBusinessId = $receipt->branch?->business_id;
            if (in_array($receiptBusinessId, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengakses data penerimaan barang ini.');
        }

        return $receipt;
    }

    /**
     * Create purchase receipt with items and rejects.
     */
    public function create(PurchaseReceiptDTO $dto, User $user): PurchaseReceipt
    {
        return DB::transaction(function () use ($dto) {
            $data = $dto->toArray();
            $receipt = $this->repository->create($data);

            if (!empty($dto->items)) {
                $this->itemRepository->createMany($receipt->id, $dto->items);
            }

            if (!empty($dto->rejects)) {
                $this->rejectRepository->createMany($receipt->id, $dto->rejects);
            }

            return $receipt->load([
                'items.productItemMeasurement.productItem',
                'items.productItemMeasurement.measurementUnit',
                'rejects.productItemMeasurement.productItem',
                'rejects.productItemMeasurement.measurementUnit'
            ]);
        });
    }

    /**
     * Update purchase receipt.
     */
    public function update(int $id, PurchaseReceiptDTO $dto, User $user): PurchaseReceipt
    {
        $this->getAuthorizedReceipt($id, $user);

        return DB::transaction(function () use ($id, $dto) {
            $data = $dto->toArray();
            $receipt = $this->repository->update($id, $data);

            // Delete old items and create new ones
            $this->itemRepository->deleteByReceiptId($id);
            if (!empty($dto->items)) {
                $this->itemRepository->createMany($receipt->id, $dto->items);
            }

            // Delete old rejects and create new ones
            $this->rejectRepository->deleteByReceiptId($id);
            if (!empty($dto->rejects)) {
                $this->rejectRepository->createMany($receipt->id, $dto->rejects);
            }

            return $receipt->load([
                'items.productItemMeasurement.productItem',
                'items.productItemMeasurement.measurementUnit',
                'rejects.productItemMeasurement.productItem',
                'rejects.productItemMeasurement.measurementUnit'
            ]);
        });
    }

    /**
     * Delete purchase receipt.
     */
    public function delete(int $id, User $user): bool
    {
        $receipt = $this->getAuthorizedReceipt($id, $user);
        
        if ($receipt->status === 'Confirmed') {
            throw new \Exception('Penerimaan barang yang sudah dikonfirmasi tidak dapat dihapus.');
        }

        return $this->repository->delete($id);
    }

    public function getSelectionData(User $user): array
    {
        $suppliers = [];
        $branches = [];
        $users = [];

        if ($user->hasPermission(UserPermission::VIEW_ANY_PURCHASE_RECEIPT)) {
            $suppliers = $this->supplierRepository->query()->get();
            $branches = $this->branchRepository->query()->with('business')->get();
            $users = $this->userRepository->getUsersByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PURCHASE_RECEIPT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            
            $suppliers = $this->supplierRepository->query()
                ->whereHas('businesses', function ($q) use ($associatedBusinessIds) {
                    $q->whereIn('businesses.id', $associatedBusinessIds);
                })->get();

            $branches = $this->branchRepository->query()
                ->whereIn('business_id', $associatedBusinessIds)
                ->with('business')
                ->get();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PURCHASE_RECEIPT)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            
            $suppliers = $this->supplierRepository->query()
                ->whereHas('businesses', function ($q) use ($ownedBusinessIds) {
                    $q->whereIn('businesses.id', $ownedBusinessIds);
                })->get();

            $branches = $this->branchRepository->query()
                ->whereIn('business_id', $ownedBusinessIds)
                ->with('business')
                ->get();
        }

        return compact('suppliers', 'branches', 'users');
    }

    /**
     * Get selection data for a specific owner.
     */
    public function getOwnerSelectionData(int $ownerId): array
    {
        $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $ownerId)->pluck('id')->toArray();

        $suppliers = $this->supplierRepository->query()
            ->whereHas('businesses', function ($q) use ($ownedBusinessIds) {
                $q->whereIn('businesses.id', $ownedBusinessIds);
            })->get();

        $branches = $this->branchRepository->query()
            ->whereIn('business_id', $ownedBusinessIds)
            ->with('business')
            ->get();

        return compact('suppliers', 'branches');
    }

    /**
     * Confirm a purchase receipt and copy items to inventory batches.
     */
    public function confirm(int $id, User $user): PurchaseReceipt
    {
        $receipt = $this->getAuthorizedReceipt($id, $user);

        if ($receipt->status === 'Confirmed') {
            throw new \Exception('Penerimaan barang ini sudah dikonfirmasi.');
        }

        return DB::transaction(function () use ($receipt, $id) {
            $receiptDate = $receipt->receipt_date;
            $ymd = \Carbon\Carbon::parse($receiptDate)->format('ymd');
            
            // Format {ymd}{jumlah purchase_receipts pada hari receipt_date + 1}
            $count = $this->repository->query()->whereDate('receipt_date', $receiptDate)->count();
            $batchNumber = $ymd . ($count + 1);

            $receipt->load('items');

            foreach ($receipt->items as $item) {
                $this->inventoryBatchRepository->create([
                    'product_item_measurement_id' => $item->product_item_measurement_id,
                    'purchase_receipt_item_id' => $item->id,
                    'batch_number' => $batchNumber,
                    'initial_quantity' => $item->quantity,
                    'current_quantity' => $item->quantity,
                    'unit_cost' => $item->unit_cost,
                    'expired_date' => $item->expired_date,
                    'status' => \App\Enums\InventoryBatchStatus::ACTIVE,
                ]);
            }

            return $this->repository->update($id, ['status' => 'Confirmed']);
        });
    }
}
