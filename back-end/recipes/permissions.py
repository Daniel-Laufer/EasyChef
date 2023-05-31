from rest_framework import permissions

class IsOwnerOrReadOnlyRecipe(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # anyone can read
        if request.method in permissions.SAFE_METHODS:
            return True
        # Only the owner of an account can edit their account.
        return obj.author == request.user
