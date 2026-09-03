import os

from django.conf import settings
from django.template.loader import render_to_string

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


def send_sendgrid_email(
    to_email,
    subject,
    text_content,
    html_content=None,
):
    """
    Send an email through the SendGrid Web API.
    """

    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = settings.DEFAULT_FROM_EMAIL

    if not api_key:
        raise RuntimeError(
            "SENDGRID_API_KEY is not configured."
        )

    if not from_email:
        raise RuntimeError(
            "DEFAULT_FROM_EMAIL is not configured."
        )

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=subject,
        plain_text_content=text_content,
    )

    if html_content:
        message.add_content(
            html_content,
            "text/html",
        )

    client = SendGridAPIClient(api_key)

    response = client.send(message)

    if response.status_code not in (200, 201, 202):
        raise RuntimeError(
            f"SendGrid error: "
            f"{response.status_code} - {response.body}"
        )

    return response


def send_order_confirmation(order):
    """
    Send an order confirmation email to the customer.
    """

    user = order.user

    if not user.email:
        return

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

    html_content = render_to_string(
        "notifications/order_confirmed.html",
        context,
    )

    text_content = f"""
Hi {context['user_name']},

Your order {order.order_number} has been confirmed!

Total: ${order.total}

Thank you for shopping with Zavora.
"""

    return send_sendgrid_email(
        to_email=user.email,
        subject=f"Order Confirmed — {order.order_number}",
        text_content=text_content,
        html_content=html_content,
    )
