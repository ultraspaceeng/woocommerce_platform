import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

export interface CartItem {
    product: Product;
    quantity: number;
    selectedOptions?: Record<string, string>;
}

interface CartState {
    items: CartItem[];
    isOpen: boolean;
    isCartOpen: boolean;

    // Actions
    addItem: (product: Product, quantity?: number, options?: Record<string, string>) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;

    // Computed
    getItemCount: () => number;
    getSubtotal: () => number;
    getTotal: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            isCartOpen: false,

            addItem: (product, quantity = 1, options) => {
                const { items } = get();
                const existingIndex = items.findIndex(
                    (item) =>
                        item.product._id === product._id &&
                        JSON.stringify(item.selectedOptions) === JSON.stringify(options)
                );

                if (existingIndex >= 0) {
                    // Update quantity of existing item
                    const newItems = [...items];
                    newItems[existingIndex].quantity += quantity;
                    set({ items: newItems });
                } else {
                    // Add new item
                    set({
                        items: [...items, { product, quantity, selectedOptions: options }],
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
                set({
                    items: get().items.map((item) =>
                        item.product._id === productId
                            ? { ...item, quantity }
                            : item
                    ),
                });
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
        }),
        {
            name: 'royal-commerce-cart',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ items: state.items }),
        }
    )
);
