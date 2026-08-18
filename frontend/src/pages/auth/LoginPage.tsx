import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { register, handleSubmit } = useForm<{ email: string; password: string }>();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      setAuth(res.data.user, res.data.access, res.data.refresh);
      toast.success("Welcome back!");
      navigate("/");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Login to <span className="text-orange-500">Jumia Clone</span>
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register("email", { required: true })}
              type="email"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              {...register("password", { required: true })}
              type="password"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-md font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-orange-500 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}