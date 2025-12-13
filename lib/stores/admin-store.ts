import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AdminState {
    isAuthenticated: boolean;
    email: string | null;
    token: string | null;

    // Actions
    login: (email: string, token: string) => void;
    logout: () => void;
    getAuthHeader: () => {}
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set, get) => ({
            isAuthenticated: false,
            email: null,
            token: null,

            login: (email, token) => {
                set({
                    isAuthenticated: true,
                    email,
                    token,
                });
            },

            logout: () => {
                set({
                    isAuthenticated: false,
                    email: null,
                    token: null,
                });
            },

            getAuthHeader: () => {
                const { token } = get();
                return token ? { Authorization: `Bearer ${token}` } : {};
            },
        }),
        {
            name: 'royal-commerce-admin',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
