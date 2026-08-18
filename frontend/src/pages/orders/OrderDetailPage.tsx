import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { ordersApi } from "@/api/orders";
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function OrderDetailPage() {
  const { order_number } = useParams<{ order_number: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", order_number],
    queryFn: () => ordersApi.getOrder(order_number!).then((r) => r.data),
    enabled: !!order_number,
  });

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      await ordersApi.cancelOrder(order_number!);
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["order", order_number] });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">Order not found.</p>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancellable = ["pending", "confirmed"].includes(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={18} /> Back to Orders
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500">
            Placed on {new Date(order.created_at).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric"
            })}
          </p>
        </div>
        <span
          className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
            statusColors[order.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Progress Tracker */}
      {!["cancelled", "refunded"].includes(order.status) && (
        <div className="bg-white rounded-lg shadow p-5 mb-6">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div
                    className={`absolute top-3 right-1/2 w-full h-0.5 -z-10 ${
                      i <= currentStepIndex ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  />
                )}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= currentStepIndex
                      ? "bg-orange-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="text-xs text-gray-500 mt-2 capitalize">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package size={18} /> Items ({order.items.length})
            </h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-800">{item.product_name}</p>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × ${item.unit_price}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-800">${item.total_price}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-5">
            <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={18} /> Shipping Address
            </h2>
            <p className="text-sm text-gray-600">
              {order.shipping_full_name}<br />
              {order.shipping_address_line1}<br />
              {order.shipping_city}, {order.shipping_country}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-5 h-fit">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard size={18} /> Order Summary
          </h2>
          <div className="space-y-2 text-sm text-gray-600 mb-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${order.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>${order.shipping_cost}</span>
            </div>
          </div>
          <div className="border-t pt-3 flex justify-between font-bold text-gray-800 mb-2">
            <span>Total</span>
            <span>${order.total}</span>
          </div>
          <p className="text-xs text-gray-500 capitalize">
            Payment: {order.payment_status}
          </p>

          {isCancellable && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full mt-4 border border-red-300 text-red-500 hover:bg-red-50 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}