from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "order", "user", "amount", "currency",
        "status", "created_at",
    ]
    list_filter = ["status", "currency"]
    search_fields = ["order__order_number", "user__email", "stripe_payment_intent_id"]
    readonly_fields = [
        "order", "user", "stripe_payment_intent_id", "stripe_client_secret",
        "amount", "currency", "created_at", "updated_at",
    ]

    def has_add_permission(self, request):
        return False  # payments created by API only, not admin

    def has_delete_permission(self, request, obj=None):
        return False  # never delete payment records