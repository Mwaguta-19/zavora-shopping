import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { cartApi } from "@/api/cart";
import { useCartStore } from "@/store/cartStore";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { mediaUrl } from "@/utils/media";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function CartPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCart } = useCartStore();

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartApi.getCart().then((r) => r.data),
  });

  useEffect(() => {
    if (cart) setCart(cart);
  }, [cart]);

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      const { data } = await cartApi.updateItem(itemId, quantity);
      queryClient.setQueryData(["cart"], data);
      setCart(data);
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      await cartApi.removeItem(itemId);
      const { data } = await cartApi.getCart();
      queryClient.setQueryData(["cart"], data);
      setCart(data);
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      const { data } = await cartApi.getCart();
      queryClient.setQueryData(["cart"], data);
      setCart(data);
      toast.success("Cart cleared");
    } catch {
      toast.error("Failed to clear cart");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Looks like you haven't added anything yet.</p>
        <Link
          to="/products"
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-md font-medium inline-block"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Shopping Cart ({cart.total_items} items)
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:underline flex items-center gap-1"
        >
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="md:col-span-2 space-y-3">
          {cart.items.map((item) => {
            const img = item.product.images?.[0];
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow p-4 flex gap-4 items-center"
              >
                <Link to={`/products/${item.product.slug}`} className="shrink-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                    {img ? (
                      <img
                        src={mediaUrl(img.image)}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="font-medium text-gray-800 hover:text-orange-500 line-clamp-1"
                  >
                    {item.product.name}
                  </Link>
                  <p className="text-orange-500 font-bold mt-1">
                    ${item.product.effective_price}
                  </p>
                </div>

                {/* Quantity */}
                <div className="flex items-center border rounded-md shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-100"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <p className="font-bold text-gray-800 w-20 text-right shrink-0">
                  ${item.total_price}
                </p>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-5 h-fit sticky top-20">
          <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${cart.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-gray-800 mb-4">
            <span>Total</span>
            <span>${cart.subtotal}</span>
          </div>
          <button
            onClick={() => navigate("/checkout")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-md font-semibold transition-colors"
          >
            Proceed to Checkout
          </button>
          <Link
            to="/products"
            className="block text-center text-sm text-orange-500 hover:underline mt-3"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}