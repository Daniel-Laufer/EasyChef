import uuid
import os
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

# Create your models here.
def generate_file_path(instance, filename):
    file_type = filename.split('.')[-1]
    return f'profile_pictures/{uuid.uuid4()}.{file_type}'

class User(AbstractUser):
    profile_picture = models.ImageField(upload_to=generate_file_path, default="profile_pictures/default.jpg")

    # source: https://stackoverflow.com/a/19131360
    phone_number_regex = RegexValidator(regex=r'^\+?1?\d{9,15}$')
    phone_number = models.CharField(validators=[phone_number_regex], max_length=17)












