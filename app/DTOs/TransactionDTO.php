<?php

namespace App\DTOs;

use App\Http\Requests\TransactionRequest;

class TransactionDTO
{
    public function __construct(
        public int $branchId,
        public ?int $customerId,
        public float $discountPrice,
        public string $status,
        public array $items,
        public ?array $newCustomer = null,
        public ?string $paymentMethod = null
    ) {}

    /**
     * Map Request input into DTO.
     */
    public static function fromRequest(TransactionRequest $request): self
    {
        return new self(
            branchId: (int) $request->input('branch_id'),
            customerId: $request->input('customer_id') ? (int) $request->input('customer_id') : null,
            discountPrice: (float) $request->input('discount_price', 0),
            status: $request->input('status', 'completed'),
            items: $request->input('items', []),
            newCustomer: $request->input('customers'),
            paymentMethod: $request->input('payment_method')
        );
    }

    /**
     * Convert DTO back into transaction database model input.
     */
    public function toTransactionArray(): array
    {
        return [
            'branch_id' => $this->branchId,
            'customer_id' => $this->customerId,
            'discount_price' => $this->discountPrice,
            'status' => $this->status,
            'payment_method' => $this->paymentMethod,
        ];
    }
}
