<?php

namespace App\DTOs;

use App\Http\Requests\SupplierRequest;

class SupplierDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $contactName = null,
        public readonly ?string $contactPhone = null,
        public readonly ?string $address = null,
        public readonly ?string $description = null,
        public readonly ?array $businessIds = null
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(SupplierRequest $request, ?array $businessIds = null): self
    {
        $inputIds = $request->input('business_ids');
        if (is_array($inputIds)) {
            $inputIds = array_map('intval', $inputIds);
        }

        return new self(
            name: $request->input('name'),
            contactName: $request->input('contact_name'),
            contactPhone: $request->input('contact_phone'),
            address: $request->input('address'),
            description: $request->input('description'),
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
            'contact_name' => $this->contactName,
            'contact_phone' => $this->contactPhone,
            'address' => $this->address,
            'description' => $this->description,
        ];
    }
}
