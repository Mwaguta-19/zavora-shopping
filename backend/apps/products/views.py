# Create your views here.

from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from .models import Category, Product, ProductReview
from apps.orders.models import Order
from apps.accounts.models import User
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductReviewSerializer,
)


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = ["category", "brand", "is_featured", "min_price", "max_price"]

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.filter(parent=None, is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ProductListView(generics.ListCreateAPIView):
    queryset = Product.objects.filter(is_active=True).select_related(
        "category"
    ).prefetch_related("images")
    filterset_class = ProductFilter
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "brand", "category__name"]
    ordering_fields = ["price", "created_at", "name"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductDetailSerializer
        return ProductListSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.filter(is_active=True).select_related(
        "category"
    ).prefetch_related("images", "reviews__user")  # ← add __user
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"

    def get_permissions(self):
        if self.request.method in ["PUT", "PATCH", "DELETE"]:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class FeaturedProductsView(generics.ListAPIView):
    queryset = Product.objects.filter(is_active=True, is_featured=True).prefetch_related("images")
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]


class ProductReviewView(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return ProductReview.objects.filter(product__slug=self.kwargs["slug"])

    def perform_create(self, serializer):
        product = Product.objects.get(slug=self.kwargs["slug"])
        serializer.save(user=self.request.user, product=product)

class AdminProductListView(generics.ListCreateAPIView):
    queryset = Product.objects.all().select_related("category").prefetch_related("images")
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = None

class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.IsAdminUser]

class AdminProductImageView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        images = request.FILES.getlist("images")
        created = []
        for img in images:
            image = ProductImage.objects.create(
                product=product,
                image=img,
                is_primary=not product.images.exists()
            )
            created.append(ProductImageSerializer(image).data)
        return Response(created, status=status.HTTP_201_CREATED)

    def delete(self, request, product_id, image_id):
        image = get_object_or_404(ProductImage, id=image_id, product_id=product_id)
        image.delete()
        return Response({"detail": "Image deleted."})

class AdminStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from django.db.models import Sum
        return Response({
            "total_products": Product.objects.count(),
            "total_orders": Order.objects.count(),
            "total_users": User.objects.count(),
            "total_revenue": Order.objects.filter(
                payment_status="paid"
            ).aggregate(Sum("total"))["total__sum"] or 0,
            "pending_orders": Order.objects.filter(status="pending").count(),
            "recent_orders": [
                {
                    "order_number": o.order_number,
                    "total": str(o.total),
                    "status": o.status,
                    "created_at": o.created_at.strftime("%Y-%m-%d"),
                }
                for o in Order.objects.order_by("-created_at")[:5]
            ],
        })
