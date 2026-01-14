from rest_framework import permissions


class IsStaffOrReadOnly(permissions.BasePermission):
    """Allow full access to staff users, read-only to others."""

    def has_permission(self, request, view):
        # read-only methods allowed for any request
        if request.method in permissions.SAFE_METHODS:
            return True
        # write methods only for staff or teachers
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_staff:
            return True
        # allow teachers (role == 'teacher') to write
        return getattr(user, 'role', None) == 'teacher'


class IsStaffOrTeacher(permissions.BasePermission):
    """
    Allows access to staff users or users with the 'teacher' role.
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return user.is_staff or getattr(user, 'role', None) == 'teacher'


class IsInstructorOrStaff(permissions.BasePermission):
    """
    Allows access to staff users or instructors who own the resource.
    Safe methods are allowed for all authenticated users.
    """
    def has_object_permission(self, request, view, obj):
        # Allow read-only for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True

        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.is_staff:
            return True
        
        # Check if user is a teacher and owns the object
        is_teacher = getattr(user, 'role', None) == 'teacher'
        owner = getattr(obj, 'owner', None)
        return is_teacher and owner == user
