import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Plus, Pencil, Trash2, Upload, X, Package } from "lucide-react";
import { mediaUrl } from "@/utils/media";
import toast from "react-hot-toast";

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => adminApi.getProducts().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      adminApi.getCategories().then((r) => {
        const d = r.data as any;
        return Array.isArray(d) ? d : (d.results ?? []);
      }),
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    discount_price: "",
    stock: "",
    brand: "",
    category_id: "",
    is_active: true,
    is_featured: false,
  });

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      price: "",
      discount_price: "",
      stock: "",
      brand: "",
      category_id: "",
      is_active: true,
      is_featured: false,
    });
    setEditProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: any) => {
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      discount_price: product.discount_price || "",
      stock: product.stock,
      brand: product.brand,
      category_id: product.category?.id || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setEditProduct(product);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editProduct) {
        await adminApi.updateProduct(editProduct.id, form);
        toast.success("Product updated!");
      } else {
        await adminApi.createProduct(form);
        toast.success("Product created!");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success("Product deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleImageUpload = async (productId: number, files: FileList) => {
    setUploadingImages(true);
    try {
      await adminApi.uploadImages(productId, files);
      toast.success("Images uploaded!");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch {
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageDelete = async (productId: number, imageId: number) => {
    try {
      await adminApi.deleteImage(productId, imageId);
      toast.success("Image deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch {
      toast.error("Failed to delete image");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-gray-800">
                {editProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={resetForm}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. HP Laptop 15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    value={form.brand}
                    onChange={(e) =>
                      setForm({ ...form, brand: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="e.g. HP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Discount Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.discount_price}
                    onChange={(e) =>
                      setForm({ ...form, discount_price: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock *
                  </label>
                  <input
                    required
                    type="number"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) =>
                    setForm({ ...form, category_id: e.target.value })
                  }
                  className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">Select category</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.checked })
                    }
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm({ ...form, is_featured: e.target.checked })
                    }
                    className="w-4 h-4 accent-orange-500"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>

              {/* Image upload for existing products */}
              {editProduct && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editProduct.images?.map((img: any) => (
                      <div key={img.id} className="relative w-20 h-20">
                        <img
                          src={mediaUrl(img.image)}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleImageDelete(editProduct.id, img.id)
                          }
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-orange-400">
                    <Upload size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {uploadingImages ? "Uploading..." : "Upload images"}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) {
                          handleImageUpload(editProduct.id, e.target.files);
                        }
                      }}
                    />
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-md font-medium disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editProduct
                      ? "Update Product"
                      : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 border rounded-md hover:bg-gray-50 text-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Image
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Name
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Category
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Price
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Stock
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-gray-500 font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product: any) => {
                const img = product.images?.[0];
                return (
                  <tr
                    key={product.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                        {img ? (
                          <img
                            src={mediaUrl(img.image)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-800">
                        {product.name}
                      </p>
                      <p className="text-gray-500 text-xs">{product.brand}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.category?.name}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">${product.price}</p>
                      {product.discount_price && (
                        <p className="text-xs text-orange-500">
                          ${product.discount_price}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {(!products || products.length === 0) && (
            <div className="text-center py-12 text-gray-500">
              <Package size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No products yet. Add your first product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
