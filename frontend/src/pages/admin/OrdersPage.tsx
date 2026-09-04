import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { useState } from "react";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () =>
      adminApi.getOrders().then((r) => {
        const d = r.data as any;
        return Array.isArray(d) ? d : (d.results ?? []);
      }),
  });

  const handleStatusChange = async (orderNumber: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(orderNumber, status);
      toast.success("Order status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Orders</h1>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Order
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Customer
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Total
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Payment
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Date
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Update
                </th>
              </tr>
            </thead>
            <tbody>
              {orders?.map((order: any) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium">
                    #{order.order_number}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {order.shipping_full_name}
                  </td>
                  <td className="px-6 py-4 font-medium">${order.total}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.payment_status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleStatusChange(order.order_number, e.target.value)
                      }
                      className="border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-orange-400"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
