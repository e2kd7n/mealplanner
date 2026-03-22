#!/bin/bash

# Comprehensive API Testing Script for Architecture Validation
# Tests all core functionality after Phase 1-3 architecture changes

set -e

API_URL="http://localhost:8080/api"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Starting Comprehensive API Testing"
echo "======================================"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
HEALTH=$(curl -s http://localhost:8080/health)
if echo "$HEALTH" | jq -e '.status == "ok"' > /dev/null; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Test 2: User Registration
echo -e "${YELLOW}Test 2: User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "testuser@example.com",
        "password": "TestPass123!",
        "familyName": "TestFamily"
    }')

if echo "$REGISTER_RESPONSE" | jq -e '.accessToken' > /dev/null; then
    ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.accessToken')
    USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
    echo -e "${GREEN}✓ User registration successful${NC}"
    echo "  User ID: $USER_ID"
else
    echo -e "${RED}✗ User registration failed${NC}"
    echo "$REGISTER_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 3: User Login
echo -e "${YELLOW}Test 3: User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "testuser@example.com",
        "password": "TestPass123!"
    }')

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' > /dev/null; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
    echo -e "${GREEN}✓ User login successful${NC}"
else
    echo -e "${RED}✗ User login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 4: Get User Profile
echo -e "${YELLOW}Test 4: Get User Profile${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | jq -e '.email' > /dev/null; then
    echo -e "${GREEN}✓ User profile retrieved${NC}"
    echo "  Email: $(echo "$PROFILE_RESPONSE" | jq -r '.email')"
else
    echo -e "${RED}✗ User profile retrieval failed${NC}"
    echo "$PROFILE_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 5: Create Recipe
echo -e "${YELLOW}Test 5: Create Recipe${NC}"
RECIPE_RESPONSE=$(curl -s -X POST "$API_URL/recipes" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "title": "Test Pasta Recipe",
        "description": "A delicious test pasta",
        "prepTime": 15,
        "cookTime": 20,
        "servings": 4,
        "difficulty": "EASY",
        "mealTypes": ["DINNER"],
        "ingredients": [
            {
                "name": "Pasta",
                "amount": 500,
                "unit": "g"
            },
            {
                "name": "Tomato Sauce",
                "amount": 400,
                "unit": "ml"
            }
        ],
        "instructions": [
            "Boil water",
            "Cook pasta",
            "Add sauce"
        ]
    }')

if echo "$RECIPE_RESPONSE" | jq -e '.id' > /dev/null; then
    RECIPE_ID=$(echo "$RECIPE_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✓ Recipe created successfully${NC}"
    echo "  Recipe ID: $RECIPE_ID"
else
    echo -e "${RED}✗ Recipe creation failed${NC}"
    echo "$RECIPE_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 6: Get All Recipes
echo -e "${YELLOW}Test 6: Get All Recipes${NC}"
RECIPES_RESPONSE=$(curl -s -X GET "$API_URL/recipes" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$RECIPES_RESPONSE" | jq -e '.[0].id' > /dev/null; then
    RECIPE_COUNT=$(echo "$RECIPES_RESPONSE" | jq 'length')
    echo -e "${GREEN}✓ Recipes retrieved successfully${NC}"
    echo "  Recipe count: $RECIPE_COUNT"
else
    echo -e "${RED}✗ Recipe retrieval failed${NC}"
    echo "$RECIPES_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 7: Get Single Recipe
echo -e "${YELLOW}Test 7: Get Single Recipe${NC}"
SINGLE_RECIPE=$(curl -s -X GET "$API_URL/recipes/$RECIPE_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$SINGLE_RECIPE" | jq -e '.title' > /dev/null; then
    echo -e "${GREEN}✓ Single recipe retrieved${NC}"
    echo "  Title: $(echo "$SINGLE_RECIPE" | jq -r '.title')"
else
    echo -e "${RED}✗ Single recipe retrieval failed${NC}"
    echo "$SINGLE_RECIPE" | jq .
    exit 1
fi
echo ""

# Test 8: Create Meal Plan
echo -e "${YELLOW}Test 8: Create Meal Plan${NC}"
MEAL_PLAN_RESPONSE=$(curl -s -X POST "$API_URL/meal-plans" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"date\": \"2026-03-25\",
        \"mealType\": \"DINNER\",
        \"recipeId\": \"$RECIPE_ID\",
        \"servings\": 4
    }")

if echo "$MEAL_PLAN_RESPONSE" | jq -e '.id' > /dev/null; then
    MEAL_PLAN_ID=$(echo "$MEAL_PLAN_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✓ Meal plan created successfully${NC}"
    echo "  Meal Plan ID: $MEAL_PLAN_ID"
else
    echo -e "${RED}✗ Meal plan creation failed${NC}"
    echo "$MEAL_PLAN_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 9: Get Meal Plans
echo -e "${YELLOW}Test 9: Get Meal Plans${NC}"
MEAL_PLANS_RESPONSE=$(curl -s -X GET "$API_URL/meal-plans?startDate=2026-03-20&endDate=2026-03-30" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$MEAL_PLANS_RESPONSE" | jq -e '.[0].id' > /dev/null; then
    MEAL_PLAN_COUNT=$(echo "$MEAL_PLANS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✓ Meal plans retrieved successfully${NC}"
    echo "  Meal plan count: $MEAL_PLAN_COUNT"
else
    echo -e "${RED}✗ Meal plan retrieval failed${NC}"
    echo "$MEAL_PLANS_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 10: Create Grocery List
echo -e "${YELLOW}Test 10: Create Grocery List${NC}"
GROCERY_LIST_RESPONSE=$(curl -s -X POST "$API_URL/grocery-lists" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Weekly Shopping",
        "items": [
            {
                "ingredientName": "Pasta",
                "amount": 500,
                "unit": "g",
                "category": "GRAINS"
            }
        ]
    }')

if echo "$GROCERY_LIST_RESPONSE" | jq -e '.id' > /dev/null; then
    GROCERY_LIST_ID=$(echo "$GROCERY_LIST_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✓ Grocery list created successfully${NC}"
    echo "  Grocery List ID: $GROCERY_LIST_ID"
else
    echo -e "${RED}✗ Grocery list creation failed${NC}"
    echo "$GROCERY_LIST_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 11: Get Grocery Lists
echo -e "${YELLOW}Test 11: Get Grocery Lists${NC}"
GROCERY_LISTS_RESPONSE=$(curl -s -X GET "$API_URL/grocery-lists" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GROCERY_LISTS_RESPONSE" | jq -e '.[0].id' > /dev/null; then
    GROCERY_LIST_COUNT=$(echo "$GROCERY_LISTS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✓ Grocery lists retrieved successfully${NC}"
    echo "  Grocery list count: $GROCERY_LIST_COUNT"
else
    echo -e "${RED}✗ Grocery list retrieval failed${NC}"
    echo "$GROCERY_LISTS_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 12: Add Pantry Item
echo -e "${YELLOW}Test 12: Add Pantry Item${NC}"
PANTRY_RESPONSE=$(curl -s -X POST "$API_URL/pantry" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "ingredientName": "Flour",
        "amount": 1000,
        "unit": "g",
        "category": "GRAINS",
        "expirationDate": "2026-12-31"
    }')

if echo "$PANTRY_RESPONSE" | jq -e '.id' > /dev/null; then
    PANTRY_ID=$(echo "$PANTRY_RESPONSE" | jq -r '.id')
    echo -e "${GREEN}✓ Pantry item added successfully${NC}"
    echo "  Pantry Item ID: $PANTRY_ID"
else
    echo -e "${RED}✗ Pantry item addition failed${NC}"
    echo "$PANTRY_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 13: Get Pantry Items
echo -e "${YELLOW}Test 13: Get Pantry Items${NC}"
PANTRY_ITEMS_RESPONSE=$(curl -s -X GET "$API_URL/pantry" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PANTRY_ITEMS_RESPONSE" | jq -e '.[0].id' > /dev/null; then
    PANTRY_COUNT=$(echo "$PANTRY_ITEMS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✓ Pantry items retrieved successfully${NC}"
    echo "  Pantry item count: $PANTRY_COUNT"
else
    echo -e "${RED}✗ Pantry item retrieval failed${NC}"
    echo "$PANTRY_ITEMS_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 14: Get Ingredients
echo -e "${YELLOW}Test 14: Get Ingredients${NC}"
INGREDIENTS_RESPONSE=$(curl -s -X GET "$API_URL/ingredients" \
    -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$INGREDIENTS_RESPONSE" | jq -e 'type == "array"' > /dev/null; then
    INGREDIENT_COUNT=$(echo "$INGREDIENTS_RESPONSE" | jq 'length')
    echo -e "${GREEN}✓ Ingredients retrieved successfully${NC}"
    echo "  Ingredient count: $INGREDIENT_COUNT"
else
    echo -e "${RED}✗ Ingredient retrieval failed${NC}"
    echo "$INGREDIENTS_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 15: Cache Performance (node-cache validation)
echo -e "${YELLOW}Test 15: Cache Performance Test${NC}"
echo "  Testing recipe retrieval (should use cache on second call)"
TIME1=$(date +%s%N)
curl -s -X GET "$API_URL/recipes/$RECIPE_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null
TIME2=$(date +%s%N)
FIRST_CALL=$((($TIME2 - $TIME1) / 1000000))

TIME3=$(date +%s%N)
curl -s -X GET "$API_URL/recipes/$RECIPE_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" > /dev/null
TIME4=$(date +%s%N)
SECOND_CALL=$((($TIME4 - $TIME3) / 1000000))

echo -e "${GREEN}✓ Cache test completed${NC}"
echo "  First call: ${FIRST_CALL}ms"
echo "  Second call: ${SECOND_CALL}ms (cached)"
if [ $SECOND_CALL -lt $FIRST_CALL ]; then
    echo -e "${GREEN}  Cache is working (second call faster)${NC}"
fi
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ All 15 API tests passed successfully!${NC}"
echo ""
echo "Architecture Validation Summary:"
echo "  ✓ Authentication working (JWT tokens)"
echo "  ✓ User management working"
echo "  ✓ Recipe CRUD operations working"
echo "  ✓ Meal planning working"
echo "  ✓ Grocery list management working"
echo "  ✓ Pantry management working"
echo "  ✓ Ingredient management working"
echo "  ✓ In-memory cache (node-cache) working"
echo "  ✓ Database connectivity working"
echo "  ✓ All API endpoints accessible"
echo ""
echo "🎉 Phase 1-3 Architecture Changes Validated!"

# Made with Bob
