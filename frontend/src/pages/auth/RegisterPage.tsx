import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

type FormData = {
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
};

export default function RegisterPage() {
  const { register, handleSubmit} = useForm<FormData>();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: FormData) => {
  if (data.password !== data.password2) {
    toast.error("Passwords do not match");
    return;
  }
  setLoading(true);
  try {
    const res = await authApi.register(data);
    setAuth(res.data.user, res.data.access, res.data.refresh);
    toast.success("Account created!");
    navigate("/");
  } catch (err: any) {
    const errors = err.response?.data;
    if (errors) {
      // Show first error from any field
      const firstError =
        errors.email?.[0] ||
        errors.password?.[0] ||
        errors.password2?.[0] ||
        errors.non_field_errors?.[0] ||
        errors.detail ||
        "Registration failed";
      toast.error(firstError);
    } else {
      toast.error("Registration failed");
    }
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Create Account
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                {...register("first_name")}
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                {...register("last_name")}
                className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register("email", { required: true })}
              type="email"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              {...register("password", { required: true })}
              type="password"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              {...register("password2", { required: true })}
              type="password"
              className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-md font-semibold transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-orange-500 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}