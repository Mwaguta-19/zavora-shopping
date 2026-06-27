from rest_framework import serializers
from .models import Address, Cart, CartItem, Order, OrderItem
from apps.products.serializers import ProductListSerializer


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "full_name", "phone", "address_line1", "address_line2",
            "city", "state", "country", "postal_code", "is_default", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity", "total_price", "added_at"]
        read_only_fields = ["id", "added_at"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.ReadOnlyField()
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ["id", "items", "total_items", "subtotal", "updated_at"]


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "product_sku",
            "quantity", "unit_price", "total_price",
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "payment_status",
            "shipping_full_name", "shipping_phone",
            "shipping_address_line1", "shipping_address_line2",
            "shipping_city", "shipping_state", "shipping_country",
            "shipping_postal_code", "subtotal", "shipping_cost",
            "total", "notes", "items", "created_at",
        ]
        read_only_fields = [
            "id", "order_number", "status", "payment_status",
            "subtotal", "total", "created_at",
        ]


class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)
    shipping_cost = serializers.DecimalField(
        max_digits=10, decimal_places=2, default=0
    )