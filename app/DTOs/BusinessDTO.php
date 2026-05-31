<?php

namespace App\DTOs;

use App\Http\Requests\BusinessRequest;

class BusinessDTO
{
    public function __construct(
        public readonly string $name,
        public readonly ?string $description,
        public readonly ?int $userId = null
    ) {}

    /**
     * Create DTO from request.
     */
    public static function fromRequest(BusinessRequest $request, ?int $userId = null): self
    {
        return new self(
            name: $request->input('name'),
            description: $request->input('description'),
            userId: $userId ?? $request->input('user_id')
        );
    }

    /**
     * Convert DTO to array for database persistence.
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'description' => $this->description,
        ];

        if ($this->userId !== null) {
            $data['user_id'] = $this->userId;
        }

        return $data;
    }
}
