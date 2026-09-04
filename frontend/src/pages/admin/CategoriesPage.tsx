import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";
import { Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () =>
      adminApi.getCategories().then((r) => {
        const d = r.data as any;
        return Array.isArray(d) ? d : (d.results ?? []);
      }),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createCategory({ name, is_active: true });
      toast.success("Category created!");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setName("");
      setShowForm(false);
    } catch {
      toast.error("Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await adminApi.deleteCategory(slug);
      toast.success("Category deleted!");
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">New Category</h2>
            <button onClick={() => setShowForm(false)}>
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="flex-1 border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create"}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">
                Name
              </th>
              <th className="text-left px-6 py-4 text-gray-500 font-medium">
                Slug
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
            {categories?.map((cat: any) => (
              <tr
                key={cat.id}
                className="border-b last:border-0 hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium text-gray-800">
                  {cat.name}
                </td>
                <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cat.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleDelete(cat.slug)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
