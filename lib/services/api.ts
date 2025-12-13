import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage if available
        if (typeof window !== 'undefined') {
            const adminStore = localStorage.getItem('royal-commerce-admin');
            if (adminStore) {
                try {
                    const parsed = JSON.parse(adminStore);
                    if (parsed.state?.token) {
                        config.headers.Authorization = `Bearer ${parsed.state.token}`;
                    }
                } catch {
                    // Ignore parse errors
                }
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - could redirect to login
            if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
                localStorage.removeItem('royal-commerce-admin');
                window.location.href = '/admin';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// API helper functions
export const productsApi = {
    getAll: (params?: { limit?: number; search?: string; category?: string; type?: string; minPrice?: number; maxPrice?: number }) =>
        api.get('/products', { params }),
    getById: (id: string) => api.get(`/products/${id}`),
    create: (data: FormData | object) => api.post('/products', data),
    update: (id: string, data: FormData | object) => api.put(`/products/${id}`, data),
    delete: (id: string) => api.delete(`/products/${id}`),
};

export const ordersApi = {
    getAll: (params?: { status?: string; page?: number; limit?: number }) =>
        api.get('/orders', { params }),
    getById: (id: string) => api.get(`/orders/${id}`),
    getByOrderId: (orderId: string) => api.get(`/orders/track/${orderId}`),
    create: (data: object) => api.post('/orders', data),
    updateStatus: (id: string, status: object) => api.patch(`/orders/${id}`, status),
};

export const authApi = {
    adminLogin: (email: string, password: string) =>
        api.post('/auth/admin', { email, password }),
    verifyToken: () => api.get('/auth/verify'),
};

export const dashboardApi = {
    getMetrics: () => api.get('/dashboard/metrics'),
};

export const settingsApi = {
    get: () => api.get('/settings'),
    update: (data: object) => api.put('/settings', data),
};

export const categoriesApi = {
    getAll: () => api.get('/categories'),
    getById: (id: string) => api.get(`/categories/${id}`),
    create: (data: object) => api.post('/categories', data),
    update: (id: string, data: object) => api.put(`/categories/${id}`, data),
    delete: (id: string) => api.delete(`/categories/${id}`),
};

export const usersApi = {
    getAll: () => api.get('/users'),
    getById: (id: string) => api.get(`/users/${id}`),
    update: (id: string, data: object) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
};

