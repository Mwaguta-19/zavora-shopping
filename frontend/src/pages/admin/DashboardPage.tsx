import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Package, ShoppingBag, Users, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats().then((r) => r.data),
  });

  const cards = [
    {
      label: "Total Products",
      value: stats?.total_products || 0,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      label: "Total Orders",
      value: stats?.total_orders || 0,
      icon: ShoppingBag,
      color: "bg-green-500",
    },
    {
      label: "Total Users",
      value: stats?.total_users || 0,
      icon: Users,
      color: "bg-purple-500",
    },
    {
      label: "Total Revenue",
      value: `$${stats?.total_revenue || 0}`,
      icon: DollarSign,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3">Order</th>
                <th className="pb-3">Total</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_orders?.map((order: any) => (
                <tr key={order.order_number} className="border-b last:border-0">
                  <td className="py-3 font-medium">#{order.order_number}</td>
                  <td className="py-3">${order.total}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{order.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
