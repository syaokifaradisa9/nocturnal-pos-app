<?php

namespace App\Repositories;

use App\Models\Reward;
use Illuminate\Database\Eloquent\Builder;

interface RewardRepository
{
    /**
     * Get all rewards or query builder.
     */
    public function query(): Builder;

    /**
     * Find a reward by ID.
     */
    public function find(int $id): ?Reward;

    /**
     * Find a reward by ID or fail.
     */
    public function findOrFail(int $id): Reward;

    /**
     * Create a new reward.
     */
    public function create(array $data): Reward;

    /**
     * Update an existing reward.
     */
    public function update(int $id, array $data): Reward;

    /**
     * Delete a reward (soft delete).
     */
    public function delete(int $id): bool;
}
