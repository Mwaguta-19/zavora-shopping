from django.contrib import admin
from .models import Address, Cart, CartItem, Order, OrderItem


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["full_name", "user", "city", "country", "is_default"]
    search_fields = ["full_name", "user__email", "city"]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    fields = ["product", "product_name", "product_sku", "quantity", "unit_price"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_number", "user", "status", "payment_status",
        "subtotal", "total", "created_at",
    ]
    list_filter = ["status", "payment_status"]
    search_fields = ["order_number", "user__email"]
    readonly_fields = ["order_number", "subtotal", "total", "created_at"]
    inlines = [OrderItemInline]

    def save_model(self, request, obj, form, change):
        """Auto-calculate subtotal and total before saving."""
        obj.subtotal = obj.subtotal or 0
        obj.shipping_cost = obj.shipping_cost or 0
        obj.total = obj.subtotal + obj.shipping_cost
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        """Recalculate totals after order items are saved."""
        super().save_related(request, form, formsets, change)
        obj = form.instance
        items_total = sum(
            (item.unit_price * item.quantity)
            for item in obj.items.all()
            if item.unit_price
        )
        obj.subtotal = items_total
        obj.total = items_total + (obj.shipping_cost or 0)
        obj.save()