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
};