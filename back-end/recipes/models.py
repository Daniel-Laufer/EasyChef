from django.db import models
from accounts.models import User
import uuid


# Create your models here.
class Recipe(models.Model):
    name = models.CharField(max_length=255)
    author = models.ForeignKey(to=User, on_delete=models.CASCADE)
    diet = models.CharField(choices=[
                                ('unrestricted', 'unrestricted'),
                                ('vegan', 'vegan'),
                                ('vegetarian', 'vegetarian'),
                                ('kosher', 'kosher'),
                                ('halal', 'halal')
                            ], default='unrestricted', max_length=200)

    cuisine = models.CharField(choices=[
                                   ('italian', 'italian'),
                                   ('greek', 'greek'),
                                   ('mexican', 'mexican'),
                                   ("chinese", "chinese"),
                                   ("indian", "indian"),
                                   ("japanese", "japanese"),
                                   ('korean', 'korean'),
                                   ('thai', 'thai'),
                                   ('german', 'german')
                               ], max_length=200)
    cook_time_minutes = models.PositiveIntegerField()
    prep_time_minutes = models.PositiveIntegerField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

def generate_image_file_path(instance, filename):
    file_type = filename.split('.')[-1]
    return f'recipes/{uuid.uuid4()}.{file_type}'

class RecipeMedia(models.Model):
    class Meta:
        verbose_name_plural = "Recipe media"
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='media')
    image = models.FileField(upload_to=generate_image_file_path, null=True, blank=True)
    description = models.CharField(null=True, blank=True, max_length=200)

class RecipeStep(models.Model):
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='steps')
    step_number = models.PositiveIntegerField()
    instructions = models.TextField()
    cook_time_minutes = models.PositiveIntegerField()
    prep_time_minutes = models.PositiveIntegerField()

class RecipeStepMedia(models.Model):
    class Meta:
        verbose_name_plural = "Recipe step media"
    recipe_step = models.ForeignKey(to=RecipeStep, on_delete=models.CASCADE, related_name='media')
    image = models.FileField(upload_to=generate_image_file_path, null=True, blank=True)
    description = models.CharField(null=True, blank=True, max_length=200)

class Ingredient(models.Model):
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='ingredients')
    name = models.CharField(max_length=200)
    quantity_serving_one = models.PositiveIntegerField()
    quantity_serving_two = models.PositiveIntegerField()
    quantity_units = models.CharField(null=True, blank=True, max_length=4)

class Comment(models.Model):
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name='comments')
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='comments')
    date_posted = models.DateTimeField(auto_now_add=True)
    content = models.TextField()
    parent_comment = models.ForeignKey(to='self', on_delete=models.CASCADE, related_name='replies', null=True,
                                       blank=True)

class Like(models.Model):
    class Meta:
        unique_together = (('user', 'recipe'),)
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name='likes')
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='likes')

class Rating(models.Model):
    class Meta:
        unique_together = (('user', 'recipe'),)

    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name='ratings')
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='ratings')
    amount = models.IntegerField(choices=((1, "One"), (2, "Two"), (3, "Three"), (4, "Four"), (5, "Five")), null=True)

class Favourite(models.Model):
    class Meta:
        unique_together = (('user', 'recipe'),)
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name='favourites')
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='favourites')

class ShoppingListItem(models.Model):
    class Meta:
        unique_together = (('user', 'recipe'),)
    user = models.ForeignKey(to=User, on_delete=models.CASCADE, related_name='shopping_list_items')
    recipe = models.ForeignKey(to=Recipe, on_delete=models.CASCADE, related_name='shopping_list_items')








