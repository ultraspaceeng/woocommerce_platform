import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

export interface CartItem {
    product: Product;
    quantity: number;
    selectedOptions?: Record<string, string>;
}

// Message types for real-time feedback
export interface CartMessage {
    type: 'success' | 'warning' | 'error';
    message: string;
    timestamp: number;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    lastMessage: CartMessage | null;

    // Actions
    addItem: (product: Product, quantity?: number, options?: Record<string, string>) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    clearMessage: () => void;

    // Computed
    getItemCount: () => number;
    getSubtotal: () => number;
    getTotal: () => number;
    isInCart: (productId: string) => boolean;
    getCartItemQuantity: (productId: string) => number;
    getAvailableStock: (product: Product) => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            lastMessage: null,

            addItem: (product, quantity = 1, options) => {
                const { items } = get();
                const existingIndex = items.findIndex(
                    (item) =>
                        item.product._id === product._id &&
                        JSON.stringify(item.selectedOptions) === JSON.stringify(options)
                );

                // For digital products, only allow one in cart
                if (product.type === 'digital') {
                    if (existingIndex >= 0) {
                        // Digital product already in cart - don't add again
                        set({
                            lastMessage: {
                                type: 'warning',
                                message: `"${product.title}" is already in your cart`,
                                timestamp: Date.now(),
                            },
                        });
                        return;
                    }
                    // Digital products: add with quantity 1
                    set({
                        items: [...items, { product, quantity: 1, selectedOptions: options }],
                        lastMessage: {
                            type: 'success',
                            message: `Added "${product.title}" to cart`,
                            timestamp: Date.now(),
                        },
                    });
                    return;
                }

                // Physical products: check stock limits
                const availableStock = product.inventory?.stock ?? 0;
                const currentQtyInCart = existingIndex >= 0 ? items[existingIndex].quantity : 0;

                // Don't allow adding if out of stock
                if (availableStock <= 0) {
                    set({
                        lastMessage: {
                            type: 'error',
                            message: `"${product.title}" is out of stock`,
                            timestamp: Date.now(),
                        },
                    });
                    return;
                }

                // Cap at available stock
                const maxCanAdd = Math.max(0, availableStock - currentQtyInCart);
                const actualQuantityToAdd = Math.min(quantity, maxCanAdd);

                if (actualQuantityToAdd <= 0) {
                    set({
                        lastMessage: {
                            type: 'warning',
                            message: `Maximum stock reached for "${product.title}" (${availableStock} available)`,
                            timestamp: Date.now(),
                        },
                    });
                    return;
                }

                if (existingIndex >= 0) {
                    // Update quantity of existing item
                    const newItems = [...items];
                    newItems[existingIndex].quantity += actualQuantityToAdd;

                    const wasLimited = actualQuantityToAdd < quantity;
                    set({
                        items: newItems,
                        lastMessage: {
                            type: wasLimited ? 'warning' : 'success',
                            message: wasLimited
                                ? `Added ${actualQuantityToAdd} (max stock: ${availableStock})`
                                : `Updated cart: ${newItems[existingIndex].quantity}× "${product.title}"`,
                            timestamp: Date.now(),
                        },
                    });
                } else {
                    // Add new item
                    const wasLimited = actualQuantityToAdd < quantity;
                    set({
                        items: [...items, { product, quantity: actualQuantityToAdd, selectedOptions: options }],
                        lastMessage: {
                            type: wasLimited ? 'warning' : 'success',
                            message: wasLimited
                                ? `Added ${actualQuantityToAdd}× "${product.title}" (max stock: ${availableStock})`
                                : `Added "${product.title}" to cart`,
                            timestamp: Date.now(),
                        },
                    });
                }
            },

            removeItem: (productId) => {
                set({
                    items: get().items.filter((item) => item.product._id !== productId),
                });
            },

            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }

                const { items } = get();
                const item = items.find((i) => i.product._id === productId);

                if (!item) return;

                // For physical products, validate against stock
                if (item.product.type !== 'digital') {
                    const availableStock = item.product.inventory?.stock ?? 0;
                    const safeQuantity = Math.min(quantity, availableStock);

                    if (safeQuantity !== quantity) {
                        console.warn(`Quantity adjusted to ${safeQuantity} (max stock: ${availableStock})`);
                    }

                    set({
                        items: items.map((i) =>
                            i.product._id === productId
                                ? { ...i, quantity: safeQuantity }
                                : i
                        ),
                    });
                } else {
                    // Digital products always have quantity 1
                    set({
                        items: items.map((i) =>
                            i.product._id === productId
                                ? { ...i, quantity: 1 }
                                : i
                        ),
                    });
                }
            },

            clearCart: () => set({ items: [] }),

            toggleCart: () => set({ isOpen: !get().isOpen }),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            getItemCount: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            getSubtotal: () => {
                return get().items.reduce((total, item) => {
                    const price = item.product.discountedPrice || item.product.price;
                    return total + price * item.quantity;
                }, 0);
            },

            getTotal: () => {
                // For now, total equals subtotal. Add tax/shipping later.
                return get().getSubtotal();
            },

            isInCart: (productId: string) => {
                return get().items.some((item) => item.product._id === productId);
            },

            clearMessage: () => set({ lastMessage: null }),

            getCartItemQuantity: (productId: string) => {
                const item = get().items.find((i) => i.product._id === productId);
                return item?.quantity ?? 0;
            },

            getAvailableStock: (product: Product) => {
                // For digital products, always return 1 (can only buy once)
                if (product.type === 'digital') {
                    return get().isInCart(product._id) ? 0 : 1;
                }
                // For physical products, return stock minus what's already in cart
                const inCartQty = get().getCartItemQuantity(product._id);
                const totalStock = product.inventory?.stock ?? 0;
                return Math.max(0, totalStock - inCartQty);
            },
        }),
        {
            name: 'royal-commerce-cart',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ items: state.items }),
        }
    )
);
