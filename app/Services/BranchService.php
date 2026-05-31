<?php

namespace App\Services;

use App\DTOs\BranchDTO;
use App\Enums\UserPermission;
use App\Models\Branch;
use App\Models\Business;
use App\Models\User;
use App\Repositories\BranchRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\UserRepository;
use Illuminate\Auth\Access\AuthorizationException;

class BranchService
{
    public function __construct(
        protected BranchRepository $repository,
        protected BusinessRepository $businessRepository,
        protected UserRepository $userRepository
    ) {}

    /**
     * Get a query builder with permissions applied.
     */
    public function getFilteredQuery(User $user)
    {
        $query = $this->repository->query();

        if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH)) {
            return $query;
        }

        if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            return $query->whereIn('business_id', $associatedBusinessIds);
        }

        if ($user->hasPermission(UserPermission::VIEW_OWN_BRANCH)) {
            return $query->whereHas('business', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        throw new AuthorizationException('Anda tidak memiliki izin untuk melihat data cabang.');
    }

    /**
     * Get a branch if authorized.
     */
    public function getAuthorizedBranch(int $id, User $user): Branch
    {
        $branch = $this->repository->findOrFail($id);

        if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH)) {
            return $branch;
        }

        if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($branch->business_id, $associatedBusinessIds)) {
                return $branch;
            }
        }

        if ($user->hasPermission(UserPermission::VIEW_OWN_BRANCH)) {
            if ($branch->business && $branch->business->user_id === $user->id) {
                return $branch;
            }
        }

        throw new AuthorizationException('Anda tidak memiliki izin untuk melihat cabang ini.');
    }

    /**
     * Create a new branch.
     */
    public function create(BranchDTO $dto, User $user): Branch
    {
        if (!$user->hasPermission(UserPermission::CREATE_ANY_BRANCH) &&
            !$user->hasPermission(UserPermission::CREATE_ASSOCIATED_BRANCH) &&
            !$user->hasPermission(UserPermission::CREATE_OWN_BRANCH)) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menambah cabang.');
        }

        $data = $dto->toArray();

        if ($user->hasPermission(UserPermission::CREATE_ANY_BRANCH)) {
            // Keseluruhan: business_id must be provided in request
        } else if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_BRANCH)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (count($associatedBusinessIds) === 1) {
                $data['business_id'] = $associatedBusinessIds[0];
            } else {
                if (!in_array($data['business_id'] ?? null, $associatedBusinessIds)) {
                    throw new AuthorizationException('Bisnis yang dipilih tidak berasosiasi dengan Anda.');
                }
            }
        } else {
            // CREATE_OWN_BRANCH (Pribadi)
            $ownedBusiness = $this->businessRepository->query()->where('user_id', $user->id)->first();
            if (!$ownedBusiness) {
                throw new AuthorizationException('Anda belum memiliki bisnis pribadi.');
            }
            $data['business_id'] = $ownedBusiness->id;
        }

        if (empty($data['business_id'])) {
            throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
        }

        return $this->repository->create($data);
    }

    /**
     * Update branch if authorized.
     */
    public function update(int $id, BranchDTO $dto, User $user): Branch
    {
        $branch = $this->repository->findOrFail($id);

        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::EDIT_ANY_BRANCH)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_BRANCH)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($branch->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::EDIT_OWN_BRANCH)) {
            if ($branch->business && $branch->business->user_id === $user->id) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah cabang ini.');
        }

        $data = $dto->toArray();

        // Enforce the same scoping for the business ID during update if not ANY
        if (!$user->hasPermission(UserPermission::EDIT_ANY_BRANCH)) {
            // Keep existing business_id or force check
            $data['business_id'] = $branch->business_id;
        }

        return $this->repository->update($id, $data);
    }

    /**
     * Delete branch if authorized.
     */
    public function delete(int $id, User $user): bool
    {
        $branch = $this->repository->findOrFail($id);

        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::DELETE_ANY_BRANCH)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::DELETE_ASSOCIATED_BRANCH)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($branch->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::DELETE_OWN_BRANCH)) {
            if ($branch->business && $branch->business->user_id === $user->id) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus cabang ini.');
        }

        return $this->repository->delete($id);
    }

    /**
     * Get businesses and users selection data based on permission.
     */
    public function getSelectionData(User $user): array
    {
        $businesses = [];
        $users = [];

        if ($user->hasPermission(UserPermission::VIEW_ANY_BRANCH)) {
            $businesses = $this->businessRepository->query()->with('owner')->get();
            $users = $this->userRepository->getUsersByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_BRANCH)) {
            $businesses = $this->businessRepository->query()
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })->get();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_BRANCH)) {
            $businesses = $this->businessRepository->query()
                ->where('user_id', $user->id)->get();
        }

        return compact('businesses', 'users');
    }
}
