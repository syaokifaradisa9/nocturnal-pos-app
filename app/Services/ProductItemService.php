<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use App\Repositories\ProductRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\UserRepository;
use App\Enums\UserPermission;
use Illuminate\Auth\Access\AuthorizationException;

class ProductItemService
{
    public function __construct(
        protected ProductRepository $repository,
        protected BusinessRepository $businessRepository,
        protected UserRepository $userRepository,
        protected ProductCatalogService $catalogService
    ) {}

    /**
     * Get authorized product by ID.
     */
    public function getAuthorizedProduct(int $id, User $user): Product
    {
        $product = $this->repository->findOrFail($id);
        $product->load(['items.measurementUnit', 'businesses']);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_ITEM)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_ITEM)) {
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
     * Create product item.
     */
    public function create(array $payload, User $user): Product
    {
        $businessIds = $payload['business_ids'] ?? [];

        // If no business_ids provided, resolve from the selected product's existing associations
        if (empty($businessIds) && !empty($payload['product_id'])) {
            $product = $this->repository->findOrFail($payload['product_id']);
            $businessIds = $product->businesses()->pluck('businesses.id')->toArray();
        }

        if ($user->hasPermission(UserPermission::CREATE_ANY_PRODUCT_ITEM)) {
            // Admin can assign to any business IDs
        } else if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_PRODUCT_ITEM)) {
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
        } else if ($user->hasPermission(UserPermission::CREATE_OWN_PRODUCT_ITEM)) {
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

        $payload['business_ids'] = $businessIds;

        return $this->catalogService->storeProduct($payload);
    }

    /**
     * Update product item.
     */
    public function update(int $id, array $payload, User $user): Product
    {
        $product = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::EDIT_ANY_PRODUCT_ITEM)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT_ITEM)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::EDIT_OWN_PRODUCT_ITEM)) {
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah produk ini.');
        }

        $businessIds = $payload['business_ids'] ?? null;
        $resolvedBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();

        if ($user->hasPermission(UserPermission::EDIT_ANY_PRODUCT_ITEM)) {
            if ($businessIds !== null) {
                $resolvedBusinessIds = $businessIds;
            }
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_PRODUCT_ITEM)) {
            if ($businessIds !== null) {
                $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
                foreach ($businessIds as $bId) {
                    if (!in_array($bId, $associatedBusinessIds)) {
                        throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                    }
                }
                $resolvedBusinessIds = $businessIds;
            }
        }

        $payload['business_ids'] = $resolvedBusinessIds;

        return $this->catalogService->updateProduct($product, $payload);
    }

    /**
     * Delete product.
     */
    public function delete(int $id, User $user): bool
    {
        $product = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::DELETE_ANY_PRODUCT_ITEM)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::DELETE_ASSOCIATED_PRODUCT_ITEM)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            if (array_intersect($associatedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::DELETE_OWN_PRODUCT_ITEM)) {
            $productBusinessIds = $product->businesses()->pluck('businesses.id')->toArray();
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (array_intersect($ownedBusinessIds, $productBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus produk ini.');
        }

        // Under transactional security, delete the items as well
        $product->items()->delete();
        return $this->repository->delete($id);
    }

    /**
     * Get selection data for form.
     */
    public function getSelectionData(User $user): array
    {
        $businesses = [];
        $users = [];

        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_ITEM)) {
            $businesses = $this->businessRepository->query()->with('owner')->get();
            $users = $this->userRepository->getUsersByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_PRODUCT_ITEM)) {
            $businesses = $this->businessRepository->query()
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })->get();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_PRODUCT_ITEM)) {
            $businesses = $this->businessRepository->query()
                ->where('user_id', $user->id)->get();
        }

        $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
        $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
        $allAccessibleBusinessIds = array_unique(array_merge($associatedBusinessIds, $ownedBusinessIds));

        if ($user->hasPermission(UserPermission::VIEW_ANY_PRODUCT_ITEM)) {
            $productUnits = \App\Models\ProductUnit::all();
            $products = \App\Models\Product::all();
        } else {
            $productUnits = \App\Models\ProductUnit::whereIn('business_id', $allAccessibleBusinessIds)->get();
            $products = \App\Models\Product::whereHas('businesses', function ($sub) use ($allAccessibleBusinessIds) {
                $sub->whereIn('businesses.id', $allAccessibleBusinessIds);
            })->get();
        }

        return compact('businesses', 'users', 'productUnits', 'products');
    }

    /**
     * Get businesses by User ID.
     */
    public function getBusinessesByUserId(int $userId): \Illuminate\Database\Eloquent\Collection
    {
        return $this->businessRepository->query()->where('user_id', $userId)->get();
    }

    /**
     * Get products by Business ID.
     */
    public function getProductsByBusinessId(int $businessId): \Illuminate\Database\Eloquent\Collection
    {
        return \App\Models\Product::whereHas('businesses', function ($q) use ($businessId) {
            $q->where('businesses.id', $businessId);
        })->select('id', 'name')->get();
    }
}

