<?php

namespace App\Services;

use App\DTOs\CustomerDTO;
use App\Models\Customer;
use App\Models\User;
use App\Repositories\CustomerRepository;
use App\Repositories\BusinessRepository;
use App\Repositories\UserRepository;
use App\Enums\UserPermission;
use Illuminate\Auth\Access\AuthorizationException;

class CustomerService
{
    public function __construct(
        protected CustomerRepository $repository,
        protected BusinessRepository $businessRepository,
        protected UserRepository $userRepository
    ) {}

    /**
     * Get authorized customer by ID.
     */
    public function getAuthorizedCustomer(int $id, User $user): Customer
    {
        $customer = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::VIEW_ANY_CUSTOMER)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_CUSTOMER)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($customer->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_CUSTOMER)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (in_array($customer->business_id, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengakses customer ini.');
        }

        return $customer;
    }

    /**
     * Create customer with authorization.
     */
    public function create(CustomerDTO $dto, User $user): Customer
    {
        $data = $dto->toArray();
        $businessId = $dto->businessId;

        if ($user->hasPermission(UserPermission::CREATE_ANY_CUSTOMER)) {
            // Admin can assign to any business ID passed in request
        } else if ($user->hasPermission(UserPermission::CREATE_ASSOCIATED_CUSTOMER)) {
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
        } else if ($user->hasPermission(UserPermission::CREATE_OWN_CUSTOMER)) {
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
            throw new AuthorizationException('Anda tidak memiliki izin untuk menambah customer.');
        }

        if (!$businessId) {
            throw new \InvalidArgumentException('Bisnis wajib ditentukan.');
        }

        $data['business_id'] = $businessId;
        return $this->repository->create($data);
    }

    /**
     * Update customer.
     */
    public function update(int $id, CustomerDTO $dto, User $user): Customer
    {
        $customer = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::EDIT_ANY_CUSTOMER)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_CUSTOMER)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($customer->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::EDIT_OWN_CUSTOMER)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (in_array($customer->business_id, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk mengubah customer ini.');
        }

        $data = $dto->toArray();

        // Check if editing business_id is permitted and valid
        $businessId = $dto->businessId;
        if ($businessId !== $customer->business_id) {
            if ($user->hasPermission(UserPermission::EDIT_ANY_CUSTOMER)) {
                // Allowed
            } else if ($user->hasPermission(UserPermission::EDIT_ASSOCIATED_CUSTOMER)) {
                $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
                if (!in_array($businessId, $associatedBusinessIds)) {
                    throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                }
            } else if ($user->hasPermission(UserPermission::EDIT_OWN_CUSTOMER)) {
                $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
                if (!in_array($businessId, $ownedBusinessIds)) {
                    throw new AuthorizationException('Bisnis yang dipilih tidak valid untuk akun Anda.');
                }
            } else {
                throw new AuthorizationException('Anda tidak memiliki izin untuk memindahkan customer ke bisnis lain.');
            }
        }

        $this->repository->update($id, $data);
        return $customer;
    }

    /**
     * Delete customer.
     */
    public function delete(int $id, User $user): bool
    {
        $customer = $this->repository->findOrFail($id);
        $isAuthorized = false;

        if ($user->hasPermission(UserPermission::DELETE_ANY_CUSTOMER)) {
            $isAuthorized = true;
        } else if ($user->hasPermission(UserPermission::DELETE_ASSOCIATED_CUSTOMER)) {
            $associatedBusinessIds = $user->businesses()->pluck('businesses.id')->toArray();
            if (in_array($customer->business_id, $associatedBusinessIds)) {
                $isAuthorized = true;
            }
        } else if ($user->hasPermission(UserPermission::DELETE_OWN_CUSTOMER)) {
            $ownedBusinessIds = $this->businessRepository->query()->where('user_id', $user->id)->pluck('id')->toArray();
            if (in_array($customer->business_id, $ownedBusinessIds)) {
                $isAuthorized = true;
            }
        }

        if (!$isAuthorized) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk menghapus customer ini.');
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

        if ($user->hasPermission(UserPermission::VIEW_ANY_CUSTOMER)) {
            $businesses = $this->businessRepository->query()->with('owner')->get();
            $users = $this->userRepository->getUsersByPermission(UserPermission::VIEW_OWN_BUSINESS->value);
        } else if ($user->hasPermission(UserPermission::VIEW_ASSOCIATED_CUSTOMER)) {
            $businesses = $this->businessRepository->query()
                ->whereHas('users', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                })->get();
        } else if ($user->hasPermission(UserPermission::VIEW_OWN_CUSTOMER)) {
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
