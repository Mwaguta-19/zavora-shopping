import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "@/api/client";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    new_password: "",
    new_password2: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.new_password !== form.new_password2) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password/", {
        uid,
        token,
        ...form,
      });
      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">
          Reset Password
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Enter your new password below
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={form.new_password}
              onChange={(e) =>
                setForm({ ...form, new_password: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={form.new_password2}
              onChange={(e) =>
                setForm({ ...form, new_password2: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Repeat password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-md font-semibold disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          <Link to="/login" className="text-orange-500 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
