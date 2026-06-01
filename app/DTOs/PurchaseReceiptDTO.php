<?php

namespace App\DTOs;

use Illuminate\Http\Request;

class PurchaseReceiptDTO
{
    public function __construct(
        public readonly int $supplierId,
        public readonly int $branchId,
        public readonly ?string $receiptNumber = null,
        public readonly string $receiptDate,
        public readonly string $status,
        public readonly ?string $notes = null,
        public readonly array $items = [],
        public readonly array $rejects = []
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(Request $request): self
    {
        $items = [];
        if ($request->has('items')) {
            foreach ($request->input('items', []) as $item) {
                $items[] = [
                    'product_item_measurement_id' => (int) $item['product_item_measurement_id'],
                    'quantity' => (float) $item['quantity'],
                    'unit_cost' => (float) $item['unit_cost'],
                    'expired_date' => $item['expired_date'] ?? null,
                ];
            }
        }

        $rejects = [];
        if ($request->has('rejects')) {
            foreach ($request->input('rejects', []) as $reject) {
                $rejects[] = [
                    'product_item_measurement_id' => (int) $reject['product_item_measurement_id'],
                    'quantity' => (float) $reject['quantity'],
                    'reason' => $reject['reason'],
                ];
            }
        }

        return new self(
            supplierId: (int) $request->input('supplier_id'),
            branchId: (int) $request->input('branch_id'),
            receiptNumber: $request->input('receipt_number'),
            receiptDate: $request->input('receipt_date'),
            status: $request->input('status'),
            notes: $request->input('notes'),
            items: $items,
            rejects: $rejects
        );
    }

    /**
     * Convert DTO to array for database persistence (receipt fields only).
     */
    public function toArray(): array
    {
        return [
            'supplier_id' => $this->supplierId,
            'branch_id' => $this->branchId,
            'receipt_number' => $this->receiptNumber,
            'receipt_date' => $this->receiptDate,
            'status' => $this->status,
            'notes' => $this->notes,
        ];
    }
}
