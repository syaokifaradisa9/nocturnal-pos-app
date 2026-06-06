<?php

namespace App\Services;

use App\DTOs\UserDTO;
use App\Enums\UserPermission;
use App\Models\User;
use App\Repositories\UserRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\RoleRepository;
use App\Repositories\BranchRepository;
use App\Repositories\PermissionRepository;
use Illuminate\Support\Facades\DB;

class UserService
{
    public function __construct(
        protected UserRepository $repository,
        protected BusinessRepository $businessRepository,
        protected RoleRepository $roleRepository,
        protected BranchRepository $branchRepository,
        protected PermissionRepository $permissionRepository
    ) {}

    /**
     * Create a new user, their business, first branch, and map their role.
     */
    public function create(UserDTO $dto): User
    {
        return DB::transaction(function () use ($dto) {
            // 1. Create User
            $userData = $dto->toUserArray();
            $user = $this->repository->create($userData);

            // 2. Create Business
            $businessData = $dto->toBusinessArray();
            $businessData['user_id'] = $user->id;
            
            // Check if a business with same name already exists (including soft-deleted)
            $existingBusiness = $this->businessRepository->query()
                ->onlyTrashed()
                ->where('name', $businessData['name'])
                ->where('user_id', $user->id)
                ->first();

            if ($existingBusiness) {
                $existingBusiness->restore();
                $existingBusiness->update($businessData);
                $business = $existingBusiness;
            } else {
                $business = $this->businessRepository->create($businessData);
            }

            // 3. Create First Branch
            $branchData = $dto->toBranchArray();
            $branchData['business_id'] = $business->id;
            $branch = $this->branchRepository->create($branchData);

            // 4. Find or create the role based on account_type
            $role = $this->findOrCreateRoleByAccountType($dto->accountType);

            // 5. Link User to Business and Branch with Role
            $user->businesses()->syncWithoutDetaching([$business->id => ['role_id' => $role->id]]);
            $user->branches()->syncWithoutDetaching([$branch->id => ['role_id' => $role->id]]);

            return $user;
        });
    }

    /**
     * Update an existing user, their business, and branch details.
     */
    public function update(int $id, UserDTO $dto): User
    {
        return DB::transaction(function () use ($id, $dto) {
            // 1. Update User
            $userData = $dto->toUserArray();
            $user = $this->repository->update($id, $userData);

            // 2. Find or Create Business owned by this user
            $businessData = $dto->toBusinessArray();
            $businessData['user_id'] = $user->id;

            $business = $this->businessRepository->query()->where('user_id', $user->id)->first();
            if ($business) {
                $business->update($businessData);
            } else {
                $business = $this->businessRepository->create($businessData);
            }

            // 3. Create or Update First Branch
            $branchData = $dto->toBranchArray();
            $branchData['business_id'] = $business->id;

            $branch = $this->branchRepository->query()->where('business_id', $business->id)->first();
            if ($branch) {
                $branch->update($branchData);
            } else {
                $branch = $this->branchRepository->create($branchData);
            }

            // 4. Find or create the role based on account_type
            $role = $this->findOrCreateRoleByAccountType($dto->accountType);

            // 5. Link User to Business and Branch with Role
            $user->businesses()->syncWithoutDetaching([$business->id => ['role_id' => $role->id]]);
            $user->branches()->syncWithoutDetaching([$branch->id => ['role_id' => $role->id]]);

            return $user;
        });
    }

    /**
     * Find or create the role based on requested account type.
     */
    private function findOrCreateRoleByAccountType(string $accountType): \App\Models\Role
    {
        if ($accountType === 'pebisnis') {
            $role = $this->roleRepository->findByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
            if (!$role) {
                $role = $this->roleRepository->firstOrCreate('Pebisnis', [
                    'description' => 'Role Pebisnis dengan izin melihat data bisnis pribadi'
                ]);
                $permission = $this->permissionRepository->findByName(UserPermission::VIEW_OWN_BUSINESS->value);
                if ($permission) {
                    $role->permissions()->syncWithoutDetaching([$permission->id]);
                }
            }
            return $role;
        }

        if ($accountType === 'owner_bisnis') {
            $role = $this->roleRepository->query()->whereHas('permissions', function($q) {
                $q->where('name', UserPermission::VIEW_OWN_BRANCH->value);
            })->whereDoesntHave('permissions', function($q) {
                $q->where('name', UserPermission::VIEW_OWN_BUSINESS->value);
            })->first();

            if (!$role) {
                $role = $this->roleRepository->firstOrCreate('Owner Bisnis', [
                    'description' => 'Role Owner Bisnis dengan izin melihat data cabang pribadi'
                ]);
                $permission = $this->permissionRepository->findByName(UserPermission::VIEW_OWN_BRANCH->value);
                if ($permission) {
                    $role->permissions()->syncWithoutDetaching([$permission->id]);
                }
            }
            return $role;
        }

        // Default to owner_cabang
        $role = $this->roleRepository->query()->whereHas('permissions', function($q) {
            $q->where('name', UserPermission::VIEW_OWN_PRODUCT->value);
        })->whereDoesntHave('permissions', function($q) {
            $q->whereIn('name', [UserPermission::VIEW_OWN_BUSINESS->value, UserPermission::VIEW_OWN_BRANCH->value]);
        })->first();

        if (!$role) {
            $role = $this->roleRepository->firstOrCreate('Owner Cabang', [
                'description' => 'Role Owner Cabang dengan izin melihat data produk pribadi'
            ]);
            $permission = $this->permissionRepository->findByName(UserPermission::VIEW_OWN_PRODUCT->value);
            if ($permission) {
                $role->permissions()->syncWithoutDetaching([$permission->id]);
            }
        }
        return $role;
    }

    /**
     * Delete a user and their associated business.
     */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $user = $this->repository->findOrFail($id);

            // Soft-delete businesses owned by this user
            $businesses = $this->businessRepository->query()->where('user_id', $user->id)->get();
            foreach ($businesses as $b) {
                $b->delete();
            }

            return $this->repository->delete($id);
        });
    }
}
