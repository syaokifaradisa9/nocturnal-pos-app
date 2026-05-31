<?php

namespace App\DTOs;

use App\Http\Requests\ProductRequest;

class ProductDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?array $businessIds = null
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(ProductRequest $request, ?array $businessIds = null): self
    {
        $inputIds = $request->input('business_ids');
        if (is_array($inputIds)) {
            $inputIds = array_map('intval', $inputIds);
        }

        return new self(
            name: $request->input('name'),
            businessIds: $businessIds ?? $inputIds
        );
    }

    /**
     * Convert DTO to array for database persistence.
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
        ];
    }
}
