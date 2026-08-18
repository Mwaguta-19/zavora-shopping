import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/api/products";
import ProductCard from "@/components/ui/ProductCard";
import { Link } from "react-router-dom";

export default function HomePage() {
  const { data: featured } = useQuery({
    queryKey: ["featured"],
    queryFn: () => productsApi.getFeatured().then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.getCategories().then((r) => r.data),
  });

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Shop Everything, Delivered Fast
        </h1>
        <p className="text-lg mb-8 opacity-90">
          Millions of products at your fingertips
        </p>
        <Link
          to="/products"
          className="bg-yellow-400 text-gray-800 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors"
        >
          Shop Now
        </Link>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Shop by Category</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="bg-white rounded-lg p-4 text-center shadow hover:shadow-md transition-shadow"
              >
                {cat.image && (
                  <img src={cat.image} alt={cat.name} className="w-12 h-12 object-cover mx-auto mb-2 rounded-full" />
                )}
                <p className="text-sm font-medium text-gray-700">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products */}
      {featured && featured.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
            <Link to="/products" className="text-orange-500 hover:underline text-sm">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}