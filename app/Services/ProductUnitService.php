<?php

namespace App\Services;

use App\DTOs\ProductUnitDTO;
use App\Models\ProductUnit;
use App\Models\User;
use App\Repositories\ProductUnitRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\UserRepository;
use App\Enums\UserPermission;
use Illuminate\Auth\Access\AuthorizationException;

class ProductUnitService
{
    public function __construct(
        protected ProductUnitRepository $repository,
        protected BusinessRepository $businessRepository,
        protected UserRepository $userRepository
    ) {}

    /**
     * Get authorized product unit by ID.
     */
    public function getAuthorizedProductUnit(int $id, User $user): ProductUnit
    {
        $unit = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($unit->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_UNIT)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (in_array($unit->business_id, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengakses satuan produk ini.');
        }

        return $unit;
    }

    /**
     * Create product unit with authorization.
     */
    public function create(ProductUnitDTO $dto, User $user): ProductUnit
    {
        $data = $dto->toArray();
        $businessId = $dto->businessId;

        if ($user->hasPermission(UserPermission::CREATE_ANY_PRODUCT_UNIT)) {
            // Admin can assign to any business ID passed in request
        } else if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_PRODUCT_UNIT)) {
            $associatedBusinesses = $user->businesses()->pluck('businesses.id')->toArray();
            if (empty($associatedBusinesses)) {
                throw new AuthorizationException('Anda tidak terasosiasi dengan bisnis apapun.');
            }

            if (!$businessId) {
                if (count($associatedBusinesses) === 1) {
                    $businessId = $associatedBusinesses[0];
                } else {
                    throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
                }
            } else {
                if (!in_array($businessId, $associatedBusinesses)) {
                    throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                }
            }
        } else if ($user->hasPermission(UserPermission::CREATE_OWN_PRODUCT_UNIT)) {
            $ownedBusinesses = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (empty($ownedBusinesses)) {
                throw new AuthorizationException('Anda belum memiliki bisnis pribadi.');
            }

            if (!$businessId) {
                if (count($ownedBusinesses) === 1) {
                    $businessId = $ownedBusinesses[0];
                } else {
                    throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
                }
            } else {
                if (!in_array($businessId, $ownedBusinesses)) {
                    throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                }
            }
        } else {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menambah satuan produk.');
        }

        if (!$businessId) {
            throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
        }

        $data['business_id'] = $businessId;
        return $this->repository->create($data);
    }

    /**
     * Update product unit.
     */
    public function update(int $id, ProductUnitDTO $dto, User $user): ProductUnit
    {
        $unit = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::EDIT_ANY_PRODUCT_UNIT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT_UNIT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($unit->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::EDIT_OWN_PRODUCT_UNIT)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (in_array($unit->business_id, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah satuan produk ini.');
        }

        $data = $dto->toArray();

        // Check if editing business_id is permitted and valid
        $businessId = $dto->businessId;
        if ($businessId !== $unit->business_id) {
            if ($user->hasPermission(UserPermission::EDIT_ANY_PRODUCT_UNIT)) {
                // Allowed
            } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT_UNIT)) {
                $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
                if (!in_array($businessId, $associatedBusinessIds)) {
                    throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                }
            } else if ($user->hasPermission(UserPermission::EDIT_OWN_PRODUCT_UNIT)) {
                $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
                if (!in_array($businessId, $ownedBusinessIds)) {
                    throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                }
            } else {
                throw new AuthorizationException('Anda tidak memiliki izin untuk memindahkan satuan produk ke bisnis lain.');
            }
        }

        $this->repository->update($id, $data);
        return $unit;
    }

    /**
     * Delete product unit.
     */
    public function delete(int $id, User $user): bool
    {
        $unit = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::DELETE_ANY_PRODUCT_UNIT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::DELETE_ASSOCIATED_PRODUCT_UNIT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($unit->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::DELETE_OWN_PRODUCT_UNIT)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (in_array($unit->business_id, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus satuan produk ini.');
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

        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_UNIT)) {
            $businesses = $this->businessRepository->query()->with('owner')->get();
            $users = $this->userRepository->getUsersByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_UNIT)) {
            $businesses = $this->businessRepository->query()
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })->get();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_UNIT)) {
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
