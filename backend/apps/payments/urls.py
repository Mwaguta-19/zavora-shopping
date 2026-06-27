from django.urls import path
from .views import (
    CreatePaymentIntentView,
    PaymentStatusView,
    StripeWebhookView,
    RefundPaymentView,
)

urlpatterns = [
    path("create-intent/", CreatePaymentIntentView.as_view(), name="create-payment-intent"),
    path("status/<str:order_number>/", PaymentStatusView.as_view(), name="payment-status"),
    path("webhook/", StripeWebhookView.as_view(), name="stripe-webhook"),
    path("refund/<str:order_number>/", RefundPaymentView.as_view(), name="refund-payment"),
]