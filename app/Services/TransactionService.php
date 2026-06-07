<?php

namespace App\Services;

use App\DTOs\TransactionDTO;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\Customer;
use App\Models\ProductItem;
use App\Models\Branch;
use App\Repositories\TransactionRepository;
use App\Repositories\CustomerRepository;
use App\Repositories\BranchRepository;
use App\Repositories\InventoryBatchRepository;
use App\Enums\InventoryBatchStatus;
use Illuminate\Support\Facades\DB;

class TransactionService
{
    public function __construct(
        protected TransactionRepository $repository,
        protected CustomerRepository $customerRepository,
        protected BranchRepository $branchRepository,
        protected InventoryBatchRepository $inventoryBatchRepository
    ) {}

    /**
     * Get products for cashier POS based on branch and filters.
     */
    public function getProductsForBranch(int $branchId, ?int $productId = null): array
    {
        $branch = $this->branchRepository->findOrFail($branchId);
        $businessId = $branch->business_id;

        // Query product items belonging to this business
        $query = ProductItem::whereHas('product.businesses', function($q) use ($businessId) {
            $q->where('businesses.id', $businessId);
        })
        ->where('is_active', true)
        ->with(['product', 'measurements.measurementUnit', 'measurements.priceTierings']);

        if ($productId) {
            $query->where('product_id', $productId);
        }

        $productItems = $query->get();

        $result = [];
        foreach ($productItems as $item) {
            $measurementsData = [];
            $minPrice = null;

            foreach ($item->measurements as $measurement) {
                // Calculate stock in this branch
                $stock = (float) $this->inventoryBatchRepository->query()
                    ->where('product_item_measurement_id', $measurement->id)
                    ->where('status', InventoryBatchStatus::ACTIVE->value)
                    ->whereHas('purchaseReceiptItem.purchaseReceipt', function($q) use ($branchId) {
                        $q->where('branch_id', $branchId);
                    })
                    ->sum('current_quantity');

                // Get tierings
                $tierings = $measurement->priceTierings->map(function($t) {
                    return [
                        'minimum' => (int) $t->minimum,
                        'price' => (float) $t->price
                    ];
                })->sortBy('minimum')->values()->toArray();

                $measurementMinPrice = !empty($tierings) ? $tierings[0]['price'] : 0.0;
                foreach ($tierings as $t) {
                    if ($t['price'] < $measurementMinPrice) {
                        $measurementMinPrice = $t['price'];
                    }
                }

                if ($minPrice === null || $measurementMinPrice < $minPrice) {
                    $minPrice = $measurementMinPrice;
                }

                // If no tierings exist, use 0
                if (empty($tierings)) {
                    $tierings = [['minimum' => 1, 'price' => 0.0]];
                }

                $measurementsData[] = [
                    'id' => $measurement->id,
                    'is_base_unit' => $measurement->is_base_unit,
                    'conversion_rate' => (float) $measurement->conversion_rate,
                    'unit' => [
                        'id' => $measurement->measurementUnit->id,
                        'name' => $measurement->measurementUnit->name,
                        'short_name' => $measurement->measurementUnit->short_name,
                        'allow_decimal' => (bool) $measurement->measurementUnit->allow_decimal
                    ],
                    'stock' => $stock,
                    'price_tierings' => $tierings,
                    'min_price' => $measurementMinPrice
                ];
            }

            // Fallback price if no measurements exist
            if ($minPrice === null) {
                $minPrice = 0.0;
            }

            // Calculate total stock across all measurements
            $totalStock = array_sum(array_column($measurementsData, 'stock'));

            $result[] = [
                'id' => $item->id,
                'name' => $item->name,
                'image_url' => $item->image_url ?: null,
                'product_id' => $item->product_id,
                'product_name' => $item->product->name,
                'min_price' => $minPrice,
                'total_stock' => $totalStock,
                'measurements' => $measurementsData
            ];
        }

        return $result;
    }

    /**
     * Get parent products for filtering.
     */
    public function getFiltersForBranch(int $branchId): array
    {
        $branch = $this->branchRepository->findOrFail($branchId);
        $businessId = $branch->business_id;

        return \App\Models\Product::whereHas('businesses', function($q) use ($businessId) {
            $q->where('businesses.id', $businessId);
        })->get(['id', 'name'])->toArray();
    }

    /**
     * Get customers associated with the branch's business.
     */
    public function getCustomersForBranch(int $branchId): array
    {
        $branch = $this->branchRepository->findOrFail($branchId);
        $businessId = $branch->business_id;

        return $this->customerRepository->query()
            ->where('business_id', $businessId)
            ->get(['id', 'name', 'phone'])
            ->toArray();
    }

    /**
     * Save draft or complete checkout transaction.
     */
    public function processTransaction(TransactionDTO $dto): Transaction
    {
        return DB::transaction(function() use ($dto) {
            $branch = $this->branchRepository->findOrFail($dto->branchId);
            $businessId = $branch->business_id;

            $customerId = $dto->customerId;

            // 1. Check if we need to auto-create a new customer
            if ($dto->newCustomer && !empty($dto->newCustomer['name'])) {
                $customer = $this->customerRepository->create([
                    'name' => $dto->newCustomer['name'],
                    'phone' => $dto->newCustomer['phone'] ?? null,
                    'business_id' => $businessId,
                    'current_point' => 0
                ]);
                $customerId = $customer->id;
            }

            // 2. Create the transaction
            $transactionData = $dto->toTransactionArray();
            $transactionData['customer_id'] = $customerId;
            $transaction = $this->repository->create($transactionData);

            // 3. Create items and handle stock deduction if status is completed
            foreach ($dto->items as $item) {
                // Fetch measurement to get snapshot names
                $measurement = \App\Models\ProductItemMeasurement::with(['productItem', 'measurementUnit'])->find($item['product_item_measurement_id'] ?? null);

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_name' => $measurement ? $measurement->productItem->name : 'Unknown Product',
                    'measurement_name' => $measurement ? $measurement->measurementUnit->name : 'Unit',
                    'product_item_measurement_id' => $measurement ? $measurement->id : null,
                    'quantity' => $item['quantity'],
                    'price' => $item['price']
                ]);

                // Deduct stock FIFO if completed
                if ($dto->status === 'completed') {
                    $qtyToDeduct = (float) $item['quantity'];
                    $measurementId = (int) $item['product_item_measurement_id'];
                    $branchId = $dto->branchId;

                    $batches = $this->inventoryBatchRepository->query()
                        ->where('product_item_measurement_id', $measurementId)
                        ->where('status', InventoryBatchStatus::ACTIVE->value)
                        ->whereHas('purchaseReceiptItem.purchaseReceipt', function($q) use ($branchId) {
                            $q->where('branch_id', $branchId);
                        })
                        ->orderBy('created_at', 'asc')
                        ->get();

                    foreach ($batches as $batch) {
                        if ($qtyToDeduct <= 0) break;

                        $currentQty = (float) $batch->current_quantity;
                        if ($currentQty <= 0) continue;

                        if ($currentQty >= $qtyToDeduct) {
                            $newQty = $currentQty - $qtyToDeduct;
                            $batch->update([
                                'current_quantity' => $newQty,
                                'status' => $newQty == 0 ? InventoryBatchStatus::EXHAUSTED->value : InventoryBatchStatus::ACTIVE->value
                            ]);
                            $qtyToDeduct = 0;
                        } else {
                            $qtyToDeduct -= $currentQty;
                            $batch->update([
                                'current_quantity' => 0,
                                'status' => InventoryBatchStatus::EXHAUSTED->value
                            ]);
                        }
                    }
                }
            }

            return $transaction;
        });
    }

    /**
     * Get all active draft transactions for a branch.
     */
    public function getDraftsForBranch(int $branchId): array
    {
        return $this->repository->query()
            ->where('branch_id', $branchId)
            ->where('status', 'draft')
            ->with(['customer', 'items.productItemMeasurement'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function($tx) {
                return [
                    'id' => $tx->id,
                    'customer_id' => $tx->customer_id,
                    'customer_name' => $tx->customer ? $tx->customer->name : 'Walk-in Customer',
                    'customer_phone' => $tx->customer ? $tx->customer->phone : null,
                    'discount_price' => (float) $tx->discount_price,
                    'payment_method' => $tx->payment_method,
                    'created_at' => $tx->created_at->toDateTimeString(),
                    'items' => $tx->items->map(function($item) {
                        return [
                            'product_item_id' => $item->productItemMeasurement ? $item->productItemMeasurement->product_item_id : null,
                            'product_item_measurement_id' => $item->product_item_measurement_id,
                            'name' => $item->product_name,
                            'quantity' => (float) $item->quantity,
                            'price' => (float) $item->price,
                            'unit_name' => $item->measurement_name
                        ];
                    })
                ];
            })
            ->toArray();
    }

    /**
     * Delete a draft transaction.
     */
    public function deleteDraft(int $id): void
    {
        $transaction = $this->repository->findOrFail($id);
        if ($transaction->status !== 'draft') {
            throw new \Exception('Hanya transaksi draft yang dapat dihapus.');
        }
        // Deleting the transaction will also cascade delete transaction_item if configured in DB, 
        // but let's be explicit and delete items first if needed, though soft deletes apply to transaction.
        // Actually, soft delete the transaction.
        $transaction->delete();
    }
}
