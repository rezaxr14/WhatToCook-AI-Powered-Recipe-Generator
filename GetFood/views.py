import json
import os
import re
import subprocess
from datetime import timedelta

import requests
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.http import JsonResponse
from django.shortcuts import render, reverse, get_object_or_404, redirect
from rest_framework import viewsets
from .models import Ingredient, Recipe, UserPantry
from .serializers import IngredientSerializer, RecipeSerializer, UserPantrySerializer
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm


import json
from django.http import JsonResponse
import requests


from django.views.decorators.http import require_GET
from django.conf import settings
from django.utils import timezone
import hashlib
from .models import AISuggestionCache

LMSTUDIO_URL = settings.LMSTUDIO_URL
MODEL_NAME = settings.MODEL_NAME


# Create your views here.
class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer


class UserPantryViewSet(viewsets.ModelViewSet):
    queryset = UserPantry.objects.all()
    serializer_class = UserPantrySerializer


def index(request):
    recipes = Recipe.objects.all()
    ingredients = Ingredient.objects.all()
    user_pantry = UserPantry.objects.first()  # Example: first user's pantry

    page = request.GET.get('page', 1)  # Get page number from query params, default 1
    paginator = Paginator(recipes, 6)
    try:
        paginated_recipes = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page
        paginated_recipes = paginator.page(1)
    except EmptyPage:
        # If page is out of range, deliver last page
        paginated_recipes = paginator.page(paginator.num_pages)

    context = {
        "recipes": paginated_recipes,
        "ingredients": ingredients,
        "user_pantry": user_pantry,
        "num_pages": paginator.num_pages,
        "current_page": paginated_recipes.number,
    }
    return render(request, "GetFood/index.html", context)


@login_required
def pantry(request):
    user_pantry, _ = UserPantry.objects.get_or_create(user=request.user)
    ingredients = user_pantry.ingredients.all()
    available_ingredients = Ingredient.objects.exclude(id__in=ingredients)

    if request.method == "POST":
        if "ingredient_id" in request.POST:  # Add ingredient
            ingredient_id = request.POST.get("ingredient_id")
            if ingredient_id:
                ingredient = Ingredient.objects.get(id=ingredient_id)
                user_pantry.ingredients.add(ingredient)
                return redirect("pantry")

        elif "remove_id" in request.POST:  # Remove ingredient
            remove_id = request.POST.get("remove_id")
            if remove_id:
                ingredient = Ingredient.objects.get(id=remove_id)
                user_pantry.ingredients.remove(ingredient)
                return redirect("pantry")

    return render(request, "GetFood/pantry.html", {
        "ingredients": ingredients,
        "available_ingredients": available_ingredients,
    })


def recipe_detail(request, recipe_id):
    recipe = get_object_or_404(Recipe, id=recipe_id)
    instructions_list = recipe.instructions.split('\n') if recipe.instructions else []
    context = {
        "recipe": recipe,
        "instructions_list": instructions_list,
    }
    return render(request, "GetFood/recipe_detail.html", context)


def can_cook(request):
    user = request.user
    pantry_ingredients = []

    if user.is_authenticated:
        try:
            pantry = UserPantry.objects.get(user=user)
            pantry_ingredients = pantry.ingredients.all()
        except UserPantry.DoesNotExist:
            pantry_ingredients = []

    # Recipes where all ingredients are in user's pantry
    possible_recipes = []
    for recipe in Recipe.objects.all():
        recipe_ingredients = [ri.ingredient for ri in recipe.recipeingredient_set.all()]
        if all(ingredient in pantry_ingredients for ingredient in recipe_ingredients):
            possible_recipes.append(recipe)

    paginator = Paginator(possible_recipes, 6)
    page = request.GET.get('page', default=1)
    try:
        paginated_recipes = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page
        paginated_recipes = paginator.page(1)
    except EmptyPage:
        # If page is out of range, deliver last page
        paginated_recipes = paginator.page(paginator.num_pages)

    context = {
        "possible_recipes": paginated_recipes,
        "pantry_ingredients": pantry_ingredients,
        "num_pages": paginator.num_pages,
        "current_page": paginated_recipes.number,
    }
    return render(request, "GetFood/can_cook.html", context)


# Signup
def signup_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create an empty pantry for the user
            UserPantry.objects.create(user=user)
            login(request, user)
            return redirect('index')
    else:
        form = UserCreationForm()
    return render(request, 'GetFood/signup.html', {'form': form})


# Login
def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('index')
    else:
        form = AuthenticationForm()
    return render(request, 'GetFood/login.html', {'form': form})


@login_required
def ai_suggestions(request):
    """Generate dish ideas using LM Studio model."""
    return render(request, "GetFood/ai_suggestions.html")


@login_required
def ai_recipe_detail(request, name):
    """Render base page; fetch details via AJAX later."""
    return render(request, "GetFood/ai_recipe_detail.html", {"recipe_name": name})


@login_required
def ai_suggestions_api(request):
    user = request.user
    try:
        pantry = UserPantry.objects.get(user=user)
    except UserPantry.DoesNotExist:
        return JsonResponse({"error": "Your pantry is empty! Add ingredients first."})

    ingredients = [i.name for i in pantry.ingredients.all()]
    ingredients_str = ', '.join(sorted(ingredients))
    ingredients_hash = hashlib.sha256(ingredients_str.encode()).hexdigest()
    cache_entry = AISuggestionCache.objects.filter(
        ingredients_hash=ingredients_hash,
        created_at__gte=timezone.now() - timedelta(days=1)
    ).first()
    if cache_entry:
        return JsonResponse({"recipes": cache_entry.ai_response}, safe=False)
    prompt = (
        f"You are a creative chef. Based on these ingredients: {ingredients_str}, "
        "suggest 5 unique, realistic dishes I can cook. "
        "Return ONLY valid JSON with a top-level array called 'dishes'. "
        "Each dish must have keys: name, short_description, cuisine, difficulty, image_hint. "
        "Return raw JSON, no markdown or code fences."
    )

    try:
        response = requests.post(
            LMSTUDIO_URL,
            headers={"Content-Type": "application/json"},
            json={"model": MODEL_NAME, "messages": [{"role": "user", "content": prompt}], "temperature": 0.7},
            timeout=240,
        )
        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        # Remove newlines for safer parsing
        content = content.replace("\n", "")

        # Extract all {...} objects inside the string
        matches = re.findall(r'\{.*?\}', content)
        recipes = []
        for m in matches:
            try:
                obj = json.loads(m)
                if "name" in obj:
                    recipes.append(obj)
                elif "dishes" in obj:
                    # sometimes AI wraps single recipe in "dishes" key
                    recipes.extend(obj["dishes"])
            except json.JSONDecodeError:
                continue
        for r in recipes:
            r['image'] = find_best_image(r["name"])

        AISuggestionCache.objects.create(
            ingredients_hash=ingredients_hash,
            ai_response=recipes
        )
    except Exception as e:
        return JsonResponse(
            {"error": f"Failed to parse AI response: {e}", "raw_response": content if 'content' in locals() else None},
            status=500,
        )
    return JsonResponse({"recipes": recipes})


@require_GET
@login_required
def ai_recipe_detail_api(request, recipe_name):
    try:
        prompt = (
            f"You are a master chef. Give detailed step-by-step instructions for cooking '{recipe_name}'. "
            "Return valid JSON with these keys: "
            "{'name', 'ingredients' (list of dicts with 'name', 'amount', 'unit'), "
            "'instructions' (list of dicts with 'step' and optional 'time_minutes'), 'time_minutes'}. "
            "Return ONLY raw JSON, no markdown, code fences, or comments."
        )

        response = requests.post(
            LMSTUDIO_URL,
            headers={"Content-Type": "application/json"},
            json={
                "model": MODEL_NAME,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            },
            timeout=120,
        )

        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        # Remove markdown/code fences if they exist
        if content.startswith("```"):
            content = content.strip("`").replace("json\n", "").replace("```", "").strip()

        # Sometimes the model returns extra quotes or escapes
        try:
            recipe_data = json.loads(content)
        except json.JSONDecodeError:
            # Try unescaping extra quotes
            recipe_data = json.loads(content.encode('utf-8').decode('unicode_escape'))

        # Optional: add image if you have mapping
        recipe_data["image"] = find_best_image(recipe_name)

        return JsonResponse(recipe_data)

    except Exception as e:
        return JsonResponse({"error": f"Error fetching recipe details: {e}"})


recipe_names = ["Spaghetti Bolognese",
                "Pancakes",
                "Chicken Fried Rice"
                "Chocolate Cake",
                "Caesar Salad",
                "Garlic Bread",
                "Mashed Potatoes",
                "Omelette",
                "Grilled Chicken",
                "Beef Stew",
                "Fish Tacos",
                "Vegetable Stir Fry"
                "Shrimp Alfredo Pasta"
                "Mushroom Risotto",
                "Greek Salad",
                "Lentil Soup",
                "Stuffed Peppers",
                ]
recipe_image_locations = [
    "spaghetti.jpg",
    "Pancakes.jpg",
    "Chicken.jpg",
    "Chocolate.jpg",
    "Caesar.jpg",
    "Garlic.jpg",
    "potatoes.jpg",
    "Omelette.jpg",
    "grilled.jpg",
    "beef.jpg",
    "Fish_Tacos.jpeg",
    "stir_fry.jpeg",
    "shrimp_alfredo.jpeg",
    "risotto.jpeg",
    "greek_salad.jpeg",
    "lentil_soup.jpeg",
    "stuffed_peppers.jpeg",
]

recipe_image_map = dict(zip(
    [name.lower() for name in recipe_names],  # lowercase for case-insensitive matching
    recipe_image_locations
))

import difflib


def find_best_image(recipe_name: str) -> str:
    """
    Returns the best matching image for a recipe name.
    Matches on any word in the name or uses fuzzy matching.
    """
    name_lower = recipe_name.lower()
    words = name_lower.split()

    # 1️⃣ Check if any word matches a seed recipe
    for seed_name in recipe_image_map.keys():
        seed_words = seed_name.split()
        if any(word in seed_words for word in words):
            return f"/media/recipes/{recipe_image_map[seed_name]}"

    # 2️⃣ Fuzzy match as a fallback
    close_matches = difflib.get_close_matches(name_lower, recipe_image_map.keys(), n=1, cutoff=0.5)
    if close_matches:
        best_match = close_matches[0]
        return f"/media/recipes/{recipe_image_map[best_match]}"

    # 3️⃣ Default image
    return "/media/recipes/default.jpg"
