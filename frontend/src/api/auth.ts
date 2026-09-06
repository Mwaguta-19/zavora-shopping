import api from "./client";
import type { AuthTokens, User } from "../types";

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
  }) => api.post<AuthTokens>("/auth/register/", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>("/auth/login/", data),

  logout: (refresh: string) => api.post("/auth/logout/", { refresh }),

  getProfile: () => api.get<User>("/auth/profile/"),

  updateProfile: (data: Partial<User>) => api.patch<User>("/auth/profile/", data),

  changePassword: (data: {
    old_password: string;
    new_password: string;
    new_password2: string;
  }) => api.post("/auth/change-password/", data),

  // Admin
  getAdminUsers: () =>
  api.get<{
    count: number;
    next: string | null;
    previous: string | null;
    results: User[];
  }>("/auth/admin/users/"),

  updateAdminUser: (id: string, data: Partial<User>) =>
    api.patch<User>(`/auth/admin/users/${id}/`, data),

  deleteAdminUser: (id: string) =>
    api.delete(`/auth/admin/users/${id}/`),
};