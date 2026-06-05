<?php

namespace App\Services;

use App\DTOs\BusinessDTO;
use App\Enums\UserPermission;
use App\Models\Business;
use App\Models\User;
use App\Repositories\BusinessRepository;
use App\Repositories\RoleRepository;
use App\Repositories\UserRepository;
use Illuminate\Auth\Access\AuthorizationException;

class BusinessService
{
    public function __construct(
        protected BusinessRepository $repository,
        protected RoleRepository $roleRepository,
        protected UserRepository $userRepository
    ) {}

    /**
     * Get a business if authorized.
     */
    public function getAuthorizedBusiness(int $id, User $user): Business
    {
        $business = $this->repository->findOrFail($id);

        if ($user->hasPermission(UserPermission::VIEW_ANY_BUSINESS)) {
            return $business;
        }

        if ($user->hasPermission(UserPermission::VIEW_OWN_BUSINESS) && $business->user_id === $user->id) {
            return $business;
        }

        throw new AuthorizationException('Anda tidak memiliki izin untuk melihat bisnis ini.');
    }

    /**
     * Create a new business and link to creator.
     */
    public function create(BusinessDTO $dto, User $user): Business
    {
        if (!$user->hasPermission(UserPermission::CREATE_ANY_BUSINESS) && !$user->hasPermission(UserPermission::CREATE_OWN_BUSINESS)) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menambah bisnis.');
        }

        $data = $dto->toArray();

        if (!$user->hasPermission(UserPermission::CREATE_ANY_BUSINESS)) {
            $data['user_id'] = $user->id;
        }

        $userId = $data['user_id'] ?? null;
        $existingTrashed = $this->repository->query()
            ->onlyTrashed()
            ->where('name', $data['name'])
            ->where('user_id', $userId)
            ->first();

        if ($existingTrashed) {
            $existingTrashed->restore();
            $existingTrashed->update($data);
            $business = $existingTrashed;
        } else {
            $business = $this->repository->create($data);
        }

        // Associate owner (or creator if global) to the new business with role that has VIEW_OWN_BUSINESS permission
        $role = $this->roleRepository->findByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        if ($role) {
            $ownerId = $business->user_id ?? $user->id;
            $owner = User::find($ownerId);
            if ($owner) {
                $owner->businesses()->syncWithoutDetaching([$business->id => ['role_id' => $role->id]]);
            }
        }

        return $business;
    }

    /**
     * Update business if authorized.
     */
    public function update(int $id, BusinessDTO $dto, User $user): Business
    {
        $business = $this->repository->findOrFail($id);

        if ($user->hasPermission(UserPermission::EDIT_ANY_BUSINESS)) {
            $data = $dto->toArray();
            $updated = $this->repository->update($id, $data);
            $this->syncOwnerRole($updated);
            return $updated;
        }

        if ($user->hasPermission(UserPermission::EDIT_OWN_BUSINESS) && $business->user_id === $user->id) {
            $data = $dto->toArray();
            $data['user_id'] = $user->id;
            $updated = $this->repository->update($id, $data);
            $this->syncOwnerRole($updated);
            return $updated;
        }

        throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah bisnis ini.');
    }

    /**
     * Soft delete business if authorized.
     */
    public function delete(int $id, User $user): bool
    {
        $business = $this->repository->findOrFail($id);

        if ($user->hasPermission(UserPermission::DELETE_ANY_BUSINESS)) {
            return $this->repository->delete($id);
        }

        if ($user->hasPermission(UserPermission::DELETE_OWN_BUSINESS) && $business->user_id === $user->id) {
            return $this->repository->delete($id);
        }

        throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus bisnis ini.');
    }

    /**
     * Get users who have the VIEW_OWN_BUSINESS permission.
     */
    public function getUsersWithViewOwnPermission()
    {
        return $this->userRepository->getUsersByPermission(
            UserPermission::VIEW_OWN_BUSINESS->value
        );
    }

    /**
     * Ensure the business owner is associated with the role that has VIEW_OWN_BUSINESS permission.
     */
    private function syncOwnerRole(Business $business): void
    {
        if (!$business->user_id) {
            return;
        }

        $role = $this->roleRepository->findByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        if (!$role) {
            return;
        }

        $owner = $business->owner;
        if (!$owner) {
            return;
        }

        // Sync the owner's association with this business using the correct role
        $owner->businesses()->syncWithoutDetaching([$business->id => ['role_id' => $role->id]]);
    }
}
