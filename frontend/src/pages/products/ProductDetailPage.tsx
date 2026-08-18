import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { productsApi } from "@/api/products";
import { cartApi } from "@/api/cart";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { Star, ShoppingCart, Truck, Shield, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { setCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [review, setReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const { data: product, isLoading, refetch } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.getProduct(slug!).then((r) => r.data),
    enabled: !!slug,
  });

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to add to cart");
      navigate("/login");
      return;
    }
    setAddingToCart(true);
    try {
      const { data } = await cartApi.addItem(product!.id, quantity);
      setCart(data);
      toast.success(`${quantity} item(s) added to cart!`);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to leave a review");
      return;
    }
    setSubmittingReview(true);
    try {
      await productsApi.addReview(slug!, review);
      toast.success("Review submitted!");
      setReview({ rating: 5, comment: "" });
      refetch();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-xl text-gray-500">Product not found.</p>
        <button
          onClick={() => navigate("/products")}
          className="mt-4 text-orange-500 hover:underline"
        >
          Back to products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6"
      >
        <ArrowLeft size={18} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
            {product.images?.length > 0 ? (
              <img
                src={product.images[selectedImage]?.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                    selectedImage === i ? "border-orange-500" : "border-transparent"
                  }`}
                >
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <p className="text-sm text-orange-500 font-medium mb-1">
            {product.category?.name}
          </p>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>

          {/* Rating */}
          {product.avg_rating && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    className={
                      s <= Math.round(product.avg_rating!)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.avg_rating} ({product.review_count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold text-orange-500">
              ${product.effective_price}
            </span>
            {product.discount_price && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  ${product.price}
                </span>
                <span className="bg-red-100 text-red-600 text-sm font-bold px-2 py-0.5 rounded">
                  -{product.discount_percentage}%
                </span>
              </>
            )}
          </div>

          {/* Stock */}
          <p className={`text-sm font-medium mb-4 ${product.in_stock ? "text-green-600" : "text-red-500"}`}>
            {product.in_stock ? `✓ In Stock (${product.stock} available)` : "✗ Out of Stock"}
          </p>

          {/* Brand & SKU */}
          <div className="text-sm text-gray-500 space-y-1 mb-6">
            {product.brand && <p>Brand: <span className="text-gray-700 font-medium">{product.brand}</span></p>}
            <p>SKU: <span className="text-gray-700">{product.sku}</span></p>
          </div>

          {/* Quantity */}
          {product.in_stock && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Qty:</span>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 hover:bg-gray-100 text-lg"
                >
                  −
                </button>
                <span className="px-4 py-1.5 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-1.5 hover:bg-gray-100 text-lg"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={!product.in_stock || addingToCart}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors mb-6"
          >
            <ShoppingCart size={20} />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </button>

          {/* Trust badges */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck size={18} className="text-orange-500" />
              <span>Free delivery on orders over $50</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Shield size={18} className="text-orange-500" />
              <span>30-day return policy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-3">Description</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Reviews ({product.review_count})
        </h2>

        {/* Add Review */}
        {isAuthenticated && (
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h3 className="font-medium text-gray-700 mb-3">Write a Review</h3>
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setReview({ ...review, rating: s })}>
                  <Star
                    size={24}
                    className={
                      s <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
            <textarea
              value={review.comment}
              onChange={(e) => setReview({ ...review, comment: e.target.value })}
              placeholder="Share your experience..."
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400 mb-3"
            />
            <button
              onClick={handleReviewSubmit}
              disabled={submittingReview}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-60"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}

        {/* Review List */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="border-b pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">
                    {r.user_name || r.user_email}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        s <= r.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            No reviews yet. Be the first to review!
          </p>
        )}
      </div>
    </div>
  );
}