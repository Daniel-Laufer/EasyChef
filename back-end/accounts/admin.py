from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import User

fields = list(UserAdmin.fieldsets)
fields[0] = (None, {'fields': ('username', 'password', 'profile_picture', 'phone_number')})
UserAdmin.fieldsets = tuple(fields)


# admin.site.register(CustomUser)
admin.site.register(User, UserAdmin)