import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Theme } from '@/types';

interface UIState {
    theme: Theme;
    sidebarOpen: boolean;
    mobileMenuOpen: boolean;

    // Actions
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    setMobileMenuOpen: (open: boolean) => void;
    toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            sidebarOpen: true,
            mobileMenuOpen: false,

            setTheme: (theme) => {
                set({ theme });
                document.documentElement.setAttribute('data-theme', theme);
            },

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                get().setTheme(newTheme);
            },

            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

            setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
            toggleMobileMenu: () => set({ mobileMenuOpen: !get().mobileMenuOpen }),
        }),
        {
            name: 'royal-commerce-ui',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
        }
    )
);
