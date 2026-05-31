<?php

namespace App\Services;

use App\DTOs\ProductDTO;
use App\Models\Product;
use App\Models\User;
use App\Repositories\ProductRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\UserRepository;
use App\Enums\UserPermission;
use Illuminate\Auth\Access\AuthorizationException;

class ProductService
{
    public function __construct(
        protected ProductRepository $repository,
        protected BusinessRepository $businessRepository,
        protected UserRepository $userRepository
    ) {}

    /**
     * Get authorized product by ID.
     */
    public function getAuthorizedProduct(int $id, User $user): Product
    {
        $product = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PRODUCT)) {
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengakses produk ini.');
        }

        return $product;
    }

    /**
     * Create product with authorization and sync business.
     */
    public function create(ProductDTO $dto, User $user): Product
    {
        $data = $dto->toArray();
        $businessIds = $dto->businessIds;

        if ($user->hasPermission(UserPermission::CREATE_ANY_PRODUCT)) {
            // Admin can assign to any business IDs passed in request
        } else if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_PRODUCT)) {
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
        } else if ($user->hasPermission(UserPermission::CREATE_OWN_PRODUCT)) {
            $ownedBusinesses = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (empty($ownedBusinesses)) {
                throw new AuthorizationException('Anda belum memiliki bisnis pribadi.');
            }
            $businessIds = $ownedBusinesses;
        } else {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menambah produk.');
        }

        if (empty($businessIds)) {
            throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
        }

        $product = $this->repository->create($data);
        $product->businesses()->sync($businessIds);

        return $product;
    }

    /**
     * Update product.
     */
    public function update(int $id, ProductDTO $dto, User $user): Product
    {
        $product = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::EDIT_ANY_PRODUCT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::EDIT_OWN_PRODUCT)) {
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah produk ini.');
        }

        $data = $dto->toArray();
        $this->repository->update($id, $data);

        // Update the business association if provided and permitted
        if ($user->hasPermission(UserPermission::EDIT_ANY_PRODUCT)) {
            if ($dto->businessIds !== null) {
                $product->businesses()->sync($dto->businessIds);
            }
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT)) {
            if ($dto->businessIds !== null) {
                $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
                foreach ($dto->businessIds as $bId) {
                    if (!in_array($bId, $associatedBusinessIds)) {
                        throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                    }
                }
                $product->businesses()->sync($dto->businessIds);
            }
        }

        return $product;
    }

    /**
     * Delete product.
     */
    public function delete(int $id, User $user): bool
    {
        $product = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::DELETE_ANY_PRODUCT)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::DELETE_ASSOCIATED_PRODUCT)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::DELETE_OWN_PRODUCT)) {
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus produk ini.');
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

        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT)) {
            $businesses = $this->businessRepository->query()->with('owner')->get();
            $users = $this->userRepository->getUsersByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT)) {
            $businesses = $this->businessRepository->query()
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })->get();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PRODUCT)) {
            $businesses = $this->businessRepository->query()
                ->where('user_id', $user->id)->get();
        }

        return compact('businesses', 'users');
    }
}
