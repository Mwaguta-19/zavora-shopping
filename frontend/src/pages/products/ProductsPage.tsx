import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { productsApi } from "@/api/products";
import ProductCard from "../../components/ui/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const ordering = searchParams.get("ordering") || "-created_at";
  const page = parseInt(searchParams.get("page") || "1");

  const { data, isLoading } = useQuery({
    queryKey: ["products", search, category, minPrice, maxPrice, ordering, page],
    queryFn: () =>
      productsApi.getProducts({
        search: search || undefined,
        category: category ? parseInt(category) : undefined,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        ordering,
        page,
      }).then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.getCategories().then((r) =>{
    const data = r.data as any;
    return Array.isArray(data) ? data : (data.results ?? []);
  }),
});

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});

  const results = data?.results ?? [];
  const isEmpty = !isLoading && results.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {search ? `Results for "${search}"` : "All Products"}
          {data && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({data.count} items)
            </span>
          )}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 border px-4 py-2 rounded-md text-sm hover:bg-gray-50 md:hidden"
        >
          <SlidersHorizontal size={16} />
          Filters
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className={`w-56 shrink-0 ${showFilters ? "block" : "hidden"} md:block`}>
          <div className="bg-white rounded-lg shadow p-4 space-y-5 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-orange-500 hover:underline flex items-center gap-1"
              >
                <X size={12} /> Clear
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Category</h4>
              <div className="space-y-1">
                <button
                  onClick={() => updateParam("category", "")}
                  className={`block w-full text-left text-sm px-2 py-1 rounded ${
                    !category ? "bg-orange-100 text-orange-600 font-medium" : "hover:bg-gray-50"
                  }`}
                >
                  All
                </button>
                {categories?.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => updateParam("category", String(cat.id))}
                    className={`block w-full text-left text-sm px-2 py-1 rounded ${
                      category === String(cat.id)
                        ? "bg-orange-100 text-orange-600 font-medium"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Price Range</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => updateParam("min_price", e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-orange-400"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => updateParam("max_price", e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Sort By</h4>
              <select
                value={ordering}
                onChange={(e) => updateParam("ordering", e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-orange-400"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-t-lg" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg">No products found.</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-orange-500 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-center gap-2 mt-8">
                {data?.previous && (
                  <button
                    onClick={() => updateParam("page", String(page - 1))}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    ← Previous
                  </button>
                )}
                {data?.next && (
                  <button
                    onClick={() => updateParam("page", String(page + 1))}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Next →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}