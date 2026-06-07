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
    QrCode
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

function ProductImage({ src, alt, stock }: { src: string | null; alt: string; stock: number }) {
    const [isError, setIsError] = useState(false);

    if (!src || isError) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-650 font-extrabold text-xs tracking-wider select-none">
                no Photo
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt}
            onError={() => setIsError(true)}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out ${
                stock <= 0 ? 'filter grayscale brightness-75' : ''
            }`}
        />
    );
}

export default function CashierPOS({ branches }: { branches: BranchOption[] }) {
    // Branch Selection
    const [selectedBranch, setSelectedBranch] = useState<BranchOption | null>(
        branches.length > 0 ? branches[0] : null
    );
    const [showBranchModal, setShowBranchModal] = useState(false);

    // Products & Filters
    const [products, setProducts] = useState<ProductItemData[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discountPrice, setDiscountPrice] = useState<number>(0);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | number>('');
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
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Transfer' | 'QRIS'>('Cash');
    const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);

    // Notifications/Feedback
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Refs
    const customerDropdownRef = useRef<HTMLDivElement>(null);

    // Form inputs for new customer
    const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '' });
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
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
                setIsCustomerDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
            const res = await fetch(`/cashier/customers?branch_id=${selectedBranch.id}`);
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
            const res = await fetch(`/cashier/drafts?branch_id=${selectedBranch.id}`);
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
        if (!measurement.price_tierings || measurement.price_tierings.length === 0) {
            return 0;
        }
        let appliedPrice = measurement.price_tierings[0].price;
        let maxMinMatched = -1;

        measurement.price_tierings.forEach(tier => {
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
            item => item.product_item_id === product.id && item.selected_measurement_id === measurement.id
        );

        if (existingIdx > -1) {
            const currentQty = cart[existingIdx].quantity;
            updateCartQuantity(product.id, measurement.id, Number(currentQty) + 1);
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
                short_name: measurement.unit.short_name
            };

            setCart([...cart, newCartItem]);
        }
    };

    // Update Item quantity
    const updateCartQuantity = (productItemId: number, measurementId: number, qty: number | string) => {
        const updatedCart = cart.map(item => {
            if (item.product_item_id === productItemId && item.selected_measurement_id === measurementId) {
                const meas = item.measurements.find(m => m.id === measurementId);
                if (!meas) return item;

                let targetQty = qty;
                const numericQty = Number(targetQty);

                if (numericQty > meas.stock) {
                    targetQty = meas.stock;
                    triggerAlert('error', `Batas stok tercapai. Maksimal stok: ${meas.stock}`);
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
                    price: newPrice
                };
            }
            return item;
        }).filter(Boolean) as CartItem[];

        setCart(updatedCart);
    };

    // Remove Item from Cart
    const removeFromCart = (productItemId: number, measurementId: number) => {
        setCart(cart.filter(item => !(item.product_item_id === productItemId && item.selected_measurement_id === measurementId)));
    };

    // Clear all items in cart
    const clearCart = () => {
        if (cart.length === 0) return;
        if (confirm('Apakah Anda yakin ingin mengosongkan keranjang belanja?')) {
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
            is_new: true
        };

        setCustomers([newCustomer, ...customers]);
        setSelectedCustomerId(tempId);
        setShowNewCustomerModal(false);
        setNewCustomerForm({ name: '', phone: '' });
        triggerAlert('success', 'Data customer berhasil disimpan, silakan lanjut.');
    };

    // Save discount directly
    const handleSaveDiscount = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanVal = discountInput.replace(/\./g, '');
        const value = parseFloat(cleanVal) || 0;
        setDiscountPrice(value);
        setShowDiscountModal(false);
        triggerAlert('success', `Diskon Rp ${value.toLocaleString('id-ID')} diterapkan.`);
    };

    // Subtotals
    const getSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * Number(item.quantity || 0)), 0);
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
                items: cart.map(item => ({
                    product_item_id: item.product_item_id,
                    product_item_measurement_id: item.selected_measurement_id,
                    quantity: Number(item.quantity || 0),
                    price: item.price
                }))
            };

            if (status === 'completed') {
                payload.payment_method = paymentMethod;
            }

            // Handle Customer mapping
            const selectedCust = customers.find(c => c.id === selectedCustomerId);
            if (selectedCust) {
                if (selectedCust.is_new) {
                    payload.customers = {
                        name: selectedCust.name,
                        phone: selectedCust.phone
                    };
                } else {
                    payload.customer_id = selectedCust.id;
                }
            }

            const res = await fetch('/cashier/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''
                },
                body: JSON.stringify(payload)
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
                triggerAlert('error', data.message || 'Gagal memproses transaksi.');
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
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/cashier/drafts/${draft.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || ''
                }
            });

            if (!res.ok) throw new Error('Gagal menghapus draft dari server.');

            // Refresh draft list so it disappears
            await fetchDrafts();

            // Load to cart
            const mappedItems: CartItem[] = draft.items.map(item => {
                const matchedProd = products.find(p => p.id === item.product_item_id);
                const measurements = matchedProd ? matchedProd.measurements : [];
                const matchedMeas = measurements.find(m => m.id === item.product_item_measurement_id);

                return {
                    product_item_id: item.product_item_id,
                    name: item.name,
                    image_url: matchedProd?.image_url || '',
                    selected_measurement_id: item.product_item_measurement_id,
                    quantity: item.quantity,
                    base_price: matchedMeas ? getTieredPrice(matchedMeas, 1) : item.price,
                    price: item.price,
                    stock: matchedMeas ? matchedMeas.stock : 9999,
                    measurements: measurements,
                    allow_decimal: matchedMeas ? matchedMeas.unit.allow_decimal : true,
                    short_name: item.unit_name
                };
            });

            setCart(mappedItems);
            setDiscountPrice(draft.discount_price);
            setDiscountInput(String(draft.discount_price));

            if (draft.customer_id) {
                setSelectedCustomerId(draft.customer_id);
            } else if (draft.customer_name && draft.customer_name !== 'Walk-in Customer') {
                const existingCust = customers.find(c => c.name === draft.customer_name);
                if (existingCust) {
                    setSelectedCustomerId(existingCust.id);
                } else {
                    const tempId = `new_${Date.now()}`;
                    const tempCust: CustomerData = {
                        id: tempId,
                        name: draft.customer_name,
                        phone: draft.customer_phone,
                        is_new: true
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
    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(customerSearchQuery))
    );

    // Selected customer display text
    const selectedCustomerText = () => {
        const found = customers.find(c => c.id === selectedCustomerId);
        if (found) {
            return found.phone ? `${found.name} - ${found.phone}` : found.name;
        }
        return 'Pilih Customer...';
    };

    const cartItemCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    // Flatten products to display per measurement unit
    const flattenedProducts = products
        .filter(product => selectedCategory === null || product.product_id === selectedCategory)
        .flatMap(product => 
            product.measurements.map(measurement => {
                const displayName = `${product.name} ${measurement.unit.name}`;
                return {
                    ...product,
                    measurement,
                    displayName,
                    price: measurement.min_price,
                    stock: measurement.stock,
                    unitName: measurement.unit.name,
                    shortName: measurement.unit.short_name
                };
            })
        );

    const filteredProducts = flattenedProducts
        .filter(item => 
            item.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
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
                <div className={`fixed top-5 right-5 z-55 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl border backdrop-blur-md transition-all duration-300 animate-scale-up ${
                    alert.type === 'success' 
                        ? 'bg-emerald-50/90 border-emerald-250 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 shadow-emerald-500/5' 
                        : 'bg-rose-50/90 border-rose-250 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 shadow-rose-500/5'
                }`}>
                    {alert.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                    <span className="text-xs font-bold tracking-wide">{alert.message}</span>
                    <button onClick={() => setAlert(null)} className="ml-2.5 opacity-40 hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 flex-col relative">
                
                {/* ═══ Top Toolbar (Persistent on Desktop & Mobile) ═══ */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200/60 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md shrink-0 z-30 shadow-sm">
                    <div className="flex items-center gap-3">
                        {/* Back Button */}
                        <button
                            onClick={() => router.visit('/dashboard')}
                            className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.03] active:scale-95 transition-all duration-200 cursor-pointer shadow-sm"
                            title="Kembali ke Dashboard"
                        >
                            <ArrowLeft className="h-4.5 w-4.5" />
                        </button>

                        {/* Brand / Branch Select Button */}
                        <button
                            onClick={() => branches.length > 1 && setShowBranchModal(true)}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/45 bg-slate-50/50 dark:bg-slate-900/40 text-left transition-all duration-200 ${
                                branches.length > 1 
                                    ? 'hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' 
                                    : 'cursor-default'
                            }`}
                            title={branches.length > 1 ? "Ganti Cabang" : undefined}
                        >
                            <Store className="h-4 w-4 text-sky-500 dark:text-sky-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none truncate">POS Cabang</p>
                                <span className="text-xs font-black text-slate-800 dark:text-white tracking-tight leading-none block mt-0.5 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[280px] md:max-w-none">
                                    {selectedBranch ? selectedBranch.label : ''}
                                </span>
                            </div>
                            {branches.length > 1 && (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                            )}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle (Custom styled wrapper) */}
                        <div className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm relative">
                            <ThemeToggle className="relative inset-0" />
                        </div>

                        {/* Load Draft */}
                        <button
                            onClick={() => { fetchDrafts(); setShowDraftModal(true); }}
                            className="relative flex items-center justify-center h-9 px-3.5 gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer shadow-sm"
                            title="Load Draft Transaksi"
                        >
                            <FolderOpen className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                            <span className="hidden sm:inline">Draft</span>
                            {drafts.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-black text-white px-1 shadow-md shadow-amber-500/30 border-2 border-white dark:border-slate-950 animate-pulse">
                                    {drafts.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ═══ Tab Switcher (Mobile/Tablet Only) ═══ */}
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/50 dark:border-slate-800/40 shrink-0 lg:hidden flex gap-2">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-205 flex items-center justify-center gap-2 border ${
                            activeTab === 'catalog'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-800 shadow-sm'
                                : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Store className="h-4 w-4" />
                        Katalog Produk
                    </button>
                    <button
                        onClick={() => setActiveTab('cart')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-205 flex items-center justify-center gap-2 border relative ${
                            activeTab === 'cart'
                                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 border-slate-200 dark:border-slate-800 shadow-sm'
                                : 'bg-transparent text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <ShoppingCart className="h-4 w-4" />
                        Keranjang
                        {cartItemCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-sky-500 text-[10px] font-bold text-white min-w-[18px] shadow-sm">
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* ═══ Main Area (Split on Desktop, Stacked on Mobile) ═══ */}
                <div className="flex-1 min-h-0 flex overflow-hidden relative">
                    
                    {/* Left: Products Panel */}
                    <div className={`flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 lg:flex ${activeTab === 'catalog' ? 'flex' : 'hidden'}`}>
                        {/* Search & Category Filters */}
                        <div className="px-4 sm:px-6 py-4 space-y-3 bg-white/40 dark:bg-slate-900/10 border-b border-slate-200/40 dark:border-slate-800/30 shrink-0">
                            {/* Search Bar */}
                            <div className="relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Cari produk berdasarkan nama..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all text-slate-900 dark:text-white placeholder:text-slate-400 shadow-sm"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Category Pills */}
                            <div className="flex items-center gap-2 overflow-x-auto clean-scrollbar pb-1.5 -mx-1 px-1">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                                        selectedCategory === null
                                            ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-850 dark:hover:text-white'
                                    }`}
                                >
                                    Semua
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                                            selectedCategory === cat.id
                                                ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                                                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-850 dark:hover:text-white'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="flex-1 overflow-y-auto clean-scrollbar p-4 sm:p-6 pb-24 lg:pb-6">
                            {isLoadingProducts ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
                                    <span className="text-sm font-semibold text-slate-500">Memuat katalog produk...</span>
                                </div>
                            ) : filteredProducts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                    <div className="size-16 rounded-2xl bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center">
                                        <Folder className="h-7 w-7 text-slate-350 dark:text-slate-700" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Tidak ada produk ditemukan</p>
                                    <p className="text-xs text-slate-400 max-w-xs">Sesuaikan filter atau masukkan kata kunci pencarian lain.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 3xl:grid-cols-5 gap-3.5 sm:gap-4">
                                    {filteredProducts.map(item => {
                                        const cartItem = cart.find(
                                            c => c.product_item_id === item.id && c.selected_measurement_id === item.measurement.id
                                        );
                                        const isInCart = !!cartItem;
                                        const cartQty = cartItem ? cartItem.quantity : 0;

                                        return (
                                            <div 
                                                key={`${item.id}_${item.measurement.id}`}
                                                onClick={() => addToCart(item, item.measurement)}
                                                className={`flex flex-row sm:flex-col items-center sm:items-stretch gap-3.5 p-2.5 sm:p-0 overflow-hidden rounded-2xl bg-white dark:bg-slate-900/60 border hover:shadow-xl hover:shadow-sky-500/5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 group relative ${
                                                    isInCart 
                                                        ? 'border-sky-500 dark:border-sky-400 ring-[3px] ring-sky-500/20 bg-sky-50/10 dark:bg-sky-950/10 shadow-md shadow-sky-500/5' 
                                                        : 'border-slate-200/60 dark:border-slate-800/60 hover:border-sky-300 dark:hover:border-sky-500/40'
                                                }`}
                                            >
                                                {/* Product Image & Badges */}
                                                <div className="relative w-20 h-20 sm:w-full sm:h-auto sm:aspect-[4/3] bg-slate-100 dark:bg-slate-950 overflow-hidden rounded-xl sm:rounded-none border border-slate-100 dark:border-slate-850/50 sm:border-0 shrink-0">
                                                    <ProductImage src={item.image_url} alt={item.displayName} stock={item.stock} />
                                                    {item.stock <= 0 ? (
                                                        <div className="absolute inset-0 bg-slate-950/45 flex items-center justify-center backdrop-blur-[0.5px]">
                                                            <span className="text-[9px] sm:text-[10px] font-black text-white tracking-wider uppercase px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-rose-600/90 shadow-md">Habis</span>
                                                        </div>
                                                    ) : (
                                                        /* Stock badge overlay (desktop only) */
                                                        <div className="absolute top-2.5 right-2.5 hidden sm:block">
                                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg backdrop-blur-md shadow-sm border ${
                                                                item.stock > 10 
                                                                    ? 'bg-white/95 dark:bg-slate-900/95 text-slate-650 dark:text-slate-350 border-slate-150/40 dark:border-slate-800/40' 
                                                                    : 'bg-amber-500/90 text-white border-transparent'
                                                            }`}>
                                                                Stok: {item.stock} {item.shortName}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Selected Quantity Badge overlay */}
                                                    {isInCart && (
                                                        <div className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5">
                                                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 sm:min-w-[26px] sm:h-6 px-1.5 sm:px-2 rounded-lg bg-sky-500 text-[9px] sm:text-[11px] font-black text-white shadow-lg shadow-sky-500/35 border border-sky-400">
                                                                {cartQty}x
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 flex flex-col justify-between p-0.5 sm:p-3.5 min-w-0 h-20 sm:h-auto">
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest leading-none">
                                                                {item.product_name}
                                                            </span>
                                                            <span className={`text-[9px] font-bold sm:hidden leading-none ${
                                                                item.stock <= 0 
                                                                    ? 'text-rose-500' 
                                                                    : item.stock <= 10 
                                                                        ? 'text-amber-500' 
                                                                        : 'text-slate-400 dark:text-slate-500'
                                                            }`}>
                                                                • Stok: {item.stock} {item.shortName}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-205 leading-snug mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1 sm:line-clamp-2 min-h-[16px] sm:min-h-[32px] truncate sm:whitespace-normal" title={item.displayName}>
                                                            {item.displayName}
                                                        </h3>
                                                    </div>

                                                    <div className="mt-2 sm:mt-3.5 pt-2 sm:pt-2.5 border-t border-slate-50 dark:border-slate-800/30 flex items-center justify-between">
                                                        <span className="text-xs sm:text-sm font-black text-sky-600 dark:text-sky-400">
                                                            Rp {item.price.toLocaleString('id-ID')}
                                                        </span>
                                                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 px-1.5 py-0.5 rounded-md border border-slate-100/50 dark:border-slate-800/20">
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
                    <div className={`w-full lg:w-[380px] xl:w-[410px] shrink-0 flex flex-col bg-white dark:bg-slate-900/40 border-l border-slate-200/50 dark:border-slate-800/40 lg:flex ${activeTab === 'cart' ? 'flex' : 'hidden'}`}>
                        {/* Cart Header */}
                        <div className="hidden lg:flex items-center justify-between px-5 py-4 border-b border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-slate-900/60 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="flex items-center justify-center size-8 rounded-xl bg-sky-50 dark:bg-sky-500/10">
                                    <ShoppingCart className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">Keranjang Belanja</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {cart.length > 0 && (
                                    <>
                                        <span className="hidden lg:inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-sky-500 text-[10px] font-bold text-white min-w-[20px] shadow-sm">
                                            {cartItemCount} item
                                        </span>
                                        <button
                                            onClick={clearCart}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
                                            title="Kosongkan Keranjang"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto clean-scrollbar px-5 py-4 pb-64 lg:pb-4 space-y-3 bg-slate-50/30 dark:bg-slate-900/10">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                                    <div className="size-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                                        <ReceiptText className="h-6 w-6 text-slate-300 dark:text-slate-700 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Keranjang kosong</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 max-w-[180px]">Pilih produk dari katalog untuk memulai transaksi.</p>
                                    </div>
                                </div>
                            ) : (
                                cart.map(item => {
                                    return (
                                        <div 
                                            key={`${item.product_item_id}-${item.selected_measurement_id}`}
                                            className="py-3 border-b border-slate-150/50 dark:border-slate-800/40 flex items-center justify-between gap-3"
                                        >
                                            {/* Left side: Item Name & Unit */}
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate" title={`${item.name} ${item.short_name}`}>
                                                    {item.name}
                                                </h4>
                                                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 block">
                                                    Satuan: {item.short_name}
                                                </span>
                                            </div>

                                            {/* Right side: Qty controls, Price & Delete */}
                                            <div className="flex items-center gap-3.5 shrink-0">
                                                {/* Compact Quantity Controls */}
                                                <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden size-fit">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQuantity(item.product_item_id, item.selected_measurement_id, Number(item.quantity || 0) - (item.allow_decimal ? 0.5 : 1))}
                                                        className="p-1.5 hover:bg-slate-150/50 dark:hover:bg-slate-900 text-slate-500 transition-colors cursor-pointer"
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode={item.allow_decimal ? "decimal" : "numeric"}
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            let val = e.target.value;
                                                            if (item.allow_decimal) {
                                                                val = val.replace(',', '.');
                                                                val = val.replace(/[^0-9.]/g, '');
                                                                const parts = val.split('.');
                                                                if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                                                            } else {
                                                                val = val.replace(/\D/g, '');
                                                            }
                                                            updateCartQuantity(item.product_item_id, item.selected_measurement_id, val);
                                                        }}
                                                        onBlur={(e) => {
                                                            let val = Number(e.target.value);
                                                            if (isNaN(val) || val <= 0) val = 1;
                                                            updateCartQuantity(item.product_item_id, item.selected_measurement_id, val);
                                                        }}
                                                        className="w-12 text-center text-sm font-black border-0 focus:ring-0 p-0 leading-none bg-transparent text-slate-900 dark:text-white"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => updateCartQuantity(item.product_item_id, item.selected_measurement_id, Number(item.quantity || 0) + (item.allow_decimal ? 0.5 : 1))}
                                                        className="p-1.5 hover:bg-slate-150/50 dark:hover:bg-slate-900 text-slate-500 transition-colors cursor-pointer"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                {/* Price */}
                                                <div className="text-right min-w-[75px]">
                                                    {item.price < item.base_price && (
                                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 line-through block leading-none mb-0.5 font-medium">
                                                            Rp {(item.base_price * Number(item.quantity || 0)).toLocaleString('id-ID')}
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none block">
                                                        Rp {(item.price * Number(item.quantity || 0)).toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 leading-none block">
                                                        @ Rp {item.price.toLocaleString('id-ID')}
                                                    </span>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => removeFromCart(item.product_item_id, item.selected_measurement_id)}
                                                    className="p-1 text-slate-350 hover:text-rose-500 transition-colors cursor-pointer"
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
                        <div className="px-5 py-4 space-y-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-850 shrink-0 fixed bottom-0 left-0 right-0 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto lg:shadow-none lg:border-slate-200/50 lg:dark:border-slate-800/40 lg:bg-white lg:dark:bg-slate-900/60 lg:backdrop-blur-sm">
                            <div className="p-4 bg-slate-55/80 dark:bg-slate-950/40 rounded-2xl border border-slate-150/80 dark:border-slate-850/60 space-y-3">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="text-slate-800 dark:text-slate-350">Rp {getSubtotal().toLocaleString('id-ID')}</span>
                                </div>

                                <div 
                                    onClick={() => { 
                                        setDiscountInput(discountPrice > 0 ? discountPrice.toLocaleString('id-ID') : ''); 
                                        setShowDiscountModal(true); 
                                    }}
                                    className="flex items-center justify-between text-xs font-black text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-350 cursor-pointer group"
                                >
                                    <span className="flex items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5 text-sky-500 group-hover:scale-105 transition-transform" />
                                        Diskon
                                    </span>
                                    <span className="border-b border-dashed border-sky-400">
                                        {discountPrice > 0 ? `- Rp ${discountPrice.toLocaleString('id-ID')}` : 'Tambah diskon...'}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-1" />

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">Total Bayar</span>
                                    <span className="text-lg font-black text-slate-950 dark:text-white tabular-nums animate-scale-up">
                                        Rp {getTotalPayment().toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-1 pb-2 lg:pb-0">
                                <button
                                    onClick={() => handleCheckout('draft')}
                                    disabled={isSubmitting || cart.length === 0}
                                    className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-black text-slate-700 dark:text-slate-300 rounded-xl transition-all disabled:opacity-40 hover:scale-[1.01] active:scale-99 cursor-pointer shadow-sm"
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
                                    className="flex-[1.6] inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-xs font-black text-white rounded-xl shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all disabled:opacity-40 disabled:shadow-none hover:scale-[1.01] active:scale-99 cursor-pointer"
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
                    <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden">
                        <div 
                            onClick={() => setActiveTab('cart')}
                            className="backdrop-blur-md bg-sky-500/90 dark:bg-sky-600/90 text-white rounded-2xl shadow-xl shadow-sky-500/20 px-4 py-3 flex items-center justify-between hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer border border-sky-400/20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative p-2 rounded-xl bg-white/20">
                                    <ShoppingCart className="h-5 w-5 text-white animate-pulse" />
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-1 ring-white">
                                        {cartItemCount}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-medium text-sky-100">Keranjang Belanja</p>
                                    <p className="text-sm font-black text-white leading-none mt-0.5">
                                        Rp {getTotalPayment().toLocaleString('id-ID')}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-black bg-white text-sky-600 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm">
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
                            Pilih cabang penjualan tempat Anda akan mengoperasikan kasir POS.
                        </p>
                        <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto clean-scrollbar pr-1">
                            {branches.map(b => (
                                <button
                                    key={b.id}
                                    onClick={() => {
                                        setSelectedBranch(b);
                                        setShowBranchModal(false);
                                        setCart([]);
                                    }}
                                    className={`w-full text-left p-3.5 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all hover:scale-[1.01] cursor-pointer ${
                                        selectedBranch?.id === b.id
                                            ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-extrabold ring-2 ring-sky-500/20'
                                            : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-300'
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
                <form onSubmit={handleNewCustomerSubmit} className="space-y-4 py-2">
                    <FormInput
                        name="name"
                        label="Nama Lengkap"
                        value={newCustomerForm.name}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                        placeholder="Masukkan nama customer..."
                        required
                    />

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            Nomor Telepon
                        </label>
                        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-300 dark:focus-within:border-sky-600 transition-all">
                            <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 select-none shrink-0">
                                +62
                            </span>
                            <input
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={newCustomerForm.phone}
                                onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value.replace(/\D/g, '') })}
                                placeholder="812xxxxxxxx"
                                className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none border-0 focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                        <button
                            type="button"
                            onClick={() => setShowNewCustomerModal(false)}
                            className="px-4.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-655 hover:shadow-sky-500/30 transition-all cursor-pointer"
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
                            setDiscountInput(val ? Number(val).toLocaleString('id-ID') : '');
                        }}
                        placeholder="0"
                    />

                    {/* Calculation breakdown */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150/60 dark:border-slate-850/50 space-y-2 mt-3 shadow-inner">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Total Awal</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-350">
                                Rp {getSubtotal().toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>Potongan Diskon</span>
                            <span className="font-semibold text-rose-600 dark:text-rose-450">
                                - Rp {(parseFloat(discountInput.replace(/\./g, '')) || 0).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-1" />
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                            <span>Total Pembayaran</span>
                            <span className="text-sm font-black text-sky-600 dark:text-sky-400">
                                Rp {Math.max(0, getSubtotal() - (parseFloat(discountInput.replace(/\./g, '')) || 0)).toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                        <button
                            type="button"
                            onClick={() => setShowDiscountModal(false)}
                            className="px-4.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-655 hover:shadow-sky-500/30 transition-all cursor-pointer"
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
                        Daftar transaksi pesanan yang disimpan sebagai draft di cabang ini.
                    </p>

                    {isLoadingDrafts ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
                        </div>
                    ) : drafts.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500 font-bold border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            Belum ada draft untuk cabang ini.
                        </div>
                    ) : (
                        <div className="space-y-2.5 max-h-96 overflow-y-auto clean-scrollbar pr-1">
                            {drafts.map(dr => (
                                <div 
                                    key={dr.id}
                                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-sky-300 dark:hover:border-sky-500/40 bg-white dark:bg-slate-900/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-xs text-slate-900 dark:text-white leading-none">
                                                {dr.customer_name}
                                            </span>
                                            {dr.customer_phone && (
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-none">
                                                    ({dr.customer_phone})
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1.5 line-clamp-1">
                                            {dr.items.map(i => `${i.name} (${i.quantity} ${i.unit_name})`).join(', ')}
                                        </p>
                                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 block">
                                            {dr.created_at}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => loadDraftToCart(dr)}
                                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-xs font-black text-sky-600 dark:text-sky-400 rounded-xl transition-all hover:scale-[1.03] active:scale-97 cursor-pointer"
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
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">
                                Tambah Customer Baru
                            </h4>
                            <div className="space-y-3">
                                <FormInput
                                    name="new_name"
                                    label="Nama Lengkap"
                                    value={newCustomerForm.name}
                                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                                    placeholder="Masukkan nama customer..."
                                    required
                                />
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                                        Nomor Telepon
                                    </label>
                                    <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
                                        <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 border-r border-slate-200 dark:border-slate-700 select-none shrink-0">
                                            +62
                                        </span>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={newCustomerForm.phone}
                                            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value.replace(/\D/g, '') })}
                                            placeholder="812xxxxxxxx"
                                            className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none border-0 focus:ring-0"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewCustomerForm({ name: '', phone: '' });
                                        setIsAddingNewCustomer(false);
                                    }}
                                    className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!newCustomerForm.name.trim()) {
                                            triggerAlert('error', 'Nama customer wajib diisi.');
                                            return;
                                        }
                                        const tempId = `new_${Date.now()}`;
                                        const newCustomer: CustomerData = {
                                            id: tempId,
                                            name: newCustomerForm.name,
                                            phone: newCustomerForm.phone || null,
                                            is_new: true
                                        };
                                        setCustomers([newCustomer, ...customers]);
                                        setSelectedCustomerId(tempId);
                                        setCustomerSearchQuery(newCustomer.name);
                                        setNewCustomerForm({ name: '', phone: '' });
                                        setIsAddingNewCustomer(false);
                                        triggerAlert('success', 'Customer berhasil ditambahkan secara lokal.');
                                    }}
                                    className="px-4 py-1.5 bg-sky-500 text-white rounded-xl text-[11px] font-bold shadow-md hover:bg-sky-600 transition-colors cursor-pointer"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Customer Selection dropdown view */
                        <div className="space-y-1.5 relative" ref={customerDropdownRef}>
                            <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350">
                                    Pilih Customer
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingNewCustomer(true)}
                                    className="text-[10px] font-black text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors flex items-center gap-1 cursor-pointer"
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
                                    onFocus={() => setIsCustomerDropdownOpen(true)}
                                    onChange={(e) => {
                                        setCustomerSearchQuery(e.target.value);
                                        setIsCustomerDropdownOpen(true);
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-900 dark:text-white"
                                />
                                {selectedCustomerId ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomerId('');
                                            setCustomerSearchQuery('');
                                        }}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>

                            {/* Customer Dropdown list */}
                            {isCustomerDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-48 overflow-y-auto clean-scrollbar p-1.5 space-y-0.5">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedCustomerId('');
                                            setCustomerSearchQuery('');
                                            setIsCustomerDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                                            selectedCustomerId === ''
                                                ? 'bg-sky-500 text-white font-extrabold'
                                                : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                        }`}
                                    >
                                        Walk-in Customer (Umum)
                                    </button>
                                    {filteredCustomers.map(cust => (
                                        <button
                                            key={cust.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCustomerId(cust.id);
                                                setCustomerSearchQuery(cust.name);
                                                setIsCustomerDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between ${
                                                selectedCustomerId === cust.id
                                                    ? 'bg-sky-500 text-white font-extrabold'
                                                    : 'text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                            }`}
                                        >
                                            <span>{cust.name}</span>
                                            {cust.phone && (
                                                <span className={`text-[10px] ${selectedCustomerId === cust.id ? 'text-sky-100' : 'text-slate-400 dark:text-slate-550'}`}>
                                                    {cust.phone}
                                                </span>
                                            )}
                                        </button>
                                    ))}
                                    {filteredCustomers.length === 0 && (
                                        <div className="px-3 py-2 text-center text-[10px] text-slate-400 font-medium italic">
                                            Tidak ada customer cocok
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Selected Customer Preview Card */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150/60 dark:border-slate-850/50 flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                            <User className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black text-slate-450 dark:text-slate-550 uppercase tracking-widest leading-none">Customer Terpilih</p>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-1 leading-none">
                                {selectedCustomerText() === 'Pilih Customer...' ? 'Walk-in Customer (Umum)' : selectedCustomerText()}
                            </h4>
                        </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350">
                            Metode Pembayaran
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            {/* Cash Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Cash')}
                                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                    paymentMethod === 'Cash'
                                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-extrabold ring-2 ring-sky-500/20'
                                        : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-300'
                                }`}
                            >
                                <Coins className={`h-5 w-5 ${paymentMethod === 'Cash' ? 'text-sky-500' : 'text-slate-400'}`} />
                                <span className="text-xs font-black">Cash</span>
                            </button>

                            {/* Transfer Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('Transfer')}
                                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                    paymentMethod === 'Transfer'
                                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-extrabold ring-2 ring-sky-500/20'
                                        : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-300'
                                }`}
                            >
                                <CreditCard className={`h-5 w-5 ${paymentMethod === 'Transfer' ? 'text-sky-500' : 'text-slate-400'}`} />
                                <span className="text-xs font-black">Transfer</span>
                            </button>

                            {/* QRIS Option */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('QRIS')}
                                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                                    paymentMethod === 'QRIS'
                                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-extrabold ring-2 ring-sky-500/20'
                                        : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-300'
                                }`}
                            >
                                <QrCode className={`h-5 w-5 ${paymentMethod === 'QRIS' ? 'text-sky-500' : 'text-slate-400'}`} />
                                <span className="text-xs font-black">QRIS</span>
                            </button>
                        </div>
                    </div>

                    {/* Total billing detail */}
                    <div className="p-4 bg-slate-55/80 dark:bg-slate-950/40 rounded-2xl border border-slate-150/80 dark:border-slate-850/60 space-y-2 mt-3">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-455">
                            <span>Total Tagihan</span>
                            <span className="text-slate-800 dark:text-slate-300">Rp {getSubtotal().toLocaleString('id-ID')}</span>
                        </div>
                        {discountPrice > 0 && (
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-455">
                                <span>Potongan Diskon</span>
                                <span className="text-rose-600 dark:text-rose-400">- Rp {discountPrice.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-1" />
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">Total Wajib Bayar</span>
                            <span className="text-base font-black text-sky-600 dark:text-sky-400 tabular-nums">
                                Rp {getTotalPayment().toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                        <button
                            type="button"
                            onClick={() => setShowPaymentModal(false)}
                            className="px-4.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={() => handleCheckout('completed')}
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-sky-600 hover:shadow-sky-500/30 transition-all cursor-pointer flex items-center gap-1.5"
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
