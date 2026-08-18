import { useState } from "react";
import { ordersApi } from "@/api/orders";
import toast from "react-hot-toast";

export default function AddressForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    country: "Kenya",
    postal_code: "",
    is_default: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ordersApi.addAddress(form);
      toast.success("Address saved!");
      onSuccess();
    } catch {
      toast.error("Failed to save address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Full Name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          required
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <input
        required
        placeholder="Address Line 1"
        value={form.address_line1}
        onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
        className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
      />
      <input
        placeholder="Address Line 2 (optional)"
        value={form.address_line2}
        onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
        className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          required
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          required
          placeholder="State"
          value={form.state}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          placeholder="Postal Code"
          value={form.postal_code}
          onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
          className="border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>
      <input
        required
        placeholder="Country"
        value={form.country}
        onChange={(e) => setForm({ ...form, country: e.target.value })}
        className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-md font-medium disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Address"}
      </button>
    </form>
  );
}