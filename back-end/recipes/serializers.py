import django.db
from rest_framework import serializers
from .models import Recipe, RecipeStep, RecipeStepMedia, RecipeMedia, Ingredient, Comment, Like, Favourite, Rating,\
    ShoppingListItem
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db.models import Count, Avg
from accounts.serializers import UserSerializer



class RecipeStepMediaSerializer(serializers.ModelSerializer):
    recipe_step_id = serializers.CharField(max_length=200, write_only=True)

    class Meta:
        model = RecipeStepMedia
        fields = ('id', 'recipe_step_id', 'image', 'description')

    def create(self, validated_data):
        try:
            recipe_step = get_object_or_404(RecipeStep, pk=validated_data.get("recipe_step_id", -1))
        except RecipeStep.DoesNotExist:
            raise Http404("provided recipe step not found")

        new_media = RecipeStepMedia.objects.create(recipe_step=recipe_step, **validated_data)
        recipe_step.image = new_media
        recipe_step.save()
        return new_media


class RecipeMediaSerializer(serializers.ModelSerializer):
    recipe_id = serializers.CharField(max_length=200, write_only=True)

    class Meta:
        model = RecipeMedia
        fields = ('id', 'recipe_id', 'image', 'description')


    def create(self, validated_data):
        try:
            recipe_step = get_object_or_404(Recipe, pk=validated_data.get("recipe_id", -1))
        except RecipeStep.DoesNotExist:
            raise Http404("provided recipe not found")

        new_media = RecipeMedia.objects.create(recipe=recipe_step, **validated_data)
        recipe_step.image = new_media
        recipe_step.save()
        return new_media

class IngredientSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)
    class Meta:
        model = Ingredient
        fields = ('id', 'name', 'quantity_serving_one', 'quantity_serving_two', 'quantity_units')


class RecipeStepSerializer(serializers.ModelSerializer):
    media = RecipeStepMediaSerializer(many=True, required=False, read_only=True)
    id = serializers.IntegerField(required=False)
    class Meta:
        model = RecipeStep
        fields = ('step_number', 'instructions', 'cook_time_minutes', 'prep_time_minutes', 'media', 'id')
        extra_kwargs = {
            "media": {"read_only": True},
            "id": {"read_only": True}
        }

    def create(self, validated_data):
        return RecipeStep.objects.create(**validated_data)

class RecipeSerializer(serializers.ModelSerializer):
    steps = RecipeStepSerializer(many=True, required=True)
    ingredients = IngredientSerializer(many=True, required=True)
    media = RecipeMediaSerializer(many=True, required=False)
    id = serializers.IntegerField(required=False)
    interaction_stats = serializers.SerializerMethodField(required=False, read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(source='author', read_only=True)


    class Meta:
        model = Recipe
        fields = ('name', 'cuisine', 'cook_time_minutes', 'prep_time_minutes', 'description', 'steps', 'ingredients',
                  'diet', 'media', 'id', 'interaction_stats', 'user_id')
        extra_kwargs = {
            "media": {"read_only": True},
            "id": {"read_only": True}
        }

    def create(self, validated_data):
        request = self.context.get("request")
        created_recipe = Recipe.objects.create(author=request.user,
                                               name=validated_data.get("name"),
                                               diet=validated_data.get("diet"),
                                               cuisine=validated_data.get("cuisine"),
                                               cook_time_minutes=validated_data.get("cook_time_minutes"),
                                               prep_time_minutes=validated_data.get("prep_time_minutes"),
                                               description=validated_data.get("description")
                                               )
        validated_steps_data = validated_data.get("steps", [])
        ingredient_data = validated_data.get("ingredients", [])

        to_return = {'recipe_id': created_recipe.pk, 'step_ids': []}

        for step in validated_steps_data:
            created_step = RecipeStep.objects.create(recipe=created_recipe, **step)
            to_return['step_ids'].append(created_step.pk)
        for ingredient in ingredient_data:
            Ingredient.objects.create(recipe=created_recipe, **ingredient)

        return to_return

    def update(self, instance, validated_data):
        name = validated_data.pop("name")
        diet = validated_data.get("diet")
        cook_time_minutes = validated_data.get("cook_time_minutes")
        prep_time_minutes = validated_data.get("prep_time_minutes")
        description = validated_data.get("description")
        ingredients_data = validated_data.pop('ingredients', [])
        steps_data = validated_data.pop('steps', [])

        instance.name = name
        instance.diet = diet
        instance.cook_time_minutes = cook_time_minutes
        instance.prep_time_minutes = prep_time_minutes
        instance.description = description

        if ingredients_data:
            current_ingredient_instances = Ingredient.objects.filter(recipe=instance)
            current_ingredient_instance_map = {ingr.id: ingr for ingr in current_ingredient_instances}
            for ingredient_data in ingredients_data:
                if ingredient_data.get('id'):
                    ingredient_data['recipe_id'] = instance.id
                    if ingredient_data["id"] not in current_ingredient_instance_map:
                        raise Http404()

                    ingredient_serializer = IngredientSerializer(current_ingredient_instance_map[ingredient_data["id"]],
                                                                 data=ingredient_data)
                    if ingredient_serializer.is_valid():
                        ingredient_serializer.save()
                else:
                    # creating new ingredient
                    Ingredient.objects.create(recipe=instance, **ingredient_data)

        if steps_data:
            current_step_instances = RecipeStep.objects.filter(recipe=instance)
            current_step_instances_map = {step.id: step for step in current_step_instances}
            for step_data in steps_data:
                if step_data.get("id"):
                    step_data['recipe_id'] = instance.id
                    if step_data["id"] not in current_step_instances_map:
                        raise Http404()

                    step_serializer = RecipeStepSerializer(current_step_instances_map[step_data["id"]],
                                                                 data=step_data)

                    if step_serializer.is_valid():
                        step_serializer.save()
                else:
                    # creating new step
                    RecipeStep.objects.create(recipe=instance, **step_data)

        instance.save()

        return instance


    def get_interaction_stats(self, obj):

        aggregation = Recipe.objects.filter(id=obj.id).aggregate(Count("likes"), Count("favourites"), Count("comments"),
                                                     Count("ratings"), average_rating=Avg("ratings__amount"))
        to_return = dict()
        to_return["num_likes"] = aggregation['likes__count']
        to_return["num_favourites"] = aggregation['favourites__count']
        to_return["num_comments"] = aggregation['comments__count']
        to_return["num_ratings"] = aggregation['ratings__count']
        to_return["avg_rating"] = aggregation['average_rating']
        return to_return

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if user := self.context.get("user"):
            data['is_in_user_shopping_list'] = ShoppingListItem.objects.filter(recipe=instance, user=user).exists()
            data['is_favourited_by_user'] = Favourite.objects.filter(recipe=instance, user=user).exists()
            data['is_liked_by_user'] = Like.objects.filter(recipe=instance, user=user).exists()
            rating_given = None
            if Rating.objects.filter(recipe=instance, user=user).exists():
                rating_given = Rating.objects.get(recipe=instance, user=user).amount
            data['rating_given'] = rating_given
            data['num_likes'] = Like.objects.filter(recipe=instance).count()
            data['num_favourites'] = Favourite.objects.filter(recipe=instance).count()
        return data







class ShoppingListItemSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(required=False, write_only=True)
    recipe = RecipeSerializer(read_only=True)

    class Meta:
        model = Recipe
        fields = ('id', 'recipe')

    def create(self, validated_data):
        request = self.context.get("request")
        try:
            recipe = get_object_or_404(Recipe, pk=validated_data.get("id"))
            created_shopping_list_item = ShoppingListItem.objects.create(user=request.user, recipe=recipe)
        except django.db.IntegrityError:
            res = serializers.ValidationError({'message': 'user already has this recipe in their shopping list.'})
            res.status_code = 409
            raise res
        return created_shopping_list_item



class CommentSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', required=False)
    user = UserSerializer(read_only=True)
    recipe_id = serializers.IntegerField(source='recipe.id')
    parent_comment_id = serializers.IntegerField(source='parent_comment.id', required=False, allow_null=True)
    id = serializers.IntegerField(required=False)


    class Meta:
        model = Comment
        fields = ('id', 'user_id', 'recipe_id', 'date_posted', 'content', 'parent_comment_id', 'user')

    def create(self, validated_data):
        recipe_id = validated_data["recipe"]["id"]
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        user = self.context.get("request").user
        parent_comment = None
        if "parent_comment" in validated_data:
            try:
                parent_comment = Comment.objects.get(pk=validated_data["parent_comment"]['id'])
            except Comment.DoesNotExist:
                raise Http404()

        return Comment.objects.create(user=user,
                                          recipe=recipe,
                                          content=validated_data.get("content"),
                                          parent_comment=parent_comment
                                          )


class LikeSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', required=False)
    recipe_id = serializers.IntegerField(source='recipe.id')
    id = serializers.IntegerField(required=False, read_only=True)

    class Meta:
        model = Like
        fields = ('user_id', 'recipe_id', 'id')

    def create(self, validated_data):
        recipe_id = validated_data["recipe"]["id"]
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        user = self.context.get("request").user
        try:
            created_like = Like.objects.create(user=user, recipe=recipe)
        except django.db.IntegrityError:
            res = serializers.ValidationError({'message': 'user already liked this recipe'})
            res.status_code = 409
            raise res
        return created_like

class FavouriteSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', required=False)
    recipe_id = serializers.IntegerField(source='recipe.id')
    id = serializers.IntegerField(required=False, read_only=True)

    class Meta:
        model = Favourite
        fields = ('user_id', 'recipe_id', 'id')

    def create(self, validated_data):
        recipe_id = validated_data["recipe"]["id"]
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        user = self.context.get("request").user
        try:
            created_favourite = Favourite.objects.create(user=user, recipe=recipe)
        except django.db.IntegrityError:
            res = serializers.ValidationError({'message': 'user already favourited this recipe'})
            res.status_code = 409
            raise res
        return created_favourite

class RatingSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', required=False)
    recipe_id = serializers.IntegerField(source='recipe.id')
    amount = serializers.IntegerField(min_value=1, max_value=5)
    id = serializers.IntegerField(required=False, read_only=True)

    class Meta:
        model = Rating
        fields = ('user_id', 'recipe_id', 'amount', 'id')

    def create(self, validated_data):
        amount = validated_data.get("amount")
        recipe_id = validated_data["recipe"]["id"]
        recipe = get_object_or_404(Recipe, pk=recipe_id)
        user = self.context.get("request").user
        try:
            created_rating = Rating.objects.create(user=user, recipe=recipe, amount=amount)
        except django.db.IntegrityError:
            res = serializers.ValidationError({'message': 'user already rated this recipe'})
            res.status_code = 409
            raise res
        return created_rating

    def update(self, instance, validated_data):
        instance.amount = validated_data.get("amount")
        instance.save()

        return instance






















