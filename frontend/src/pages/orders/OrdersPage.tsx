import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ordersApi } from "@/api/orders";
import { Package, ChevronRight } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
};

export default function OrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.getOrders().then((r) =>{
    // Handle both paginated and non-paginated responses
    const data = r.data as any;
    return Array.isArray(data) ? data : (data.results ?? []);
  }),
});
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">When you place an order, it'll show up here.</p>
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h1>

      <div className="space-y-3">
        {orders.map((order: any) => (
          <Link
            key={order.id}
            to={`/orders/${order.order_number}`}
            className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800">#{order.order_number}</span>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  statusColors[order.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{new Date(order.created_at).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
              })}</span>
              <span>{order.items.length} item(s)</span>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="font-bold text-gray-800">${order.total}</span>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}