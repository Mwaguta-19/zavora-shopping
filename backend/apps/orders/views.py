# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.notifications.emails import send_order_confirmation, send_order_cancelled
from .models import Address, Cart, CartItem, Order, OrderItem
from .serializers import (
    AddressSerializer,
    CartSerializer,
    CartItemSerializer,
    OrderSerializer,
    CheckoutSerializer,
)
from apps.products.models import Product


# ─── Address Views ────────────────────────────────────────────────────────────

class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


# ─── Cart Views ───────────────────────────────────────────────────────────────

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_or_create_cart(self, user):
        cart, _ = Cart.objects.get_or_create(user=user)
        return cart

    def get(self, request):
        cart = self.get_or_create_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart = self.get_or_create_cart(request.user)
        cart.items.all().delete()
        return Response({"detail": "Cart cleared."})


class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Add item to cart or increase quantity."""
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        product = get_object_or_404(Product, id=product_id, is_active=True)

        if product.stock < quantity:
            return Response(
                {"detail": f"Only {product.stock} items available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, product=product
        )

        if not created:
            cart_item.quantity += quantity
        else:
            cart_item.quantity = quantity

        cart_item.save()
        return Response(CartSerializer(cart).data, status=status.HTTP_200_OK)

    def patch(self, request, item_id):
        """Update cart item quantity."""
        quantity = int(request.data.get("quantity", 1))
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)

        if quantity <= 0:
            item.delete()
            return Response({"detail": "Item removed."})

        if item.product.stock < quantity:
            return Response(
                {"detail": f"Only {item.product.stock} items available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request, item_id):
        """Remove item from cart."""
        cart = get_object_or_404(Cart, user=request.user)
        item = get_object_or_404(CartItem, id=item_id, cart=cart)
        item.delete()
        return Response({"detail": "Item removed."})


# ─── Order Views ──────────────────────────────────────────────────────────────

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        address = get_object_or_404(
            Address, id=serializer.validated_data["address_id"], user=request.user
        )
        cart = get_object_or_404(Cart, user=request.user)

        if not cart.items.exists():
            return Response(
                {"detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate stock for all items
        for item in cart.items.select_related("product"):
            if item.product.stock < item.quantity:
                return Response(
                    {"detail": f"'{item.product.name}' only has {item.product.stock} in stock."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        shipping_cost = serializer.validated_data.get("shipping_cost", 0)
        subtotal = cart.subtotal
        total = subtotal + shipping_cost

        # Create order
        order = Order.objects.create(
            user=request.user,
            shipping_full_name=address.full_name,
            shipping_phone=address.phone,
            shipping_address_line1=address.address_line1,
            shipping_address_line2=address.address_line2,
            shipping_city=address.city,
            shipping_state=address.state,
            shipping_country=address.country,
            shipping_postal_code=address.postal_code,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
            notes=serializer.validated_data.get("notes", ""),
        )

        # Create order items & deduct stock
        for item in cart.items.select_related("product"):
            OrderItem.objects.create(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_sku=item.product.sku,
                quantity=item.quantity,
                unit_price=item.product.effective_price,
            )
            item.product.stock -= item.quantity
            item.product.save()

        # Clear cart
        cart.items.all().delete()
        try:
            send_order_confirmation(order)
        except Exception:
            pass  # don't fail the order if email fails

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
        

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")

    def get_object(self):
        return get_object_or_404(
            self.get_queryset(), order_number=self.kwargs["order_number"]
        )


class CancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, order_number):
        order = get_object_or_404(
            Order, order_number=order_number, user=request.user
        )
        if order.status not in ["pending", "confirmed"]:
            return Response(
                {"detail": "This order cannot be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = Order.StatusChoices.CANCELLED
        order.save()
        try:
            send_order_cancelled(order)
        except Exception:
            pass

        return Response({"detail": "Order cancelled successfully."})

        # Restore stock
        for item in order.items.select_related("product"):
            if item.product:
                item.product.stock += item.quantity
                item.product.save()

        return Response({"detail": "Order cancelled successfully."})
