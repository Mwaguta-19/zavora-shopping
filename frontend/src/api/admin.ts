import api from "./client";

export const adminApi = {
  getStats: () => api.get("/products/admin/stats/"),

  getProducts: () => api.get("/products/admin/products/"),
  createProduct: (data: any) => api.post("/products/admin/products/", data),
  updateProduct: (id: number, data: any) => api.patch(`/products/admin/products/${id}/`, data),
  deleteProduct: (id: number) => api.delete(`/products/admin/products/${id}/`),

  uploadImages: (productId: number, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    return fetch(`${import.meta.env.VITE_API_BASE_URL}/api/products/admin/products/${productId}/images/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    }).then((r) => r.json());
  },

  deleteImage: (productId: number, imageId: number) =>
    api.delete(`/products/admin/products/${productId}/images/${imageId}/`),

  getCategories: () => api.get("/products/categories/"),
  createCategory: (data: any) => api.post("/products/categories/", data),
  deleteCategory: (slug: string) => api.delete(`/products/categories/${slug}/`),

  getOrders: () => api.get("/orders/"),
  updateOrderStatus: (orderNumber: string, status: string) =>
    api.patch(`/orders/${orderNumber}/`, { status }),
};