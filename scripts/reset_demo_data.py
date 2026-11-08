"""Wipe all recipe content and (re)create the ordinary demo account.

Step 1 of the demo setup: removes every content record (recipes, foods, units,
meal plans, shopping lists, logs ...) while keeping users, spaces and settings.
Step 2 creates a plain, non-staff account with its own space; the seed script
then fills that space.

Run with:  .venv/Scripts/python.exe scripts/reset_demo_data.py
"""

import os
import sys

import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recipes.settings')
django.setup()

from django.contrib.auth.models import User  # noqa: E402
from django.db import transaction  # noqa: E402
from django_scopes import scopes_disabled  # noqa: E402

from cookbook.models import (  # noqa: E402
    AiLog, Automation, BookmarkletImport, Comment, ConnectorConfig, CookLog,
    CustomFilter, ExportLog, Food, FoodProperty, ImportLog, Ingredient,
    InventoryEntry, InventoryLocation, InventoryLog, Keyword, MealPlan, MealType,
    NutritionInformation, Property, PropertyType, Recipe, RecipeBook,
    RecipeBookEntry, RecipeImport, SearchFields, SearchPreference, ShareLink,
    ShoppingList, ShoppingListEntry, ShoppingListRecipe, Space, Step, Storage,
    Supermarket, SupermarketCategory, SupermarketCategoryRelation, Sync, SyncLog,
    TelegramBot, Unit, UnitConversion, UserFile, UserSpace, ViewLog,
)

# --------------------------------------------------------------- new user ----
DEMO_USERNAME = 'chenxiao'
DEMO_EMAIL = 'chenxiao@example.com'
DEMO_PASSWORD = 'Tandoor@2026'
DEMO_FIRST_NAME = '陈晓'
DEMO_LAST_NAME = ''
DEMO_SPACE_NAME = '陈晓的厨房'

# second account, so the Django admin is reachable on a freshly seeded instance
ADMIN_USERNAME = 'admin'
ADMIN_EMAIL = 'admin@example.com'
ADMIN_FIRST_NAME = '管理员'
ADMIN_SPACE_NAME = '管理空间'

# Deletion order matters: children first, then the things they point at.
# (logs and imports -> plans -> books -> recipe sub-objects -> recipes -> tree data)
DELETE_ORDER = [
    CookLog, ViewLog, ShareLink, ImportLog, ExportLog, BookmarkletImport,
    RecipeImport, Sync, SyncLog, AiLog, Automation, CustomFilter,
    # NOTE: SearchFields / SearchPreference are global seed data - deleting them
    # breaks recipe search (500 on /api/recipe/), so they stay untouched.
    UserFile,
    ShoppingListEntry, ShoppingListRecipe, ShoppingList,
    InventoryLog, InventoryEntry, InventoryLocation,
    MealPlan, MealType,
    RecipeBookEntry, RecipeBook,
    Comment, Property, FoodProperty, NutritionInformation, Ingredient, Step,
    Recipe,
    PropertyType,
    UnitConversion, Keyword, Unit, Food,
    SupermarketCategoryRelation, SupermarketCategory, Supermarket,
    TelegramBot, ConnectorConfig, Storage,
]


def wipe_content():
    with scopes_disabled(), transaction.atomic():
        print('before:', Recipe.objects.count(), 'recipes /', Food.objects.count(), 'foods')
        for model in DELETE_ORDER:
            qs = model.objects.all()
            count = qs.count()
            if count:
                qs.delete()
                print(f'  cleared {count:>4} {model.__name__}')


def create_account(username, email, first_name, space_name, staff=False):
    """Create (or repair) an account together with its own space.

    The demo needs two of them: an ordinary user that owns the seeded content,
    and a superuser so a reader can open the Django admin without having to run
    ``createsuperuser`` first.
    """
    with scopes_disabled(), transaction.atomic():
        user = User.objects.filter(username=username).first()
        if user is None:
            user = User(username=username, email=email)
        user.email = email
        user.first_name = first_name
        user.last_name = ''
        user.is_staff = staff
        user.is_superuser = staff
        user.is_active = True
        user.set_password(DEMO_PASSWORD)
        user.save()

        space = Space.objects.filter(created_by=user).first()
        if space is None:
            from cookbook.helper.permission_helper import create_space_for_user
            create_space_for_user(user, name=space_name)
            space = Space.objects.filter(created_by=user).first()
        else:
            space.name = space_name
            space.save()

        # this build requires a household per space, otherwise the UI sends the
        # user to the (unfinished) household setup wizard
        from cookbook.models import Household
        user_space = UserSpace.objects.filter(user=user, space=space).first()
        household = Household.objects.filter(space=space).first()
        if household is None:
            household = Household.objects.create(name=f'{space_name}的家人', space=space)
        if user_space and user_space.household_id != household.id:
            user_space.household = household
            user_space.save(update_fields=['household'])
        space.space_setup_completed = True
        space.household_setup_completed = True
        space.save(update_fields=['space_setup_completed', 'household_setup_completed'])

        # allauth would otherwise hold the account at "email not verified"
        try:
            from allauth.account.models import EmailAddress
            EmailAddress.objects.update_or_create(
                user=user, email=email,
                defaults={'verified': True, 'primary': True},
            )
        except Exception as e:  # pragma: no cover - allauth optional at runtime
            print('  (email verification skipped:', e, ')')

        print(f'user: {user.username} / {email} (staff={user.is_staff}, super={user.is_superuser})')
        print(f'space: {space.pk} {space.name}')
        return user, space


if __name__ == '__main__':
    wipe_content()
    create_account(DEMO_USERNAME, DEMO_EMAIL, DEMO_FIRST_NAME, DEMO_SPACE_NAME)
    create_account(ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_FIRST_NAME, ADMIN_SPACE_NAME, staff=True)
    with scopes_disabled():
        print('after:', Recipe.objects.count(), 'recipes /', Food.objects.count(), 'foods')
    print(f'password for both accounts: {DEMO_PASSWORD}')
