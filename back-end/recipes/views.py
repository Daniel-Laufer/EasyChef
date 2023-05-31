from django.db.models import Count, Avg
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.status import HTTP_400_BAD_REQUEST, HTTP_201_CREATED, HTTP_403_FORBIDDEN, HTTP_500_INTERNAL_SERVER_ERROR, HTTP_404_NOT_FOUND
from .permissions import IsOwnerOrReadOnlyRecipe
from .serializers import RecipeSerializer, RecipeStepMediaSerializer, RecipeMediaSerializer, CommentSerializer, \
    LikeSerializer, FavouriteSerializer, RatingSerializer, IngredientSerializer, ShoppingListItemSerializer
from rest_framework.decorators import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Recipe, Comment, Like, Favourite, Rating, Ingredient, ShoppingListItem, RecipeMedia, RecipeStepMedia
from accounts.models import User
from django.shortcuts import get_object_or_404
from rest_framework.generics import ListAPIView, DestroyAPIView
from rest_framework.pagination import PageNumberPagination
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json
from .docs_example_data import example_response
import os
import Levenshtein
from easy_chef_back_end.settings import MEDIA_ROOT
from django.core.exceptions import ObjectDoesNotExist, PermissionDenied, ValidationError


# Create your views here.

# source: https://django-rest-framework-simplejwt.readthedocs.io/en/latest/creating_tokens_manually.html

@method_decorator(name='get', decorator=swagger_auto_schema(
    operation_summary='Get all recipes',
    operation_description='Get all recipes. By default, recipes that were created most recently will be displayed'
                          ' first in the output',
    security=[{"Bearer": []}],
    manual_parameters=[
        openapi.Parameter('popularityDesc', openapi.IN_QUERY,
                          description="(Optional) Return results in order of popularity (descending order).",
                          type=openapi.TYPE_BOOLEAN),
    ],

    responses={
        200: openapi.Response('Successful response',
                              examples={"application/json": json.dumps(example_response.get("AllRecipesGET", {}))},
                              ),
        404: 'Recipe or page not found',
    }
))
class AllRecipes(ListAPIView):
    pagination_class = PageNumberPagination
    permission_classes = [IsAuthenticated]
    serializer_class = RecipeSerializer

    def get_queryset(self):
        request = self.request
        order_by_popularity_desc = request.GET.get('popularityDesc')
        recipes = Recipe.objects.all()
        if order_by_popularity_desc and order_by_popularity_desc.lower() == 'true':
            return recipes.annotate(num_favs=Count("favourites"), overall_rating=Avg("ratings__amount")).distinct() \
                .order_by('-num_favs', '-overall_rating')

        else:
            return recipes.order_by("created_at")

    def get_serializer_context(self):
        context = super(AllRecipes, self).get_serializer_context()
        context['user'] = self.request.user
        return context


@method_decorator(name='get', decorator=swagger_auto_schema(
    operation_summary='Get my recipes',
    operation_description='Get my recipes (recipes that I have favourited, liked, rated, or commented on)',
    security=[{"Bearer": []}],
    responses={
        200: openapi.Response('Successful response',
                              examples={"application/json": json.dumps(example_response.get("MyRecipesGET", {}))},
                              ),
        401: "Authentication credentials were not provided.",
        404: 'Recipe not found',
    }
))
class MyRecipes(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = self.request.user
        to_return = {"favourited": set(), "liked": set(), "rated": set(), "commented": set()}

        favourited = Favourite.objects.filter(user=user)
        for inst in favourited:
            to_return["favourited"].add(inst.recipe)

        liked = Like.objects.filter(user=user)
        for inst in liked:
            to_return["liked"].add(inst.recipe)

        rated = Rating.objects.filter(user=user)
        for inst in rated:
            to_return["rated"].add(inst.recipe)

        commented = Comment.objects.filter(user=user)
        for inst in commented:
            to_return["commented"].add(inst.recipe)

        for key in to_return.keys():
            to_return[key] = [RecipeSerializer(recipe, context={'user': request.user}).data for recipe in to_return[key]]

        return Response(to_return)


@method_decorator(name='get', decorator=swagger_auto_schema(
    manual_parameters=[
        openapi.Parameter('name', openapi.IN_QUERY, description="Recipe name to search for",
                          type=openapi.TYPE_STRING),
        openapi.Parameter(
            'ingredients', openapi.IN_QUERY,
            description="Comma-separated list of ingredients to search for",
            type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_STRING)
        ),
        openapi.Parameter('username', openapi.IN_QUERY, description="Username of the creator to filter by",
                          type=openapi.TYPE_STRING),
        openapi.Parameter('cuisine', openapi.IN_QUERY, description="Recipe cuisine to filter by",
                          type=openapi.TYPE_STRING),
        openapi.Parameter('diet', openapi.IN_QUERY, description="Recipe diet to filter by",
                          type=openapi.TYPE_STRING),
        openapi.Parameter('maxCookTime', openapi.IN_QUERY, description="Max cooking time (in minutes) to filter by",
                          type=openapi.TYPE_STRING),
    ],
    responses={
        200: openapi.Response("success",
                              examples={"application/json": json.dumps(example_response["SearchRecipesViewGET"])},
                              ),
        401: "Authentication credentials were not provided.",
    },
    operation_summary="Filter recipes by name, ingredients, and/or creator",
    operation_description="Filter recipes by name, ingredients, and/or creator",
))
class SearchRecipesView(ListAPIView):
    pagination_class = PageNumberPagination
    permission_classes = [IsAuthenticated]
    serializer_class = RecipeSerializer

    def get_queryset(self):
        request = self.request
        name = request.GET.get('name')
        ingredients = request.GET.get('ingredients')
        username = request.GET.get('username')
        cuisine = request.GET.get('cuisine')
        diet = request.GET.get('diet')
        max_cook_time = request.GET.get('maxCookTime')

        filtered_recipes = Recipe.objects.all()
        if name:
            filtered_recipes = filtered_recipes.filter(name__icontains=name)

        if ingredients:
            ingredients_list = ingredients.split(',')

            for ing in ingredients_list:
                if ing.strip():
                    filtered_recipes = filtered_recipes.filter(ingredients__name__icontains=ing)

        if username:
            filtered_recipes = filtered_recipes.filter(author__username__icontains=username)

        if cuisine:
            filtered_recipes = filtered_recipes.filter(cuisine__icontains=cuisine)

        if diet:
            filtered_recipes = filtered_recipes.filter(diet__icontains=diet)

        if max_cook_time:
            filtered_recipes = filtered_recipes.filter(cook_time_minutes__lte=max_cook_time)

        return filtered_recipes.annotate(num_favs=Count("favourites"), overall_rating=Avg("ratings__amount")) \
            .order_by('-num_favs', '-overall_rating')

    def get_serializer_context(self):
        context = super(SearchRecipesView, self).get_serializer_context()
        context['user'] = self.request.user
        return context


@method_decorator(name='get', decorator=swagger_auto_schema(
    manual_parameters=[
        openapi.Parameter('q', openapi.IN_QUERY, description="Search term/phrase.",
                          type=openapi.TYPE_STRING),
    ],
    responses={
        200: openapi.Response("success",
                              examples={"application/json": json.dumps(example_response["SearchIngredientsGET"])},
                              ),
        401: "Authentication credentials were not provided.",
    },
    operation_description="Return the 10 most 'similar' (in terms of Levenshtein distance) ingredients to the "
                          "provided search term",
    operation_summary="Search ingredients"
))
class SearchIngredients(APIView):
    pagination_class = PageNumberPagination
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = request.query_params.get('q', '').lower()
        with open(os.path.join(os.path.dirname(__file__), "autocomplete_data", "ingredients.txt"), 'r') as f:
            all_possibilities = f.readlines()

        all_possibilities = [item.strip().lower() for item in all_possibilities]
        potential_matches = [phrase for phrase in all_possibilities if q in phrase]

        # order by decreasing similarity
        potential_matches.sort(key=lambda match: Levenshtein.distance(q, match))

        max_num_results = 10

        return Response(potential_matches[:max_num_results])


class ViewRecipe(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        security=[{"Bearer": []}],
        operation_summary='Get a single recipe',
        operation_description='Get data for a single recipe by the specified id',
        responses={
            200: openapi.Response("success", examples={"application/json": json.dumps(example_response["ViewRecipesGET"])}),
            401: "Authentication credentials were not provided.",
            404: 'Recipe not found',
        }
    )
    def get(self, request, recipe_id):
        task = get_object_or_404(Recipe, id=recipe_id)
        serializer = RecipeSerializer(task,  context={'user': request.user})
        return Response(serializer.data)


class CreateRecipe(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        security=[{"Bearer": []}],
        operation_summary="Create a new recipe",
        operation_description="Create a new recipe",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[
                'cuisine',
                'cook_time_minutes',
                'diet',
                'prep_time_minutes',
                'description',
                'steps'
            ],
            properties={
                'cuisine': openapi.Schema(type=openapi.TYPE_STRING,
                                          enum=['italian', 'greek', 'mexican', 'chinese', 'indian', 'japanese',
                                                'korean', 'thai', 'german'], example='indian'),
                'cook_time_minutes': openapi.Schema(type=openapi.TYPE_INTEGER, example=60),
                'diet': openapi.Schema(type=openapi.TYPE_STRING,
                                       enum=['unrestricted', 'vegan', 'vegetarian', 'kosher', 'halal'],
                                       example='vegan'),
                'prep_time_minutes': openapi.Schema(type=openapi.TYPE_INTEGER, example=10),
                'description': openapi.Schema(type=openapi.TYPE_STRING, example="An awesome description"),
                'steps': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        required=[
                            'step_number',
                            'instructions',
                            'cook_time_minutes',
                            'prep_time_minutes',
                        ],
                        properties={
                            'step_number': openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
                            'instructions': openapi.Schema(type=openapi.TYPE_STRING, example="Wash all produce."),
                            'cook_time_minutes': openapi.Schema(type=openapi.TYPE_INTEGER, example=5),
                            'prep_time_minutes': openapi.Schema(type=openapi.TYPE_INTEGER, example=1),
                        },
                    ),
                ),
                'ingredients': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        required=[
                            'name',
                            'quantity_serving_one',
                            'quantity_serving_two',
                        ],
                        properties={
                            'name': openapi.Schema(type=openapi.TYPE_STRING, example='chicken breast'),
                            'quantity_serving_one': openapi.Schema(type=openapi.TYPE_INTEGER, example='500g'),
                            'quantity_serving_two': openapi.Schema(type=openapi.TYPE_INTEGER, example='1000g'),
                        },
                    ),
                ),
            }
        ),
        responses={
            '201': openapi.Response(description='Created'),
            '401': "Authentication credentials were not provided.",
            '400': openapi.Response(description='Bad Request')
        }
    )
    def post(self, request):
        serializer = RecipeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            recipe = serializer.save()
            return Response(recipe, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


@method_decorator(name="delete", decorator=swagger_auto_schema(
    operation_summary="Delete a recipe",
    operation_description="Deletes a recipe with the specified id. You must be the owner of"
                          " this recipe in order to delete it.",
    responses={
        204: "Recipe was successfully deleted",
        401: "Authentication credentials were not provided.",
        403: "You do not have permission to perform this action.",
        404: "Recipe was not found"
    }
))
class DeleteRecipe(DestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnlyRecipe]
    lookup_field = 'pk'
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer

    def perform_destroy(self, instance):

        files_to_del = set()

        # get all RecipeMedia files to delete
        for item in instance.media.all():
            if item.image and item.image.url and 'default' not in item.image:
                relative_path = item.image.url
                if relative_path.startswith("/media"):
                    relative_path = relative_path[len(" /media"):]
                files_to_del.add(relative_path)

        # get all RecipeStepMedia files to delete
        for step in instance.steps.all():
            all_recipe_step_media = step.media.all()
            for item in all_recipe_step_media:
                if item.image and item.image.url and 'default' not in item.image:
                    relative_path = item.image.url
                    if relative_path.startswith("/media"):
                        relative_path = relative_path[len(" /media"):]

                    files_to_del.add(relative_path)

        super().perform_destroy(instance)

        for file_path in files_to_del:
            os.remove(os.path.join(MEDIA_ROOT, file_path))

        return Response("success")

@method_decorator(name='put', decorator=swagger_auto_schema(
        operation_summary='Update recipe details',
        operation_description="Update the details of the recipe that has the specified id. For any 'Recipe Steps' that "
                              "you provide which don't have an 'id' property, they will be assumed to be *new* steps "
                              "that you are adding to this recipe. For any 'Ingredients' that you provide which don't "
                              "have an 'id' property, they will be assumed to be *new* ingredients that you are adding "
                              "to this recipe.",
        request_body=RecipeSerializer,
        responses={
            200: "Successful update",
            401: "Authentication credentials were not provided.",
            403: "You do not have permission to perform this action. (You need to be the owner of the recipe).",
            404: 'Not found (either the entire Recipe, or one of the steps, or one of the ingredients)'
        },
    ))
class EditRecipe(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request, pk):
        recipe_to_update = get_object_or_404(Recipe, pk=pk)
        if recipe_to_update.author != request.user:
            return Response("You do not have permission to perform this action.", status=HTTP_403_FORBIDDEN)

        serializer = RecipeSerializer(recipe_to_update, data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response("Successful update")
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)



class RecipeMediaView(APIView):
    permission_classes = [IsAuthenticated]
    @swagger_auto_schema(
        security=[{'Bearer': []}],
        operation_summary='Upload an image for a recipe',
        operation_description='Upload an image for a recipe with an optional description',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['image', 'recipe_id'],
            properties={
                'image': openapi.Schema(type=openapi.TYPE_FILE),
                'recipe_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'description': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            201: openapi.Response('Success', examples={
                "application/json": json.dumps(example_response.get("RecipeMediaPOST", {}))
            }),
            401: "Authentication credentials were not provided.",
            404: 'Recipe not found',
        },
    )
    def post(self, request):
        serializer = RecipeMediaSerializer(data=request.data)
        if serializer.is_valid():
            media = serializer.save()
            media = RecipeMediaSerializer(media).data
            return Response(media, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

class DeleteRecipeMedia(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        recipe_media = get_object_or_404(RecipeMedia, pk=pk)
        associated_recipe = recipe_media.recipe
        if associated_recipe.author != request.user:
            return Response("You do not have permission to perform this action.", status=HTTP_403_FORBIDDEN)

        file_to_del = None

        # get all RecipeMedia files to delete
        if recipe_media.image and recipe_media.image.url and 'default' not in recipe_media.image:
            relative_path = recipe_media.image.url
            if relative_path.startswith("/media"):
                relative_path = relative_path[len(" /media"):]
            file_to_del = relative_path

        recipe_media.delete()

        if not file_to_del:
            return Response("You do not have permission to perform this action.", status=HTTP_500_INTERNAL_SERVER_ERROR)

        os.remove(os.path.join(MEDIA_ROOT, file_to_del))

        return Response("success")


class RecipeStepMediaView(APIView):
    @swagger_auto_schema(
        security=[{'Bearer': []}],
        operation_summary='Upload an image for a recipe step',
        operation_description='Upload an image for a recipe step with an optional description',
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['image', 'recipe_id', 'description'],
            properties={
                'image': openapi.Schema(type=openapi.TYPE_FILE),
                'recipe_step_id': openapi.Schema(type=openapi.TYPE_INTEGER),
                'description': openapi.Schema(type=openapi.TYPE_STRING),
            }
        ),
        responses={
            201: openapi.Response('Success', examples={
                "application/json": json.dumps(example_response.get("RecipeStepMediaPOST", {}))
            }),
            401: "Authentication credentials were not provided.",
            404: 'Recipe not found',

        },
    )
    def post(self, request):
        serializer = RecipeStepMediaSerializer(data=request.data)
        if serializer.is_valid():
            media = serializer.save()
            media = RecipeStepMediaSerializer(media).data
            return Response(media, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


class DeleteRecipeStepMedia(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        recipe_media = get_object_or_404(RecipeStepMedia, pk=pk)
        associated_step = recipe_media.recipe_step
        associated_recipe = associated_step.recipe
        if associated_recipe.author != request.user:
            return Response("You do not have permission to perform this action.", status=HTTP_403_FORBIDDEN)

        file_to_del = None

        # get all RecipeMedia files to delete
        if recipe_media.image and recipe_media.image.url and 'default' not in recipe_media.image:
            relative_path = recipe_media.image.url
            if relative_path.startswith("/media"):
                relative_path = relative_path[len(" /media"):]
            file_to_del = relative_path

        recipe_media.delete()

        if not file_to_del:
            return Response("You do not have permission to perform this action.", status=HTTP_500_INTERNAL_SERVER_ERROR)

        os.remove(os.path.join(MEDIA_ROOT, file_to_del))

        return Response("success")


@method_decorator(name='get', decorator=swagger_auto_schema(
    security=[{"Bearer": []}],
    operation_summary='Get all recipes IDs in your shopping list',
    operation_description='Get all recipes IDs in your shopping list',
    responses={
        200: openapi.Response('Successful response',
                              examples={
                                  "application/json": json.dumps(example_response.get("ViewShoppingListGET", {}))

                              },
                              ),
        400: 'Bad request',
        401: "Authentication credentials were not provided.",
    }
))
class ViewShoppingList(ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None
    serializer_class = ShoppingListItemSerializer

    def get_queryset(self):
        request = self.request
        user = request.user

        if request.GET.get('recipe_id'):
            try:
                recipe_id = int(request.GET.get('recipe_id'))
            except ValueError:
                raise ValidationError("recipe_id must be an integer")

            recipe = get_object_or_404(Recipe, id=recipe_id)
            return ShoppingListItem.objects.filter(recipe=recipe, user=user)

        return ShoppingListItem.objects.filter(user=user).order_by('id')


class AddToShoppingList(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Add a recipe to your shopping list",
        operation_description="Add a recipe to your shopping list",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=[
                'id',
            ],
            properties={
                'id': openapi.Schema(type=openapi.TYPE_INTEGER, example=6),
            }
        ),
        responses={
            '201': openapi.Response('Success',
                                    examples={
                                        "application/json": json.dumps(
                                            example_response.get("AddToShoppingListPOST", {}))
                                    },
                                    ),
            '400': openapi.Response(description='Bad Request'),
            401: "Authentication credentials were not provided.",
            '409': openapi.Response(description='user already has this recipe in their shopping list.'),
        }
    )
    def post(self, request):
        serializer = ShoppingListItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            shopping_list_item = serializer.save()
            shopping_list_item = ShoppingListItemSerializer(shopping_list_item).data
            return Response(shopping_list_item, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


class RemoveRecipeFromShoppingList(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        recipe = get_object_or_404(Recipe, pk=pk)
        shopping_list_item_to_remove = get_object_or_404(ShoppingListItem, recipe=recipe, user=request.user)

        shopping_list_item_to_remove.delete()

        return Response("success")


@method_decorator(name='get', decorator=swagger_auto_schema(
    security=[{"Bearer": []}],
    operation_summary='Get all comments on a recipe',
    operation_description='Get all comments on a recipe',
    responses={
        200: openapi.Response('Successful response',
                              examples={
                                  "application/json": json.dumps(example_response.get("RecipeCommentsGET"))

                              },
                              ),
        401: "Authentication credentials were not provided.",
        404: 'Recipe not found',
    }
))
class RecipeComments(ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
    serializer_class = CommentSerializer

    def get_queryset(self):
        recipe_id = self.kwargs.get('recipe_id')
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        return Comment.objects.filter(recipe=recipe).order_by("-date_posted")


class CreateComment(APIView):
    @swagger_auto_schema(
        security=[{"Bearer": []}],
        operation_description="Add a comment on a recipe",
        operation_summary="Add a comment on a recipe",
        request_body=CommentSerializer,
        responses={
            '201': openapi.Response('Success',
                                    examples={
                                        "application/json": json.dumps(example_response.get("CreateCommentPOST", {}))
                                    },
                                    ),
            '400': openapi.Response(description='Bad Request'),
            401: "Authentication credentials were not provided.",
            '404': openapi.Response(description="Recipe, user, or 'parent comment' not found."),
            '409': openapi.Response(description='user already has this recipe in their shopping list.'),
        }
    )
    def post(self, request):
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            created_comment = serializer.save()
            created_comment = CommentSerializer(created_comment).data
            return Response(created_comment, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


class AddLike(APIView):
    @swagger_auto_schema(
        security=[{"Bearer": []}],
        operation_description="Like a recipe",
        operation_summary="Like a recipe",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['recipe_id', 'amount'],
            properties={
                'recipe_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='recipe id', example=4),
            }
        ),
        responses={
            '201': openapi.Response('Success',
                                    examples={
                                        "application/json": json.dumps(example_response.get("AddLikePOST"))
                                    },
                                    ),
            '400': openapi.Response(description='Bad Request'),
            401: "Authentication credentials were not provided.",
            '409': openapi.Response(description='user already liked this recipe.'),
        }
    )
    def post(self, request):
        serializer = LikeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            created_like = serializer.save()
            created_like = LikeSerializer(created_like).data
            return Response(created_like, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)



class RemoveLike(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        recipe = get_object_or_404(Recipe, pk=pk)
        like_to_remove = get_object_or_404(Like, recipe=recipe, user=request.user)

        like_to_remove.delete()

        return Response("success")


@method_decorator(name='get', decorator=swagger_auto_schema(
    security=[{"Bearer": []}],
    operation_summary='Get all likes on a recipe',
    operation_description='Get all likes on a recipe',
    responses={
        200: openapi.Response('Successful response',
                              examples={
                                  "application/json": json.dumps(example_response.get("LikesGET", {}))

                              },
                              ),
        401: "Authentication credentials were not provided.",
        404: 'Recipe not found',
    }
))
class Likes(ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
    serializer_class = LikeSerializer

    def get_queryset(self):
        recipe_id = self.kwargs.get('recipe_id')
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        return Like.objects.filter(recipe=recipe).order_by("id")




class AddFavourite(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        security=[{"Bearer": []}],
        operation_description="Favourite a recipe",
        operation_summary="Favourite a recipe",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['recipe_id', 'amount'],
            properties={
                'recipe_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='recipe id', example=4),
            }
        ),
        responses={
            '201': openapi.Response('Success',
                                    examples={
                                        "application/json": json.dumps(example_response.get("AddFavouritePOST", {}))
                                    },
                                    ),
            '400': openapi.Response(description='Bad Request'),
            401: "Authentication credentials were not provided.",
            '409': openapi.Response(description='user already favourited this recipe.'),
        }
    )
    def post(self, request):
        serializer = FavouriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            created_fav = serializer.save()
            created_fav = FavouriteSerializer(created_fav).data
            return Response(created_fav, status=HTTP_201_CREATED)
        return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)


class RemoveFavourite(APIView):
    permission_classes = [IsAuthenticated]
    def delete(self, request, pk):
        recipe = get_object_or_404(Recipe, pk=pk)
        fav_to_remove = get_object_or_404(Favourite, recipe=recipe, user=request.user)

        fav_to_remove.delete()

        return Response("success")


@method_decorator(name='get', decorator=swagger_auto_schema(
    security=[{"Bearer": []}],
    operation_summary='Get all favourites on a recipe',
    operation_description='Get all favourites on a recipe',
    responses={
        200: openapi.Response('Successful response',
                              examples={
                                  "application/json": json.dumps(example_response.get("FavouritesGET", {}))
                              },
                              ),
        401: "Authentication credentials were not provided.",
        404: 'Recipe not found',
    }
))
class Favourites(ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
    serializer_class = FavouriteSerializer

    def get_queryset(self):
        recipe_id = self.kwargs.get('recipe_id')
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        return Favourite.objects.filter(recipe=recipe).order_by("id")


class AddRating(APIView):
    permission_classes = [IsAuthenticated]
    @swagger_auto_schema(
        security=[{"Bearer": []}],
        operation_description="Rate a recipe",
        operation_summary="Rate a recipe",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['recipe_id', 'amount'],
            properties={
                'recipe_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='recipe id', example=4),
                'amount': openapi.Schema(type=openapi.TYPE_INTEGER,
                                         description='rating you are giving to the recipe (1-5)', example=2),
            }
        ),
        responses={
            '201': openapi.Response('Success',
                                    examples={
                                        "application/json": json.dumps(example_response.get("AddRatingPOST"))
                                    },
                                    ),
            '400': openapi.Response(description='Bad Request'),
            401: "Authentication credentials were not provided.",
            '409': openapi.Response(description='user already rated this recipe.'),
        }
    )
    def post(self, request):
        recipe_id = request.data.get("recipe_id")
        if not recipe_id:
            return Response("recipe_id is required ", status=HTTP_400_BAD_REQUEST)
        recipe = get_object_or_404(Recipe, pk=recipe_id)

        try:
            rating_to_update = recipe.ratings.get(user=request.user)
            serializer = RatingSerializer(rating_to_update, data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response("Successful update")
            return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)

        except ObjectDoesNotExist:
            serializer = RatingSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                created_rating = serializer.save()
                created_rating = RatingSerializer(created_rating).data
                return Response(created_rating, status=HTTP_201_CREATED)
            return Response(serializer.errors, status=HTTP_400_BAD_REQUEST)



@method_decorator(name='get', decorator=swagger_auto_schema(
    security=[{"Bearer": []}],
    operation_summary='Get all ratings on a recipe',
    operation_description='Get all ratings on a recipe',
    responses={
        200: openapi.Response('Successful response',
                              examples={
                                  "application/json": json.dumps(example_response.get("RatingsGET", {})
                                                                 )
                              },
                              ),
        404: 'Recipe not found',
    }
))
class Ratings(ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
    serializer_class = RatingSerializer

    def get_queryset(self):
        recipe_id = self.kwargs.get('recipe_id')
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        return Rating.objects.filter(recipe=recipe)


@method_decorator(name='get', decorator=swagger_auto_schema(
    security=[{"Bearer": []}],
    operation_summary='Get all ingredients of a recipe',
    operation_description='Get all ingredients of a recipe with a specific ID',
    responses={
        200: openapi.Response('Successful response',
                              examples={
                                  "application/json": json.dumps(example_response.get("GetRecipeIngredientsGET", {}))
                              },
                              ),
        404: 'Recipe not found',
    }
))
class GetRecipeIngredients(ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination
    serializer_class = IngredientSerializer

    def get_queryset(self):
        recipe_id = self.kwargs.get('recipe_id')
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        return Ingredient.objects.filter(recipe=recipe)
