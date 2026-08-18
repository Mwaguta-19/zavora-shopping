import api from "./client";
import type { Order, Address } from "@/types";

export const ordersApi = {
  getAddresses: () => api.get<Address[]>("/addresses/"),

  addAddress: (data: Omit<Address, "id">) =>
    api.post<Address>("/addresses/", data),

  checkout: (data: { address_id: number; notes?: string }) =>
    api.post<Order>("/checkout/", data),

  getOrders: () => api.get<any>("/orders/"),

  getOrder: (order_number: string) =>
    api.get<Order>(`/orders/${order_number}/`),

  cancelOrder: (order_number: string) =>
    api.post(`/orders/${order_number}/cancel/`),

  createPaymentIntent: (order_number: string) =>
    api.post("/payments/create-intent/", { order_number }),
};