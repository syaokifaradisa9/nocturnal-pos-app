<?php

namespace App\Services;

use App\DTOs\SupplierDTO;
use App\Models\Supplier;
use App\Models\User;
use App\Repositories\SupplierRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\UserRepository;
use App\Enums\UserPermission;
use Illuminate\Auth\Access\AuthorizationException;

class SupplierService
{
    public function __construct(
        protected SupplierRepository $repository,
        protected BusinessRepository $businessRepository,
        protected UserRepository $userRepository
    ) {}

    /**
     * Get authorized supplier by ID.
     */
    public function getAuthorizedSupplier(int $id, User $user): Supplier
    {
        $supplier = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::VIEW_ANY_SUPPLIER)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_SUPPLIER)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $supplierBusinessIds = $supplier->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $supplierBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_SUPPLIER)) {
            $supplierBusinessIds = $supplier->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $supplierBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengakses supplier ini.');
        }

        return $supplier;
    }

    /**
     * Create supplier with authorization and sync business.
     */
    public function create(SupplierDTO $dto, User $user): Supplier
    {
        $data = $dto->toArray();
        $businessIds = $dto->businessIds;

        if ($user->hasPermission(UserPermission::CREATE_ANY_SUPPLIER)) {
            // Admin can assign to any business IDs passed in request
        } else if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_SUPPLIER)) {
            $associatedBusinesses = $user->businesses()->pluck('businesses.id')->toArray();
            if (empty($associatedBusinesses)) {
                throw new AuthorizationException('Anda tidak terasosiasi dengan bisnis apapun.');
            }

            if (empty($businessIds)) {
                if (count($associatedBusinesses) === 1) {
                    $businessIds = [$associatedBusinesses[0]];
                } else {
                    throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
                }
            } else {
                foreach ($businessIds as $bId) {
                    if (!in_array($bId, $associatedBusinesses)) {
                        throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                    }
                }
            }
        } else if ($user->hasPermission(UserPermission::CREATE_OWN_SUPPLIER)) {
            $ownedBusinesses = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (empty($ownedBusinesses)) {
                throw new AuthorizationException('Anda belum memiliki bisnis pribadi.');
            }
            $businessIds = $ownedBusinesses;
        } else {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menambah supplier.');
        }

        if (empty($businessIds)) {
            throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
        }

        $supplier = $this->repository->create($data);
        $supplier->businesses()->sync($businessIds);

        return $supplier;
    }

    /**
     * Update supplier.
     */
    public function update(int $id, SupplierDTO $dto, User $user): Supplier
    {
        $supplier = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::EDIT_ANY_SUPPLIER)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_SUPPLIER)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $supplierBusinessIds = $supplier->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $supplierBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::EDIT_OWN_SUPPLIER)) {
            $supplierBusinessIds = $supplier->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $supplierBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah supplier ini.');
        }

        $data = $dto->toArray();
        $this->repository->update($id, $data);

        // Update the business association if provided and permitted
        if ($user->hasPermission(UserPermission::EDIT_ANY_SUPPLIER)) {
            if ($dto->businessIds !== null) {
                $supplier->businesses()->sync($dto->businessIds);
            }
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_SUPPLIER)) {
            if ($dto->businessIds !== null) {
                $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
                foreach ($dto->businessIds as $bId) {
                    if (!in_array($bId, $associatedBusinessIds)) {
                        throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                    }
                }
                $supplier->businesses()->sync($dto->businessIds);
            }
        }

        return $supplier;
    }

    /**
     * Delete supplier.
     */
    public function delete(int $id, User $user): bool
    {
        $supplier = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::DELETE_ANY_SUPPLIER)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::DELETE_ASSOCIATED_SUPPLIER)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $supplierBusinessIds = $supplier->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $supplierBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::DELETE_OWN_SUPPLIER)) {
            $supplierBusinessIds = $supplier->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $supplierBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus supplier ini.');
        }

        return $this->repository->delete($id);
    }

    /**
     * Get selection data for form.
     */
    public function getSelectionData(User $user): array
    {
        $businesses = [];
        $users = [];

        if ($user->hasPermission(UserPermission::VIEW_ANY_SUPPLIER)) {
            $businesses = $this->businessRepository->query()->with('owner')->get();
            $users = $this->userRepository->getUsersByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_SUPPLIER)) {
            $businesses = $this->businessRepository->query()
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })->get();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_SUPPLIER)) {
            $businesses = $this->businessRepository->query()
                ->where('user_id', $user->id)->get();
        }

        return compact('businesses', 'users');
    }

    /**
     * Get businesses by User ID.
     */
    public function getBusinessesByUserId(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->businessRepository->query()->where('user_id', $userId)->get();
    }
}
