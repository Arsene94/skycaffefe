const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

class ApiClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;

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

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseURL}${endpoint}`;

        // Detect FormData to avoid setting JSON content-type
        const isFormData =
            typeof FormData !== 'undefined' && options.body instanceof FormData;

        const defaultHeaders: Record<string, string> = {
            Accept: 'application/json',
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        };

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
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
                return (await response.json()) as T;
            } else {
                return {} as T;
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ----------------
    // Auth endpoints
    // ----------------
    async loginPin(credentials: { pin: string }) {
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

    async loginEmail(credentials: { email: string; password: string }) {
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

    // ----------------
    // Products
    // ----------------
    async getProducts(params?: {
        search?: string;
        category_id?: string | number | undefined;
        page?: number;
        pageSize?: number;
    }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/products${qs}`, {
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
            // NOTE: no Content-Type here; browser sets multipart boundary
        });
    }

    async createProduct(payload: any) {
        return this.request<any>('/admin/products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateProduct(id: string | number, payload: any) {
        return this.request<any>(`/admin/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }

    async deleteProduct(id: string | number) {
        return this.request<any>(`/admin/products/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    }

    async getProductTags() {
        return this.request<string[]>('/products/tags');
    }

    async createProductTag(name: string) {
        return this.request<any>('/admin/products/tags', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    async generateNutritionalValues(payload: any) {
        return this.request<any>('/admin/products/generate-nutritional-values', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // ----------------
    // Categories
    // ----------------
    async getCategories(params?: { search?: string; page?: number; pageSize?: number }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/categories${qs}`, {
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

    async updateCategory(
        id: string | number,
        payload: Partial<{
            name: string;
            slug: string;
            description?: string | null;
            icon?: string | null;
            order?: number;
        }>
    ) {
        return this.request<any>(`/admin/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }

    async deleteCategory(id: string | number) {
        return this.request<any>(`/admin/categories/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    }

    async updateCategoryOrder(orders: { id: string | number; order: number }[]) {
        return this.request<any>(`/admin/categories/order`, {
            method: 'POST',
            body: JSON.stringify({ orders }),
        });
    }

    async getPopularCategories() {
        return this.request<any>('/categories/popular', {
            next: { revalidate: 3600 },
        });
    }

    // ----------------
    // Recommendations (Queue per category)
    // ----------------

    // GET /api/recommendations?category_id=77
    async getRecommendations(params: { category_id: string | number }) {
        const qs = `?${new URLSearchParams({
            category_id: String(params.category_id),
        })}`;
        return this.request<any>(`/recommendations${qs}`);
    }

    // POST /api/recommendations
    async createRecommendation(payload: {
        category_id: string | number;
        product_id: string | number;
        duration: number;
        unit: 'days' | 'weeks' | 'months';
        start_at?: string | null;
    }) {
        return this.request<any>('/admin/recommendations', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // PUT /api/recommendations/reorder
    async reorderRecommendations(payload: {
        category_id: string | number;
        items: { id: number | string; position: number }[];
    }) {
        return this.request<any>('/admin/recommendations/reorder', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    }

    // DELETE /api/recommendations/{id}
    async deleteRecommendation(id: string | number) {
        return this.request<void>(`/admin/recommendations/${id}`, {
            method: 'DELETE',
        });
    }

    // GET /api/recommendations/active?category_id=77
    async getActiveRecommendation(params: { category_id: string | number }) {
        const qs = `?${new URLSearchParams({
            category_id: String(params.category_id),
        })}`;
        return this.request<any>(`/recommendations/active${qs}`);
    }

    // ----------------
    // Offers
    // ----------------

    // Public: active now (opțional paginat dacă trimiți pageSize)
    async getOffers(params?: {
        search?: string;
        type?: 'PERCENT' | 'FIXED';
        application_type?: 'cart' | 'category' | 'product_ids';
        category_id?: string | number;
        page?: number;
        pageSize?: number;
    }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/offers${qs}`);
    }

    // Admin list (paginat ca la products)
    async getAdminOffers(params?: {
        search?: string;
        type?: 'PERCENT' | 'FIXED';
        application_type?: 'cart' | 'category' | 'product_ids';
        category_id?: string | number;
        page?: number;
        pageSize?: number;
    }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/admin/offers${qs}`);
    }

    async createOffer(payload: {
        code: string;
        name: string;
        description?: string;
        type: 'PERCENT' | 'FIXED';
        value: number;
        application_type: 'cart' | 'category' | 'product_ids';
        category_id?: number | string | null;
        product_ids?: (number | string)[];
        conditions?: { minItems?: number; minSubtotal?: number };
        stackable?: boolean;
        priority?: number;
        active?: boolean;
        starts_at?: string | null;
        ends_at?: string | null;
    }) {
        return this.request<any>('/admin/offers', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateOffer(id: number | string, payload: Partial<{
        code: string;
        name: string;
        description?: string;
        type: 'PERCENT' | 'FIXED';
        value: number;
        application_type: 'cart' | 'category' | 'product_ids';
        category_id?: number | string | null;
        product_ids?: (number | string)[];
        conditions?: { minItems?: number; minSubtotal?: number } | null;
        stackable?: boolean;
        priority?: number;
        active?: boolean;
        starts_at?: string | null;
        ends_at?: string | null;
    }>) {
        return this.request<any>(`/admin/offers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }

    async deleteOffer(id: number | string) {
        return this.request<any>(`/admin/offers/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleOfferActive(id: number | string) {
        return this.request<any>(`/admin/offers/${id}/toggle`, {
            method: 'POST',
        });
    }

    async reorderOffers(orders: { id: number | string; priority: number }[]) {
        return this.request<any>('/admin/offers/reorder', {
            method: 'POST',
            body: JSON.stringify({ orders }),
        });
    }

    // doar pentru application_type = product_ids
    async syncOfferProducts(id: number | string, product_ids: (number | string)[]) {
        return this.request<any>(`/admin/offers/${id}/products`, {
            method: 'PUT',
            body: JSON.stringify({ product_ids }),
        });
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
