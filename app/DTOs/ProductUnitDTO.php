<?php

namespace App\DTOs;

use App\Http\Requests\ProductUnitRequest;

class ProductUnitDTO
{
    public function __construct(
        public readonly string $name,
        public readonly string $shortName,
        public readonly ?string $description = null,
        public readonly bool $allowDecimal = true,
        public readonly int $businessId
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(ProductUnitRequest $request): self
    {
        return new self(
            name: $request->input('name'),
            shortName: $request->input('short_name'),
            description: $request->input('description'),
            allowDecimal: (bool) $request->input('allow_decimal', true),
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
            'short_name' => $this->shortName,
            'description' => $this->description,
            'allow_decimal' => $this->allowDecimal,
            'business_id' => $this->businessId,
        ];
    }
}
