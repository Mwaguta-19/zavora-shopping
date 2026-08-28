import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    mode: "onBlur",
  });

  const onSubmit = async (data: LoginFormData) => {
    if (loading) return;

    setLoading(true);

    try {
      const response = await authApi.login({
        email: data.email.trim(),
        password: data.password,
      });

      const { user, access, refresh } = response.data;

      setAuth(user, access, refresh);

      toast.success("Welcome back!");
      navigate("/", { replace: true });
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Invalid email or password.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Login to your{" "}
              <span className="font-semibold text-orange-500">Jumia Clone</span>{" "}
              account
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                disabled={loading}
                {...register("email", {
                  required: "Email address is required.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email address.",
                  },
                })}
                className={`w-full rounded-lg border px-3.5 py-2.5 outline-none transition
                  focus:ring-2 focus:ring-orange-400
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${
                    errors.email
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300"
                  }`}
              />

              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={loading}
                {...register("password", {
                  required: "Password is required.",
                })}
                className={`w-full rounded-lg border px-3.5 py-2.5 outline-none transition
                  focus:ring-2 focus:ring-orange-400
                  disabled:bg-gray-100 disabled:cursor-not-allowed
                  ${
                    errors.password
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300"
                  }`}
              />

              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white
                transition hover:bg-orange-600
                focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Forgot Password */}
            <div className="text-center -mt-2">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-orange-500 hover:text-orange-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>

          {/* Register */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-orange-500 hover:text-orange-600 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </div>
    </main>
  );
}
