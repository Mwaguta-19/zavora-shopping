from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Address, Cart, Order, OrderItem
from .serializers import CheckoutSerializer, OrderSerializer

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


# ─── Order Views ──────────────────────────────────────────────────────────────

class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        # ─── Validate Checkout Data ──────────────────────────────────────────
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # ─── Get Address ─────────────────────────────────────────────────────
        address = get_object_or_404(
            Address,
            id=serializer.validated_data["address_id"],
            user=request.user,
        )

        # ─── Get Cart ────────────────────────────────────────────────────────
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

        # ─── Lock Products ───────────────────────────────────────────────────
        #
        # Lock the product rows while checking stock and deducting quantities.
        # This prevents two simultaneous checkouts from overselling stock.
        #
        product_ids = [item.product_id for item in cart_items]

        locked_products = {
            product.id: product
            for product in cart_items[0].product.__class__.objects
            .select_for_update()
            .filter(id__in=product_ids)
        }

        # ─── Validate Stock ──────────────────────────────────────────────────
        for item in cart_items:
            product = locked_products.get(item.product_id)

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

        # ─── Calculate Totals ────────────────────────────────────────────────
        shipping_cost = serializer.validated_data.get(
            "shipping_cost",
            0,
        )

        subtotal = cart.subtotal
        total = subtotal + shipping_cost

        # ─── Create Order ────────────────────────────────────────────────────
        order = Order.objects.create(
            user=request.user,

            # Shipping snapshot
            shipping_full_name=address.full_name,
            shipping_phone=address.phone,
            shipping_address_line1=address.address_line1,
            shipping_address_line2=address.address_line2,
            shipping_city=address.city,
            shipping_state=address.state,
            shipping_country=address.country,
            shipping_postal_code=address.postal_code,

            # Pricing
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,

            # Additional information
            notes=serializer.validated_data.get(
                "notes",
                "",
            ),
        )

        # ─── Create Order Items & Deduct Stock ───────────────────────────────
        for item in cart_items:
            product = locked_products[item.product_id]

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

        # ─── Clear Cart ──────────────────────────────────────────────────────
        cart.items.all().delete()

        # ─── Notifications ───────────────────────────────────────────────────
        #
        # Notifications are sent only after the transaction commits.
        # SMS/email failures will not cancel the order.
        #
        transaction.on_commit(
            lambda: send_order_sms_safely(order)
        )

        transaction.on_commit(
            lambda: send_order_email_safely(order)
        )

        # ─── Response ────────────────────────────────────────────────────────
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )
