import api from "./client";
import type { Product, Category, PaginatedResponse } from "@/types";

export const productsApi = {
  getProducts: (params?: {
    search?: string;
    category?: number;
    min_price?: number;
    max_price?: number;
    ordering?: string;
    page?: number;
  }) => api.get<PaginatedResponse<Product>>("/products/", { params }),

  getProduct: (slug: string) => api.get<Product>(`/products/${slug}/`),

  getFeatured: () => api.get<Product[]>("/products/featured/"),

  getCategories: () => api.get<Category[]>("/products/categories/"),

  addReview: (slug: string, data: { rating: number; comment: string }) =>
    api.post(`/products/${slug}/reviews/`, data),
};