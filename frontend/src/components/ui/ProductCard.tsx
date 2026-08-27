import { Link } from "react-router-dom";
import { ShoppingCart, Star } from "lucide-react";
import type { Product } from "@/types";
import { cartApi } from "@/api/cart";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { mediaUrl } from "@/utils/media";

export default function ProductCard({ product }: { product: Product }) {
  const { setCart } = useCartStore();

  const primaryImage =
    product.images?.find((image) => image.is_primary) ??
    product.images?.[0] ??
    null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      const { data } = await cartApi.addItem(product.id);
      setCart(data);
      toast.success("Added to cart!");
    } catch {
      toast.error("Login to add to cart");
    }
  };

  return (
    <Link
      to={`/products/${product.slug}`}
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden group"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {primaryImage?.image ? (
          <img
            src={mediaUrl(primaryImage.image)}
            alt={primaryImage.alt_text || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.error(
                "Product image failed to load:",
                primaryImage.image,
              );
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}

        {product.discount_percentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product.discount_percentage}%
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
          {product.name}
        </h3>

        {product.avg_rating !== null && (
          <div className="flex items-center gap-1 mb-1">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-500">
              {product.avg_rating} ({product.review_count})
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <span className="text-orange-500 font-bold">
            ${product.effective_price}
          </span>

          {product.discount_price && (
            <span className="text-gray-400 text-xs line-through">
              ${product.price}
            </span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
        >
          <ShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </Link>
  );
}
