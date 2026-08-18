import { create } from "zustand";
import type { Cart } from "@/types";

interface CartState {
  cart: Cart | null;
  setCart: (cart: Cart) => void;
  clearCart: () => void;
  totalItems: number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  totalItems: 0,
  setCart: (cart) => set({ cart, totalItems: cart.total_items }),
  clearCart: () => set({ cart: null, totalItems: 0 }),
}));