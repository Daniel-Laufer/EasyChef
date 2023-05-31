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
from .views import CreateRecipe, RecipeMediaView, RecipeStepMediaView, AllRecipes, RecipeComments, CreateComment, \
    Likes, AddLike, AddFavourite, AddRating, Favourites, Ratings, GetRecipeIngredients, ViewRecipe, ViewShoppingList, \
    AddToShoppingList, MyRecipes, SearchRecipesView, SearchIngredients, DeleteRecipe, EditRecipe, DeleteRecipeMedia, \
    DeleteRecipeStepMedia, RemoveLike, RemoveFavourite, RemoveRecipeFromShoppingList
from django.http import HttpResponse
from django.urls import re_path


urlpatterns = [
    path('', AllRecipes.as_view(), name="view_all_recipes"),
    path('search/', SearchRecipesView.as_view(), name="search_recipes"),
    path("ingredients/search/", SearchIngredients.as_view(), name="ingredients_search"),
    path('create/', CreateRecipe.as_view(), name='create_recipe'),
    path('<int:pk>/delete/', DeleteRecipe.as_view(), name='delete_recipe'),
    path('<int:pk>/edit/', EditRecipe.as_view(), name='edit_recipe'),
    path('media/', RecipeMediaView.as_view(), name="recipe_media"),
    path('media/<int:pk>/delete/', DeleteRecipeMedia.as_view(), name="delete_recipe_media"),
    path('media/step/', RecipeStepMediaView.as_view(), name="recipe_step_media"),
    path('media/step/<int:pk>/delete/', DeleteRecipeStepMedia.as_view(), name="delete_recipe_step_media"),
    path('shopping-list/', ViewShoppingList.as_view(), name="shopping_list"),
    path('shopping-list/add/', AddToShoppingList.as_view(), name="shopping_list"),
    path('shopping-list/<int:pk>/', RemoveRecipeFromShoppingList.as_view(), name="recipe_remove_shopping_list_item"),
    path('comments/', CreateComment.as_view(), name="recipe_create_comment"),
    path('likes/', AddLike.as_view(), name="recipe_add_like"),
    path('likes/<int:pk>/', RemoveLike.as_view(), name="recipe_remove_like"),
    path('favourites/', AddFavourite.as_view(), name="recipe_add_favourite"),
    path('favourites/<int:pk>/', RemoveFavourite.as_view(), name="recipe_remove_favourite"),
    path('ratings/', AddRating.as_view(), name="recipe_add_rating"),
    path('my-recipes/', MyRecipes.as_view(), name="my-recipes"),
    path('<int:recipe_id>/', ViewRecipe.as_view(), name="view_recipe"),
    path('<int:recipe_id>/comments/', RecipeComments.as_view(), name="recipe_comments"),
    path('<int:recipe_id>/likes/', Likes.as_view(), name="recipe_likes"),
    path('<int:recipe_id>/favourites/', Favourites.as_view(), name="recipe_favourites"),
    path('<int:recipe_id>/ratings/', Ratings.as_view(), name="recipe_ratings"),
    path('<int:recipe_id>/ingredients/', GetRecipeIngredients.as_view(), name="recipe_ratings"),
    re_path(r'^.*$', lambda _: HttpResponse("Page not found.", status=404))
]
