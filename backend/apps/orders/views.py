from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Address,
    Cart,
    Order,
    OrderItem,
)

from .serializers import (
    AddressSerializer,
    CheckoutSerializer,
    OrderSerializer,
)

from apps.products.models import Product
from apps.notifications.email import send_order_confirmation
from apps.notifications.sms import send_order_sms


# ─── Notification Helpers ────────────────────────────────────────────────────

def send_order_sms_safely(order):
    """
    Send order SMS without allowing an SMS failure
    to affect the completed order.
    """
    try:
        send_order_sms(order)
    except Exception:
        pass


def send_order_email_safely(order):
    """
    Send order confirmation email without allowing
    an email failure to affect the completed order.
    """
    try:
        send_order_confirmation(order)
    except Exception:
        pass


# ─── Address Views ────────────────────────────────────────────────────────────

class AddressListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        addresses = Address.objects.filter(
            user=request.user
        ).order_by("-id")

        serializer = AddressSerializer(
            addresses,
            many=True
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = AddressSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save(
            user=request.user
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class AddressDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(
            Address,
            pk=pk,
            user=request.user,
        )

    def get(self, request, pk):
        address = self.get_object(request, pk)

        serializer = AddressSerializer(address)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk):
        address = self.get_object(request, pk)

        serializer = AddressSerializer(
            address,
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, pk):
        address = self.get_object(request, pk)

        serializer = AddressSerializer(
            address,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        address = self.get_object(request, pk)

        address.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Cart Views ───────────────────────────────────────────────────────────────

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        return cart

    def get(self, request):
        cart = self.get_cart(request)

        # Change this to CartSerializer if your project has one.
        from .serializers import CartSerializer

        serializer = CartSerializer(cart)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class CartItemView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(
            user=request.user
        )

        return cart

    def post(self, request):
        """
        Add a product to the cart.

        Expected request:

        {
            "product_id": 1,
            "quantity": 2
        }
        """

        cart = self.get_cart(request)

        product_id = request.data.get("product_id")
        quantity = request.data.get("quantity", 1)

        if not product_id:
            return Response(
                {"detail": "product_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = get_object_or_404(
            Product,
            id=product_id,
        )

        if product.stock < quantity:
            return Response(
                {
                    "detail": (
                        f"'{product.name}' only has "
                        f"{product.stock} in stock."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        item, created = cart.items.get_or_create(
            product=product,
            defaults={
                "quantity": quantity,
            },
        )

        if not created:
            new_quantity = item.quantity + quantity

            if product.stock < new_quantity:
                return Response(
                    {
                        "detail": (
                            f"Only {product.stock} units of "
                            f"'{product.name}' are available."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            item.quantity = new_quantity
            item.save(update_fields=["quantity"])

        from .serializers import CartSerializer

        return Response(
            CartSerializer(cart).data,
            status=(
                status.HTTP_201_CREATED
                if created
                else status.HTTP_200_OK
            ),
        )

    def patch(self, request, item_id):
        cart = self.get_cart(request)

        item = get_object_or_404(
            cart.items.select_related("product"),
            id=item_id,
        )

        quantity = request.data.get("quantity")

        if quantity is None:
            return Response(
                {"detail": "quantity is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Quantity must be a valid number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity < 1:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if item.product.stock < quantity:
            return Response(
                {
                    "detail": (
                        f"Only {item.product.stock} units of "
                        f"'{item.product.name}' are available."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        item.quantity = quantity
        item.save(update_fields=["quantity"])

        from .serializers import CartSerializer

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request, item_id):
        cart = self.get_cart(request)

        item = get_object_or_404(
            cart.items,
            id=item_id,
        )

        item.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


# ─── Checkout View ────────────────────────────────────────────────────────────

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # Validate checkout data
        serializer = CheckoutSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        # Get shipping address belonging to user
        address = get_object_or_404(
            Address,
            id=serializer.validated_data["address_id"],
            user=request.user,
        )

        # Get user's cart
        cart = get_object_or_404(
            Cart,
            user=request.user,
        )

        cart_items = list(
            cart.items.select_related("product")
        )

        if not cart_items:
            return Response(
                {"detail": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Lock product rows
        product_ids = [
            item.product_id
            for item in cart_items
        ]

        locked_products = {
            product.id: product
            for product in (
                Product.objects
                .select_for_update()
                .filter(id__in=product_ids)
            )
        }

        # Validate stock
        for item in cart_items:
            product = locked_products.get(
                item.product_id
            )

            if product is None:
                return Response(
                    {
                        "detail": (
                            f"Product '{item.product.name}' "
                            "is no longer available."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if product.stock < item.quantity:
                return Response(
                    {
                        "detail": (
                            f"'{product.name}' only has "
                            f"{product.stock} in stock."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Calculate totals
        shipping_cost = serializer.validated_data.get(
            "shipping_cost",
            0,
        )

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

            notes=serializer.validated_data.get(
                "notes",
                "",
            ),
        )

        # Create order items and deduct stock
        for item in cart_items:
            product = locked_products[
                item.product_id
            ]

            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                product_sku=product.sku,
                quantity=item.quantity,
                unit_price=product.effective_price,
            )

            product.stock -= item.quantity

            product.save(
                update_fields=["stock"]
            )

        # Clear cart
        cart.items.all().delete()

        # Send notifications after successful commit
        transaction.on_commit(
            lambda: send_order_sms_safely(order)
        )

        transaction.on_commit(
            lambda: send_order_email_safely(order)
        )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


# ─── Order Views ──────────────────────────────────────────────────────────────

class OrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects
            .filter(user=request.user)
            .order_by("-id")
        )

        serializer = OrderSerializer(
            orders,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_number):
        order = get_object_or_404(
            Order,
            order_number=order_number,
            user=request.user,
        )

        serializer = OrderSerializer(order)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class CancelOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_number):
        order = get_object_or_404(
            Order.objects.select_for_update(),
            order_number=order_number,
            user=request.user,
        )

        # Adjust these status names if your Order model
        # uses different choices.
        if order.status in [
            "cancelled",
            "delivered",
            "completed",
        ]:
            return Response(
                {
                    "detail": (
                        f"Order cannot be cancelled because "
                        f"its status is '{order.status}'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restore stock
        for item in order.items.select_related("product"):
            product = item.product

            if product:
                product.stock += item.quantity

                product.save(
                    update_fields=["stock"]
                )

        order.status = "cancelled"
        order.save(
            update_fields=["status"]
        )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_200_OK,
        )
