<?php

namespace App\DTOs;

use Illuminate\Http\Request;

class StockAdjustmentDTO
{
    public function __construct(
        public readonly int $branchId,
        public readonly ?string $adjustmentDate = null,
        public readonly ?string $notes = null,
        public readonly string $status,
        public readonly array $items = []
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
                    'inventory_batch_id' => (int) $item['inventory_batch_id'],
                    'current_quantity' => (float) $item['current_quantity'],
                    'physical_quantity' => (float) $item['physical_quantity'],
                    'difference' => (float) $item['physical_quantity'] - (float) $item['current_quantity'],
                    'note' => $item['note'] ?? null,
                ];
            }
        }

        return new self(
            branchId: (int) $request->input('branch_id'),
            adjustmentDate: $request->input('adjustment_date'),
            notes: $request->input('notes'),
            status: $request->input('status', 'Draft'),
            items: $items
        );
    }

    /**
     * Convert DTO to array.
     */
    public function toArray(): array
    {
        return [
            'branch_id' => $this->branchId,
            'adjustment_date' => $this->adjustmentDate,
            'notes' => $this->notes,
            'status' => $this->status,
        ];
    }
}
