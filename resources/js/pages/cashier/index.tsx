import React, { useState, useEffect, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Store,
    Search,
    ShoppingCart,
    User,
    Plus,
    Minus,
    Trash2,
    Tag,
    Folder,
    Users,
    Save,
    FolderOpen,
    CheckCircle2,
    AlertCircle,
    X,
    Building2,
    Loader2,
    ArrowLeft,
    ReceiptText,
    Sun,
    Moon,
    ChevronDown,
    Coins,
    CreditCard,
    QrCode,
} from 'lucide-react';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import Modal from '../../components/commons/Modal';
import FormInput from '../../components/forms/FormInput';
import Tooltip from '../../components/commons/Tooltip';
import ThemeToggle from '../../components/commons/ThemeToggle';

interface BranchOption {
    id: number;
    name: string;
    business_name: string;
    label: string;
}

interface Unit {
    id: number;
    name: string;
    short_name: string;
    allow_decimal: boolean;
}

interface PriceTier {
    minimum: number;
    price: number;
}

interface Measurement {
    id: number;
    is_base_unit: boolean;
    conversion_rate: number;
    unit: Unit;
    stock: number;
    price_tierings: PriceTier[];
    min_price: number;
}

interface ProductItemData {
    id: number;
    name: string;
    image_url: string;
    product_id: number;
    product_name: string;
    min_price: number;
    total_stock: number;
    measurements: Measurement[];
}

interface CustomerData {
    id: number | string; // can be temporary string id for frontend customers
    name: string;
    phone: string | null;
    is_new?: boolean;
}

interface CartItem {
    product_item_id: number;
    name: string;
    image_url: string;
    selected_measurement_id: number;
    quantity: number | string;
    base_price: number; // original price for qty 1
    price: number; // actual tier price applied
    stock: number;
    measurements: Measurement[];
    allow_decimal: boolean;
    short_name: string;
}

interface DraftTransaction {
    id: number;
    customer_id: number | null;
    customer_name: string;
    customer_phone: string | null;
    discount_price: number;
    created_at: string;
    items: {
        product_item_id: number;
        product_item_measurement_id: number;
        name: string;
        quantity: number;
        price: number;
        unit_name: string;
    }[];
}

function ProductImage({
    src,
    alt,
    stock,
}: {
    src: string | null;
    alt: string;
    stock: number;
}) {
    const [isError, setIsError] = useState(false);

    if (!src || isError) {
        return (
            <div className="dark:text-slate-650 flex h-full w-full items-center justify-center bg-slate-100 text-xs font-extrabold tracking-wider text-slate-400 select-none dark:bg-slate-900">
                no Photo
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            onError={() => setIsError(true)}
            className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                stock <= 0 ? 'brightness-75 grayscale filter' : ''
            }`}
        />
    );
}

export default function CashierPOS({ branches }: { branches: BranchOption[] }) {
    // Branch Selection
    const [selectedBranch, setSelectedBranch] = useState<BranchOption | null>(
        branches.length > 0 ? branches[0] : null,
    );
    const [showBranchModal, setShowBranchModal] = useState(false);

    // Products & Filters
    const [products, setProducts] = useState<ProductItemData[]>([]);
    const [categories, setCategories] = useState<
        { id: number; name: string }[]
    >([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discountPrice, setDiscountPrice] = useState<number>(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState<
        string | number
    >('');
    const [customers, setCustomers] = useState<CustomerData[]>([]);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

    // Responsive Tab state for Mobile/Tablet
    const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog');

    // Drafts
    const [drafts, setDrafts] = useState<DraftTransaction[]>([]);
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

    // Modals
    const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<
        'Cash' | 'Transfer' | 'QRIS'
    >('Cash');
    const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

    // Notifications/Feedback
    const [alert, setAlert] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // Refs
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // Form inputs for new customer
    const [newCustomerForm, setNewCustomerForm] = useState({
        name: '',
        phone: '',
    });
    const [discountInput, setDiscountInput] = useState('');

    // Fetch products, customers, and drafts when branch changes
    useEffect(() => {
        if (selectedBranch) {
            fetchProducts();
            fetchCustomers();
            fetchDrafts();
        }
    }, [selectedBranch]);

    // Close customer dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                customerDropdownRef.current &&
                !customerDropdownRef.current.contains(event.target as Node)
            ) {
                setIsCustomerDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchProducts = async () => {
        if (!selectedBranch) return;
        setIsLoadingProducts(true);
        try {
            const url = `/cashier/products?branch_id=${selectedBranch.id}`;
            const res = await fetch(url);
            const data = await res.json();
            setProducts(data.products || []);
            setCategories(data.filters || []);
        } catch (error) {
            triggerAlert('error', 'Gagal memuat produk.');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const fetchCustomers = async () => {
        if (!selectedBranch) return;
        try {
            const res = await fetch(
                `/cashier/customers?branch_id=${selectedBranch.id}`,
            );
            const data = await res.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };

    const fetchDrafts = async () => {
        if (!selectedBranch) return;
        setIsLoadingDrafts(true);
        try {
            const res = await fetch(
                `/cashier/drafts?branch_id=${selectedBranch.id}`,
            );
            const data = await res.json();
            setDrafts(data.drafts || []);
        } catch (error) {
            triggerAlert('error', 'Gagal memuat transaksi draft.');
        } finally {
            setIsLoadingDrafts(false);
        }
    };

    const triggerAlert = (type: 'success' | 'error', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert(null), 4000);
    };

    // Helper to calculate tier price based on quantity
    const getTieredPrice = (measurement: Measurement, qty: number): number => {
        if (
            !measurement.price_tierings ||
            measurement.price_tierings.length === 0
        ) {
            return 0;
        }
        let appliedPrice = measurement.price_tierings[0].price;
        let maxMinMatched = -1;

        measurement.price_tierings.forEach((tier) => {
            if (qty >= tier.minimum && tier.minimum > maxMinMatched) {
                maxMinMatched = tier.minimum;
                appliedPrice = tier.price;
            }
        });

        return appliedPrice;
    };

    // Add Item to Cart
    const addToCart = (product: ProductItemData, measurement: Measurement) => {
        const existingIdx = cart.findIndex(
            (item) =>
                item.product_item_id === product.id &&
                item.selected_measurement_id === measurement.id,
        );

        if (existingIdx > -1) {
            const currentQty = cart[existingIdx].quantity;
            updateCartQuantity(
                product.id,
                measurement.id,
                Number(currentQty) + 1,
            );
        } else {
            if (measurement.stock <= 0) {
                triggerAlert('error', 'Stok produk habis.');
                return;
            }

            const initialPrice = getTieredPrice(measurement, 1);

            const newCartItem: CartItem = {
                product_item_id: product.id,
                name: product.name,
                image_url: product.image_url,
                selected_measurement_id: measurement.id,
                quantity: 1,
                base_price: getTieredPrice(measurement, 1),
                price: initialPrice,
                stock: measurement.stock,
                measurements: product.measurements,
                allow_decimal: measurement.unit.allow_decimal,
                short_name: measurement.unit.short_name,
            };

            setCart([...cart, newCartItem]);
        }
    };

    // Update Item quantity
    const updateCartQuantity = (
        productItemId: number,
        measurementId: number,
        qty: number | string,
    ) => {
        const updatedCart = cart
            .map((item) => {
                if (
                    item.product_item_id === productItemId &&
                    item.selected_measurement_id === measurementId
                ) {
                    const meas = item.measurements.find(
                        (m) => m.id === measurementId,
                    );
                    if (!meas) return item;

                    let targetQty = qty;
                    const numericQty = Number(targetQty);

                    if (numericQty > meas.stock) {
                        targetQty = meas.stock;
                        triggerAlert(
                            'error',
                            `Batas stok tercapai. Maksimal stok: ${meas.stock}`,
                        );
                    }

                    if (typeof targetQty === 'number' && numericQty <= 0) {
                        return null;
                    }

                    if (!item.allow_decimal && typeof targetQty === 'number') {
                        targetQty = Math.floor(targetQty);
                    }

                    const newPrice = getTieredPrice(meas, numericQty || 0);

                    return {
                        ...item,
                        quantity: targetQty,
                        price: newPrice,
                    };
                }
                return item;
            })
            .filter(Boolean) as CartItem[];

        setCart(updatedCart);
    };

    // Remove Item from Cart
    const removeFromCart = (productItemId: number, measurementId: number) => {
        setCart(
            cart.filter(
                (item) =>
                    !(
                        item.product_item_id === productItemId &&
                        item.selected_measurement_id === measurementId
                    ),
            ),
        );
    };

    // Clear all items in cart
    const clearCart = () => {
        if (cart.length === 0) return;
        if (
            confirm('Apakah Anda yakin ingin mengosongkan keranjang belanja?')
        ) {
            setCart([]);
            setDiscountPrice(0);
            setDiscountInput('0');
            setSelectedCustomerId('');
        }
    };

    // Create New Customer (Frontend state)
    const handleNewCustomerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomerForm.name.trim()) return;

        const tempId = `new_${Date.now()}`;
        const newCustomer: CustomerData = {
            id: tempId,
            name: newCustomerForm.name,
            phone: newCustomerForm.phone || null,
            is_new: true,
        };

        setCustomers([newCustomer, ...customers]);
        setSelectedCustomerId(tempId);
        setShowNewCustomerModal(false);
        setNewCustomerForm({ name: '', phone: '' });
        triggerAlert(
            'success',
            'Data customer berhasil disimpan, silakan lanjut.',
        );
    };

    // Save discount directly
    const handleSaveDiscount = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanVal = discountInput.replace(/\./g, '');
        const value = parseFloat(cleanVal) || 0;
        setDiscountPrice(value);
        setShowDiscountModal(false);
        triggerAlert(
            'success',
            `Diskon Rp ${value.toLocaleString('id-ID')} diterapkan.`,
        );
    };

    // Subtotals
    const getSubtotal = () => {
        return cart.reduce(
            (sum, item) => sum + item.price * Number(item.quantity || 0),
            0,
        );
    };

    const getTotalPayment = () => {
        const total = getSubtotal() - discountPrice;
        return total < 0 ? 0 : total;
    };

    // Save Draft or Checkout Submit
    const handleCheckout = async (status: 'completed' | 'draft') => {
        if (!selectedBranch) return;
        if (cart.length === 0) {
            triggerAlert('error', 'Keranjang belanja kosong.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                branch_id: selectedBranch.id,
                discount_price: discountPrice,
                status: status,
                items: cart.map((item) => ({
                    product_item_id: item.product_item_id,
                    product_item_measurement_id: item.selected_measurement_id,
                    quantity: Number(item.quantity || 0),
                    price: item.price,
                })),
            };

            if (status === 'completed') {
                payload.payment_method = paymentMethod;
            }

            // Handle Customer mapping
            const selectedCust = customers.find(
                (c) => c.id === selectedCustomerId,
            );
            if (selectedCust) {
                if (selectedCust.is_new) {
                    payload.customers = {
                        name: selectedCust.name,
                        phone: selectedCust.phone,
                    };
                } else {
                    payload.customer_id = selectedCust.id;
                }
            }

            const res = await fetch('/cashier/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (data.success) {
                triggerAlert('success', data.message);
                setCart([]);
                setDiscountPrice(0);
                setSelectedCustomerId('');
                setDiscountInput('0');
                setShowPaymentModal(false);
                fetchProducts(); // Refresh stocks
                fetchCustomers(); // Refresh customer list in case new customer was saved
                fetchDrafts(); // Refresh drafts list
                setActiveTab('catalog'); // Switch back to catalog view on mobile
            } else {
                triggerAlert(
                    'error',
                    data.message || 'Gagal memproses transaksi.',
                );
            }
        } catch (error) {
            triggerAlert('error', 'Koneksi gagal / Terjadi kesalahan server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Load selected draft to cart
    const loadDraftToCart = async (draft: DraftTransaction) => {
        try {
            // Optimistically close modal
            setShowDraftModal(false);

            // Delete the draft from server
            const csrfToken = document.head
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const res = await fetch(`/cashier/drafts/${draft.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
            });

            if (!res.ok) throw new Error('Gagal menghapus draft dari server.');

            // Refresh draft list so it disappears
            await fetchDrafts();

            // Load to cart
            const mappedItems: CartItem[] = draft.items.map((item) => {
                const matchedProd = products.find(
                    (p) => p.id === item.product_item_id,
                );
                const measurements = matchedProd
                    ? matchedProd.measurements
                    : [];
                const matchedMeas = measurements.find(
                    (m) => m.id === item.product_item_measurement_id,
                );

                return {
                    product_item_id: item.product_item_id,
                    name: item.name,
                    image_url: matchedProd?.image_url || '',
                    selected_measurement_id: item.product_item_measurement_id,
                    quantity: item.quantity,
                    base_price: matchedMeas
                        ? getTieredPrice(matchedMeas, 1)
                        : item.price,
                    price: item.price,
                    stock: matchedMeas ? matchedMeas.stock : 9999,
                    measurements: measurements,
                    allow_decimal: matchedMeas
                        ? matchedMeas.unit.allow_decimal
                        : true,
                    short_name: item.unit_name,
                };
            });

            setCart(mappedItems);
            setDiscountPrice(draft.discount_price);
            setDiscountInput(String(draft.discount_price));

            if (draft.customer_id) {
                setSelectedCustomerId(draft.customer_id);
            } else if (
                draft.customer_name &&
                draft.customer_name !== 'Walk-in Customer'
            ) {
                const existingCust = customers.find(
                    (c) => c.name === draft.customer_name,
                );
                if (existingCust) {
                    setSelectedCustomerId(existingCust.id);
                } else {
                    const tempId = `new_${Date.now()}`;
                    const tempCust: CustomerData = {
                        id: tempId,
                        name: draft.customer_name,
                        phone: draft.customer_phone,
                        is_new: true,
                    };
                    setCustomers([tempCust, ...customers]);
                    setSelectedCustomerId(tempId);
                }
            } else {
                setSelectedCustomerId('');
            }

            triggerAlert('success', 'Transaksi draft berhasil dimuat.');
            setActiveTab('cart'); // Switch directly to cart to view loaded draft items on mobile
        } catch (error) {
            triggerAlert('error', 'Gagal memuat atau menghapus draft.');
        }
    };

    // Filter customers list
    const filteredCustomers = customers.filter(
        (c) =>
            c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
            (c.phone && c.phone.includes(customerSearchQuery)),
    );

    // Selected customer display text
    const selectedCustomerText = () => {
        const found = customers.find((c) => c.id === selectedCustomerId);
        if (found) {
            return found.phone ? `${found.name} - ${found.phone}` : found.name;
        }
        return 'Pilih Customer...';
    };

    const cartItemCount = cart.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0,
    );

    // Flatten products to display per measurement unit
    const flattenedProducts = products
        .filter(
            (product) =>
                selectedCategory === null ||
                product.product_id === selectedCategory,
        )
        .flatMap((product) =>
            product.measurements.map((measurement) => {
                const displayName = `${product.name} ${measurement.unit.name}`;
                return {
                    ...product,
                    measurement,
                    displayName,
                    price: measurement.min_price,
                    stock: measurement.stock,
                    unitName: measurement.unit.name,
                    shortName: measurement.unit.short_name,
                };
            }),
        );

    const filteredProducts = flattenedProducts
        .filter(
            (item) =>
                item.displayName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                item.product_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        )
        .sort((a, b) => {
            const aHasStock = a.stock > 0 ? 1 : 0;
            const bHasStock = b.stock > 0 ? 1 : 0;
            return bHasStock - aHasStock; // Sorts 1 (has stock) before 0 (out of stock)
        });

    return (
        <DashboardLayout title="Kasir POS">
            <Head title="Kasir POS" />

            {/* Alert Notification */}
            {alert && (
                <div
                    className={`animate-scale-up fixed top-5 right-5 z-55 flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-md transition-all duration-300 ${
                        alert.type === 'success'
                            ? 'border-emerald-250 bg-emerald-50/90 text-emerald-800 shadow-emerald-500/5 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'border-rose-250 bg-rose-50/90 text-rose-800 shadow-rose-500/5 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}
                >
                    {alert.type === 'success' ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    )}
                    <span className="text-xs font-bold tracking-wide">
                        {alert.message}
                    </span>
                    <button
                        onClick={() => setAlert(null)}
                        className="ml-2.5 opacity-40 transition-opacity hover:opacity-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="relative flex h-screen flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* ═══ Top Toolbar (Persistent on Desktop & Mobile) ═══ */}
                <div className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6 dark:border-slate-800/50 dark:bg-slate-900/60">
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button
                            onClick={() => router.visit('/dashboard')}
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:bg-slate-50 hover:text-slate-700 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            title="Kembali ke Dashboard"
                        >
                            <ArrowLeft className="h-4.5 w-4.5" />
                        </button>

                        {/* Brand / Branch Select Button */}
                        <button
                            onClick={() =>
                                branches.length > 1 && setShowBranchModal(true)
                            }
                            className={`flex items-center gap-2.5 rounded-xl border border-slate-200/40 bg-slate-50/50 px-3 py-1.5 text-left transition-all duration-200 dark:border-slate-800/45 dark:bg-slate-900/40 ${
                                branches.length > 1
                                    ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                                    : 'cursor-default'
                            }`}
                            title={
                                branches.length > 1 ? 'Ganti Cabang' : undefined
                            }
                        >
                            <Store className="h-4 w-4 shrink-0 text-sky-500 dark:text-sky-400" />
                            <div className="min-w-0">
                                <p className="truncate text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                    POS Cabang
                                </p>
                                <span className="xs:max-w-[160px] mt-0.5 block max-w-[120px] truncate text-xs leading-none font-black tracking-tight text-slate-800 sm:max-w-[280px] md:max-w-none dark:text-white">
                                    {selectedBranch ? selectedBranch.label : ''}
                                </span>
                            </div>
                            {branches.length > 1 && (
                                <ChevronDown className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle (Custom styled wrapper) */}
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                            <ThemeToggle className="relative inset-0" />
                        </div>

                        {/* Load Draft */}
                        <button
                            onClick={() => {
                                fetchDrafts();
                                setShowDraftModal(true);
                            }}
                            className="dark:text-slate-350 relative flex h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-50 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                            title="Load Draft Transaksi"
                        >
                            <FolderOpen className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                            <span className="hidden sm:inline">Draft</span>
                            {drafts.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full border-2 border-white bg-amber-500 px-1 text-[9px] font-black text-white shadow-md shadow-amber-500/30 dark:border-slate-950">
                                    {drafts.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ═══ Tab Switcher (Mobile/Tablet Only) ═══ */}
                <div className="flex shrink-0 gap-2 border-b border-slate-200/50 bg-slate-50 px-4 py-2 lg:hidden dark:border-slate-800/40 dark:bg-slate-950">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black transition-all duration-205 ${
                            activeTab === 'catalog'
                                ? 'border-slate-200 bg-white text-sky-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400'
                                : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        <Store className="h-4 w-4" />
                        Katalog Produk
                    </button>
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`relative flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-black transition-all duration-205 ${
                            activeTab === 'cart'
                                ? 'border-slate-200 bg-white text-sky-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-sky-400'
                                : 'border-transparent bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {cartItemCount > 0 && (
                            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* ═══ Main Area (Split on Desktop, Stacked on Mobile) ═══ */}
                <div className="relative flex min-h-0 flex-1 overflow-hidden">
                    {/* Left: Products Panel */}
                    <div
                        className={`flex min-w-0 flex-1 flex-col bg-slate-50 lg:flex dark:bg-slate-950 ${activeTab === 'catalog' ? 'flex' : 'hidden'}`}
                    >
                        {/* Search & Category Filters */}
                        <div className="shrink-0 space-y-3 border-b border-slate-200/40 bg-white/40 px-4 py-4 sm:px-6 dark:border-slate-800/30 dark:bg-slate-900/10">
                            {/* Search Bar */}
                            <div className="group relative">
                                <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-sky-500" />
                                <input
                                    type="text"
                                    placeholder="Cari produk berdasarkan nama..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pr-10 pl-10 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="hover:text-slate-650 absolute top-1/2 right-3.5 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Category Pills */}
                            <div className="clean-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1.5">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-black whitespace-nowrap transition-all duration-200 ${
                                        selectedCategory === null
                                            ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                            : 'hover:text-slate-850 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                    }`}
                                >
                                    Semua
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() =>
                                            setSelectedCategory(cat.id)
                                        }
                                        className={`cursor-pointer rounded-xl border px-4 py-2 text-xs font-black whitespace-nowrap transition-all duration-200 ${
                                            selectedCategory === cat.id
                                                ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                                : 'hover:text-slate-850 border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="clean-scrollbar flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:pb-6">
                            {isLoadingProducts ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                                    <span className="text-sm font-semibold text-slate-500">
                                        Memuat katalog produk...
                                    </span>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                                    <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900/50">
                                        <Folder className="text-slate-350 h-7 w-7 dark:text-slate-700" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                        Tidak ada produk ditemukan
                                    </p>
                                    <p className="max-w-xs text-xs text-slate-400">
                                        Sesuaikan filter atau masukkan kata
                                        kunci pencarian lain.
                                    </p>
                                </div>
                            ) : (
                                <div className="3xl:grid-cols-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5">
                                    {filteredProducts.map((item) => {
                                        const cartItem = cart.find(
                                            (c) =>
                                                c.product_item_id === item.id &&
                                                c.selected_measurement_id ===
                                                    item.measurement.id,
                                        );
                                        const isInCart = !!cartItem;
                                        const cartQty = cartItem
                                            ? cartItem.quantity
                                            : 0;

                                        return (
                                            <div
                                                key={`${item.id}_${item.measurement.id}`}
                                                onClick={() =>
                                                    addToCart(
                                                        item,
                                                        item.measurement,
                                                    )
                                                }
                                                className={`group relative flex transform cursor-pointer flex-row items-center gap-3.5 overflow-hidden rounded-2xl border bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/5 sm:flex-col sm:items-stretch sm:p-0 dark:bg-slate-900/60 ${
                                                    isInCart
                                                        ? 'border-sky-500 bg-sky-50/10 shadow-md ring-[3px] shadow-sky-500/5 ring-sky-500/20 dark:border-sky-400 dark:bg-sky-950/10'
                                                        : 'border-slate-200/60 hover:border-sky-300 dark:border-slate-800/60 dark:hover:border-sky-500/40'
                                                }`}
                                            >
                                                {/* Product Image & Badges */}
                                                <div className="dark:border-slate-850/50 relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none sm:border-0 dark:bg-slate-950">
                                                    <ProductImage
                                                        src={item.image_url}
                                                        alt={item.displayName}
                                                        stock={item.stock}
                                                    />
                                                    {item.stock <= 0 ? (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 backdrop-blur-[0.5px]">
                                                            <span className="rounded-lg bg-rose-600/90 px-2 py-1 text-[9px] font-black tracking-wider text-white uppercase shadow-md sm:px-2.5 sm:py-1.5 sm:text-[10px]">
                                                                Habis
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        /* Stock badge overlay (desktop only) */
                                                        <div className="absolute top-2.5 right-2.5 hidden sm:block">
                                                            <span
                                                                className={`rounded-lg border px-2 py-0.5 text-[10px] font-extrabold shadow-sm backdrop-blur-md ${
                                                                    item.stock >
                                                                    10
                                                                        ? 'text-slate-650 dark:text-slate-350 border-slate-150/40 bg-white/95 dark:border-slate-800/40 dark:bg-slate-900/95'
                                                                        : 'border-transparent bg-amber-500/90 text-white'
                                                                }`}
                                                            >
                                                                Stok:{' '}
                                                                {item.stock}{' '}
                                                                {item.shortName}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Selected Quantity Badge overlay */}
                                                    {isInCart && (
                                                        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
                                                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-lg border border-sky-400 bg-sky-500 px-1.5 text-[9px] font-black text-white shadow-lg shadow-sky-500/35 sm:h-6 sm:min-w-[26px] sm:px-2 sm:text-[11px]">
                                                                {cartQty}x
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex h-20 min-w-0 flex-1 flex-col justify-between p-0.5 sm:h-auto sm:p-3.5">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-1.5">
                                                            <span className="text-[9px] leading-none font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                                {
                                                                    item.product_name
                                                                }
                                                            </span>
                                                            <span
                                                                className={`text-[9px] leading-none font-bold sm:hidden ${
                                                                    item.stock <=
                                                                    0
                                                                        ? 'text-rose-500'
                                                                        : item.stock <=
                                                                            10
                                                                          ? 'text-amber-500'
                                                                          : 'text-slate-400 dark:text-slate-500'
                                                                }`}
                                                            >
                                                                • Stok:{' '}
                                                                {item.stock}{' '}
                                                                {item.shortName}
                                                            </span>
                                                        </div>
                                                        <h3
                                                            className="dark:text-slate-205 mt-1 line-clamp-1 min-h-[16px] truncate text-xs leading-snug font-bold text-slate-800 transition-colors group-hover:text-sky-600 sm:line-clamp-2 sm:min-h-[32px] sm:whitespace-normal dark:group-hover:text-sky-400"
                                                            title={
                                                                item.displayName
                                                            }
                                                        >
                                                            {item.displayName}
                                                        </h3>
                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2 sm:mt-3.5 sm:pt-2.5 dark:border-slate-800/30">
                                                        <span className="text-xs font-black text-sky-600 sm:text-sm dark:text-sky-400">
                                                            Rp{' '}
                                                            {item.price.toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </span>
                                                        <span className="rounded-md border border-slate-100/50 bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold text-slate-400 sm:text-[9px] dark:border-slate-800/20 dark:bg-slate-800/40 dark:text-slate-500">
                                                            {item.unitName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Cart Sidebar */}
                    <div
                        className={`flex w-full shrink-0 flex-col border-l border-slate-200/50 bg-white lg:flex lg:w-[380px] xl:w-[410px] dark:border-slate-800/40 dark:bg-slate-900/40 ${activeTab === 'cart' ? 'flex' : 'hidden'}`}
                    >
                        {/* Cart Header */}
                        <div className="hidden shrink-0 items-center justify-between border-b border-slate-200/50 bg-white px-5 py-4 lg:flex dark:border-slate-800/40 dark:bg-slate-900/60">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10">
                                    <ShoppingCart className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    Keranjang Belanja
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {cart.length > 0 && (
                                    <>
                                        <span className="hidden min-w-[20px] items-center justify-center rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm lg:inline-flex">
                                            {cartItemCount} item
                                        </span>
                                        <button
                                            onClick={clearCart}
                                            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-all duration-200 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                                            title="Kosongkan Keranjang"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="clean-scrollbar flex-1 space-y-3 overflow-y-auto bg-slate-50/30 px-5 py-4 pb-64 lg:pb-4 dark:bg-slate-900/10">
                            {cart.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                                        <ReceiptText className="h-6 w-6 animate-pulse text-slate-300 dark:text-slate-700" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                            Keranjang kosong
                                        </p>
                                        <p className="dark:text-slate-550 mt-1 max-w-[180px] text-[10px] text-slate-400">
                                            Pilih produk dari katalog untuk
                                            memulai transaksi.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                cart.map((item) => {
                                    return (
                                        <div
                                            key={`${item.product_item_id}-${item.selected_measurement_id}`}
                                            className="border-slate-150/50 flex items-center justify-between gap-3 border-b py-3 dark:border-slate-800/40"
                                        >
                                            {/* Left side: Item Name & Unit */}
                                            <div className="min-w-0 flex-1">
                                                <h4
                                                    className="truncate text-xs font-bold text-slate-800 dark:text-slate-200"
                                                    title={`${item.name} ${item.short_name}`}
                                                >
                                                    {item.name}
                                                </h4>
                                                <span className="mt-0.5 block text-[9px] font-black tracking-widest text-slate-400 uppercase dark:text-slate-500">
                                                    Satuan: {item.short_name}
                                                </span>
                                            </div>

                                            {/* Right side: Qty controls, Price & Delete */}
                                            <div className="flex shrink-0 items-center gap-3.5">
                                                {/* Compact Quantity Controls */}
                                                <div className="flex size-fit items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateCartQuantity(
                                                                item.product_item_id,
                                                                item.selected_measurement_id,
                                                                Number(
                                                                    item.quantity ||
                                                                        0,
                                                                ) -
                                                                    (item.allow_decimal
                                                                        ? 0.5
                                                                        : 1),
                                                            )
                                                        }
                                                        className="hover:bg-slate-150/50 cursor-pointer p-1.5 text-slate-500 transition-colors dark:hover:bg-slate-900"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode={
                                                            item.allow_decimal
                                                                ? 'decimal'
                                                                : 'numeric'
                                                        }
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            let val =
                                                                e.target.value;
                                                            if (
                                                                item.allow_decimal
                                                            ) {
                                                                val =
                                                                    val.replace(
                                                                        ',',
                                                                        '.',
                                                                    );
                                                                val =
                                                                    val.replace(
                                                                        /[^0-9.]/g,
                                                                        '',
                                                                    );
                                                                const parts =
                                                                    val.split(
                                                                        '.',
                                                                    );
                                                                if (
                                                                    parts.length >
                                                                    2
                                                                )
                                                                    val =
                                                                        parts[0] +
                                                                        '.' +
                                                                        parts
                                                                            .slice(
                                                                                1,
                                                                            )
                                                                            .join(
                                                                                '',
                                                                            );
                                                            } else {
                                                                val =
                                                                    val.replace(
                                                                        /\D/g,
                                                                        '',
                                                                    );
                                                            }
                                                            updateCartQuantity(
                                                                item.product_item_id,
                                                                item.selected_measurement_id,
                                                                val,
                                                            );
                                                        }}
                                                        onBlur={(e) => {
                                                            let val = Number(
                                                                e.target.value,
                                                            );
                                                            if (
                                                                isNaN(val) ||
                                                                val <= 0
                                                            )
                                                                val = 1;
                                                            updateCartQuantity(
                                                                item.product_item_id,
                                                                item.selected_measurement_id,
                                                                val,
                                                            );
                                                        }}
                                                        className="w-12 border-0 bg-transparent p-0 text-center text-sm leading-none font-black text-slate-900 focus:ring-0 dark:text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateCartQuantity(
                                                                item.product_item_id,
                                                                item.selected_measurement_id,
                                                                Number(
                                                                    item.quantity ||
                                                                        0,
                                                                ) +
                                                                    (item.allow_decimal
                                                                        ? 0.5
                                                                        : 1),
                                                            )
                                                        }
                                                        className="hover:bg-slate-150/50 cursor-pointer p-1.5 text-slate-500 transition-colors dark:hover:bg-slate-900"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                {/* Price */}
                                                <div className="min-w-[75px] text-right">
                                                    {item.price <
                                                        item.base_price && (
                                                        <span className="mb-0.5 block text-[9px] leading-none font-medium text-slate-400 line-through dark:text-slate-500">
                                                            Rp{' '}
                                                            {(
                                                                item.base_price *
                                                                Number(
                                                                    item.quantity ||
                                                                        0,
                                                                )
                                                            ).toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </span>
                                                    )}
                                                    <span className="block text-xs leading-none font-black text-slate-800 dark:text-slate-200">
                                                        Rp{' '}
                                                        {(
                                                            item.price *
                                                            Number(
                                                                item.quantity ||
                                                                    0,
                                                            )
                                                        ).toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                    <span className="mt-0.5 block text-[8px] leading-none font-bold text-slate-400 dark:text-slate-500">
                                                        @ Rp{' '}
                                                        {item.price.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() =>
                                                        removeFromCart(
                                                            item.product_item_id,
                                                            item.selected_measurement_id,
                                                        )
                                                    }
                                                    className="text-slate-350 cursor-pointer p-1 transition-colors hover:text-rose-500"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Bill Summary & Actions */}
                        <div className="dark:border-slate-850 fixed right-0 bottom-0 left-0 z-40 shrink-0 space-y-4 border-t border-slate-200 bg-white px-5 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] lg:relative lg:right-auto lg:bottom-auto lg:left-auto lg:z-auto lg:border-slate-200/50 lg:bg-white lg:shadow-none lg:backdrop-blur-sm dark:bg-slate-950 lg:dark:border-slate-800/40 lg:dark:bg-slate-900/60">
                            <div className="bg-slate-55/80 border-slate-150/80 dark:border-slate-850/60 space-y-3 rounded-2xl border p-4 dark:bg-slate-950/40">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="dark:text-slate-350 text-slate-800">
                                        Rp{' '}
                                        {getSubtotal().toLocaleString('id-ID')}
                                    </span>
                                </div>

                                <div
                                    onClick={() => {
                                        setDiscountInput(
                                            discountPrice > 0
                                                ? discountPrice.toLocaleString(
                                                      'id-ID',
                                                  )
                                                : '',
                                        );
                                        setShowDiscountModal(true);
                                    }}
                                    className="dark:hover:text-sky-350 group flex cursor-pointer items-center justify-between text-xs font-black text-sky-600 hover:text-sky-500 dark:text-sky-400"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5 text-sky-500 transition-transform group-hover:scale-105" />
                                        Diskon
                                    </span>
                                    <span className="border-b border-dashed border-sky-400">
                                        {discountPrice > 0
                                            ? `- Rp ${discountPrice.toLocaleString('id-ID')}`
                                            : 'Tambah diskon...'}
                                    </span>
                                </div>

                                <div className="my-1 h-px bg-slate-200/60 dark:bg-slate-800/60" />

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                        Total Bayar
                                    </span>
                                    <span className="animate-scale-up text-lg font-black text-slate-950 tabular-nums dark:text-white">
                                        Rp{' '}
                                        {getTotalPayment().toLocaleString(
                                            'id-ID',
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-1 pb-2 lg:pb-0">
                                <button
                                    onClick={() => handleCheckout('draft')}
                                    disabled={isSubmitting || cart.length === 0}
                                    className="dark:border-slate-850 inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 py-3.5 text-xs font-black text-slate-700 shadow-sm transition-all hover:scale-[1.01] hover:bg-slate-50 active:scale-99 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800/60"
                                >
                                    <Save className="h-4 w-4 text-slate-400" />
                                    Draft
                                </button>
                                <button
                                    onClick={() => {
                                        setPaymentMethod('Cash');
                                        setSelectedCustomerId('');
                                        setCustomerSearchQuery('');
                                        setShowPaymentModal(true);
                                    }}
                                    disabled={isSubmitting || cart.length === 0}
                                    className="inline-flex flex-[1.6] cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3.5 text-xs font-black text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.01] hover:from-sky-600 hover:to-indigo-600 hover:shadow-sky-500/35 active:scale-99 disabled:opacity-40 disabled:shadow-none"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Bayar Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Floating Bottom Bar (Mobile/Tablet only, Catalog Tab, Cart > 0) ═══ */}
                {activeTab === 'catalog' && cartItemCount > 0 && (
                    <div className="fixed right-4 bottom-4 left-4 z-30 lg:hidden">
                        <div
                            onClick={() => setActiveTab('cart')}
                            className="flex cursor-pointer items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-500/90 px-4 py-3 text-white shadow-xl shadow-sky-500/20 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] active:scale-95 dark:bg-sky-600/90"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative rounded-xl bg-white/20 p-2">
                                    <ShoppingCart className="h-5 w-5 animate-pulse text-white" />
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-1 ring-white">
                                        {cartItemCount}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-sky-100">
                                        Keranjang Belanja
                                    </p>
                                    <p className="mt-0.5 text-sm leading-none font-black text-white">
                                        Rp{' '}
                                        {getTotalPayment().toLocaleString(
                                            'id-ID',
                                        )}
                                    </p>
                                </div>
                            </div>
                            <span className="flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-black text-sky-600 shadow-sm">
                                Lihat Keranjang
                                <ArrowLeft className="h-3 w-3 rotate-180" />
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Branch Selection Modal ─── */}
            {branches.length > 1 && (
                <Modal
                    open={showBranchModal}
                    onClose={() => {
                        if (selectedBranch) {
                            setShowBranchModal(false);
                        }
                    }}
                    title="Pilih Cabang Kasir"
                    maxWidth="max-w-md"
                >
                    <div className="space-y-4 py-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Pilih cabang penjualan tempat Anda akan
                            mengoperasikan kasir POS.
                        </p>
                        <div className="clean-scrollbar flex max-h-80 flex-col gap-2.5 overflow-y-auto pr-1">
                            {branches.map((b) => (
                                <button
                                    key={b.id}
                                    onClick={() => {
                                        setSelectedBranch(b);
                                        setShowBranchModal(false);
                                        setCart([]);
                                    }}
                                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl border p-3.5 text-left text-sm font-bold transition-all hover:scale-[1.01] ${
                                        selectedBranch?.id === b.id
                                            ? 'border-sky-500 bg-sky-50/50 font-extrabold text-sky-700 ring-2 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400'
                                            : 'dark:border-slate-850 border-slate-200 text-slate-800 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                                    }`}
                                >
                                    <span>{b.label}</span>
                                    <Store className="h-4.5 w-4.5 shrink-0 text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            {/* ─── Customer Baru Modal ─── */}
            <Modal
                open={showNewCustomerModal}
                onClose={() => setShowNewCustomerModal(false)}
                title="Customer Baru"
                maxWidth="max-w-md"
            >
                <form
                    onSubmit={handleNewCustomerSubmit}
                    className="space-y-4 py-2"
                >
                    <FormInput
                        name="name"
                        label="Nama Lengkap"
                        value={newCustomerForm.name}
                        onChange={(e) =>
                            setNewCustomerForm({
                                ...newCustomerForm,
                                name: e.target.value,
                            })
                        }
                        placeholder="Masukkan nama customer..."
                        required
                    />

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Nomor Telepon
                        </label>
                        <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 transition-all focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-800 dark:focus-within:border-sky-600">
                            <span className="shrink-0 border-r border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-500 select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                +62
                            </span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={newCustomerForm.phone}
                                onChange={(e) =>
                                    setNewCustomerForm({
                                        ...newCustomerForm,
                                        phone: e.target.value.replace(
                                            /\D/g,
                                            '',
                                        ),
                                    })
                                }
                                placeholder="812xxxxxxxx"
                                className="flex-1 border-0 bg-white px-3 py-2.5 text-sm text-slate-900 focus:ring-0 focus:outline-none dark:bg-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="dark:border-slate-850 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowNewCustomerModal(false)}
                            className="text-slate-650 cursor-pointer rounded-xl border border-slate-200 px-4.5 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="hover:bg-sky-655 cursor-pointer rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-sky-500/30"
                        >
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── Discount Modal ─── */}
            <Modal
                open={showDiscountModal}
                onClose={() => setShowDiscountModal(false)}
                title="Potongan Harga"
                maxWidth="max-w-xs"
            >
                <form onSubmit={handleSaveDiscount} className="space-y-4 py-2">
                    <FormInput
                        name="discount"
                        label="Nominal Diskon (Rupiah)"
                        type="text"
                        inputMode="numeric"
                        value={discountInput}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setDiscountInput(
                                val ? Number(val).toLocaleString('id-ID') : '',
                            );
                        }}
                        placeholder="0"
                    />

                    {/* Calculation breakdown */}
                    <div className="border-slate-150/60 dark:border-slate-850/50 mt-3 space-y-2 rounded-xl border bg-slate-50 p-3 shadow-inner dark:bg-slate-950">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Total Awal</span>
                            <span className="dark:text-slate-350 font-semibold text-slate-700">
                                Rp {getSubtotal().toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Potongan Diskon</span>
                            <span className="dark:text-rose-450 font-semibold text-rose-600">
                                - Rp{' '}
                                {(
                                    parseFloat(
                                        discountInput.replace(/\./g, ''),
                                    ) || 0
                                ).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="my-1 h-px bg-slate-200/60 dark:bg-slate-800/60" />
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span>Total Pembayaran</span>
                            <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                                Rp{' '}
                                {Math.max(
                                    0,
                                    getSubtotal() -
                                        (parseFloat(
                                            discountInput.replace(/\./g, ''),
                                        ) || 0),
                                ).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    <div className="dark:border-slate-850 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowDiscountModal(false)}
                            className="text-slate-650 cursor-pointer rounded-xl border border-slate-200 px-4.5 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="hover:bg-sky-655 cursor-pointer rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:shadow-sky-500/30"
                        >
                            Terapkan
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ─── Draft Transactions Modal ─── */}
            <Modal
                open={showDraftModal}
                onClose={() => setShowDraftModal(false)}
                title="Draft Transaksi"
                maxWidth="max-w-lg"
            >
                <div className="space-y-4 py-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Daftar transaksi pesanan yang disimpan sebagai draft di
                        cabang ini.
                    </p>

                    {isLoadingDrafts ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-xs font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                            Belum ada draft untuk cabang ini.
                        </div>
                    ) : (
                        <div className="clean-scrollbar max-h-96 space-y-2.5 overflow-y-auto pr-1">
                            {drafts.map((dr) => (
                                <div
                                    key={dr.id}
                                    className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-sky-300 hover:shadow-md sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-sky-500/40"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs leading-none font-extrabold text-slate-900 dark:text-white">
                                                {dr.customer_name}
                                            </span>
                                            {dr.customer_phone && (
                                                <span className="text-[10px] leading-none text-slate-400 dark:text-slate-500">
                                                    ({dr.customer_phone})
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-450 mt-1.5 line-clamp-1 text-[10px] dark:text-slate-500">
                                            {dr.items
                                                .map(
                                                    (i) =>
                                                        `${i.name} (${i.quantity} ${i.unit_name})`,
                                                )
                                                .join(', ')}
                                        </p>
                                        <span className="mt-1.5 block text-[9px] text-slate-400 dark:text-slate-500">
                                            {dr.created_at}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => loadDraftToCart(dr)}
                                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-600 transition-all hover:scale-[1.03] hover:bg-sky-100 active:scale-97 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
                                    >
                                        <FolderOpen className="h-4 w-4" />
                                        Buka Draft
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* ─── Payment Confirmation Modal ─── */}
            <Modal
                open={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setIsAddingNewCustomer(false);
                }}
                title="Konfirmasi Pembayaran"
                maxWidth="max-w-md"
            >
                <div className="space-y-5 py-2">
                    {isAddingNewCustomer ? (
                        /* Inline Customer Baru Form */
                        <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                                Tambah Customer Baru
                            </h4>
                            <div className="space-y-3">
                                <FormInput
                                    name="new_name"
                                    label="Nama Lengkap"
                                    value={newCustomerForm.name}
                                    onChange={(e) =>
                                        setNewCustomerForm({
                                            ...newCustomerForm,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Masukkan nama customer..."
                                    required
                                />
                                <div>
                                    <label className="dark:text-slate-350 mb-1.5 block text-xs font-semibold text-slate-700">
                                        Nomor Telepon
                                    </label>
                                    <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 transition-all focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-800">
                                        <span className="shrink-0 border-r border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-500 select-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                            +62
                                        </span>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={newCustomerForm.phone}
                                            onChange={(e) =>
                                                setNewCustomerForm({
                                                    ...newCustomerForm,
                                                    phone: e.target.value.replace(
                                                        /\D/g,
                                                        '',
                                                    ),
                                                })
                                            }
                                            placeholder="812xxxxxxxx"
                                            className="flex-1 border-0 bg-white px-3 py-2.5 text-sm text-slate-900 focus:ring-0 focus:outline-none dark:bg-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewCustomerForm({
                                            name: '',
                                            phone: '',
                                        });
                                        setIsAddingNewCustomer(false);
                                    }}
                                    className="text-slate-650 cursor-pointer rounded-xl border border-slate-200 px-3.5 py-1.5 text-[11px] font-semibold transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!newCustomerForm.name.trim()) {
                                            triggerAlert(
                                                'error',
                                                'Nama customer wajib diisi.',
                                            );
                                            return;
                                        }
                                        const tempId = `new_${Date.now()}`;
                                        const newCustomer: CustomerData = {
                                            id: tempId,
                                            name: newCustomerForm.name,
                                            phone:
                                                newCustomerForm.phone || null,
                                            is_new: true,
                                        };
                                        setCustomers([
                                            newCustomer,
                                            ...customers,
                                        ]);
                                        setSelectedCustomerId(tempId);
                                        setCustomerSearchQuery(
                                            newCustomer.name,
                                        );
                                        setNewCustomerForm({
                                            name: '',
                                            phone: '',
                                        });
                                        setIsAddingNewCustomer(false);
                                        triggerAlert(
                                            'success',
                                            'Customer berhasil ditambahkan secara lokal.',
                                        );
                                    }}
                                    className="cursor-pointer rounded-xl bg-sky-500 px-4 py-1.5 text-[11px] font-bold text-white shadow-md transition-colors hover:bg-sky-600"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Customer Selection dropdown view */
                        <div
                            className="relative space-y-1.5"
                            ref={customerDropdownRef}
                        >
                            <div className="flex items-center justify-between">
                                <label className="dark:text-slate-350 block text-xs font-semibold text-slate-700">
                                    Pilih Customer
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingNewCustomer(true)}
                                    className="flex cursor-pointer items-center gap-1 text-[10px] font-black text-sky-600 transition-colors hover:text-sky-500 dark:text-sky-400"
                                >
                                    <Plus className="h-3 w-3" />
                                    Customer Baru
                                </button>
                            </div>

                            {/* Searchable input */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari / Pilih Customer (Umum jika kosong)..."
                                    value={customerSearchQuery}
                                    onFocus={() =>
                                        setIsCustomerDropdownOpen(true)
                                    }
                                    onChange={(e) => {
                                        setCustomerSearchQuery(e.target.value);
                                        setIsCustomerDropdownOpen(true);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                                />
                                {selectedCustomerId ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomerId('');
                                            setCustomerSearchQuery('');
                                        }}
                                        className="hover:text-slate-650 absolute top-1/2 right-3.5 -translate-y-1/2 text-slate-400"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>

                            {/* Customer Dropdown list */}
                            {isCustomerDropdownOpen && (
                                <div className="clean-scrollbar absolute z-50 mt-1.5 max-h-48 w-full space-y-0.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-950">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomerId('');
                                            setCustomerSearchQuery('');
                                            setIsCustomerDropdownOpen(false);
                                        }}
                                        className={`w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-all ${
                                            selectedCustomerId === ''
                                                ? 'bg-sky-500 font-extrabold text-white'
                                                : 'dark:text-slate-350 text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                        }`}
                                    >
                                        Walk-in Customer (Umum)
                                    </button>
                                    {filteredCustomers.map((cust) => (
                                        <button
                                            key={cust.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomerId(cust.id);
                                                setCustomerSearchQuery(
                                                    cust.name,
                                                );
                                                setIsCustomerDropdownOpen(
                                                    false,
                                                );
                                            }}
                                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold transition-all ${
                                                selectedCustomerId === cust.id
                                                    ? 'bg-sky-500 font-extrabold text-white'
                                                    : 'dark:text-slate-350 text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                            }`}
                                        >
                                            <span>{cust.name}</span>
                                            {cust.phone && (
                                                <span
                                                    className={`text-[10px] ${selectedCustomerId === cust.id ? 'text-sky-100' : 'dark:text-slate-550 text-slate-400'}`}
                                                >
                                                    {cust.phone}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                        <div className="px-3 py-2 text-center text-[10px] font-medium text-slate-400 italic">
                                            Tidak ada customer cocok
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected Customer Preview Card */}
                    <div className="border-slate-150/60 dark:border-slate-850/50 flex items-center gap-3 rounded-2xl border bg-slate-50 p-3 dark:bg-slate-950">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-500/10">
                            <User className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-slate-450 dark:text-slate-550 text-[9px] leading-none font-black tracking-widest uppercase">
                                Customer Terpilih
                            </p>
                            <h4 className="mt-1 text-xs leading-none font-extrabold text-slate-800 dark:text-slate-200">
                                {selectedCustomerText() === 'Pilih Customer...'
                                    ? 'Walk-in Customer (Umum)'
                                    : selectedCustomerText()}
                            </h4>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                        <label className="dark:text-slate-350 block text-xs font-semibold text-slate-700">
                            Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            {/* Cash Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Cash')}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all ${
                                    paymentMethod === 'Cash'
                                        ? 'border-sky-500 bg-sky-50/50 font-extrabold text-sky-700 ring-2 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400'
                                        : 'dark:border-slate-850 border-slate-200 text-slate-800 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                                }`}
                            >
                                <Coins
                                    className={`h-5 w-5 ${paymentMethod === 'Cash' ? 'text-sky-500' : 'text-slate-400'}`}
                                />
                                <span className="text-xs font-black">Cash</span>
                            </button>

                            {/* Transfer Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Transfer')}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all ${
                                    paymentMethod === 'Transfer'
                                        ? 'border-sky-500 bg-sky-50/50 font-extrabold text-sky-700 ring-2 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400'
                                        : 'dark:border-slate-850 border-slate-200 text-slate-800 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                                }`}
                            >
                                <CreditCard
                                    className={`h-5 w-5 ${paymentMethod === 'Transfer' ? 'text-sky-500' : 'text-slate-400'}`}
                                />
                                <span className="text-xs font-black">
                                    Transfer
                                </span>
                            </button>

                            {/* QRIS Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('QRIS')}
                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition-all ${
                                    paymentMethod === 'QRIS'
                                        ? 'border-sky-500 bg-sky-50/50 font-extrabold text-sky-700 ring-2 ring-sky-500/20 dark:bg-sky-500/10 dark:text-sky-400'
                                        : 'dark:border-slate-850 border-slate-200 text-slate-800 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
                                }`}
                            >
                                <QrCode
                                    className={`h-5 w-5 ${paymentMethod === 'QRIS' ? 'text-sky-500' : 'text-slate-400'}`}
                                />
                                <span className="text-xs font-black">QRIS</span>
                            </button>
                        </div>
                    </div>

                    {/* Total billing detail */}
                    <div className="bg-slate-55/80 border-slate-150/80 dark:border-slate-850/60 mt-3 space-y-2 rounded-2xl border p-4 dark:bg-slate-950/40">
                        <div className="dark:text-slate-455 flex items-center justify-between text-xs font-bold text-slate-500">
                            <span>Total Tagihan</span>
                            <span className="text-slate-800 dark:text-slate-300">
                                Rp {getSubtotal().toLocaleString('id-ID')}
                            </span>
                        </div>
                        {discountPrice > 0 && (
                            <div className="dark:text-slate-455 flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>Potongan Diskon</span>
                                <span className="text-rose-600 dark:text-rose-400">
                                    - Rp {discountPrice.toLocaleString('id-ID')}
                                </span>
                            </div>
                        )}
                        <div className="my-1 h-px bg-slate-200/60 dark:bg-slate-800/60" />
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                Total Wajib Bayar
                            </span>
                            <span className="text-base font-black text-sky-600 tabular-nums dark:text-sky-400">
                                Rp {getTotalPayment().toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="dark:border-slate-850 flex justify-end gap-3 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className="text-slate-650 cursor-pointer rounded-xl border border-slate-200 px-4.5 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCheckout('completed')}
                            disabled={isSubmitting}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-white shadow-md transition-all hover:bg-sky-600 hover:shadow-sky-500/30"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Selesaikan Transaksi
                        </button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
