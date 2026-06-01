<?php

namespace App\DTOs;

use App\Http\Requests\RewardRequest;

class RewardDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description = null,
        public readonly int $minimumPoint,
        public readonly int $businessId
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(RewardRequest $request): self
    {
        return new self(
            name: $request->input('name'),
            description: $request->input('description'),
            minimumPoint: (int) $request->input('minimum_point'),
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
            'description' => $this->description,
            'minimum_point' => $this->minimumPoint,
            'business_id' => $this->businessId,
        ];
    }
}
