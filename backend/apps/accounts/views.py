from rest_framework import generics, permissions, status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)
from django.utils.encoding import (
    force_bytes,
    force_str,
)
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response

from apps.notifications.email import (
    send_sendgrid_email,
)

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
    AdminUserSerializer,
)

from .permissions import IsSuperAdmin

import logging


User = get_user_model()

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Register
# ─────────────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        # Send welcome email without breaking registration
        try:
            send_welcome_email(user)
        except Exception:
            logger.exception(
                "Failed to send welcome email to %s",
                user.email,
            )

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────────────────────────────────────

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


# ─────────────────────────────────────────────────────────────────────────────
# Logout
# ─────────────────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {
                    "detail": "Logged out successfully."
                },
                status=status.HTTP_200_OK,
            )

        except Exception:
            return Response(
                {
                    "detail": "Invalid token."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


# ─────────────────────────────────────────────────────────────────────────────
# Profile
# ─────────────────────────────────────────────────────────────────────────────

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return UpdateProfileSerializer

        return UserSerializer

    def get_object(self):
        return self.request.user


# ─────────────────────────────────────────────────────────────────────────────
# Change Password
# ─────────────────────────────────────────────────────────────────────────────

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = request.user

        if not user.check_password(
            serializer.validated_data["old_password"]
        ):
            return Response(
                {
                    "old_password": "Incorrect password."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(
            serializer.validated_data["new_password"]
        )

        user.save()

        return Response(
            {
                "detail": "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Forgot Password
# ─────────────────────────────────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {
                    "detail": "Email is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(
                email__iexact=email,
                is_active=True,
            )

        except User.DoesNotExist:
            # Do not reveal whether an account exists.
            return Response(
                {
                    "detail": (
                        "If this email exists, "
                        "a reset link has been sent."
                    )
                },
                status=status.HTTP_200_OK,
            )

        try:
            # Generate secure password-reset token
            token = default_token_generator.make_token(user)

            # Encode user ID
            uid = urlsafe_base64_encode(
                force_bytes(user.pk)
            )

            # Frontend reset URL
            reset_url = (
                f"{settings.FRONTEND_URL}"
                f"/reset-password/{uid}/{token}"
            )

            # Send password-reset email through SendGrid
            response = send_sendgrid_email(
                to_email=user.email,
                subject="Reset Your Zavora Password",
                text_content=f"""
Hi {user.first_name or user.email},

We received a request to reset your Zavora password.

Click the link below to reset your password:

{reset_url}

If you did not request this password reset, you can safely ignore this email.

Zavora Team
""",
            )

            logger.info(
                "Password reset email sent to %s. SendGrid status: %s",
                user.email,
                response.status_code,
            )

        except Exception:
            # IMPORTANT:
            # Log the actual error on Railway so we can diagnose it.
            logger.exception(
                "Failed to send password reset email to %s",
                user.email,
            )

            return Response(
                {
                    "detail": (
                        "Unable to send the password reset email "
                        "at this time. Please try again later."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "detail": (
                    "If this email exists, "
                    "a reset link has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Reset Password
# ─────────────────────────────────────────────────────────────────────────────

class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        new_password2 = request.data.get("new_password2")

        # Check required fields
        if not all(
            [
                uid,
                token,
                new_password,
                new_password2,
            ]
        ):
            return Response(
                {
                    "detail": "All fields are required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check passwords match
        if new_password != new_password2:
            return Response(
                {
                    "detail": "Passwords do not match."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check password length
        if len(new_password) < 8:
            return Response(
                {
                    "detail": (
                        "Password must be at least "
                        "8 characters long."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Decode user ID
        try:
            user_id = force_str(
                urlsafe_base64_decode(uid)
            )

            user = User.objects.get(
                pk=user_id,
                is_active=True,
            )

        except (
            User.DoesNotExist,
            ValueError,
            TypeError,
            OverflowError,
        ):
            return Response(
                {
                    "detail": "Invalid reset link."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate token
        if not default_token_generator.check_token(
            user,
            token,
        ):
            return Response(
                {
                    "detail": (
                        "Reset link has expired or is invalid. "
                        "Please request a new one."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Change password
        user.set_password(new_password)
        user.save()

        return Response(
            {
                "detail": (
                    "Password reset successfully. "
                    "You can now login."
                )
            },
            status=status.HTTP_200_OK,
        )


# ─────────────────────────────────────────────────────────────────────────────
# Welcome Email
# ─────────────────────────────────────────────────────────────────────────────

def send_welcome_email(user):
    """
    Send welcome email through SendGrid.
    """

    if not user.email:
        return

    return send_sendgrid_email(
        to_email=user.email,
        subject="Welcome to Zavora!",
        text_content=f"""
Hi {user.first_name or user.email},

Welcome to Zavora!

We're excited to have you.

Start shopping at:
{settings.FRONTEND_URL}

Happy shopping!

Zavora Team
""",
    )

class AdminUserListView(generics.ListAPIView):
    """
    Return all users for the admin dashboard.
    Only staff/superusers can access this endpoint.
    """

    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return User.objects.all().order_by("-created_at")


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a user.

    Only Super Admins can access this endpoint.
    Super Admin accounts are protected from modification/deletion.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]

    def get_queryset(self):
        return User.objects.all()

    def update(self, request, *args, **kwargs):
        user = self.get_object()

        # Protect Super Admin accounts
        if user.is_superuser:
            return Response(
                {
                    "detail": "Super Admin accounts cannot be modified."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()

        # Protect Super Admin accounts
        if user.is_superuser:
            return Response(
                {
                    "detail": "Super Admin accounts cannot be deleted."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().destroy(request, *args, **kwargs)