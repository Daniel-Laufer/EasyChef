from rest_framework import serializers
from accounts.models import User


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'password', 'email', 'phone_number', 'profile_picture')
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        created_user = User.objects.create_user(
            validated_data.get("username"),
            validated_data.get("email"),
            validated_data.get("password"),
            phone_number=validated_data.get("phone_number"),
            first_name=validated_data.get("first_name"),
            last_name=validated_data.get("last_name")
        )
        if profile_picture := validated_data.get("profile_picture"):
            created_user.profile_picture = profile_picture
        created_user.save()
        return created_user



class MinimalUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ('id', 'username', 'profile_picture')






