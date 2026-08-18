from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


def send_order_confirmation(order):
    """Send order confirmation email to customer."""
    user = order.user
    items = order.items.all()

    context = {
        "user_name": user.full_name or user.email,
        "order_number": order.order_number,
        "status": order.get_status_display(),
        "order_date": order.created_at.strftime("%B %d, %Y"),
        "items": items,
        "total": order.total,
        "shipping_name": order.shipping_full_name,
        "shipping_address": order.shipping_address_line1,
        "shipping_city": order.shipping_city,
        "shipping_country": order.shipping_country,
        "frontend_url": settings.FRONTEND_URL,
    }

    html_content = render_to_string("notifications/order_confirmed.html", context)
    text_content = f"""
Hi {context['user_name']},

Your order {order.order_number} has been confirmed!
Total: ${order.total}

Thank you for shopping with Jumia Clone.
    """

    msg = EmailMultiAlternatives(
        subject=f"Order Confirmed — {order.order_number}",
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_content, "text/html")
    msg.send(fail_silently=False)


def send_order_shipped(order, tracking_number=None):
    """Send shipping notification."""
    user = order.user
    subject = f"Your order {order.order_number} has been shipped! 🚚"
    body = f"""
Hi {user.full_name or user.email},

Great news! Your order {order.order_number} is on its way.

{"Tracking Number: " + tracking_number if tracking_number else ""}

Shipping to:
{order.shipping_full_name}
{order.shipping_address_line1}
{order.shipping_city}, {order.shipping_country}

Thank you for shopping with Jumia Clone!
    """
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_order_cancelled(order):
    """Send cancellation email."""
    user = order.user
    subject = f"Order {order.order_number} Cancelled"
    body = f"""
Hi {user.full_name or user.email},

Your order {order.order_number} has been cancelled.
Total refund of ${order.total} will be processed within 3-5 business days.

If you have questions, reply to this email.

Jumia Clone Team
    """
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def send_welcome_email(user):
    """Send welcome email on registration."""
    subject = "Welcome to Jumia Clone! 🎉"
    body = f"""
Hi {user.first_name or user.email},

Welcome to Jumia Clone! We're excited to have you.

Start shopping now at {settings.FRONTEND_URL}

Happy shopping!
Jumia Clone Team
    """
    send_mail(
        subject=subject,
        message=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )