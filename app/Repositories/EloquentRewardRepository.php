<?php

namespace App\Repositories;

use App\Models\Reward;
use Illuminate\Database\Eloquent\Builder;

class EloquentRewardRepository implements RewardRepository
{
    /**
     * Get all rewards or query builder.
     */
    public function query(): Builder
    {
        return Reward::query();
    }

    /**
     * Find a reward by ID.
     */
    public function find(int $id): ?Reward
    {
        return Reward::find($id);
    }

    /**
     * Find a reward by ID or fail.
     */
    public function findOrFail(int $id): Reward
    {
        return Reward::findOrFail($id);
    }

    /**
     * Create a new reward.
     */
    public function create(array $data): Reward
    {
        return Reward::create($data);
    }

    /**
     * Update an existing reward.
     */
    public function update(int $id, array $data): Reward
    {
        $reward = $this->findOrFail($id);
        $reward->update($data);
        return $reward;
    }

    /**
     * Delete a reward.
     */
    public function delete(int $id): bool
    {
        $reward = $this->findOrFail($id);
        return $reward->delete();
    }
}
