const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

class ApiClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;

        // Get token from localStorage if available
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    }

    removeToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...(options.headers || {}),
            },
            credentials: 'include',
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return {} as T;
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async loginPin(credentials: { pin: string; }) {
        const response = await this.request<{
            access_token: string;
            user: any;
        }>('/users/login/pin', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(credentials),
        });

        this.setToken(response.access_token);
        return response;
    }

    async loginEmail(credentials: { email: string; password: string; }) {
        const response = await this.request<{
            access_token: string;
            user: any;
        }>('/users/login/email', {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(credentials),
        });

        this.setToken(response.access_token);
        return response;
    }

    async register(userData: {
        email: string;
        password: string;
        name: string;
        address: string;
        phone: string;
    }) {
        const response = await this.request<{
            access_token: string;
            user: any;
        }>('/users/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        this.setToken(response.access_token);
        return response;
    }

    async getProfile() {
        return this.request<any>('/users/profile');
    }

    async getProducts(params?: { search?: string; category_id?: string | number | undefined; page?: number; pageSize?: number }) {
        return this.request<any>(`/products?${new URLSearchParams(params as any)}`, {
            next: { revalidate: 0 },
        });
    }

    async uploadProductImage(file: File): Promise<{ url: string }> {
        const formData = new FormData();
        formData.append('image', file);

        return this.request<any>('/admin/products/upload-image', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
        });
    }

    async createProduct(payload: any) {
        return this.request<any>('/admin/products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateProduct(id: string, payload: any) {
        return this.request<any>(`/admin/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
            },
        });
    }

    async deleteProduct(id: string | number) {
        return this.request<{ status: string }>(`/admin/products/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
        });
    }

    async getProductTags() {
        return this.request<string[]>('/products/tags');
    }

    async createProductTag(name: string) {
        return this.request<{ id: number; name: string }>('/admin/products/tags', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    async getCategories(params?: { search?: string; page?: number; pageSize?: number }) {
        return this.request<any>(`/categories?${new URLSearchParams(params as any)}`, {
            next: { revalidate: 0 },
        });
    }

    async getCategory(id: string | number) {
        return this.request<any>(`/admin/categories/${id}`);
    }

    async createCategory(payload: {
        name: string;
        slug: string;
        description?: string;
        icon?: string;
        order?: number;
    }) {
        return this.request<any>('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateCategory(id: string | number, payload: Partial<{
        name: string;
        slug: string;
        description?: string | null;
        icon?: string | null;
        order?: number;
    }>) {
        return this.request<any>(`/admin/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
            },
        });
    }

    async deleteCategory(id: string | number) {
        return this.request<{ status: string }>(`/admin/categories/${id}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
            },
        });
    }

    async updateCategoryOrder(
        orders: { id: string | number; order: number }[]
    ) {
        return this.request<{ status: string }>(`/admin/categories/order`, {
            method: 'POST',
            body: JSON.stringify({ orders }),
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
