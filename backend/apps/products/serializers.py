from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductReview


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image", "parent", "is_active"]

    def get_children(self, obj):
        if obj.children.exists():
            return CategorySerializer(obj.children.filter(is_active=True), many=True).data
        return []


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "order"]


class ProductReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    user_name = serializers.ReadOnlyField(source="user.full_name")

    class Meta:
        model = ProductReview
        fields = ["id", "user_email", "user_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing products."""
    images = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source="category.name")
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    effective_price = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "price", "discount_price",
            "effective_price", "discount_percentage", "in_stock",
            "brand", "category_name", "images", "is_featured",
        ]

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first() or obj.images.first()
        if image:
            return ProductImageSerializer(image).data
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True,
        required=False  # ← add this
    )
    discount_percentage = serializers.ReadOnlyField()
    in_stock = serializers.ReadOnlyField()
    effective_price = serializers.ReadOnlyField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description", "price", "discount_price",
            "effective_price", "discount_percentage", "stock", "in_stock",
            "brand", "sku", "category", "category_id", "images", "reviews",
            "is_active", "is_featured", "avg_rating", "review_count", "created_at",
        ]
        read_only_fields = ["id", "slug", "sku", "created_at"]

    def get_avg_rating(self, obj):
        reviews = obj.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 1)
        return None

    def get_review_count(self, obj):
        return obj.reviews.count()