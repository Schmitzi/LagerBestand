// Shared types between backend and frontend
export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    quantity: number;
    location: string;
    category: string;
    sku?: string;
    price?: number;
    supplier?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateInventoryItem {
    name: string;
    description?: string;
    quantity: number;
    location: string;
    category: string;
    sku?: string;
    price?: number;
    supplier?: string;
}

export interface UpdateInventoryItem {
    name?: string;
    description?: string;
    quantity?: number;
    location?: string;
    category?: string;
    sku?: string;
    price?: number;
    supplier?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';