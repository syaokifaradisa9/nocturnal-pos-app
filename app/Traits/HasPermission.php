<?php

namespace App\Traits;

use App\Models\Permission;
use Illuminate\Support\Collection;

trait HasPermission
{
    /**
     * Check if the role has any of the given permissions.
     *
     * @param  mixed  $permissions
     * @return bool
     */
    public function hasPermissions($permissions): bool
    {
        if ($permissions instanceof Collection) {
            $permissions = $permissions->toArray();
        }
        if (!is_array($permissions)) {
            $permissions = [$permissions];
        }

        $rolePermissions = $this->permissions()->pluck('name', 'id');

        foreach ($permissions as $permission) {
            if ($permission instanceof Permission) {
                if ($rolePermissions->has($permission->id)) {
                    return true;
                }
            } elseif (is_numeric($permission)) {
                if ($rolePermissions->has((int) $permission)) {
                    return true;
                }
            } elseif (is_string($permission)) {
                if ($rolePermissions->contains($permission)) {
                    return true;
                }
            }
        }

        return false;
    }

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

        $this->permissions()->syncWithoutDetaching($permissionIds);
        return $this;
    }

    /**
     * Alias to support user typo assignPermisisons.
     *
     * @param  mixed  $permissions
     * @return $this
     */
    public function assignPermisisons($permissions): self
    {
        return $this->assignPermissions($permissions);
    }
}
