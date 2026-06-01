<?php

namespace App\DTOs;

use App\Http\Requests\CustomerRequest;

class CustomerDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $phone = null,
        public readonly int $currentPoint = 0,
        public readonly int $businessId
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(CustomerRequest $request): self
    {
        return new self(
            name: $request->input('name'),
            phone: $request->input('phone'),
            currentPoint: (int) ($request->input('current_point') ?? 0),
            businessId: (int) $request->input('business_id')
        );
    }

    /**
     * Convert DTO to array for database persistence.
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'phone' => $this->phone,
            'current_point' => $this->currentPoint,
            'business_id' => $this->businessId,
        ];
    }
}
