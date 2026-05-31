<?php

namespace App\Traits;

use App\Enums\UserPermission;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

trait HasRole
{
    /**
     * Check if the user has any of the given roles.
     *
     * @param  mixed  $roles
     * @return bool
     */
    public function hasRoles($roles): bool
    {
        if ($roles instanceof Collection) {
            $roles = $roles->toArray();
        }
        if (!is_array($roles)) {
            $roles = [$roles];
        }

        $businessRoles = DB::table('business_users')
            ->where('user_id', $this->id)
            ->join('roles', 'business_users.role_id', '=', 'roles.id')
            ->select('roles.name', 'roles.id')
            ->get();

        $branchRoles = DB::table('user_branches')
            ->where('user_id', $this->id)
            ->join('roles', 'user_branches.role_id', '=', 'roles.id')
            ->select('roles.name', 'roles.id')
            ->get();

        $userRoles = $businessRoles->concat($branchRoles);

        foreach ($roles as $role) {
            foreach ($userRoles as $userRole) {
                if ($role instanceof Role && $userRole->id === $role->id) {
                    return true;
                }
                if (is_numeric($role) && $userRole->id == $role) {
                    return true;
                }
                if (is_string($role) && $userRole->name === $role) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Assign roles to the user in a business or branch context.
     *
     * @param  mixed  $roles
     * @param  int|null  $businessId
     * @param  int|null  $branchId
     * @return $this
     */
    public function assignRoles($roles, ?int $businessId = null, ?int $branchId = null): self
    {
        if ($roles instanceof Collection) {
            $roles = $roles->toArray();
        }
        $roles = is_array($roles) ? $roles : [$roles];

        $roleIds = array_filter(array_map(function ($role) {
            if ($role instanceof Role) {
                return $role->id;
            }
            if (is_numeric($role)) {
                return (int) $role;
            }
            return Role::where('name', $role)->value('id');
        }, $roles));

        if ($businessId) {
            foreach ($roleIds as $roleId) {
                DB::table('business_users')->updateOrInsert([
                    'user_id' => $this->id,
                    'business_id' => $businessId,
                    'role_id' => $roleId,
                ]);
            }
        }

        if ($branchId) {
            foreach ($roleIds as $roleId) {
                DB::table('user_branches')->updateOrInsert([
                    'user_id' => $this->id,
                    'branch_id' => $branchId,
                    'role_id' => $roleId,
                ]);
            }
        }

        return $this;
    }

    /**
     * Sync roles for the user in a business or branch context.
     *
     * @param  mixed  $roles
     * @param  int|null  $businessId
     * @param  int|null  $branchId
     * @return $this
     */
    public function syncRoles($roles, ?int $businessId = null, ?int $branchId = null): self
    {
        if ($roles instanceof Collection) {
            $roles = $roles->toArray();
        }
        $roles = is_array($roles) ? $roles : [$roles];

        $roleIds = array_filter(array_map(function ($role) {
            if ($role instanceof Role) {
                return $role->id;
            }
            if (is_numeric($role)) {
                return (int) $role;
            }
            return Role::where('name', $role)->value('id');
        }, $roles));

        if ($businessId) {
            DB::table('business_users')
                ->where('user_id', $this->id)
                ->where('business_id', $businessId)
                ->delete();

            foreach ($roleIds as $roleId) {
                DB::table('business_users')->insert([
                    'user_id' => $this->id,
                    'business_id' => $businessId,
                    'role_id' => $roleId,
                ]);
            }
        }

        if ($branchId) {
            DB::table('user_branches')
                ->where('user_id', $this->id)
                ->where('branch_id', $branchId)
                ->delete();

            foreach ($roleIds as $roleId) {
                DB::table('user_branches')->insert([
                    'user_id' => $this->id,
                    'branch_id' => $branchId,
                    'role_id' => $roleId,
                ]);
            }
        }

        return $this;
    }

    /**
     * The direct permissions relationship.
     */
    public function directPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permission');
    }

    /**
     * Assign direct permissions to the user.
     *
     * @param  mixed  $permissions
     * @return $this
     */
    public function assignPermissions($permissions): self
    {
        if ($permissions instanceof Collection) {
            $permissions = $permissions->toArray();
        }
        $permissions = is_array($permissions) ? $permissions : [$permissions];

        $permissionIds = array_filter(array_map(function ($permission) {
            if ($permission instanceof Permission) {
                return $permission->id;
            }
            if (is_numeric($permission)) {
                return (int) $permission;
            }
            return Permission::where('name', $permission)->value('id');
        }, $permissions));

        $this->directPermissions()->syncWithoutDetaching($permissionIds);
        return $this;
    }

    /**
     * Sync direct permissions for the user.
     *
     * @param  mixed  $permissions
     * @return $this
     */
    public function syncPermissions($permissions): self
    {
        if ($permissions instanceof Collection) {
            $permissions = $permissions->toArray();
        }
        $permissions = is_array($permissions) ? $permissions : [$permissions];

        $permissionIds = array_filter(array_map(function ($permission) {
            if ($permission instanceof Permission) {
                return $permission->id;
            }
            if (is_numeric($permission)) {
                return (int) $permission;
            }
            return Permission::where('name', $permission)->value('id');
        }, $permissions));

        $this->directPermissions()->sync($permissionIds);
        return $this;
    }

    /**
     * Get all roles associated with the user across businesses and branches.
     *
     * @return Collection
     */
    public function getRoles(): Collection
    {
        $businessRoles = Role::select('roles.id', 'roles.name', 'roles.description')
            ->join('business_users', 'roles.id', '=', 'business_users.role_id')
            ->where('business_users.user_id', $this->id);

        $branchRoles = Role::select('roles.id', 'roles.name', 'roles.description')
            ->join('user_branches', 'roles.id', '=', 'user_branches.role_id')
            ->where('user_branches.user_id', $this->id);

        return $businessRoles->union($branchRoles)->get();
    }

    /**
     * Get all permissions associated with the user (both direct and role-inherited).
     *
     * @return Collection
     */
    public function permissions(): Collection
    {
        $direct = Permission::select('permissions.name', 'permissions.description')
            ->join('user_permission', 'permissions.id', '=', 'user_permission.permission_id')
            ->where('user_permission.user_id', $this->id);

        $roleBased = Permission::select('permissions.name', 'permissions.description')
            ->join('role_permission', 'permissions.id', '=', 'role_permission.permission_id')
            ->join('roles', 'role_permission.role_id', '=', 'roles.id')
            ->whereIn('roles.id', function ($query) {
                $query->select('role_id')
                    ->from('business_users')
                    ->where('user_id', $this->id)
                    ->union(
                        DB::table('user_branches')
                            ->select('role_id')
                            ->where('user_id', $this->id)
                    );
            });

        return $direct->union($roleBased)->get();
    }

    /**
     * Get all permissions associated with the user (both direct and role-inherited).
     *
     * @return Collection
     */
    public function getPermissions(): Collection
    {
        return $this->permissions();
    }

    /**
     * Alias to support user typo getPermisisons.
     *
     * @return Collection
     */
    public function getPermisisons(): Collection
    {
        return $this->permissions();
    }

    /**
     * Check if the user has a specific permission.
     */
    public function hasPermission(string|UserPermission $permission): bool
    {
        $name = $permission instanceof UserPermission ? $permission->value : $permission;
        return $this->permissions()->pluck('name')->contains($name);
    }
}
