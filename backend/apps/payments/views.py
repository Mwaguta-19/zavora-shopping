import stripe
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.orders.models import Order
from .models import Payment


class CreatePaymentIntentView(APIView):
    """Create a Stripe PaymentIntent for an order."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_number = request.data.get("order_number")
        order = get_object_or_404(
            Order, order_number=order_number, user=request.user
        )

        if order.payment_status == "paid":
            return Response(
                {"detail": "This order is already paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete existing payment intent if exists
        if hasattr(order, "payment"):
            try:
                stripe.PaymentIntent.cancel(
                    order.payment.stripe_payment_intent_id
                )
            except Exception:
                pass
            order.payment.delete()

        # Create Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=int(order.total * 100),  # Stripe uses cents
            currency="usd",
            metadata={
                "order_number": order.order_number,
                "user_id": str(request.user.id),
            },
        )

        # Save payment record
        Payment.objects.create(
            order=order,
            user=request.user,
            stripe_payment_intent_id=intent.id,
            stripe_client_secret=intent.client_secret,
            amount=order.total,
        )

        return Response({
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "amount": order.total,
            "currency": "usd",
            "order_number": order.order_number,
        })


class PaymentStatusView(APIView):
    """Check payment status for an order."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_number):
        order = get_object_or_404(
            Order, order_number=order_number, user=request.user
        )
        if not hasattr(order, "payment"):
            return Response({"detail": "No payment found for this order."}, status=404)

        payment = order.payment
        # Sync with Stripe
        intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)

        if intent.status == "succeeded" and payment.status != "success":
            payment.status = Payment.StatusChoices.SUCCESS
            payment.save()
            order.payment_status = "paid"
            order.status = Order.StatusChoices.CONFIRMED
            order.save()

        return Response({
            "order_number": order_number,
            "payment_status": payment.status,
            "stripe_status": intent.status,
            "amount": payment.amount,
        })


@method_decorator(csrf_exempt, name="dispatch")
class StripeWebhookView(APIView):
    """Handle Stripe webhook events."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response({"detail": "Invalid signature."}, status=400)

        if event["type"] == "payment_intent.succeeded":
            intent = event["data"]["object"]
            self._handle_payment_success(intent)

        elif event["type"] == "payment_intent.payment_failed":
            intent = event["data"]["object"]
            self._handle_payment_failed(intent)

        return Response({"status": "ok"})

    def _handle_payment_success(self, intent):
        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=intent["id"]
            )
            payment.status = Payment.StatusChoices.SUCCESS
            payment.save()

            order = payment.order
            order.payment_status = "paid"
            order.status = Order.StatusChoices.CONFIRMED
            order.stripe_payment_intent = intent["id"]
            order.save()
        except Payment.DoesNotExist:
            pass

    def _handle_payment_failed(self, intent):
        try:
            payment = Payment.objects.get(
                stripe_payment_intent_id=intent["id"]
            )
            payment.status = Payment.StatusChoices.FAILED
            payment.save()

            order = payment.order
            order.payment_status = "failed"
            order.save()
        except Payment.DoesNotExist:
            pass


class RefundPaymentView(APIView):
    """Refund a payment (admin only)."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)

        if not hasattr(order, "payment") or order.payment.status != "success":
            return Response(
                {"detail": "No successful payment to refund."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        refund = stripe.Refund.create(
            payment_intent=order.payment.stripe_payment_intent_id
        )

        if refund.status == "succeeded":
            order.payment.status = Payment.StatusChoices.REFUNDED
            order.payment.save()
            order.payment_status = "refunded"
            order.status = Order.StatusChoices.REFUNDED
            order.save()
            return Response({"detail": "Refund successful."})

        return Response(
            {"detail": "Refund failed."},
            status=status.HTTP_400_BAD_REQUEST,
        )