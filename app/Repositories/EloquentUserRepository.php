<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Support\Collection;

class EloquentUserRepository implements UserRepository
{
    /**
     * Get users who have a specific permission (direct or role-inherited).
     */
    public function getUsersByPermission(string $permissionName): Collection
    {
        return User::where(function ($query) use ($permissionName) {
            $query->whereHas('directPermissions', function ($q) use ($permissionName) {
                $q->where('name', $permissionName);
            })
            ->orWhereIn('id', function ($sub) use ($permissionName) {
                $sub->select('business_users.user_id')
                    ->from('business_users')
                    ->join('role_permission', 'business_users.role_id', '=', 'role_permission.role_id')
                    ->join('permissions', 'role_permission.permission_id', '=', 'permissions.id')
                    ->where('permissions.name', $permissionName);
            })
            ->orWhereIn('id', function ($sub) use ($permissionName) {
                $sub->select('user_branches.user_id')
                    ->from('user_branches')
                    ->join('role_permission', 'user_branches.role_id', '=', 'role_permission.role_id')
                    ->join('permissions', 'role_permission.permission_id', '=', 'permissions.id')
                    ->where('permissions.name', $permissionName);
            });
        })->select('id', 'name')->get();
    }

    /**
     * Get query builder for users.
     */
    public function query(): \Illuminate\Database\Eloquent\Builder
    {
        return User::query();
    }

    /**
     * Find user by ID.
     */
    public function find(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * Find user by ID or fail.
     */
    public function findOrFail(int $id): User
    {
        return User::findOrFail($id);
    }

    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Update an existing user.
     */
    public function update(int $id, array $data): User
    {
        $user = $this->findOrFail($id);
        $user->update($data);
        return $user;
    }

    /**
     * Delete a user (soft delete).
     */
    public function delete(int $id): bool
    {
        $user = $this->findOrFail($id);
        return $user->delete();
    }
}
