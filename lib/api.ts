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

    async register(payload: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        address?: string;
        city?: string;
        label?: string;
    }) {
        const resp = await this.request<{ access_token: string; user: any }>('/users/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        this.setToken(resp.access_token);
        return resp;
    }

    async getProfile() {
        return this.request<any>('/users/profile');
    }

    async updateProfile(payload: Partial<{ name: string; phone: string; password?: string }>) {
        return this.request<any>('/users/profile', {
            method: 'PATCH',
            body: JSON.stringify(payload),
            credentials: 'include',
        });
    }

// --- Addresses (user)
    async getMyAddresses() {
        return this.request<any>('/users/addresses');
    }
    async createAddress(payload: { city: string; address: string; label?: string | null; lat?: number | null; lng?: number | null }) {
        return this.request<any>('/users/addresses', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
    async updateAddress(id: string | number, payload: Partial<{ city: string; address: string; label?: string | null; lat?: number | null; lng?: number | null }>) {
        return this.request<any>(`/users/addresses/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }
    async deleteAddress(id: string | number) {
        return this.request<void>(`/users/addresses/${id}`, { method: 'DELETE' });
    }
    async setDefaultAddress(id: string | number) {
        return this.request<any>(`/users/addresses/${id}/default`, { method: 'POST' });
    }

    async lookupClientByPhone(phone: string) {
        return this.request<any>(`/admin/clients/lookup?phone=${encodeURIComponent(phone)}`, {
            method: 'GET',
            credentials: 'include',
        });
    }

    async searchProducts(params: { q: string; pageSize?: number }) {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.pageSize) qs.set('pageSize', String(params.pageSize));
        return this.request<any>(`/products/search?${qs.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
    }

    async logout() {
        try {
            await this.request('/users/logout', { method: 'POST' });
        } finally {
            this.removeToken();
        }
    }

    // ----------------
    // Products
    // ----------------
    async getProducts(params?: {
        search?: string;
        category_id?: string | number | undefined;
        page?: number;
        pageSize?: number;
        client_page?: string;
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
    async getCategories(params?: { search?: string; page?: number; pageSize?: number; client_page?: string }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/categories${qs}`, {
            next: { revalidate: 0 },
        });
    }

    // async getCategory(id: string | number) {
    //     return this.request<any>(`/admin/categories/${id}`);
    // }

    async createCategory(payload: any) {
        return this.request<any>('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateCategory(
        id: string | number,
        payload: any
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

    // async updateCategoryOrder(orders: { id: string | number; order: number }[]) {
    //     return this.request<any>(`/admin/categories/order`, {
    //         method: 'POST',
    //         body: JSON.stringify({ orders }),
    //     });
    // }

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

    async getPopularProducts(params?: { limit?: number; days?: number }) {
        const qs = new URLSearchParams();
        if (params?.limit) qs.set('limit', String(params.limit));
        if (params?.days) qs.set('days', String(params.days));
        return this.request<any>(`/admin/analytics/popular-products?${qs.toString()}`, {
            method: 'GET',
            credentials: 'include',
        });
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

    async getAdminOffer(id: number | string) {
        return this.request<any>(`/admin/offers/${id}`);
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

    // async reorderOffers(orders: { id: number | string; priority: number }[]) {
    //     return this.request<any>('/admin/offers/reorder', {
    //         method: 'POST',
    //         body: JSON.stringify({ orders }),
    //     });
    // }
    //
    // // doar pentru application_type = product_ids
    // async syncOfferProducts(id: number | string, product_ids: (number | string)[]) {
    //     return this.request<any>(`/admin/offers/${id}/products`, {
    //         method: 'PUT',
    //         body: JSON.stringify({ product_ids }),
    //     });
    // }

    // ---- Clients (Admin) ----
    async getAdminClients(params?: { search?: string; page?: number; pageSize?: number }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/admin/clients${qs}`);
    }

    async getAdminClient(id: string | number) {
        return this.request<any>(`/admin/clients/${id}`);
    }

    // ----------------
// Delivery Zones
// ----------------
    async getAdminDeliveryZones(params?: {
        search?: string;
        active?: '1' | '0';
        page?: number;
        pageSize?: number;
    }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/admin/delivery-zones${qs}`);
    }

    async getDeliveryZones(params?: { active?: 1 | 0 }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/delivery-zones${qs}`);
    }

    async createDeliveryZone(payload: {
        name: string;
        description?: string;
        deliveryFee: number;
        deliveryTime?: string | null;
        minOrder: number;
        active?: boolean;
        areas: string[];
    }) {
        return this.request<any>(`/admin/delivery-zones`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async updateDeliveryZone(
        id: string | number,
        payload: Partial<{
            name: string;
            description?: string | null;
            deliveryFee: number;
            deliveryTime?: string | null;
            minOrder: number;
            active?: boolean;
            areas: string[];
        }>
    ) {
        return this.request<any>(`/admin/delivery-zones/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }

    async deleteDeliveryZone(id: string | number) {
        return this.request<any>(`/admin/delivery-zones/${id}`, {
            method: 'DELETE',
        });
    }

    async toggleDeliveryZone(id: string | number) {
        return this.request<any>(`/admin/delivery-zones/${id}/toggle`, {
            method: 'POST',
        });
    }

    // ----------------
    // Orders ✅
    // ----------------
    // Tipul payload-ului de creare (aliniat cu controllerul)
    // (Poți muta într-un fișier de tipuri dacă vrei)
    async createOrder(payload: {
        order_id: string;
        delivery_type: 'delivery' | 'pickup';
        payment_method: 'cash' | 'card';
        customer_name: string;
        customer_phone: string;
        address_id?: number;
        address_text?: string | null;
        delivery_zone_id?: number | null;
        delivery_fee: number;
        notes?: string | null;
        items: { product_id: number; quantity: number }[];
        discount?: number;
        applied_offers?: any[] | null;
    }) {
        return this.request<{ id: string; data: any }>(`/orders`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // listă comenzi (doar dacă ești logat; client -> ale lui; staff -> toate)
    async getOrders(params?: { status?: string; page?: number; pageSize?: number }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/orders${qs}`);
    }

    async getMyOrders() {
        return this.request<any>('/orders'); // index pentru utilizatorul autentificat
    }
    async getOrder(id: string | number) {
        return this.request<any>(`/orders/${id}`);
    }

    async updateOrderStatus(id: string | number, status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'completed' | 'canceled') {
        return this.request<any>(`/orders/${id}/status`, {
            method: 'POST',
            body: JSON.stringify({ status }),
        });
    }

    async cancelOrder(id: string | number) {
        return this.request<any>(`/orders/${id}/cancel`, {
            method: 'POST',
        });
    }

    async updateOrder(
        id: string | number,
        payload: {
            items?: { product_id: number; quantity: number }[];
            notes?: string | null;
            payment_method?: 'cash' | 'card';
            delivery_type?: 'delivery' | 'pickup';
        }
    ) {
        return this.request<any>(`/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });
    }

    // Staff (admin/manager)
    async getStaff(params?: { search?: string; page?: number; pageSize?: number }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/admin/staff${qs}`);
    }

    async createStaff(payload: {
        name: string;
        email?: string | null;
        password: string;
        phone?: string | null;
        role: 'MANAGER' | 'EMPLOYEE';
        pin: string; // 4+ cifre
    }) {
        return this.request<any>('/admin/staff', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    async createQr(payload: {
        uuid: string;
        type: 'redirect' | 'info';
        url?: string | null;
        data?: Record<string, any> | null;
        branding?: Record<string, any> | null;
    }) {
        return this.request<any>('/admin/qr', {
            method: 'POST',
            body: JSON.stringify(payload),
            credentials: 'include',
        });
    }

    async getAdminQrs(params?: { search?: string; page?: number; pageSize?: number }) {
        const qs = params ? `?${new URLSearchParams(params as any)}` : '';
        return this.request<any>(`/admin/qr${qs}`, { credentials: 'include' });
    }

    async deleteQr(id: number | string) {
        return this.request<void>(`/admin/qr/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    }

    async getQr(uuid: string) {
        return this.request<any>(`/qr/${encodeURIComponent(uuid)}`, {
            method: 'GET',
            credentials: 'include',
        });
    }

    async getAdminSettings() {
        return this.request<any>('/admin/settings', { method: 'GET', credentials: 'include' });
    }

    async updateAdminSettings(payload: Partial<{
        business_name: string;
        site_email: string | null;
        support_phone: string | null;
        notify_whatsapp_numbers: string[];
        notify_on_new_order: boolean;
        notify_on_order_update: boolean; // 🆕
        order_auto_confirm: boolean;
        accept_cash: boolean;
        accept_card: boolean;
        pickup_address: string | null;
    }>) {
        return this.request<any>('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(payload),
            credentials: 'include',
        });
    }

    async getSettings() {
        return this.request<any>('/settings', { next: { revalidate: 300, tags: ['settings'] } });
    }

}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
