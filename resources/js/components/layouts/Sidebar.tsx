import React from 'react';
import { 
    LayoutDashboard, 
    Store,
    Building,
    ChevronLeft,
    ShoppingBag,
    Truck,
    ShieldCheck,
    Users,
    Scale,
    Gift,
    Package,
    ClipboardCheck,
    ClipboardList
} from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { UserPermission } from '../../types';

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }: SidebarProps) {
    const { url, props } = usePage();
    
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const savedScrollTop = sessionStorage.getItem('sidebar-scroll-top');
        if (savedScrollTop && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = parseInt(savedScrollTop, 10);
        }
    }, [url]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        sessionStorage.setItem('sidebar-scroll-top', String(e.currentTarget.scrollTop));
    };

    const user = props.auth?.user as any;
    const userPermissions = user?.permissions || [];
    const hasBusinessPermission = userPermissions.includes(UserPermission.VIEW_ANY_BUSINESS) || userPermissions.includes(UserPermission.VIEW_OWN_BUSINESS);
    const hasBranchPermission = userPermissions.includes(UserPermission.VIEW_ANY_BRANCH) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_BRANCH) || userPermissions.includes(UserPermission.VIEW_OWN_BRANCH);
    const hasProductPermission = userPermissions.includes(UserPermission.VIEW_ANY_PRODUCT) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_PRODUCT) || userPermissions.includes(UserPermission.VIEW_OWN_PRODUCT);
    const hasSupplierPermission = userPermissions.includes(UserPermission.VIEW_ANY_SUPPLIER) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_SUPPLIER) || userPermissions.includes(UserPermission.VIEW_OWN_SUPPLIER);
    const hasRolePermission = userPermissions.includes(UserPermission.VIEW_ROLE);
    const hasCustomerPermission = userPermissions.includes(UserPermission.VIEW_ANY_CUSTOMER) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_CUSTOMER) || userPermissions.includes(UserPermission.VIEW_OWN_CUSTOMER);
    const hasProductUnitPermission = userPermissions.includes(UserPermission.VIEW_ANY_PRODUCT_UNIT) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_PRODUCT_UNIT) || userPermissions.includes(UserPermission.VIEW_OWN_PRODUCT_UNIT);
    const hasRewardPermission = userPermissions.includes(UserPermission.VIEW_ANY_REWARD) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_REWARD) || userPermissions.includes(UserPermission.VIEW_OWN_REWARD);
    const hasProductItemPermission = userPermissions.includes(UserPermission.VIEW_ANY_PRODUCT_ITEM) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_PRODUCT_ITEM) || userPermissions.includes(UserPermission.VIEW_OWN_PRODUCT_ITEM);
    const hasPurchaseReceiptPermission = userPermissions.includes(UserPermission.VIEW_ANY_PURCHASE_RECEIPT) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_PURCHASE_RECEIPT) || userPermissions.includes(UserPermission.VIEW_OWN_PURCHASE_RECEIPT);
    const hasStockAdjustmentPermission = userPermissions.includes(UserPermission.VIEW_ANY_STOCK_ADJUSTMENT) || userPermissions.includes(UserPermission.VIEW_ASSOCIATED_STOCK_ADJUSTMENT) || userPermissions.includes(UserPermission.VIEW_OWN_STOCK_ADJUSTMENT);

    const menuGroups = [
        {
            groupName: '',
            items: [
                { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }
            ]
        },
        ...((hasPurchaseReceiptPermission || hasStockAdjustmentPermission) ? [
            {
                groupName: 'Operasional',
                items: [
                    ...(hasPurchaseReceiptPermission ? [
                        { name: 'Penerimaan Barang', icon: ClipboardCheck, href: '/purchase-receipts' },
                        { name: 'Monitoring Stok', icon: Package, href: '/stock-monitoring' }
                    ] : []),
                    ...(hasStockAdjustmentPermission ? [
                        { name: 'Stock Opname', icon: ClipboardList, href: '/stock-adjustments' }
                    ] : [])
                ]
            }
        ] : []),
        ...(hasRolePermission ? [
            {
                groupName: 'Data Master',
                items: [
                    { name: 'Role & Izin', icon: ShieldCheck, href: '/roles' }
                ]
            }
        ] : []),
        ...((hasBusinessPermission || hasBranchPermission || hasSupplierPermission) ? [
            {
                groupName: 'Data Bisnis',
                items: [
                    ...(hasBusinessPermission ? [{ name: 'Bisnis', icon: Store, href: '/businesses' }] : []),
                    ...(hasBranchPermission ? [{ name: 'Cabang', icon: Building, href: '/branches' }] : []),
                    ...(hasSupplierPermission ? [{ name: 'Supplier', icon: Truck, href: '/suppliers' }] : [])
                ]
            }
        ] : []),
        ...((hasProductUnitPermission || hasProductPermission || hasProductItemPermission) ? [
            {
                groupName: 'Produk',
                items: [
                    ...(hasProductUnitPermission ? [{ name: 'Satuan Produk', icon: Scale, href: '/product-units' }] : []),
                    ...(hasProductPermission ? [{ name: 'Produk Induk', icon: ShoppingBag, href: '/products' }] : []),
                    ...(hasProductItemPermission ? [{ name: 'Produk Penjualan', icon: Package, href: '/product-items' }] : [])
                ]
            }
        ] : []),
        ...((hasCustomerPermission || hasRewardPermission) ? [
            {
                groupName: 'Loyalitas Pelanggan',
                items: [
                    ...(hasCustomerPermission ? [{ name: 'Customer', icon: Users, href: '/customers' }] : []),
                    ...(hasRewardPermission ? [{ name: 'Reward', icon: Gift, href: '/rewards' }] : [])
                ]
            }
        ] : [])
    ];

    const isActive = (href: string) => {
        return url.startsWith(href);
    };

    return (
        <aside 
            className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 transition-all duration-300
                ${isCollapsed ? 'md:w-20' : 'md:w-60'} 
                w-64
                max-md:-translate-x-full
                ${isMobileOpen ? 'max-md:translate-x-0' : ''}
            `}
        >
            {/* Sidebar Header */}
            <div className="flex h-16 items-center justify-between px-4.5">
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                        <Store className="h-4 w-4" />
                    </div>
                    {(!isCollapsed || isMobileOpen) && (
                        <span className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white transition-opacity duration-300">
                            Nocturnal POS
                        </span>
                    )}
                </div>
                {isMobileOpen && setIsMobileOpen && (
                    <button 
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-650 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Navigation Menu */}
            <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto clean-scrollbar px-3 py-4"
            >
                <nav className="space-y-6">
                    {menuGroups.map((group, groupIndex) => (
                        <div key={groupIndex} className="space-y-1.5">
                            {group.groupName && (!isCollapsed || isMobileOpen) && (
                                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    {group.groupName}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((item, itemIndex) => {
                                    const active = isActive(item.href);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={itemIndex}
                                            href={item.href}
                                            className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                                                active 
                                                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' 
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                                            }`}
                                            title={isCollapsed && !isMobileOpen ? item.name : undefined}
                                        >
                                            <Icon className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                                                active 
                                                    ? 'text-primary' 
                                                    : 'text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-300'
                                            }`} />
                                            {(!isCollapsed || isMobileOpen) && (
                                                <span className="truncate">{item.name}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
