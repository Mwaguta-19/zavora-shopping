import africastalking
from django.conf import settings


def send_sms(phone: str, message: str):
    """Send SMS via Africa's Talking."""
    try:
        africastalking.initialize(
            username=settings.AT_USERNAME,
            api_key=settings.AT_API_KEY,
        )
        sms = africastalking.SMS
        response = sms.send(message, [phone])
        return response
    except Exception as e:
        print(f"SMS Error: {e}")
        return None


def send_order_sms(order):
    """Send order confirmation SMS."""
    if not order.user.phone:
        return

    message = (
        f"Hi {order.user.first_name or 'Customer'}! "
        f"Your order #{order.order_number} has been placed. "
        f"Total: KES {order.total}. "
        f"Track at: zavora-shopping-mart.vercel.app/{order.order_number}"
    )
    send_sms(order.user.phone, message)


def send_order_shipped_sms(order, tracking=None):
    """Send shipping SMS."""
    if not order.user.phone:
        return

    message = (
        f"Your order #{order.order_number} has been shipped! "
        f"{'Tracking: ' + tracking if tracking else ''} "
        f"Zavora shopping mart"
    )
    send_sms(order.user.phone, message)