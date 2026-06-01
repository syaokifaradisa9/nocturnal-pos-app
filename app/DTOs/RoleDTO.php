<?php

namespace App\DTOs;

use App\Http\Requests\RoleRequest;

class RoleDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description = null,
        public readonly ?array $permissionIds = null
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(RoleRequest $request, ?array $permissionIds = null): self
    {
        $inputIds = $request->input('permission_ids');
        if (is_array($inputIds)) {
            $inputIds = array_map('intval', $inputIds);
        }

        return new self(
            name: $request->input('name'),
            description: $request->input('description'),
            permissionIds: $permissionIds ?? $inputIds
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
        ];
    }
}
