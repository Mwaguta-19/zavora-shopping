from django.urls import path
from .views import (
    CategoryListView,
    CategoryDetailView,
    ProductListView,
    ProductDetailView,
    FeaturedProductsView,
    ProductReviewView,
    AdminProductListView,
    AdminProductDetailView,
    AdminProductImageView,
    AdminStatsView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("categories/<slug:slug>/", CategoryDetailView.as_view(), name="category-detail"),
    path("", ProductListView.as_view(), name="product-list"),
    path("featured/", FeaturedProductsView.as_view(), name="featured-products"),
    path("<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
    path("<slug:slug>/reviews/", ProductReviewView.as_view(), name="product-reviews"),

    #admin endpoints
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/products/", AdminProductListView.as_view(), name="admin-product-list"),
    path("admin/products/<int:pk>/", AdminProductDetailView.as_view(), name="admin-product-detail"),
    path("admin/products/<int:product_id>/images/", AdminProductImageView.as_view(), name="admin-product-images"),
    path("admin/products/<int:product_id>/images/<int:image_id>/", AdminProductImageView.as_view(), name="admin-product-image-delete"),
]
