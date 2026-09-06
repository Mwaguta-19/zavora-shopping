from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Allows access only to Super Admin users.
    """

    message = "Only Super Admins can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.is_superuser
        )


class IsStaffUser(BasePermission):
    """
    Allows access to active staff users, including Super Admins.
    """

    message = "Staff access is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.is_staff
        )


class IsSuperAdminOrStaff(BasePermission):
    """
    Allows access to active Super Admins or Staff.
    """

    message = "Administrative access is required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and (
                request.user.is_superuser
                or request.user.is_staff
            )
        )