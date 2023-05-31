"""easy_chef_back_end URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from accounts.views import Register, Login, EditAccount, DeleteAccount, ViewAccount
from django.http import HttpResponse
from django.urls import re_path


urlpatterns = [
    path('register/', Register.as_view(), name='register_view'),
    path('login/', Login.as_view(), name="login_view"),
    path("<int:user_id>/", ViewAccount.as_view(), name="view_account"),
    path("<int:id>/edit/", EditAccount.as_view(), name="edit_user"),
    path("<int:pk>/delete/", DeleteAccount.as_view(), name="delete_user"),
    re_path(r'^.*$', lambda _: HttpResponse("Page not found.", status=404))
]
