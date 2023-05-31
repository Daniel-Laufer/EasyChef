from django.contrib import admin
from .models import Recipe, RecipeStep, RecipeStepMedia, RecipeMedia, Ingredient, Comment, Like,\
    Rating, Favourite, ShoppingListItem

# Register your models here.
admin.site.register(Recipe)
admin.site.register(RecipeStep)
admin.site.register(RecipeStepMedia)
admin.site.register(RecipeMedia)
admin.site.register(Ingredient)
admin.site.register(Comment)
admin.site.register(Like)
admin.site.register(Rating)
admin.site.register(Favourite)
admin.site.register(ShoppingListItem)
