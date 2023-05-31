from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.tokens import RefreshToken
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_201_CREATED

from .permissions import IsOwnerOrReadOnly
from .serializers import UserSerializer, MinimalUserSerializer
from rest_framework.decorators import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import UpdateAPIView, DestroyAPIView
from accounts.models import User
import os
from easy_chef_back_end.settings import MEDIA_ROOT
from django.shortcuts import get_object_or_404



# source: https://django-rest-framework-simplejwt.readthedocs.io/en/latest/creating_tokens_manually.html
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class Register(APIView):
    @swagger_auto_schema(
        security=[],
        operation_summary='Create user account',
        operation_description='Create user account, and obtain refresh and access tokens for this user.',
        request_body=UserSerializer,
        responses={
            201: openapi.Response(
                description="User created successfully",
                examples={
                    "application/json": {

                        "id": 3,
                        "username": "DanL9875",
                        "first_name": "Daniel",
                        "last_name": "Laufer",
                        "email": "daniel.laufer@mail.utoronto.ca",
                        "phone_number": "+19055108458",
                        "profile_picture": "/media/profile_pictures/f9881bbe-e9b7-49fa-ab7e-b16fc74717e4.jpeg",
                        "tokens": {
                            "refresh": "AAAAAAA",
                            "access": "BBBBBB"
                        }

                    }
                },

            ),
            404: 'User not found'
        },
    )
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            response = {**serializer.data, "tokens": get_tokens_for_user(user)}
            return Response(response, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


class ViewAccount(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        security=[{"Bearer": []}],
        operation_summary='View a user account with a specific id',
        operation_description='View a user account with a specific id',
        responses={
            200: openapi.Response(
                description="Success",
                examples={
                    "application/json": {
                        "id": 3,
                        "username": "DanL9875edited",
                        "first_name": "Daniel",
                        "last_name": "Laufer",
                        "email": "daniel.laufer@mail.utoronto.ca",
                        "phone_number": "+19055108458",
                        "profile_picture": "/media/profile_pictures/f9881bbe-e9b7-49fa-ab7e-b16fc74717e4.jpeg"
                    }
                },

            ),
            401: "Authentication credentials were not provided.",
            404: 'User not found',
        }
    )
    def get(self, request, user_id):
        user = get_object_or_404(User, id=user_id)
        # if user != request.user:
        #     serializer = MinimalUserSerializer(user)
        # else:
        #     serializer = UserSerializer(user)
        serializer = UserSerializer(user)
        return Response(serializer.data)



class EditAccount(UpdateAPIView):
    queryset = User.objects.all()
    lookup_field = 'id'
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    # @swagger_auto_schema(
    #     security=[{"Bearer": []}],
    #     operation_summary='Update user account details',
    #     operation_description='Update the details of the user account that has the specified id.',
    #     request_body=UserSerializer,
    #     responses={
    #         200: openapi.Response(
    #             description="Success",
    #             examples={
    #                 "application/json": {
    #                     "id": 3,
    #                     "username": "DanL9875edited",
    #                     "first_name": "Daniel",
    #                     "last_name": "Laufer",
    #                     "email": "daniel.laufer@mail.utoronto.ca",
    #                     "phone_number": "+19055108458",
    #                     "profile_picture": "http://localhost:8000/media/profile_pictures/f9881bbe-e9b7-49fa-ab7e-b16fc74717e4.jpeg"
    #                 }
    #             },
    #
    #         ),
    #         401: "Authentication credentials were not provided.",
    #         403: "You do not have permission to perform this action. (You need to be the owner of the account).",
    #         404: 'User not found'
    #     },
    # )
    # def patch(self, request, *args, **kwargs):
    #     return super().patch(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        password = serializer.validated_data.get('password', None)
        self.perform_update(serializer)
        if password:
            instance.set_password(password)
            instance.save()

        return Response(serializer.data)


@method_decorator(name="delete", decorator=swagger_auto_schema(
    operation_summary="Delete a user account",
    operation_description="Deletes a user account with the specified id",
    responses={
        204: "Account was successfully deleted",
        401: "Authentication credentials were not provided.",
        403: "You do not have permission to perform this action.",
        404: "Account was not found"
    }
))
class DeleteAccount(DestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    lookup_field = 'pk'
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_destroy(self, instance):

        file_to_del = instance.profile_picture
        relative_path_to_media = None
        if file_to_del and file_to_del.url:
            relative_path_to_media = file_to_del.url
            if relative_path_to_media.startswith("/media"):
                relative_path_to_media = relative_path_to_media[len(" /media"):]

        super().perform_destroy(instance)

        if relative_path_to_media and 'default.jpg' not in relative_path_to_media:
            os.remove(os.path.join(MEDIA_ROOT, relative_path_to_media))

        return Response("success")


class Login(APIView):
    @swagger_auto_schema(
        security=[],
        operation_summary='Log in to a user account',
        operation_description='Log in to a user account, and obtain refresh and access tokens for this user.',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[
                'username',
                'password',
            ],
            properties={
                'username': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            201: openapi.Response(
                description="User logged in successfully",
                examples={
                    "application/json": {
                        "id": 1,
                        "username": "DanL987783",
                        "first_name": "Daniel2",
                        "last_name": "Laufer2",
                        "email": "daniel.laufer@mail.utoronto.ca",
                        "phone_number": "+19055108458",
                        "profile_picture": "/media/profile_pictures/default.jpg",
                        "tokens": {
                            "refresh": "xxxxxx",
                            "access": "yyyyyy"
                        }
                    }
                },

            ),
            401: 'Unauthorized'
        },
    )
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username:
            return Response("username is required.", status=HTTP_400_BAD_REQUEST)
        if not password:
            return Response("password is required.", status=HTTP_400_BAD_REQUEST)

        if (user := authenticate(username=username, password=password)) is not None:
            serializer = UserSerializer(user)
            return Response({
                **serializer.data,
                'tokens': get_tokens_for_user(user)
            })
        else:
            return Response(status=401)
