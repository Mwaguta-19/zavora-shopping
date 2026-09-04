import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.is_staff && !user?.is_superuser)
    return <Navigate to="/" replace />;
  return <>{children}</>;
}
