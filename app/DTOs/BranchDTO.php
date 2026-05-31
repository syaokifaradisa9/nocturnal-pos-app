<?php

namespace App\DTOs;

use App\Http\Requests\BranchRequest;

class BranchDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $address,
        public readonly ?int $businessId = null,
        public readonly ?string $openingTime = null,
        public readonly ?string $endTime = null
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(BranchRequest $request, ?int $businessId = null): self
    {
        return new self(
            name: $request->input('name'),
            address: $request->input('address'),
            businessId: $businessId ?? ($request->input('business_id') ? (int) $request->input('business_id') : null),
            openingTime: $request->input('opening_time'),
            endTime: $request->input('end_time')
        );
    }

    /**
     * Convert DTO to array for database persistence.
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'address' => $this->address,
            'opening_time' => $this->openingTime,
            'end_time' => $this->endTime,
        ];

        if ($this->businessId !== null) {
            $data['business_id'] = $this->businessId;
        }

        return $data;
    }
}
