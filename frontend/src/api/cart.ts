import api from "./client";
import type { Cart } from "@/types";

export const cartApi = {
  getCart: () => api.get<Cart>("/cart/"),

  addItem: (product_id: number, quantity = 1) =>
    api.post<Cart>("/cart/items/", { product_id, quantity }),

  updateItem: (item_id: number, quantity: number) =>
    api.patch<Cart>(`/cart/items/${item_id}/`, { quantity }),

  removeItem: (item_id: number) => api.delete(`/cart/items/${item_id}/`),

  clearCart: () => api.delete("/cart/"),
};