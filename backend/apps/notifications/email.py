from django.conf import settings
from django.core.mail import send_mail


def send_order_confirmation(order):
    """
    Send an order confirmation email to the customer.
    """

    user = order.user

    if not user.email:
        return

    send_mail(
        subject=f"Order #{order.id} Confirmation",
        message=(
            f"Hi {user.get_full_name() or user.username},\n\n"
            f"Thank you for your order!\n\n"
            f"Order ID: #{order.id}\n"
            f"Total: {order.total}\n\n"
            "We have received your order and will process it shortly.\n\n"
            "Thank you for shopping with us."
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )
