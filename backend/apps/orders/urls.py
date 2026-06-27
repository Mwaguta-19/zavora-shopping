from django.urls import path
from .views import (
    AddressListCreateView,
    AddressDetailView,
    CartView,
    CartItemView,
    CheckoutView,
    OrderListView,
    OrderDetailView,
    CancelOrderView,
)

urlpatterns = [
    # Addresses
    path("addresses/", AddressListCreateView.as_view(), name="address-list"),
    path("addresses/<int:pk>/", AddressDetailView.as_view(), name="address-detail"),

    # Cart
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/items/", CartItemView.as_view(), name="cart-add"),
    path("cart/items/<int:item_id>/", CartItemView.as_view(), name="cart-item"),

    # Checkout & Orders
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("orders/", OrderListView.as_view(), name="order-list"),
    path("orders/<str:order_number>/", OrderDetailView.as_view(), name="order-detail"),
    path("orders/<str:order_number>/cancel/", CancelOrderView.as_view(), name="order-cancel"),
]