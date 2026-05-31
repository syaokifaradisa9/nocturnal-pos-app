import React from 'react';
import { usePage } from '@inertiajs/react';
import { UserPermission } from '../../types';

interface CheckPermissionProps {
    permissions: UserPermission | UserPermission[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAll?: boolean;
}

export default function CheckPermission({ 
    permissions, 
    children, 
    fallback = null, 
    requireAll = false 
}: CheckPermissionProps) {
    const { props } = usePage();
    const user = props.auth?.user as any;
    const userPermissions: string[] = user?.permissions || [];

    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    
    const hasPermission = requireAll 
        ? requiredPermissions.every(permission => userPermissions.includes(permission))
        : requiredPermissions.some(permission => userPermissions.includes(permission));

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
