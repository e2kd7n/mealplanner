# Family Meal Planner & Grocery Shopping App - Technical Plan

## Executive Summary


## Legal & Licensing Requirements

### Copyright & Ownership

**Copyright Notice Template:**
```
Copyright (c) 2026 Erik Didriksen
All rights reserved.

This software is proprietary and confidential.
Unauthorized copying, distribution, or use is strictly prohibited.
```

**Implementation:**
- Add copyright header to all source files (frontend, backend, scripts)
- Include copyright in package.json files
- Add copyright to documentation files
- Set up pre-commit hook to ensure new files include copyright notice

### License

**License Type:** Proprietary/Private Use
- This is a private, self-hosted application for personal/family use
- Not intended for public distribution or commercial use
- No open-source license required for private use
- If sharing with other families in the future, consider:
  - MIT License (permissive, allows commercial use)
  - GPL v3 (copyleft, requires derivative works to be open source)
  - Custom proprietary license with usage restrictions

**LICENSE File:**
```
PROPRIETARY LICENSE

Copyright (c) 2026 [Your Name]

This software and associated documentation files (the "Software") are the 
proprietary property of [Your Name]. 

RESTRICTIONS:
1. The Software is for personal, non-commercial use only
2. No copying, modification, or distribution without explicit permission
3. No reverse engineering or decompilation
4. No removal of copyright notices

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

### Anti-Piracy & Protection Measures

**For Self-Hosted Private Use:**
Since this is a self-hosted application for personal use, traditional anti-piracy measures are not necessary. However, if you plan to share with other families:

1. **Access Control:**
   - Family-based authentication (already planned)
   - Invite-only system (already planned)
   - Rate limiting to prevent abuse

2. **Usage Tracking (Optional):**
   - Log family registrations
   - Monitor API usage patterns
   - Alert on suspicious activity

3. **Code Protection (If Sharing):**
   - Minification and obfuscation of frontend code
   - Environment-specific configuration
   - Secure API keys and secrets

**Note:** For a private, self-hosted family application, extensive anti-piracy measures are typically unnecessary. Focus on secure deployment and access control.

### Attribution & Third-Party Licenses

**Required Attributions:**

1. **Open Source Dependencies:**
   - React (MIT License)
   - Node.js (MIT License)
   - PostgreSQL (PostgreSQL License)
   - Express.js (MIT License)
   - Prisma (Apache 2.0)
   - All npm packages used

2. **External APIs:**
   - Spoonacular API (if used) - Commercial license required
   - Edamam API (if used) - Attribution required
   - USDA Data - Public domain, attribution appreciated
   - Store APIs - Check individual terms of service

3. **Attribution File (ATTRIBUTION.md):**
```markdown
# Third-Party Licenses and Attributions

## Open Source Software

This project uses the following open-source software:

### Frontend
- React (MIT License) - Copyright (c) Meta Platforms, Inc.
- TypeScript (Apache 2.0) - Copyright (c) Microsoft Corporation
- Material-UI (MIT License) - Copyright (c) MUI
[... full list with licenses]

### Backend
- Node.js (MIT License)
- Express.js (MIT License)
- Prisma (Apache 2.0)
[... full list with licenses]

### External Services
- Recipe data provided by [API Name]
- Nutritional information from [Source]
- Seasonal produce data from USDA

## License Compatibility

All dependencies are compatible with proprietary use.
See individual LICENSE files in node_modules for full license texts.
```

### Terms of Service (If Sharing)

**For Multi-Family Deployment:**

```markdown
# Terms of Service

Last Updated: [Date]

## Acceptance of Terms
By using this meal planning application, you agree to these terms.

## Use Restrictions
- Personal, non-commercial use only
- One family per account
- No automated access or scraping
- No resale or redistribution

## Data Privacy
- Your data is stored on a private server
- No data sharing with third parties
- You can export or delete your data at any time

## Liability
- Software provided "as is"
- No warranty for accuracy of nutritional information
- Not responsible for food allergies or dietary issues
- Users responsible for verifying ingredient safety

## Termination
- Accounts may be terminated for terms violations
- You may delete your account at any time
```

### Implementation Checklist

**Phase 1 (Before First Commit):**
- [x] Add copyright notice template to plan
- [ ] Create LICENSE file
- [ ] Create ATTRIBUTION.md file
- [ ] Document third-party dependencies

**Phase 2 (During Development):**
- [ ] Add copyright headers to all source files
- [ ] Set up pre-commit hook for copyright enforcement
- [ ] Audit all dependencies for license compatibility
- [ ] Document API terms of service compliance

**Phase 3 (Before Deployment):**
- [ ] Review and update all legal documents
- [ ] Ensure all attributions are complete
- [ ] Add terms of service if sharing with others
- [ ] Document data privacy practices

### Patent Considerations

**For This Project:**
- No known patent issues for meal planning applications
- Standard web technologies are not patented
- Recipe recommendation algorithms are generally not patentable
- If using proprietary APIs, review their patent clauses

**Defensive Measures:**
- Document original work and development timeline
- Keep records of design decisions
- Prior art: Many meal planning apps exist (not novel)

A Progressive Web App (PWA) designed for a family of 4 (2 adults, 2 teenagers) to simplify meal planning and grocery shopping. The app features a smart recommendation system, curated recipe collection, seasonal awareness, budget optimization, and offline functionality.

## 1. Application Architecture & Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit with RTK Query for API calls
- **UI Library**: Material-UI (MUI) or Tailwind CSS with Headless UI
- **PWA Features**: Workbox for service workers and offline caching
- **Routing**: React Router v6
- **Forms**: React Hook Form with Zod validation
- **Charts/Visualizations**: Recharts for nutrition and budget tracking

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (primary data) + Redis (caching, sessions)
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **API Style**: RESTful with potential GraphQL for complex queries

### External Services
- **Recipe Data**: Spoonacular API or Edamam API (for recipe discovery)
- **Seasonal Data**: USDA Seasonal Produce Guide API
- **Price Data**: Store APIs or web scraping for local grocery prices
- **Nutrition**: Integrated with recipe APIs

### DevOps & Hosting
- **Containerization**: Podman with Podman Compose (multi-container setup)
- **Target Platform**: Raspberry Pi (ARM64 architecture)
- **Deployment**: Self-hosted on home network
- **Reverse Proxy**: Nginx for routing and SSL termination
- **Database Hosting**: PostgreSQL container on Raspberry Pi
- **CI/CD**: GitHub Actions (optional for building ARM images)

### Development Tools
- **Package Manager**: pnpm
- **Linting**: ESLint + Prettier
- **Testing**: Vitest (unit), Playwright (e2e)
- **Version Control**: Git with conventional commits

## 2. Database Schema

### Core Entities

#### Users
```sql
users
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- family_name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### FamilyMembers
```sql
family_members
- id (UUID, PK)
- user_id (UUID, FK -> users)
- name (VARCHAR)
- age_group (ENUM: child, teen, adult)
- can_cook (BOOLEAN)
- dietary_restrictions (JSONB)
- created_at (TIMESTAMP)
```

#### Recipes
```sql
recipes
- id (UUID, PK)
- user_id (UUID, FK -> users, nullable for public recipes)
- title (VARCHAR)
- description (TEXT)
- source (VARCHAR: custom, imported, api)
- external_id (VARCHAR, nullable)
- prep_time (INTEGER, minutes)
- cook_time (INTEGER, minutes)
- servings (INTEGER)
- difficulty (ENUM: easy, medium, hard)
- kid_friendly (BOOLEAN)
- cuisine_type (VARCHAR)
- meal_type (ENUM: breakfast, lunch, dinner, snack, dessert)
- image_url (VARCHAR)
- instructions (JSONB)
- nutrition_info (JSONB)
- cost_estimate (DECIMAL)
- is_public (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Ingredients
```sql
ingredients
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- category (ENUM: produce, protein, dairy, grains, pantry, spices, other)
- seasonal_months (INTEGER[]) -- array of months 1-12
- average_price (DECIMAL)
- unit (VARCHAR)
- allergens (VARCHAR[])
- created_at (TIMESTAMP)
```

#### RecipeIngredients
```sql
recipe_ingredients
- id (UUID, PK)
- recipe_id (UUID, FK -> recipes)
- ingredient_id (UUID, FK -> ingredients)
- quantity (DECIMAL)
- unit (VARCHAR)
- notes (VARCHAR)
- is_optional (BOOLEAN)
```

#### MealPlans
```sql
meal_plans
- id (UUID, PK)
- user_id (UUID, FK -> users)
- week_start_date (DATE)
- status (ENUM: draft, active, completed)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### PlannedMeals
```sql
planned_meals
- id (UUID, PK)
- meal_plan_id (UUID, FK -> meal_plans)
- recipe_id (UUID, FK -> recipes)
- date (DATE)
- meal_type (ENUM: breakfast, lunch, dinner, snack)
- servings (INTEGER)
- assigned_cook (UUID, FK -> family_members, nullable)
- notes (TEXT)
```

#### GroceryLists
```sql
grocery_lists
- id (UUID, PK)
- meal_plan_id (UUID, FK -> meal_plans)
- user_id (UUID, FK -> users)
- status (ENUM: draft, shopping, completed)
- total_estimated_cost (DECIMAL)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### GroceryListItems
```sql
grocery_list_items
- id (UUID, PK)
- grocery_list_id (UUID, FK -> grocery_lists)
- ingredient_id (UUID, FK -> ingredients)
- quantity (DECIMAL)
- unit (VARCHAR)
- estimated_price (DECIMAL)
- is_checked (BOOLEAN)
- store_section (VARCHAR)
- notes (VARCHAR)
```

#### RecipeRatings
```sql
recipe_ratings
- id (UUID, PK)
- recipe_id (UUID, FK -> recipes)
- user_id (UUID, FK -> users)
- family_member_id (UUID, FK -> family_members, nullable)
- rating (INTEGER, 1-5)
- notes (TEXT)
- would_make_again (BOOLEAN)
- created_at (TIMESTAMP)
```

#### UserPreferences
```sql
user_preferences
- id (UUID, PK)
- user_id (UUID, FK -> users, UNIQUE)
- weekly_budget (DECIMAL)
- preferred_cuisines (VARCHAR[])
- avoided_ingredients (UUID[], FK -> ingredients)
- cooking_skill_level (ENUM: beginner, intermediate, advanced)
- max_prep_time_weeknight (INTEGER)
- max_prep_time_weekend (INTEGER)
- dietary_preferences (JSONB)
- notification_settings (JSONB)
```

#### PantryInventory
```sql
pantry_inventory
- id (UUID, PK)
- user_id (UUID, FK -> users)
- ingredient_id (UUID, FK -> ingredients)
- quantity (DECIMAL)
- unit (VARCHAR)
- expiration_date (DATE, nullable)
- location (VARCHAR: fridge, freezer, pantry)
- updated_at (TIMESTAMP)
```

## 3. System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph Client["Client Layer - PWA"]
        UI[React UI Components]
        SW[Service Worker]
        IDB[IndexedDB - Offline Storage]
    end
    
    subgraph API["API Layer"]
        REST[REST API - Express]
        AUTH[Auth Middleware]
        VALID[Validation Layer]
    end
    
    subgraph Services["Business Logic Layer"]
        RS[Recipe Service]
        REC[Recommendation Engine]
        MP[Meal Planning Service]
        GL[Grocery List Service]
        PRICE[Price Optimization]
        SEASON[Seasonal Service]
    end
    
    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
        REDIS[(Redis Cache)]
        S3[File Storage]
    end
    
    subgraph External["External Services"]
        RAPI[Recipe APIs]
        SAPI[Seasonal Data]
        PAPI[Price Data]
    end
    
    UI --> SW
    SW --> IDB
    UI --> REST
    REST --> AUTH
    AUTH --> VALID
    VALID --> RS
    VALID --> REC
    VALID --> MP
    VALID --> GL
    
    RS --> PG
    RS --> REDIS
    RS --> RAPI
    
    REC --> PG
    REC --> REDIS
    REC --> SEASON
    REC --> PRICE
    
    MP --> PG
    MP --> RS
    
    GL --> PG
    GL --> PRICE
    
    SEASON --> SAPI
    PRICE --> PAPI
    
    RS --> S3
```

### Component Responsibilities

**Client Layer**:
- React UI: User interface components, forms, visualizations
- Service Worker: Offline caching, background sync, push notifications
- IndexedDB: Local storage for recipes, meal plans, grocery lists

**API Layer**:
- REST API: HTTP endpoints for all operations
- Auth Middleware: JWT validation, session management
- Validation: Request/response validation with Zod schemas

**Business Logic Layer**:
- Recipe Service: CRUD operations, search, filtering
- Recommendation Engine: Smart recipe suggestions based on multiple factors
- Meal Planning Service: Create/manage meal plans, assign cooks
- Grocery List Service: Generate optimized shopping lists
- Price Optimization: Compare prices, suggest alternatives
- Seasonal Service: Track seasonal ingredients, adjust recommendations

**Data Layer**:
- PostgreSQL: Primary data storage
- Redis: Session storage, caching, rate limiting
- File Storage: Recipe images, user uploads

## 4. Key User Interface Screens

### Main Navigation Structure
1. **Dashboard/Home**
2. **Recipes** (Browse, Search, Add)
3. **Meal Planner** (Weekly view)
4. **Grocery List**
5. **Pantry Inventory**
6. **Family Profile & Settings**

### Screen Wireframes (Descriptions)

#### Dashboard
- Current week's meal plan overview
- Today's meals with assigned cooks
- Quick actions: Add recipe, Start shopping, View pantry
- Budget tracker for the week
- Recommended recipes carousel
- Upcoming expiring pantry items

#### Recipe Browser
- Search bar with filters (cuisine, time, difficulty, allergens)
- Grid/list view toggle
- Filter sidebar: meal type, kid-friendly, cooking time, dietary restrictions
- Recipe cards: image, title, time, difficulty, rating, cost estimate
- "Add to favorites" and "Plan meal" quick actions

#### Recipe Detail
- Large image, title, description
- Metadata: prep/cook time, servings, difficulty, cost
- Nutrition information
- Ingredient list with checkboxes
- Step-by-step instructions
- Family ratings and notes
- "Add to meal plan" button
- "Add ingredients to grocery list" button
- Similar recipes suggestions

#### Meal Planner (Weekly View)
- Calendar grid: 7 days × 3 meals (breakfast, lunch, dinner)
- Drag-and-drop recipe cards
- Assign cook to each meal
- Quick add from favorites
- Generate suggestions button
- Export to grocery list button
- Budget summary for the week

#### Grocery List
- Grouped by store section (produce, dairy, meat, etc.)
- Checkboxes for each item
- Quantity and unit display
- Price estimates and total
- "Already have" button (adds to pantry)
- Store selection (for price optimization)
- Share list functionality
- Smart suggestions for substitutions

#### Pantry Inventory
- Searchable list of current inventory
- Categories: fridge, freezer, pantry
- Expiration date tracking
- Quick add with barcode scanner
- "Use this ingredient" - shows recipes
- Low stock alerts

## 5. Recipe Recommendation Algorithm

### Multi-Factor Scoring System

The recommendation engine uses a weighted scoring system considering:

#### Factors & Weights

1. **Seasonal Score (20%)**
   - Ingredients in season: +10 points per ingredient
   - Out of season: -5 points per ingredient
   - Calculation: `(in_season_count * 10 - out_of_season_count * 5) / total_ingredients`

2. **Budget Score (20%)**
   - Compare recipe cost to weekly budget
   - Under budget: +10 points
   - Within 10% of budget: +5 points
   - Over budget: -10 points
   - Calculation: `budget_remaining / recipe_cost * 10`

3. **Variety Score (15%)**
   - Track protein types used this week
   - Track cuisines used this week
   - New protein: +8 points
   - New cuisine: +7 points
   - Calculation: `(new_protein * 8 + new_cuisine * 7) / 15`

4. **Nutrition Balance (15%)**
   - Track macros for the week
   - Balanced meal: +10 points
   - Fills nutritional gap: +5 points
   - Calculation based on weekly macro targets

5. **Family Preference Score (15%)**
   - Average family rating: rating * 2 points
   - Would make again: +5 points
   - Never tried: +3 points (encourage variety)
   - Calculation: `(avg_rating * 2 + would_make_again * 5) / 10`

6. **Pantry Utilization (10%)**
   - Ingredients already in pantry: +5 points per ingredient
   - Expiring soon ingredients: +10 points per ingredient
   - Calculation: `(pantry_ingredients * 5 + expiring_ingredients * 10) / total_ingredients`

7. **Time Appropriateness (5%)**
   - Weeknight (< 30 min): +10 points
   - Weekend (any time): +5 points
   - Calculation based on day of week and prep time

#### Algorithm Flow

```
For each candidate recipe:
  1. Calculate individual factor scores
  2. Apply weights to each score
  3. Sum weighted scores = total_score
  4. Apply filters (allergens, dietary restrictions)
  5. Sort by total_score descending
  6. Return top N recommendations
```

#### Personalization Over Time

- Track which recommendations are accepted/rejected
- Adjust weights based on user behavior
- Learn family preferences through ratings
- Adapt to seasonal changes automatically

## 6. API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate refresh token

### Users & Family
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/preferences` - Get user preferences
- `PUT /api/users/preferences` - Update preferences
- `GET /api/family-members` - List family members
- `POST /api/family-members` - Add family member
- `PUT /api/family-members/:id` - Update family member
- `DELETE /api/family-members/:id` - Remove family member

### Recipes
- `GET /api/recipes` - List recipes (with filters, pagination)
- `GET /api/recipes/:id` - Get recipe details
- `POST /api/recipes` - Create custom recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe
- `GET /api/recipes/search` - Search recipes
- `GET /api/recipes/recommendations` - Get personalized recommendations
- `POST /api/recipes/import` - Import recipe from URL or API
- `GET /api/recipes/:id/similar` - Get similar recipes

### Recipe Ratings
- `GET /api/recipes/:id/ratings` - Get recipe ratings
- `POST /api/recipes/:id/ratings` - Add rating
- `PUT /api/ratings/:id` - Update rating
- `DELETE /api/ratings/:id` - Delete rating

### Meal Plans
- `GET /api/meal-plans` - List meal plans
- `GET /api/meal-plans/:id` - Get meal plan details
- `POST /api/meal-plans` - Create meal plan
- `PUT /api/meal-plans/:id` - Update meal plan
- `DELETE /api/meal-plans/:id` - Delete meal plan
- `POST /api/meal-plans/:id/meals` - Add meal to plan
- `PUT /api/meal-plans/:id/meals/:mealId` - Update planned meal
- `DELETE /api/meal-plans/:id/meals/:mealId` - Remove meal from plan
- `POST /api/meal-plans/:id/generate-suggestions` - Get AI suggestions

### Grocery Lists
- `GET /api/grocery-lists` - List grocery lists
- `GET /api/grocery-lists/:id` - Get grocery list details
- `POST /api/grocery-lists` - Create grocery list from meal plan
- `PUT /api/grocery-lists/:id` - Update grocery list
- `DELETE /api/grocery-lists/:id` - Delete grocery list
- `PUT /api/grocery-lists/:id/items/:itemId` - Update item (check/uncheck)
- `POST /api/grocery-lists/:id/optimize` - Optimize list by store/price

### Pantry
- `GET /api/pantry` - List pantry items
- `POST /api/pantry` - Add pantry item
- `PUT /api/pantry/:id` - Update pantry item
- `DELETE /api/pantry/:id` - Remove pantry item
- `GET /api/pantry/expiring` - Get expiring items
- `GET /api/pantry/recipes` - Get recipes using pantry items

### Ingredients
- `GET /api/ingredients` - List ingredients
- `GET /api/ingredients/search` - Search ingredients
- `GET /api/ingredients/seasonal` - Get seasonal ingredients

## 7. Offline Functionality & Data Synchronization

### Offline-First Strategy

#### Service Worker Caching Strategy

**Cache-First Resources**:
- Static assets (JS, CSS, images)
- Recipe images
- UI components

**Network-First with Cache Fallback**:
- Recipe data
- Meal plans
- Grocery lists
- User preferences

**Cache-Only**:
- App shell
- Core UI framework

#### IndexedDB Schema

```javascript
// Stores for offline data
stores = {
  recipes: { keyPath: 'id', indexes: ['title', 'cuisine_type', 'meal_type'] },
  mealPlans: { keyPath: 'id', indexes: ['week_start_date', 'status'] },
  groceryLists: { keyPath: 'id', indexes: ['status', 'meal_plan_id'] },
  pantryItems: { keyPath: 'id', indexes: ['ingredient_id', 'expiration_date'] },
  syncQueue: { keyPath: 'id', indexes: ['timestamp', 'type'] }
}
```

#### Synchronization Strategy

**Background Sync**:
1. Queue operations when offline
2. Store in `syncQueue` with timestamp
3. Register background sync event
4. When online, process queue in order
5. Handle conflicts with last-write-wins + user notification

**Conflict Resolution**:
- Server timestamp wins for most data
- For grocery list items: merge checked items
- For ratings: keep most recent
- Notify user of conflicts requiring manual resolution

**Sync Operations**:
- `POST /api/sync/pull` - Get updates since last sync
- `POST /api/sync/push` - Push local changes
- `GET /api/sync/status` - Check sync status

## 8. Grocery List Optimization Logic

### Multi-Store Price Comparison

```javascript
function optimizeGroceryList(items, stores, userPreferences) {
  // 1. Group items by category
  const categorized = groupByCategory(items);
  
  // 2. For each item, find best price across stores
  const priceMatrix = items.map(item => ({
    item,
    prices: stores.map(store => ({
      store,
      price: getPriceAtStore(item, store),
      available: isAvailableAtStore(item, store)
    }))
  }));
  
  // 3. Calculate optimal store combination
  const optimization = calculateOptimalStores(priceMatrix, {
    maxStores: userPreferences.maxStores || 2,
    travelCost: userPreferences.travelCostPerStore || 5,
    preferredStores: userPreferences.preferredStores || []
  });
  
  // 4. Suggest substitutions for expensive items
  const withSubstitutions = suggestSubstitutions(
    optimization.items,
    priceMatrix,
    userPreferences.budget
  );
  
  return {
    stores: optimization.stores,
    items: withSubstitutions,
    totalCost: optimization.totalCost,
    savings: optimization.savings
  };
}
```

### Store Section Grouping

```javascript
const storeSections = {
  produce: ['fruits', 'vegetables', 'herbs'],
  dairy: ['milk', 'cheese', 'yogurt', 'eggs'],
  meat: ['beef', 'chicken', 'pork', 'fish'],
  frozen: ['frozen vegetables', 'frozen meals', 'ice cream'],
  bakery: ['bread', 'pastries', 'tortillas'],
  pantry: ['canned goods', 'pasta', 'rice', 'oils'],
  spices: ['spices', 'seasonings', 'sauces'],
  beverages: ['drinks', 'juice', 'coffee'],
  snacks: ['chips', 'crackers', 'cookies']
};
```

### Smart Substitution Engine

```javascript
function suggestSubstitutions(item, budget) {
  const substitutes = findSubstitutes(item.ingredient_id);
  
  return substitutes
    .filter(sub => sub.price < item.price)
    .filter(sub => !hasAllergen(sub, userAllergens))
    .map(sub => ({
      original: item,
      substitute: sub,
      savings: item.price - sub.price,
      nutritionDiff: compareNutrition(item, sub),
      confidence: calculateSubstituteConfidence(item, sub)
    }))
    .sort((a, b) => b.savings - a.savings);
}
```

## 9. Seasonal Ingredient Tracking

### Seasonal Data Structure

```javascript
const seasonalData = {
  spring: { // March, April, May
    produce: [
      { name: 'asparagus', peak: [4, 5], price_factor: 0.7 },
      { name: 'strawberries', peak: [4, 5], price_factor: 0.6 },
      { name: 'peas', peak: [4, 5], price_factor: 0.8 }
    ]
  },
  summer: { // June, July, August
    produce: [
      { name: 'tomatoes', peak: [7, 8], price_factor: 0.5 },
      { name: 'corn', peak: [7, 8], price_factor: 0.6 },
      { name: 'zucchini', peak: [6, 7, 8], price_factor: 0.7 }
    ]
  },
  fall: { // September, October, November
    produce: [
      { name: 'pumpkin', peak: [10, 11], price_factor: 0.6 },
      { name: 'apples', peak: [9, 10], price_factor: 0.7 },
      { name: 'squash', peak: [9, 10, 11], price_factor: 0.7 }
    ]
  },
  winter: { // December, January, February
    produce: [
      { name: 'citrus', peak: [12, 1, 2], price_factor: 0.6 },
      { name: 'root vegetables', peak: [12, 1, 2], price_factor: 0.8 },
      { name: 'brussels sprouts', peak: [12, 1], price_factor: 0.8 }
    ]
  }
};
```

### Seasonal Recommendation Boost

```javascript
function getSeasonalBoost(recipe, currentMonth) {
  const ingredients = recipe.ingredients;
  let seasonalScore = 0;
  
  ingredients.forEach(ingredient => {
    const seasonalInfo = getSeasonalInfo(ingredient.id);
    if (seasonalInfo.peak.includes(currentMonth)) {
      seasonalScore += 10; // Peak season
    } else if (seasonalInfo.available.includes(currentMonth)) {
      seasonalScore += 5; // In season but not peak
    } else {
      seasonalScore -= 5; // Out of season
    }
  });
  
  return seasonalScore / ingredients.length;
}
```

## 10. User Authentication & Family Sharing

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant DB
    
    User->>Client: Enter credentials
    Client->>API: POST /api/auth/login
    API->>DB: Verify credentials
    DB-->>API: User data
    API-->>Client: Access token + Refresh token
    Client->>Client: Store tokens securely
    
    Note over Client,API: Subsequent requests
    Client->>API: Request with Access token
    API->>API: Verify token
    API-->>Client: Protected resource
    
    Note over Client,API: Token refresh
    Client->>API: POST /api/auth/refresh
    API->>API: Verify refresh token
    API-->>Client: New access token
```

### Family Sharing Features

**Shared Resources**:
- Recipe collection (family-wide)
- Meal plans (collaborative editing)
- Grocery lists (real-time sync)
- Pantry inventory (shared view)

**Individual Features**:
- Personal ratings and notes
- Notification preferences
- Cooking assignments

**Permissions**:
- Admin (parents): Full access, manage family members
- Member (teens): View all, edit assigned meals, rate recipes
- Kid mode: Simplified interface, kid-friendly recipes only

## 11. Implementation Roadmap

### Phase 1: MVP (8-10 weeks)

**Week 1-2: Project Setup & Core Infrastructure**
- [ ] Initialize React + TypeScript project with Vite
- [ ] Set up Express backend with TypeScript
- [ ] Configure PostgreSQL database
- [ ] Set up Prisma ORM with initial schema
- [ ] Configure Redis for caching
- [ ] Set up authentication (JWT)
- [ ] Create basic CI/CD pipeline

**Week 3-4: Core Recipe Management**
- [ ] Implement recipe CRUD operations
- [ ] Create recipe browser UI
- [ ] Build recipe detail page
- [ ] Add recipe search and filtering
- [ ] Implement recipe rating system
- [ ] Create custom recipe form

**Week 5-6: Meal Planning**
- [ ] Build meal plan data model
- [ ] Create weekly meal planner UI
- [ ] Implement drag-and-drop functionality
- [ ] Add meal assignment to family members
- [ ] Build basic recommendation system (simplified)

**Week 7-8: Grocery List**
- [ ] Generate grocery list from meal plan
- [ ] Create grocery list UI with checkboxes
- [ ] Group items by category
- [ ] Add basic price estimation
- [ ] Implement list sharing

**Week 9-10: PWA & Polish**
- [ ] Configure service worker
- [ ] Implement offline caching
- [ ] Add app manifest
- [ ] Create responsive design
- [ ] User testing and bug fixes
- [ ] Deploy MVP

### Phase 2: Enhanced Features (6-8 weeks)

**Week 11-12: Pantry Management**
- [ ] Build pantry inventory system
- [ ] Add expiration tracking
- [ ] Implement "use this ingredient" feature
- [ ] Create low stock alerts

**Week 13-14: Advanced Recommendations**
- [ ] Implement full multi-factor scoring algorithm
- [ ] Add seasonal ingredient tracking
- [ ] Build variety tracking system
- [ ] Integrate nutrition balancing

**Week 15-16: Price Optimization**
- [ ] Integrate store price APIs
- [ ] Build price comparison engine
- [ ] Implement substitution suggestions
- [ ] Add budget tracking and alerts

**Week 17-18: Enhanced UX**
- [ ] Add recipe import from URL
- [ ] Implement barcode scanning for pantry
- [ ] Create meal prep mode
- [ ] Add cooking timer integration
- [ ] Build notification system

### Phase 3: Advanced Features (4-6 weeks)

**Week 19-20: Social & Sharing**
- [ ] Family recipe sharing
- [ ] Public recipe discovery
- [ ] Recipe comments and tips
- [ ] Share meal plans with friends

**Week 21-22: Analytics & Insights**
- [ ] Budget analytics dashboard
- [ ] Nutrition tracking over time
- [ ] Cooking frequency insights
- [ ] Waste reduction metrics

**Week 23-24: Mobile Optimization**
- [ ] Optimize for mobile devices
- [ ] Add push notifications
- [ ] Implement background sync
- [ ] Create app store listings

### Phase 4: AI & Automation (Ongoing)

- [ ] Machine learning for personalization
- [ ] Automated meal plan generation
- [ ] Smart pantry suggestions
- [ ] Voice assistant integration
- [ ] Image recognition for ingredients

## 12. Technical Specifications

### Performance Requirements

- **Page Load Time**: < 2 seconds on 3G
- **Time to Interactive**: < 3 seconds
- **Offline Support**: Full functionality for core features
- **API Response Time**: < 200ms for 95th percentile
- **Database Queries**: < 100ms for most queries

### Security Requirements

- **Authentication**: JWT with 15-minute access tokens, 7-day refresh tokens
- **Password Storage**: bcrypt with salt rounds = 12
- **HTTPS**: Required for all connections
- **Input Validation**: Zod schemas on frontend and backend
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Prevention**: Content Security Policy headers
- **CSRF Protection**: SameSite cookies, CSRF tokens

### Scalability Considerations

- **Horizontal Scaling**: Stateless API servers
- **Database**: Connection pooling, read replicas for scaling
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets served via CDN
- **Rate Limiting**: 100 requests per minute per user

### Accessibility Requirements

- **WCAG 2.1 Level AA Compliance**
- **Keyboard Navigation**: Full support
- **Screen Reader**: ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio
- **Font Sizes**: Responsive and adjustable

### Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (last 2 versions)
- **Mobile**: iOS Safari 14+, Chrome Android 90+
- **PWA Support**: Service Workers, Web App Manifest

### Data Privacy

- **GDPR Compliance**: User data export, right to deletion
- **Data Encryption**: At rest and in transit
- **Privacy Policy**: Clear data usage disclosure
- **Cookie Consent**: Required for non-essential cookies

## 13. Key Features Summary

### Core Features (MVP)
✅ Recipe management (CRUD, search, filter)
✅ Custom recipe creation
✅ Recipe ratings and notes
✅ Weekly meal planner with drag-and-drop
✅ Assign meals to family members
✅ Basic recipe recommendations
✅ Grocery list generation
✅ Allergen filtering (including crustacean allergy)
✅ Kid-friendly recipe tagging
✅ Offline functionality (PWA)
✅ Family member profiles

### Enhanced Features (Phase 2)
✅ Pantry inventory management
✅ Expiration tracking
✅ Advanced recommendation algorithm (seasonal, budget, variety, nutrition)
✅ Multi-store price comparison
✅ Smart substitution suggestions
✅ Budget tracking
✅ Recipe import from URL
✅ Barcode scanning

### Advanced Features (Phase 3+)
✅ Recipe sharing and discovery
✅ Analytics dashboard
✅ Nutrition tracking over time
✅ Push notifications
✅ Voice assistant integration
✅ AI-powered meal plan generation

## 14. Success Metrics

### User Engagement
- Daily active users
- Recipes added per user
- Meal plans created per week
- Grocery lists generated
- Time spent in app

### Business Metrics
- User retention rate (30, 60, 90 days)
- Feature adoption rates
- User satisfaction (NPS score)
- Cost savings reported by users
- Reduction in food waste

### Technical Metrics
- App performance (load time, TTI)
- Error rates
- API response times
- Offline usage percentage
- Sync success rate

## Next Steps

1. **Review and Approve Plan**: Ensure all requirements are captured
2. **Set Up Development Environment**: Initialize repositories, configure tools
3. **Begin Phase 1 Implementation**: Start with project setup and core infrastructure
4. **Establish Development Workflow**: Sprint planning, code reviews, testing
5. **Create Design System**: UI components, color palette, typography

## 15. Raspberry Pi Self-Hosted Deployment

### Hardware Requirements

**Recommended**: Raspberry Pi 4 Model B (4GB or 8GB RAM)
- **Minimum**: Raspberry Pi 4 with 4GB RAM
- **Storage**: 32GB+ microSD card (Class 10 or better) or USB SSD for better performance
- **Network**: Ethernet connection recommended for stability
- **Power**: Official Raspberry Pi power supply (5V/3A)

**Optional**:
- External USB SSD for database storage (improves performance)
- UPS/battery backup for power stability
- Case with active cooling

### Podman Architecture for Raspberry Pi

#### Multi-Container Setup

```yaml
# podman-compose.yml structure
services:
  nginx:          # Reverse proxy and static file server
  frontend:       # React PWA (production build)
  backend:        # Node.js API server
  postgres:       # PostgreSQL database
  redis:          # Cache and session storage
```

#### Container Resource Limits

```yaml
# Optimized for Raspberry Pi 4 (4GB RAM)
nginx:
  memory: 128MB
  cpu: 0.25

frontend:
  memory: 256MB
  cpu: 0.5

backend:
  memory: 512MB
  cpu: 1.0

postgres:
  memory: 512MB
  cpu: 0.75

redis:
  memory: 128MB
  cpu: 0.25

Total: ~1.5GB RAM (leaves 2.5GB for OS and overhead)
```

### ARM64 Optimization

**Base Images**:
- Use official ARM64 images: `arm64v8/node:18-alpine`, `arm64v8/postgres:15-alpine`
- Alpine Linux variants for smaller image sizes
- Multi-stage builds to minimize final image size

**Build Strategy**:
```dockerfile
# Frontend: Build on development machine, copy to Pi
FROM node:18-alpine AS builder
# ... build steps ...
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Backend: Lightweight runtime
FROM node:18-alpine
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "dist/server.js"]
```

### Network Configuration

#### Local Network Access

**Internal Access** (within home network):
- Access via `http://raspberrypi.local:3000` or `http://192.168.1.x:3000`
- mDNS/Bonjour for easy discovery
- No external exposure required

**Optional External Access** (if needed):
- Use Tailscale or WireGuard VPN for secure remote access
- Avoid port forwarding for security
- Let's Encrypt SSL via DNS challenge (if using custom domain)

#### Nginx Configuration

```nginx
# Optimized for Raspberry Pi
worker_processes 2;
worker_connections 512;

# Serve static files efficiently
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Proxy API requests
location /api/ {
    proxy_pass http://backend:3001;
    proxy_buffering off;
}

# PWA service worker
location /sw.js {
    add_header Cache-Control "no-cache";
}
```

### Database Optimization for Raspberry Pi

#### PostgreSQL Configuration

```conf
# postgresql.conf - Optimized for 512MB container
shared_buffers = 128MB
effective_cache_size = 256MB
maintenance_work_mem = 64MB
work_mem = 4MB
max_connections = 20
```

#### Storage Strategy

- Use external USB SSD for database volume (10x faster than microSD)
- Regular automated backups to network storage
- WAL archiving for point-in-time recovery

```yaml
# docker-compose.yml volume mapping
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /mnt/usb-ssd/postgres
```

### Deployment Process

#### Initial Setup

```bash
# 1. Install podman on Raspberry Pi
curl -fsSL https://get.podman.com -o get-podman.sh
sudo sh get-podman.sh
sudo usermod -aG podman $USER

# 2. Install podman Compose
sudo apt-get install podman-compose

# 3. Clone repository
git clone <repo-url> meal-planner
cd meal-planner

# 4. Configure environment
cp .env.example .env
nano .env  # Edit configuration

# 5. Build and start containers
podman-compose up -d

# 6. Initialize database
podman-compose exec backend npm run migrate
podman-compose exec backend npm run seed
```

#### Update Process

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
podman-compose down
podman-compose build
podman-compose up -d

# Run migrations if needed
podman-compose exec backend npm run migrate
```

### Monitoring and Maintenance

#### Health Checks

```yaml
# podman-compose.yml health checks
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

#### Monitoring Tools

- **Portainer**: Web UI for podman management (`http://raspberrypi.local:9000`)
- **Prometheus + Grafana**: Optional metrics and dashboards
- **Log aggregation**: podman logs with rotation

```bash
# View logs
podman-compose logs -f backend

# Check resource usage
podman stats

# Backup database
podman-compose exec postgres pg_dump -U user dbname > backup.sql
```

### Backup Strategy

#### Automated Backups

```bash
#!/bin/bash
# backup.sh - Run daily via cron

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/mnt/usb-ssd/backups"

# Database backup
podman-compose exec -T postgres pg_dump -U user dbname | \
  gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Recipe images backup
tar -czf "$BACKUP_DIR/images_$DATE.tar.gz" ./data/images

# Keep last 30 days
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
```

#### Restore Process

```bash
# Restore database
gunzip < backup.sql.gz | \
  podman-compose exec -T postgres psql -U user dbname

# Restore images
tar -xzf images_backup.tar.gz -C ./data/
```

### Security Considerations

#### Container Security

- Run containers as non-root users
- Use read-only file systems where possible
- Limit network exposure (only nginx exposed)
- Regular security updates via `podman-compose pull`

#### Network Security

- Firewall rules: Only allow ports 80/443 from local network
- No default passwords in environment files
- Use secrets management for sensitive data
- Regular security audits

```bash
# UFW firewall rules
sudo ufw allow from 192.168.1.0/24 to any port 80
sudo ufw allow from 192.168.1.0/24 to any port 443
sudo ufw enable
```

### Performance Optimization

#### Caching Strategy

- Redis for session storage and API response caching
- Nginx caching for static assets
- Service worker caching on client side
- Database query result caching

#### Resource Management

```yaml
# podman-compose.yml restart policies
restart: unless-stopped

# Automatic container restart on failure
deploy:
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
```

#### Database Indexing

```sql
-- Critical indexes for performance
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX idx_planned_meals_date ON planned_meals(date);
CREATE INDEX idx_grocery_items_list_id ON grocery_list_items(grocery_list_id);
CREATE INDEX idx_pantry_expiration ON pantry_inventory(expiration_date);
```

## 16. Grocery Store Integration & Shopping Features

### Department-Organized Shopping List

#### Store Department Mapping

```javascript
const storeDepartments = {
  produce: {
    name: 'Produce',
    order: 1,
    icon: '🥬',
    subcategories: ['Fruits', 'Vegetables', 'Herbs', 'Salad']
  },
  meat_seafood: {
    name: 'Meat & Seafood',
    order: 2,
    icon: '🥩',
    subcategories: ['Beef', 'Chicken', 'Pork', 'Fish', 'Seafood']
  },
  dairy: {
    name: 'Dairy & Eggs',
    order: 3,
    icon: '🥛',
    subcategories: ['Milk', 'Cheese', 'Yogurt', 'Eggs', 'Butter']
  },
  bakery: {
    name: 'Bakery',
    order: 4,
    icon: '🍞',
    subcategories: ['Bread', 'Pastries', 'Tortillas', 'Bagels']
  },
  frozen: {
    name: 'Frozen Foods',
    order: 5,
    icon: '🧊',
    subcategories: ['Frozen Vegetables', 'Frozen Meals', 'Ice Cream', 'Pizza']
  },
  pantry: {
    name: 'Pantry & Canned',
    order: 6,
    icon: '🥫',
    subcategories: ['Canned Goods', 'Pasta', 'Rice', 'Beans', 'Sauces']
  },
  beverages: {
    name: 'Beverages',
    order: 7,
    icon: '🥤',
    subcategories: ['Juice', 'Soda', 'Coffee', 'Tea', 'Water']
  },
  snacks: {
    name: 'Snacks',
    order: 8,
    icon: '🍿',
    subcategories: ['Chips', 'Crackers', 'Cookies', 'Candy', 'Nuts']
  },
  condiments: {
    name: 'Condiments & Spices',
    order: 9,
    icon: '🧂',
    subcategories: ['Spices', 'Sauces', 'Oils', 'Vinegars', 'Seasonings']
  },
  household: {
    name: 'Household',
    order: 10,
    icon: '🧹',
    subcategories: ['Cleaning', 'Paper Products', 'Storage']
  }
};
```

#### Smart List Organization

```javascript
function organizeShoppingList(items, userStore) {
  // 1. Group by department
  const grouped = items.reduce((acc, item) => {
    const dept = item.department || 'other';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(item);
    return acc;
  }, {});

  // 2. Sort departments by store layout
  const storeLayout = getStoreLayout(userStore);
  const sorted = Object.keys(grouped)
    .sort((a, b) => storeLayout[a].order - storeLayout[b].order)
    .map(dept => ({
      department: dept,
      name: storeLayout[dept].name,
      icon: storeLayout[dept].icon,
      items: grouped[dept].sort((a, b) => a.name.localeCompare(b.name))
    }));

  return sorted;
}
```

### Online Grocery Integration

#### Supported Stores

**Phase 1 - Manual Export**:
- Generate formatted shopping list
- Copy to clipboard
- Manual paste into store website

**Phase 2 - API Integration** (if available):
- Walmart Grocery API
- Kroger API
- Instacart API
- Amazon Fresh API

**Phase 3 - Browser Automation** (fallback):
- Puppeteer-based cart loading
- Store-specific selectors
- User authentication required

#### Database Schema Updates

```sql
-- Store profiles
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  type VARCHAR, -- walmart, kroger, instacart, etc.
  api_enabled BOOLEAN DEFAULT false,
  department_mapping JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User store preferences
CREATE TABLE user_stores (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  is_primary BOOLEAN DEFAULT false,
  api_credentials JSONB, -- encrypted
  delivery_address JSONB,
  preferences JSONB, -- delivery vs pickup, time slots
  created_at TIMESTAMP DEFAULT NOW()
);

-- Store product mapping
CREATE TABLE store_products (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  ingredient_id UUID REFERENCES ingredients(id),
  product_name VARCHAR,
  product_id VARCHAR, -- store's product ID
  upc VARCHAR,
  price DECIMAL,
  unit VARCHAR,
  url VARCHAR,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

#### Cart Loading Features

##### Manual Export Formats

```javascript
// Export formats for different stores
const exportFormats = {
  walmart: {
    format: 'csv',
    columns: ['Product Name', 'Quantity', 'Unit'],
    delimiter: ','
  },
  kroger: {
    format: 'text',
    template: '{{quantity}} {{unit}} {{name}}'
  },
  instacart: {
    format: 'json',
    schema: {
      items: [{ name: '', quantity: 0, unit: '' }]
    }
  }
};

function exportShoppingList(items, store, format) {
  const exporter = exportFormats[store];
  
  switch (exporter.format) {
    case 'csv':
      return generateCSV(items, exporter.columns);
    case 'text':
      return generateText(items, exporter.template);
    case 'json':
      return generateJSON(items, exporter.schema);
  }
}
```

##### API Integration (Example: Walmart)

```javascript
class WalmartGroceryService {
  constructor(apiKey, affiliateId) {
    this.apiKey = apiKey;
    this.affiliateId = affiliateId;
    this.baseUrl = 'https://developer.api.walmart.com';
  }

  async searchProduct(query) {
    const response = await fetch(
      `${this.baseUrl}/api/v1/search?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'WM_SEC.ACCESS_TOKEN': this.apiKey,
          'WM_QOS.CORRELATION_ID': generateCorrelationId()
        }
      }
    );
    return response.json();
  }

  async addToCart(items, userId) {
    // Map ingredients to Walmart product IDs
    const products = await Promise.all(
      items.map(item => this.findBestMatch(item))
    );

    // Generate cart URL or use API to add items
    const cartUrl = this.generateCartUrl(products);
    return cartUrl;
  }

  async findBestMatch(ingredient) {
    const results = await this.searchProduct(ingredient.name);
    
    // Score products based on:
    // - Name similarity
    // - Price
    // - Availability
    // - User preferences
    
    return results.items[0]; // Best match
  }

  generateCartUrl(products) {
    // Generate Walmart cart URL with pre-filled items
    const itemIds = products.map(p => p.itemId).join(',');
    return `https://www.walmart.com/cart?items=${itemIds}`;
  }
}
```

##### Browser Automation (Fallback)

```javascript
// For stores without APIs - use Puppeteer
class StoreAutomation {
  async loadCart(store, items, credentials) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // 1. Login
    await this.login(page, store, credentials);

    // 2. Search and add each item
    for (const item of items) {
      await this.searchAndAdd(page, store, item);
    }

    // 3. Navigate to cart
    await page.goto(store.cartUrl);

    // Keep browser open for user to review and checkout
    return { browser, page };
  }

  async searchAndAdd(page, store, item) {
    // Store-specific selectors
    const selectors = this.getSelectors(store.name);

    // Search for item
    await page.type(selectors.searchBox, item.name);
    await page.click(selectors.searchButton);
    await page.waitForSelector(selectors.searchResults);

    // Add first result to cart
    await page.click(selectors.addToCartButton);
    await page.waitForSelector(selectors.cartConfirmation);
  }
}
```

#### Shopping List UI Enhancements

##### Department View

```jsx
// React component for department-organized list
function DepartmentShoppingList({ groceryList, store }) {
  const organized = organizeShoppingList(groceryList.items, store);

  return (
    <div className="shopping-list">
      {organized.map(dept => (
        <DepartmentSection key={dept.department}>
          <DepartmentHeader>
            <span className="icon">{dept.icon}</span>
            <h3>{dept.name}</h3>
            <span className="count">{dept.items.length} items</span>
          </DepartmentHeader>
          
          <ItemList>
            {dept.items.map(item => (
              <ShoppingItem
                key={item.id}
                item={item}
                onCheck={handleCheck}
                onQuantityChange={handleQuantityChange}
              />
            ))}
          </ItemList>
        </DepartmentSection>
      ))}
    </div>
  );
}
```

##### Quick Actions

```jsx
function ShoppingListActions({ groceryList, store }) {
  return (
    <ActionBar>
      {/* Export options */}
      <Button onClick={() => exportToClipboard(groceryList)}>
        📋 Copy List
      </Button>
      
      <Button onClick={() => exportToCSV(groceryList)}>
        📄 Export CSV
      </Button>

      {/* Store integration */}
      {store.api_enabled ? (
        <Button onClick={() => loadToStoreCart(groceryList, store)}>
          🛒 Load to {store.name} Cart
        </Button>
      ) : (
        <Button onClick={() => openStoreWebsite(store)}>
          🌐 Open {store.name}
        </Button>
      )}

      {/* Delivery/Pickup options */}
      <Button onClick={() => scheduleDelivery(groceryList, store)}>
        🚚 Schedule Delivery
      </Button>
      
      <Button onClick={() => scheduleCurbside(groceryList, store)}>
        🚗 Curbside Pickup
      </Button>
    </ActionBar>
  );
}
```

#### API Endpoints for Shopping Features

```javascript
// New endpoints for grocery integration
app.post('/api/grocery-lists/:id/export', async (req, res) => {
  const { format, store } = req.body;
  const list = await getGroceryList(req.params.id);
  const exported = exportShoppingList(list.items, store, format);
  res.json({ data: exported });
});

app.post('/api/grocery-lists/:id/load-cart', async (req, res) => {
  const { storeId } = req.body;
  const list = await getGroceryList(req.params.id);
  const store = await getStore(storeId);
  
  if (store.api_enabled) {
    const cartUrl = await loadToStoreAPI(list, store);
    res.json({ cartUrl });
  } else {
    // Return instructions for manual loading
    res.json({ 
      manual: true,
      instructions: generateManualInstructions(list, store)
    });
  }
});

app.get('/api/stores', async (req, res) => {
  const stores = await getAvailableStores();
  res.json({ stores });
});

app.post('/api/user-stores', async (req, res) => {
  const { storeId, preferences } = req.body;
  const userStore = await addUserStore(req.user.id, storeId, preferences);
  res.json({ userStore });
});
```

### Implementation Priority

**Phase 1 (MVP)**:
- ✅ Department-organized shopping list
- ✅ Manual export (clipboard, CSV)
- ✅ Store department customization

**Phase 2**:
- ✅ Store profiles and preferences
- ✅ Basic API integration (Walmart, Kroger if available)
- ✅ Product mapping and price tracking

**Phase 3**:
- ✅ Browser automation for unsupported stores
- ✅ Delivery/pickup scheduling
- ✅ Cart synchronization
- ✅ Price comparison across stores


## 17. podman Configuration Files

### podman-compose.yml

```yaml
version: '3.8'

services:
  # Nginx reverse proxy and static file server
  nginx:
    image: nginx:alpine
    container_name: meal-planner-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./data/images:/usr/share/nginx/html/images:ro
      - ./data/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - meal-planner-network
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.25'

  # React frontend (production build)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    image: meal-planner-frontend:latest
    container_name: meal-planner-frontend
    restart: unless-stopped
    volumes:
      - ./frontend/dist:/app/dist
    networks:
      - meal-planner-network
    deploy:
      resources:
        limits:
          memory: 256M
          cpus: '0.5'

  # Node.js backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      args:
        - NODE_ENV=production
    image: meal-planner-backend:latest
    container_name: meal-planner-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://mealplanner:${DB_PASSWORD}@postgres:5432/mealplanner
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - CORS_ORIGIN=http://raspberrypi.local
    volumes:
      - ./data/images:/app/data/images
      - ./data/uploads:/app/data/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - meal-planner-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'

  # PostgreSQL database
  postgres:
    image: postgres:15-alpine
    container_name: meal-planner-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=mealplanner
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=mealplanner
      - PGDATA=/var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - meal-planner-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mealplanner"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.75'
    # Uncomment to use external USB SSD for better performance
    # volumes:
    #   - /mnt/usb-ssd/postgres:/var/lib/postgresql/data

  # Redis cache and session storage
  redis:
    image: redis:7-alpine
    container_name: meal-planner-redis
    restart: unless-stopped
    command: redis-server --maxmemory 100mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - meal-planner-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.25'

  # Optional: Portainer for podman management
  portainer:
    image: portainer/portainer-ce:latest
    container_name: meal-planner-portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /var/run/podman.sock:/var/run/podman.sock
      - portainer_data:/data
    networks:
      - meal-planner-network
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.25'

networks:
  meal-planner-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  portainer_data:
    driver: local
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
# Multi-stage build for React PWA

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build production bundle
RUN pnpm run build

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
# Optimized for ARM64 (Raspberry Pi)

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
```

### Nginx Configuration

```nginx
# nginx/nginx.conf
user nginx;
worker_processes 2;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 512;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
}
```

```nginx
# nginx/conf.d/default.conf
upstream backend {
    server backend:3001;
    keepalive 32;
}

# HTTP server
server {
    listen 80;
    server_name raspberrypi.local _;
    
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Static files with caching
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Recipe images
    location /images/ {
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
    }

    # Service worker - no cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # PWA manifest
    location = /manifest.json {
        add_header Cache-Control "no-cache";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTPS server (uncomment when SSL is configured)
# server {
#     listen 443 ssl http2;
#     server_name raspberrypi.local;
#
#     ssl_certificate /etc/nginx/ssl/cert.pem;
#     ssl_certificate_key /etc/nginx/ssl/key.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#
#     # Same configuration as HTTP server above
#     # ...
# }
```

### Environment Variables (.env.example)

```bash
# .env.example
# Copy to .env and fill in your values

# Database
DB_PASSWORD=your_secure_password_here

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# API Keys (optional)
SPOONACULAR_API_KEY=your_api_key_here
EDAMAM_APP_ID=your_app_id_here
EDAMAM_APP_KEY=your_app_key_here

# Store APIs (optional)
WALMART_API_KEY=your_walmart_key_here
KROGER_CLIENT_ID=your_kroger_client_id_here
KROGER_CLIENT_SECRET=your_kroger_client_secret_here

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here

# Application
NODE_ENV=production
LOG_LEVEL=info
```

### Deployment Scripts

```bash
#!/bin/bash
# deploy.sh - Initial deployment script

set -e

echo "🚀 Deploying Meal Planner to Raspberry Pi..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Copy .env.example to .env and configure it."
    exit 1
fi

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/images
mkdir -p data/uploads
mkdir -p data/backups
mkdir -p data/ssl

# Build images
echo "🔨 Building podman images..."
podman-compose build --no-cache

# Start services
echo "🐳 Starting services..."
podman-compose up -d

# Wait for database
echo "⏳ Waiting for database..."
sleep 10

# Run migrations
echo "🗄️  Running database migrations..."
podman-compose exec -T backend npx prisma migrate deploy

# Seed database (optional)
echo "🌱 Seeding database..."
podman-compose exec -T backend npm run seed

# Show status
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
podman-compose ps

echo ""
echo "🌐 Access the application at:"
echo "   http://raspberrypi.local"
echo "   http://$(hostname -I | awk '{print $1}')"
echo ""
echo "🔧 Portainer (podman management):"
echo "   http://raspberrypi.local:9000"
```

```bash
#!/bin/bash
# update.sh - Update deployment script

set -e

echo "🔄 Updating Meal Planner..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Rebuild images
echo "🔨 Rebuilding podman images..."
podman-compose build

# Stop services
echo "🛑 Stopping services..."
podman-compose down

# Start services
echo "🐳 Starting services..."
podman-compose up -d

# Run migrations
echo "🗄️  Running database migrations..."
sleep 10
podman-compose exec -T backend npx prisma migrate deploy

echo "✅ Update complete!"
podman-compose ps
```

```bash
#!/bin/bash
# backup.sh - Backup script (run daily via cron)

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./data/backups"

echo "💾 Starting backup at $DATE..."

# Backup database
echo "📦 Backing up database..."
podman-compose exec -T postgres pg_dump -U mealplanner mealplanner | \
    gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup images
echo "🖼️  Backing up images..."
tar -czf "$BACKUP_DIR/images_$DATE.tar.gz" ./data/images

# Backup uploads
echo "📤 Backing up uploads..."
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" ./data/uploads

# Clean old backups (keep last 30 days)
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "✅ Backup complete!"
ls -lh "$BACKUP_DIR" | tail -5
```

```bash
#!/bin/bash
# restore.sh - Restore from backup

set -e

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_date>"
    echo "Example: ./restore.sh 20260314_120000"
    exit 1
fi

DATE=$1
BACKUP_DIR="./data/backups"

echo "♻️  Restoring from backup: $DATE"

# Stop services
echo "🛑 Stopping services..."
podman-compose down

# Restore database
echo "🗄️  Restoring database..."
gunzip < "$BACKUP_DIR/db_$DATE.sql.gz" | \
    podman-compose exec -T postgres psql -U mealplanner mealplanner

# Restore images
echo "🖼️  Restoring images..."
tar -xzf "$BACKUP_DIR/images_$DATE.tar.gz"

# Restore uploads
echo "📤 Restoring uploads..."
tar -xzf "$BACKUP_DIR/uploads_$DATE.tar.gz"

# Start services
echo "🐳 Starting services..."
podman-compose up -d

echo "✅ Restore complete!"
```

### Cron Jobs

```bash
# Add to crontab: crontab -e

# Daily backup at 2 AM
0 2 * * * /home/pi/meal-planner/backup.sh >> /home/pi/meal-planner/logs/backup.log 2>&1

# Weekly cleanup of old logs
0 3 * * 0 find /home/pi/meal-planner/logs -name "*.log" -mtime +30 -delete

# Monthly podman cleanup
0 4 1 * * podman system prune -af --volumes >> /home/pi/meal-planner/logs/cleanup.log 2>&1
```

### Monitoring Script

```bash
#!/bin/bash
# monitor.sh - Check system health

echo "🏥 Meal Planner Health Check"
echo "=============================="
echo ""

# Container status
echo "📦 Container Status:"
podman-compose ps
echo ""

# Resource usage
echo "💻 Resource Usage:"
podman stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""

# Disk usage
echo "💾 Disk Usage:"
df -h | grep -E "Filesystem|/dev/root|/dev/sda"
echo ""

# Database size
echo "🗄️  Database Size:"
podman-compose exec -T postgres psql -U mealplanner -d mealplanner -c \
    "SELECT pg_size_pretty(pg_database_size('mealplanner'));"
echo ""

# Recent logs
echo "📋 Recent Errors (last 10):"
podman-compose logs --tail=10 | grep -i error || echo "No errors found"
echo ""

# Uptime
echo "⏱️  Uptime:"
uptime
```


## 18. Multi-Family Support & Individual User Accounts

### Architecture Overview

The application supports multiple families using the same Raspberry Pi instance, with each family having:
- Independent recipe collections and meal plans
- Separate grocery store preferences
- Individual family member accounts with personalized access
- Private data isolation between families

### Updated Database Schema for Multi-Family Support

#### Updated Users Table

```sql
users
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- full_name (VARCHAR)
- family_id (UUID, FK -> families)
- role (ENUM: admin, member, child) -- Role within family
- is_system_admin (BOOLEAN) -- Can manage the entire system
- avatar_url (VARCHAR)
- preferences (JSONB) -- Personal preferences
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

#### New Families Table

```sql
families
- id (UUID, PK)
- name (VARCHAR) -- e.g., "Smith Family"
- created_by (UUID, FK -> users)
- invite_code (VARCHAR, UNIQUE) -- For inviting new members
- settings (JSONB) -- Family-wide settings
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Updated FamilyMembers Table

```sql
family_members
- id (UUID, PK)
- family_id (UUID, FK -> families)
- user_id (UUID, FK -> users, nullable) -- Linked user account
- name (VARCHAR)
- age_group (ENUM: child, teen, adult)
- can_cook (BOOLEAN)
- cooking_skill_level (ENUM: beginner, intermediate, advanced)
- dietary_restrictions (JSONB)
- favorite_cuisines (VARCHAR[])
- avatar_url (VARCHAR)
- is_active (BOOLEAN) -- For members who move out
- created_at (TIMESTAMP)
```

#### Family Invitations

```sql
family_invitations
- id (UUID, PK)
- family_id (UUID, FK -> families)
- email (VARCHAR)
- invited_by (UUID, FK -> users)
- role (ENUM: admin, member, child)
- token (VARCHAR, UNIQUE)
- expires_at (TIMESTAMP)
- accepted_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
```

#### Updated Recipes Table

```sql
recipes
- id (UUID, PK)
- family_id (UUID, FK -> families) -- Recipe belongs to family
- created_by (UUID, FK -> users)
- title (VARCHAR)
- description (TEXT)
- source (VARCHAR: custom, imported, api)
- external_id (VARCHAR, nullable)
- prep_time (INTEGER, minutes)
- cook_time (INTEGER, minutes)
- servings (INTEGER)
- difficulty (ENUM: easy, medium, hard)
- kid_friendly (BOOLEAN)
- cuisine_type (VARCHAR)
- meal_type (ENUM: breakfast, lunch, dinner, snack, dessert)
- image_url (VARCHAR)
- instructions (JSONB)
- nutrition_info (JSONB)
- cost_estimate (DECIMAL)
- visibility (ENUM: private, family, public) -- Sharing level
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Updated MealPlans Table

```sql
meal_plans
- id (UUID, PK)
- family_id (UUID, FK -> families)
- created_by (UUID, FK -> users)
- week_start_date (DATE)
- status (ENUM: draft, active, completed)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Updated PlannedMeals Table

```sql
planned_meals
- id (UUID, PK)
- meal_plan_id (UUID, FK -> meal_plans)
- recipe_id (UUID, FK -> recipes)
- date (DATE)
- meal_type (ENUM: breakfast, lunch, dinner, snack)
- servings (INTEGER)
- assigned_cook_id (UUID, FK -> users, nullable) -- User who will cook
- signup_status (ENUM: open, claimed, confirmed, completed)
- signup_deadline (TIMESTAMP, nullable)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Meal Sign-ups

```sql
meal_signups
- id (UUID, PK)
- planned_meal_id (UUID, FK -> planned_meals)
- user_id (UUID, FK -> users)
- status (ENUM: interested, committed, completed, cancelled)
- notes (TEXT)
- signed_up_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### Updated UserStores Table

```sql
user_stores
- id (UUID, PK)
- family_id (UUID, FK -> families) -- Store preference per family
- store_id (UUID, FK -> stores)
- is_primary (BOOLEAN)
- api_credentials (JSONB, encrypted)
- delivery_address (JSONB)
- preferences (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### User Roles & Permissions

#### Role Definitions

**System Admin** (is_system_admin = true):
- Manage all families on the Raspberry Pi
- View system metrics and logs
- Backup and restore data
- Typically the person who set up the Pi

**Family Admin** (role = admin):
- Manage family settings and members
- Invite new family members
- Configure store preferences
- Delete family data
- Full access to all family features

**Family Member** (role = member):
- Create and edit recipes
- Create and manage meal plans
- Sign up for cooking assignments
- Rate recipes
- Manage personal preferences
- View all family data

**Child** (role = child):
- View recipes marked as kid-friendly
- Sign up for simple cooking tasks
- Rate recipes they've tried
- Limited editing capabilities
- Simplified interface

#### Permission Matrix

| Feature | System Admin | Family Admin | Member | Child |
|---------|-------------|--------------|---------|-------|
| Manage families | ✅ | ❌ | ❌ | ❌ |
| Invite family members | ✅ | ✅ | ❌ | ❌ |
| Remove family members | ✅ | ✅ | ❌ | ❌ |
| Configure stores | ✅ | ✅ | ✅ | ❌ |
| Create recipes | ✅ | ✅ | ✅ | ❌ |
| Edit any recipe | ✅ | ✅ | Own only | ❌ |
| Delete recipes | ✅ | ✅ | Own only | ❌ |
| Create meal plans | ✅ | ✅ | ✅ | ❌ |
| Edit meal plans | ✅ | ✅ | ✅ | ❌ |
| Sign up for meals | ✅ | ✅ | ✅ | ✅ |
| View grocery lists | ✅ | ✅ | ✅ | ✅ |
| Edit grocery lists | ✅ | ✅ | ✅ | ❌ |
| Rate recipes | ✅ | ✅ | ✅ | ✅ |
| Manage pantry | ✅ | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ❌ |

### Authentication & Authorization Flow

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant API
    participant AuthService
    participant DB
    
    User->>Client: Login with email/password
    Client->>API: POST /api/auth/login
    API->>AuthService: Validate credentials
    AuthService->>DB: Query user + family
    DB-->>AuthService: User data + family_id + role
    AuthService->>AuthService: Generate JWT with claims
    AuthService-->>API: JWT tokens
    API-->>Client: Access token + Refresh token
    
    Note over Client: Store tokens + family context
    
    Client->>API: Request with token
    API->>AuthService: Verify token
    AuthService->>AuthService: Extract family_id + role
    AuthService->>API: Authorized context
    API->>DB: Query with family_id filter
    DB-->>API: Family-scoped data
    API-->>Client: Response
```

#### JWT Token Structure

```javascript
{
  // Standard claims
  sub: "user-uuid",
  iat: 1234567890,
  exp: 1234567890,
  
  // Custom claims
  family_id: "family-uuid",
  role: "member",
  is_system_admin: false,
  email: "user@example.com",
  name: "John Smith"
}
```

### Family Management Features

#### Family Creation Flow

```javascript
// POST /api/families
async function createFamily(req, res) {
  const { name, settings } = req.body;
  const userId = req.user.id;
  
  // Create family
  const family = await prisma.family.create({
    data: {
      name,
      created_by: userId,
      invite_code: generateInviteCode(),
      settings: settings || {}
    }
  });
  
  // Update user's family_id and make them admin
  await prisma.user.update({
    where: { id: userId },
    data: {
      family_id: family.id,
      role: 'admin'
    }
  });
  
  // Create family member profile
  await prisma.familyMember.create({
    data: {
      family_id: family.id,
      user_id: userId,
      name: req.user.full_name,
      age_group: 'adult',
      can_cook: true
    }
  });
  
  return res.json({ family });
}
```

#### Family Invitation Flow

```javascript
// POST /api/families/:id/invite
async function inviteToFamily(req, res) {
  const { email, role } = req.body;
  const familyId = req.params.id;
  
  // Verify requester is admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can invite' });
  }
  
  // Create invitation
  const invitation = await prisma.familyInvitation.create({
    data: {
      family_id: familyId,
      email,
      invited_by: req.user.id,
      role,
      token: generateSecureToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
  
  // Send invitation email
  await sendInvitationEmail(email, invitation.token, req.user.family.name);
  
  return res.json({ invitation });
}

// POST /api/invitations/:token/accept
async function acceptInvitation(req, res) {
  const { token } = req.params;
  const userId = req.user.id;
  
  const invitation = await prisma.familyInvitation.findUnique({
    where: { token },
    include: { family: true }
  });
  
  if (!invitation || invitation.expires_at < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired invitation' });
  }
  
  // Update user's family
  await prisma.user.update({
    where: { id: userId },
    data: {
      family_id: invitation.family_id,
      role: invitation.role
    }
  });
  
  // Mark invitation as accepted
  await prisma.familyInvitation.update({
    where: { id: invitation.id },
    data: { accepted_at: new Date() }
  });
  
  return res.json({ family: invitation.family });
}
```

### Individual User Access & Personalization

#### User Dashboard

Each family member sees a personalized dashboard:

```javascript
// GET /api/users/dashboard
async function getUserDashboard(req, res) {
  const userId = req.user.id;
  const familyId = req.user.family_id;
  
  const dashboard = {
    // Meals assigned to this user
    myUpcomingMeals: await prisma.plannedMeal.findMany({
      where: {
        assigned_cook_id: userId,
        date: { gte: new Date() },
        signup_status: { in: ['claimed', 'confirmed'] }
      },
      include: { recipe: true },
      orderBy: { date: 'asc' },
      take: 5
    }),
    
    // Open meal slots they can sign up for
    availableMeals: await prisma.plannedMeal.findMany({
      where: {
        meal_plan: { family_id: familyId },
        signup_status: 'open',
        date: { gte: new Date() }
      },
      include: { recipe: true },
      orderBy: { date: 'asc' },
      take: 10
    }),
    
    // Recipes they've created
    myRecipes: await prisma.recipe.findMany({
      where: {
        created_by: userId,
        family_id: familyId
      },
      orderBy: { created_at: 'desc' },
      take: 5
    }),
    
    // Recent family activity
    recentActivity: await getRecentFamilyActivity(familyId),
    
    // Personal stats
    stats: {
      mealsCooked: await getMealsCooked(userId),
      recipesCreated: await getRecipesCreated(userId),
      favoriteRecipes: await getFavoriteRecipes(userId)
    }
  };
  
  return res.json(dashboard);
}
```

#### Personal Preferences

```javascript
// User-specific preferences stored in users.preferences JSONB
const userPreferences = {
  notifications: {
    mealReminders: true,
    newRecipes: false,
    groceryListReady: true,
    mealSignupDeadline: true
  },
  display: {
    theme: 'light', // light, dark, auto
    defaultView: 'calendar', // calendar, list, grid
    showNutrition: true,
    showCost: true
  },
  cooking: {
    preferredMealTypes: ['dinner', 'breakfast'],
    maxPrepTime: 45, // minutes
    skillLevel: 'intermediate',
    avoidIngredients: ['mushrooms', 'olives']
  },
  calendar: {
    defaultDays: 7, // Show 7 days by default
    startOfWeek: 'sunday', // sunday, monday
    highlightMyMeals: true
  }
};
```

## 19. Meal Calendar with Sign-up System

### Calendar View Design

#### Weekly Calendar Layout

```jsx
function MealCalendar({ weekStart, familyId }) {
  const [meals, setMeals] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  
  // Calendar grid: 7 days × 3 meal types (breakfast, lunch, dinner)
  // Emphasis on dinners, with breakfast/lunch optional
  
  return (
    <CalendarContainer>
      <CalendarHeader>
        <WeekNavigation>
          <Button onClick={previousWeek}>← Previous</Button>
          <h2>{formatWeekRange(weekStart)}</h2>
          <Button onClick={nextWeek}>Next →</Button>
        </WeekNavigation>
        
        <QuickActions>
          <Button onClick={autoFillWeek}>🎲 Auto-fill Week</Button>
          <Button onClick={generateGroceryList}>🛒 Generate List</Button>
        </QuickActions>
      </CalendarHeader>
      
      <CalendarGrid>
        {/* Priority: Dinners shown prominently */}
        <MealTypeSection type="dinner" priority="high">
          <SectionHeader>
            <h3>🍽️ Dinners</h3>
            <span className="required">Required</span>
          </SectionHeader>
          <DayColumns>
            {days.map(day => (
              <DayColumn key={day}>
                <DayHeader>{formatDay(day)}</DayHeader>
                <MealSlot
                  meal={getMeal(day, 'dinner')}
                  onSignUp={handleSignUp}
                  onEdit={handleEdit}
                />
              </DayColumn>
            ))}
          </DayColumns>
        </MealTypeSection>
        
        {/* Optional: Weekend breakfasts */}
        <MealTypeSection type="breakfast" priority="medium">
          <SectionHeader>
            <h3>🥞 Weekend Breakfasts</h3>
            <span className="optional">Optional</span>
          </SectionHeader>
          <DayColumns>
            {weekendDays.map(day => (
              <DayColumn key={day}>
                <DayHeader>{formatDay(day)}</DayHeader>
                <MealSlot
                  meal={getMeal(day, 'breakfast')}
                  onSignUp={handleSignUp}
                  onEdit={handleEdit}
                />
              </DayColumn>
            ))}
          </DayColumns>
        </MealTypeSection>
        
        {/* Optional: Lunches */}
        <MealTypeSection type="lunch" priority="low" collapsed>
          <SectionHeader>
            <h3>🥗 Lunches</h3>
            <span className="optional">Optional</span>
          </SectionHeader>
          {/* Collapsed by default, expandable */}
        </MealTypeSection>
      </CalendarGrid>
      
      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </CalendarContainer>
  );
}
```

#### Meal Slot Component

```jsx
function MealSlot({ meal, onSignUp, onEdit }) {
  const currentUser = useCurrentUser();
  const isAssignedToMe = meal?.assigned_cook_id === currentUser.id;
  const canSignUp = meal?.signup_status === 'open';
  const isMyFamily = meal?.meal_plan?.family_id === currentUser.family_id;
  
  if (!meal) {
    return (
      <EmptySlot onClick={() => onEdit(null)}>
        <AddIcon>+</AddIcon>
        <span>Add meal</span>
      </EmptySlot>
    );
  }
  
  return (
    <MealCard
      className={classNames({
        'assigned-to-me': isAssignedToMe,
        'open': canSignUp,
        'claimed': meal.signup_status === 'claimed',
        'completed': meal.signup_status === 'completed'
      })}
    >
      <RecipeImage src={meal.recipe.image_url} alt={meal.recipe.title} />
      
      <MealInfo>
        <RecipeTitle>{meal.recipe.title}</RecipeTitle>
        <MealMeta>
          <span>⏱️ {meal.recipe.prep_time + meal.recipe.cook_time} min</span>
          <span>👥 {meal.servings} servings</span>
          <span>💰 ${meal.recipe.cost_estimate}</span>
        </MealMeta>
      </MealInfo>
      
      <AssignmentSection>
        {meal.assigned_cook_id ? (
          <AssignedCook>
            <Avatar user={meal.assigned_cook} size="small" />
            <span>{meal.assigned_cook.full_name}</span>
            {isAssignedToMe && <Badge>You</Badge>}
          </AssignedCook>
        ) : (
          <OpenSlot>
            <span>👋 Open for sign-up</span>
            {meal.signup_deadline && (
              <Deadline>
                Deadline: {formatDeadline(meal.signup_deadline)}
              </Deadline>
            )}
          </OpenSlot>
        )}
      </AssignmentSection>
      
      <Actions>
        {canSignUp && !isAssignedToMe && (
          <Button
            variant="primary"
            onClick={() => onSignUp(meal.id)}
          >
            🙋 I'll cook this
          </Button>
        )}
        
        {isAssignedToMe && (
          <>
            <Button
              variant="success"
              onClick={() => markComplete(meal.id)}
            >
              ✅ Mark complete
            </Button>
            <Button
              variant="secondary"
              onClick={() => cancelSignup(meal.id)}
            >
              Cancel
            </Button>
          </>
        )}
        
        <IconButton onClick={() => onEdit(meal)}>
          <EditIcon />
        </IconButton>
      </Actions>
      
      {meal.notes && (
        <Notes>{meal.notes}</Notes>
      )}
    </MealCard>
  );
}
```

### Meal Sign-up System

#### Sign-up Flow

```javascript
// POST /api/planned-meals/:id/signup
async function signUpForMeal(req, res) {
  const mealId = req.params.id;
  const userId = req.user.id;
  const { notes } = req.body;
  
  const meal = await prisma.plannedMeal.findUnique({
    where: { id: mealId },
    include: {
      meal_plan: { include: { family: true } },
      recipe: true
    }
  });
  
  // Verify user is in the same family
  if (meal.meal_plan.family_id !== req.user.family_id) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  
  // Check if meal is available
  if (meal.signup_status !== 'open') {
    return res.status(400).json({ error: 'Meal is not available for sign-up' });
  }
  
  // Check if deadline has passed
  if (meal.signup_deadline && new Date() > meal.signup_deadline) {
    return res.status(400).json({ error: 'Sign-up deadline has passed' });
  }
  
  // Create sign-up record
  const signup = await prisma.mealSignup.create({
    data: {
      planned_meal_id: mealId,
      user_id: userId,
      status: 'committed',
      notes
    }
  });
  
  // Update meal assignment
  await prisma.plannedMeal.update({
    where: { id: mealId },
    data: {
      assigned_cook_id: userId,
      signup_status: 'claimed'
    }
  });
  
  // Send notification to family
  await notifyFamily(meal.meal_plan.family_id, {
    type: 'meal_claimed',
    message: `${req.user.full_name} will cook ${meal.recipe.title} on ${formatDate(meal.date)}`,
    meal_id: mealId
  });
  
  return res.json({ signup, meal });
}

// POST /api/planned-meals/:id/cancel-signup
async function cancelMealSignup(req, res) {
  const mealId = req.params.id;
  const userId = req.user.id;
  
  const meal = await prisma.plannedMeal.findUnique({
    where: { id: mealId }
  });
  
  // Verify user is assigned to this meal
  if (meal.assigned_cook_id !== userId) {
    return res.status(403).json({ error: 'Not assigned to this meal' });
  }
  
  // Update signup status
  await prisma.mealSignup.updateMany({
    where: {
      planned_meal_id: mealId,
      user_id: userId
    },
    data: {
      status: 'cancelled'
    }
  });
  
  // Clear assignment
  await prisma.plannedMeal.update({
    where: { id: mealId },
    data: {
      assigned_cook_id: null,
      signup_status: 'open'
    }
  });
  
  // Notify family
  await notifyFamily(meal.meal_plan.family_id, {
    type: 'meal_unclaimed',
    message: `${meal.recipe.title} on ${formatDate(meal.date)} is now available`,
    meal_id: mealId
  });
  
  return res.json({ success: true });
}

// POST /api/planned-meals/:id/complete
async function completeMeal(req, res) {
  const mealId = req.params.id;
  const userId = req.user.id;
  const { rating, notes } = req.body;
  
  const meal = await prisma.plannedMeal.findUnique({
    where: { id: mealId },
    include: { recipe: true }
  });
  
  // Verify user is assigned
  if (meal.assigned_cook_id !== userId) {
    return res.status(403).json({ error: 'Not assigned to this meal' });
  }
  
  // Update meal status
  await prisma.plannedMeal.update({
    where: { id: mealId },
    data: {
      signup_status: 'completed'
    }
  });
  
  // Update signup
  await prisma.mealSignup.updateMany({
    where: {
      planned_meal_id: mealId,
      user_id: userId
    },
    data: {
      status: 'completed'
    }
  });
  
  // Optionally add rating
  if (rating) {
    await prisma.recipeRating.create({
      data: {
        recipe_id: meal.recipe_id,
        user_id: userId,
        rating,
        notes,
        would_make_again: rating >= 4
      }
    });
  }
  
  return res.json({ success: true });
}
```

#### Meal Assignment Rules

```javascript
const mealAssignmentRules = {
  // Priority levels for different meal types
  priority: {
    dinner: 'high',      // Always required
    breakfast: 'medium', // Weekend only
    lunch: 'low'         // Optional
  },
  
  // Default sign-up deadlines
  deadlines: {
    dinner: 2,      // 2 days before
    breakfast: 1,   // 1 day before
    lunch: 1        // 1 day before
  },
  
  // Who can sign up for what
  eligibility: {
    dinner: ['admin', 'member', 'teen'], // Teens can cook dinner
    breakfast: ['admin', 'member', 'teen'],
    lunch: ['admin', 'member', 'teen', 'child'] // Kids can help with lunch
  },
  
  // Automatic assignment preferences
  autoAssign: {
    rotateEvenly: true,        // Distribute meals evenly
    respectSkillLevel: true,   // Match difficulty to skill
    considerPreferences: true, // Use cooking preferences
    avoidConsecutive: true     // Don't assign same person 2 days in a row
  }
};
```

#### Notification System

```javascript
// Notify family members about meal events
async function notifyFamily(familyId, notification) {
  const members = await prisma.user.findMany({
    where: {
      family_id: familyId,
      preferences: {
        path: ['notifications', notification.type],
        equals: true
      }
    }
  });
  
  for (const member of members) {
    // In-app notification
    await prisma.notification.create({
      data: {
        user_id: member.id,
        type: notification.type,
        message: notification.message,
        data: notification,
        read: false
      }
    });
    
    // Optional: Email notification
    if (member.preferences?.notifications?.email) {
      await sendEmail(member.email, notification);
    }
    
    // Optional: Push notification (PWA)
    if (member.push_subscription) {
      await sendPushNotification(member.push_subscription, notification);
    }
  }
}
```

### API Endpoints for Multi-Family & Calendar

```javascript
// Family Management
app.post('/api/families', createFamily);
app.get('/api/families/:id', getFamily);
app.put('/api/families/:id', updateFamily);
app.delete('/api/families/:id', deleteFamily);
app.post('/api/families/:id/invite', inviteToFamily);
app.get('/api/families/:id/members', getFamilyMembers);
app.delete('/api/families/:id/members/:userId', removeFamilyMember);

// Invitations
app.get('/api/invitations/:token', getInvitation);
app.post('/api/invitations/:token/accept', acceptInvitation);
app.delete('/api/invitations/:id', cancelInvitation);

// User Dashboard
app.get('/api/users/dashboard', getUserDashboard);
app.get('/api/users/preferences', getUserPreferences);
app.put('/api/users/preferences', updateUserPreferences);
app.get('/api/users/stats', getUserStats);

// Meal Calendar
app.get('/api/meal-plans/:id/calendar', getMealCalendar);
app.get('/api/planned-meals/available', getAvailableMeals);
app.post('/api/planned-meals/:id/signup', signUpForMeal);
app.post('/api/planned-meals/:id/cancel-signup', cancelMealSignup);
app.post('/api/planned-meals/:id/complete', completeMeal);
app.get('/api/planned-meals/my-meals', getMyMeals);

// Notifications
app.get('/api/notifications', getNotifications);
app.put('/api/notifications/:id/read', markNotificationRead);
app.delete('/api/notifications/:id', deleteNotification);
```

### Updated Implementation Roadmap

#### Phase 1 (MVP) - Updated

**Week 1-2**: Project Setup & Core Infrastructure
- Initialize React + TypeScript project
- Set up Express backend
- Configure PostgreSQL with **multi-family schema**
- Set up authentication with **family context**

**Week 3-4**: Core Recipe Management
- Recipe CRUD with **family isolation**
- Recipe browser with **visibility controls**
- Recipe detail page
- Recipe search and filtering

**Week 5-6**: Meal Planning & Calendar
- **Meal calendar with sign-up system**
- Weekly meal planner UI with **priority on dinners**
- **Individual user dashboards**
- Meal assignment to family members
- **Sign-up notifications**

**Week 7-8**: Grocery List
- Generate grocery list from meal plan
- **Family-specific store preferences**
- Department-organized list
- Basic price estimation

**Week 9-10**: Multi-Family Support & Polish
- **Family creation and invitation system**
- **Individual user accounts and permissions**
- **Personal preferences and settings**
- Responsive design
- User testing and bug fixes


## 20. Sales-Driven Recipe Recommendations

### Grocery Store Sales Integration

#### Database Schema for Sales Tracking

```sql
-- Store sales/promotions
store_sales
- id (UUID, PK)
- store_id (UUID, FK -> stores)
- ingredient_id (UUID, FK -> ingredients)
- product_name (VARCHAR)
- regular_price (DECIMAL)
- sale_price (DECIMAL)
- discount_percentage (DECIMAL)
- sale_start_date (DATE)
- sale_end_date (DATE)
- quantity_limit (INTEGER, nullable)
- is_active (BOOLEAN)
- source (VARCHAR) -- api, manual, scraped
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

-- Sales scraping history
sales_scrape_log
- id (UUID, PK)
- store_id (UUID, FK -> stores)
- scrape_date (TIMESTAMP)
- items_found (INTEGER)
- status (ENUM: success, partial, failed)
- error_message (TEXT, nullable)
```

#### Sales Data Collection Methods

**Method 1: Store APIs** (Preferred)
```javascript
class StoreSalesAPI {
  async fetchSales(storeId) {
    const store = await getStore(storeId);
    
    switch (store.type) {
      case 'walmart':
        return await this.fetchWalmartSales(store);
      case 'kroger':
        return await this.fetchKrogerSales(store);
      default:
        return [];
    }
  }
  
  async fetchWalmartSales(store) {
    // Use Walmart API to get current promotions
    const response = await fetch(
      `https://api.walmart.com/v1/promotions`,
      {
        headers: {
          'WM_SEC.ACCESS_TOKEN': store.api_key
        }
      }
    );
    
    const promotions = await response.json();
    return this.mapToSalesFormat(promotions);
  }
}
```

**Method 2: Web Scraping** (Fallback)
```javascript
class StoreSalesScraper {
  async scrapeSales(storeId) {
    const store = await getStore(storeId);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    try {
      // Navigate to store's weekly ad page
      await page.goto(store.weekly_ad_url);
      
      // Extract sale items using store-specific selectors
      const sales = await page.evaluate((selectors) => {
        const items = [];
        document.querySelectorAll(selectors.itemCard).forEach(card => {
          items.push({
            name: card.querySelector(selectors.name)?.textContent,
            regular_price: card.querySelector(selectors.regularPrice)?.textContent,
            sale_price: card.querySelector(selectors.salePrice)?.textContent,
            image: card.querySelector(selectors.image)?.src
          });
        });
        return items;
      }, store.scraping_selectors);
      
      // Match to ingredients in database
      const matched = await this.matchToIngredients(sales);
      
      // Save to database
      await this.saveSales(storeId, matched);
      
      return matched;
    } finally {
      await browser.close();
    }
  }
  
  async matchToIngredients(sales) {
    const matched = [];
    
    for (const sale of sales) {
      // Use fuzzy matching to find ingredient
      const ingredient = await this.findIngredient(sale.name);
      
      if (ingredient) {
        matched.push({
          ingredient_id: ingredient.id,
          product_name: sale.name,
          regular_price: this.parsePrice(sale.regular_price),
          sale_price: this.parsePrice(sale.sale_price),
          discount_percentage: this.calculateDiscount(
            sale.regular_price,
            sale.sale_price
          )
        });
      }
    }
    
    return matched;
  }
}
```

**Method 3: Manual Entry**
```javascript
// Allow users to manually add sales they see
// POST /api/stores/:id/sales
async function addManualSale(req, res) {
  const { ingredient_id, regular_price, sale_price, end_date } = req.body;
  const storeId = req.params.id;
  
  const sale = await prisma.storeSale.create({
    data: {
      store_id: storeId,
      ingredient_id,
      regular_price,
      sale_price,
      discount_percentage: ((regular_price - sale_price) / regular_price) * 100,
      sale_start_date: new Date(),
      sale_end_date: end_date,
      is_active: true,
      source: 'manual'
    }
  });
  
  return res.json({ sale });
}
```

#### Automated Sales Monitoring

```javascript
// Cron job to check for sales daily
// Run at 6 AM daily
cron.schedule('0 6 * * *', async () => {
  console.log('Starting daily sales check...');
  
  const stores = await prisma.store.findMany({
    where: { api_enabled: true }
  });
  
  for (const store of stores) {
    try {
      const salesAPI = new StoreSalesAPI();
      const sales = await salesAPI.fetchSales(store.id);
      
      // Deactivate old sales
      await prisma.storeSale.updateMany({
        where: {
          store_id: store.id,
          sale_end_date: { lt: new Date() }
        },
        data: { is_active: false }
      });
      
      // Add new sales
      for (const sale of sales) {
        await prisma.storeSale.upsert({
          where: {
            store_id_ingredient_id: {
              store_id: store.id,
              ingredient_id: sale.ingredient_id
            }
          },
          update: {
            sale_price: sale.sale_price,
            discount_percentage: sale.discount_percentage,
            sale_end_date: sale.sale_end_date,
            is_active: true
          },
          create: sale
        });
      }
      
      console.log(`Updated ${sales.length} sales for ${store.name}`);
    } catch (error) {
      console.error(`Error fetching sales for ${store.name}:`, error);
    }
  }
  
  // Notify families about relevant sales
  await notifyFamiliesAboutSales();
});
```

### Sales-Based Recipe Recommendations

#### Enhanced Recommendation Algorithm

```javascript
async function getRecommendationsWithSales(familyId, weekStartDate) {
  const family = await getFamily(familyId);
  const userStores = await getUserStores(familyId);
  const favoriteRecipes = await getFavoriteRecipes(familyId);
  const currentSales = await getCurrentSales(userStores.map(s => s.store_id));
  
  // Get candidate recipes
  const candidates = await getCandidateRecipes(familyId);
  
  // Score each recipe
  const scored = candidates.map(recipe => {
    const baseScore = calculateBaseScore(recipe, family);
    const salesScore = calculateSalesScore(recipe, currentSales);
    const bulkScore = calculateBulkPurchaseScore(recipe, candidates);
    
    return {
      recipe,
      score: baseScore * 0.6 + salesScore * 0.25 + bulkScore * 0.15,
      breakdown: {
        base: baseScore,
        sales: salesScore,
        bulk: bulkScore
      }
    };
  });
  
  // Sort by score and return top recommendations
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);
}

function calculateSalesScore(recipe, currentSales) {
  let score = 0;
  let totalIngredients = recipe.ingredients.length;
  let ingredientsOnSale = 0;
  let totalSavings = 0;
  
  for (const ingredient of recipe.ingredients) {
    const sale = currentSales.find(s => s.ingredient_id === ingredient.id);
    
    if (sale && sale.is_active) {
      ingredientsOnSale++;
      
      // Calculate savings for this ingredient
      const quantity = ingredient.quantity;
      const savings = (sale.regular_price - sale.sale_price) * quantity;
      totalSavings += savings;
      
      // Higher discount = higher score
      score += sale.discount_percentage;
    }
  }
  
  // Normalize score
  const percentageOnSale = ingredientsOnSale / totalIngredients;
  const averageDiscount = ingredientsOnSale > 0 ? score / ingredientsOnSale : 0;
  
  // Combine factors
  return (percentageOnSale * 50) + (averageDiscount * 0.5) + (totalSavings * 2);
}
```

#### Sales-Based Notifications

```javascript
async function notifyFamiliesAboutSales() {
  const families = await prisma.family.findMany({
    include: {
      user_stores: {
        include: { store: true }
      }
    }
  });
  
  for (const family of families) {
    // Get family's favorite recipes
    const favorites = await getFavoriteRecipes(family.id);
    
    // Get current sales at their stores
    const storeIds = family.user_stores.map(us => us.store_id);
    const sales = await getCurrentSales(storeIds);
    
    // Find recipes that use ingredients on sale
    const recipesOnSale = [];
    
    for (const recipe of favorites) {
      const ingredientsOnSale = recipe.ingredients.filter(ing =>
        sales.some(sale => 
          sale.ingredient_id === ing.id && 
          sale.discount_percentage >= 20 // At least 20% off
        )
      );
      
      if (ingredientsOnSale.length >= 2) { // At least 2 ingredients on sale
        const savings = calculatePotentialSavings(recipe, sales);
        recipesOnSale.push({
          recipe,
          ingredientsOnSale,
          savings
        });
      }
    }
    
    // Send notification if there are good deals
    if (recipesOnSale.length > 0) {
      await notifyFamily(family.id, {
        type: 'sales_alert',
        title: '💰 Great Deals on Your Favorite Recipes!',
        message: `${recipesOnSale.length} of your favorite recipes have ingredients on sale this week`,
        data: {
          recipes: recipesOnSale.slice(0, 5), // Top 5
          total_savings: recipesOnSale.reduce((sum, r) => sum + r.savings, 0)
        }
      });
    }
  }
}
```

## 21. Bulk Purchasing & Ingredient Overlap Optimization

### Ingredient Overlap Analysis

#### Database Schema Updates

```sql
-- Track ingredient usage patterns
ingredient_usage_stats
- id (UUID, PK)
- family_id (UUID, FK -> families)
- ingredient_id (UUID, FK -> ingredients)
- times_used (INTEGER)
- last_used (DATE)
- average_quantity (DECIMAL)
- typical_unit (VARCHAR)
- is_staple (BOOLEAN) -- Used frequently
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

-- Ingredient pairing recommendations
ingredient_pairings
- id (UUID, PK)
- ingredient_a_id (UUID, FK -> ingredients)
- ingredient_b_id (UUID, FK -> ingredients)
- co_occurrence_count (INTEGER)
- confidence_score (DECIMAL) -- How often they appear together
- created_at (TIMESTAMP)
```

#### Bulk Purchase Optimization Algorithm

```javascript
class BulkPurchaseOptimizer {
  async optimizeMealPlan(familyId, candidateRecipes, weekStartDate) {
    // Analyze ingredient requirements across all recipes
    const ingredientMap = this.buildIngredientMap(candidateRecipes);
    
    // Identify expensive/uncommon ingredients
    const expensiveIngredients = await this.findExpensiveIngredients(ingredientMap);
    
    // For each expensive ingredient, find recipes that use it
    const optimizedPlan = [];
    const usedRecipes = new Set();
    
    for (const [ingredientId, data] of expensiveIngredients) {
      // Find recipes using this ingredient
      const recipesWithIngredient = candidateRecipes.filter(r =>
        r.ingredients.some(ing => ing.id === ingredientId) &&
        !usedRecipes.has(r.id)
      );
      
      if (recipesWithIngredient.length >= 2) {
        // Add multiple recipes to maximize ingredient usage
        const selected = this.selectComplementaryRecipes(
          recipesWithIngredient,
          data.quantity,
          data.unit
        );
        
        selected.forEach(recipe => {
          optimizedPlan.push({
            recipe,
            reason: `Uses ${data.name} (${data.cost_per_unit}/unit)`,
            bulk_benefit: true
          });
          usedRecipes.add(recipe.id);
        });
      }
    }
    
    return optimizedPlan;
  }
  
  buildIngredientMap(recipes) {
    const map = new Map();
    
    recipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        if (!map.has(ing.id)) {
          map.set(ing.id, {
            id: ing.id,
            name: ing.name,
            recipes: [],
            total_quantity: 0,
            unit: ing.unit,
            cost_per_unit: ing.average_price
          });
        }
        
        const data = map.get(ing.id);
        data.recipes.push(recipe.id);
        data.total_quantity += ing.quantity;
      });
    });
    
    return map;
  }
  
  async findExpensiveIngredients(ingredientMap) {
    const expensive = new Map();
    
    for (const [id, data] of ingredientMap) {
      // Consider expensive if:
      // 1. Cost per unit > $5
      // 2. Used in multiple recipes
      // 3. Not a staple ingredient
      
      if (data.cost_per_unit > 5 && 
          data.recipes.length >= 2 &&
          !await this.isStaple(id)) {
        expensive.set(id, data);
      }
    }
    
    return expensive;
  }
  
  selectComplementaryRecipes(recipes, totalQuantity, unit) {
    // Select recipes that together use up the bulk quantity
    // This minimizes waste
    
    const selected = [];
    let usedQuantity = 0;
    
    // Sort by quantity needed (descending)
    const sorted = recipes.sort((a, b) => {
      const qtyA = a.ingredients.find(i => i.unit === unit)?.quantity || 0;
      const qtyB = b.ingredients.find(i => i.unit === unit)?.quantity || 0;
      return qtyB - qtyA;
    });
    
    for (const recipe of sorted) {
      const needed = recipe.ingredients.find(i => i.unit === unit)?.quantity || 0;
      
      if (usedQuantity + needed <= totalQuantity * 1.2) { // Allow 20% overage
        selected.push(recipe);
        usedQuantity += needed;
      }
      
      if (selected.length >= 3) break; // Max 3 recipes per ingredient
    }
    
    return selected;
  }
}
```

#### Ingredient Pairing Recommendations

```javascript
async function findComplementaryRecipes(recipeId, familyId) {
  const recipe = await getRecipe(recipeId);
  const expensiveIngredients = recipe.ingredients.filter(
    ing => ing.average_price > 5
  );
  
  if (expensiveIngredients.length === 0) {
    return [];
  }
  
  // Find other recipes that use these expensive ingredients
  const complementary = [];
  
  for (const ingredient of expensiveIngredients) {
    const otherRecipes = await prisma.recipe.findMany({
      where: {
        family_id: familyId,
        id: { not: recipeId },
        ingredients: {
          some: {
            ingredient_id: ingredient.id
          }
        }
      },
      include: {
        ingredients: true,
        ratings: true
      }
    });
    
    complementary.push({
      ingredient: ingredient.name,
      cost: ingredient.average_price,
      recipes: otherRecipes.map(r => ({
        id: r.id,
        title: r.title,
        rating: calculateAverageRating(r.ratings),
        quantity_needed: r.ingredients.find(
          i => i.ingredient_id === ingredient.id
        )?.quantity
      }))
    });
  }
  
  return complementary;
}
```

### Enhanced Recommendation Algorithm with Bulk Buying

```javascript
async function getEnhancedRecommendations(familyId, weekStartDate) {
  const family = await getFamily(familyId);
  const userStores = await getUserStores(familyId);
  const favoriteRecipes = await getFavoriteRecipes(familyId);
  const currentSales = await getCurrentSales(userStores.map(s => s.store_id));
  
  // Get candidate recipes
  const candidates = await getCandidateRecipes(familyId);
  
  // Initialize optimizer
  const optimizer = new BulkPurchaseOptimizer();
  
  // Score each recipe with all factors
  const scored = candidates.map(recipe => {
    const baseScore = calculateBaseScore(recipe, family);
    const salesScore = calculateSalesScore(recipe, currentSales);
    const bulkScore = calculateBulkPurchaseScore(recipe, candidates);
    const overlapScore = calculateIngredientOverlapScore(recipe, candidates);
    
    return {
      recipe,
      score: 
        baseScore * 0.45 +           // Base factors (seasonal, nutrition, etc.)
        salesScore * 0.25 +          // Current sales
        bulkScore * 0.15 +           // Bulk purchase potential
        overlapScore * 0.15,         // Ingredient overlap with other meals
      breakdown: {
        base: baseScore,
        sales: salesScore,
        bulk: bulkScore,
        overlap: overlapScore
      },
      insights: {
        onSaleIngredients: getOnSaleIngredients(recipe, currentSales),
        sharedIngredients: getSharedIngredients(recipe, candidates),
        bulkOpportunities: getBulkOpportunities(recipe, candidates)
      }
    };
  });
  
  // Sort by score
  const sorted = scored.sort((a, b) => b.score - a.score);
  
  // Apply bulk optimization
  const optimized = await optimizer.optimizeMealPlan(
    familyId,
    sorted.slice(0, 30).map(s => s.recipe),
    weekStartDate
  );
  
  return {
    recommendations: sorted.slice(0, 20),
    bulkOptimized: optimized,
    summary: {
      totalSavings: calculateTotalSavings(sorted, currentSales),
      bulkBenefits: calculateBulkBenefits(optimized)
    }
  };
}

function calculateIngredientOverlapScore(recipe, otherRecipes) {
  let score = 0;
  const recipeIngredients = new Set(recipe.ingredients.map(i => i.id));
  
  // Check overlap with other recipes
  otherRecipes.forEach(other => {
    if (other.id === recipe.id) return;
    
    const otherIngredients = new Set(other.ingredients.map(i => i.id));
    const overlap = [...recipeIngredients].filter(id => otherIngredients.has(id));
    
    // More overlap = higher score
    score += overlap.length * 5;
    
    // Bonus for expensive ingredient overlap
    overlap.forEach(ingredientId => {
      const ingredient = recipe.ingredients.find(i => i.id === ingredientId);
      if (ingredient && ingredient.average_price > 5) {
        score += 10; // Bonus for expensive ingredient reuse
      }
    });
  });
  
  return Math.min(score, 100); // Cap at 100
}

function calculateBulkPurchaseScore(recipe, otherRecipes) {
  let score = 0;
  
  // Identify ingredients that could benefit from bulk purchase
  recipe.ingredients.forEach(ingredient => {
    // Check if this ingredient is used in other recipes
    const usageCount = otherRecipes.filter(other =>
      other.id !== recipe.id &&
      other.ingredients.some(i => i.id === ingredient.id)
    ).length;
    
    if (usageCount >= 2) {
      // Ingredient used in multiple recipes
      score += 15;
      
      // Extra points for expensive ingredients
      if (ingredient.average_price > 5) {
        score += 20;
      }
      
      // Extra points if bulk sizes are available
      if (ingredient.bulk_available) {
        score += 10;
      }
    }
  });
  
  return Math.min(score, 100);
}
```

### Bulk Purchase Recommendations UI

```jsx
function BulkPurchaseInsights({ mealPlan }) {
  const [insights, setInsights] = useState(null);
  
  useEffect(() => {
    fetchBulkInsights(mealPlan.id).then(setInsights);
  }, [mealPlan.id]);
  
  if (!insights) return null;
  
  return (
    <InsightsPanel>
      <h3>💡 Bulk Purchase Opportunities</h3>
      
      {insights.opportunities.map(opp => (
        <OpportunityCard key={opp.ingredient.id}>
          <IngredientHeader>
            <h4>{opp.ingredient.name}</h4>
            <PriceTag>
              ${opp.ingredient.price_per_unit}/{opp.ingredient.unit}
            </PriceTag>
          </IngredientHeader>
          
          <UsageInfo>
            <p>Used in {opp.recipes.length} meals this week:</p>
            <RecipeList>
              {opp.recipes.map(recipe => (
                <RecipeItem key={recipe.id}>
                  <span>{recipe.title}</span>
                  <Quantity>
                    {recipe.quantity} {opp.ingredient.unit}
                  </Quantity>
                </RecipeItem>
              ))}
            </RecipeList>
          </UsageInfo>
          
          <BulkRecommendation>
            <h5>💰 Bulk Purchase Recommendation</h5>
            <p>
              Buy {opp.bulk_size} {opp.ingredient.unit} for ${opp.bulk_price}
              <br />
              <strong>Save ${opp.savings}</strong> vs. buying separately
            </p>
            
            {opp.additional_recipes.length > 0 && (
              <Suggestion>
                <p>💡 Consider adding these recipes to use it all:</p>
                <ul>
                  {opp.additional_recipes.map(r => (
                    <li key={r.id}>
                      {r.title} (uses {r.quantity} {opp.ingredient.unit})
                    </li>
                  ))}
                </ul>
              </Suggestion>
            )}
          </BulkRecommendation>
        </OpportunityCard>
      ))}
      
      <SummaryCard>
        <h4>📊 Weekly Summary</h4>
        <Stat>
          <label>Total Potential Savings:</label>
          <value>${insights.total_savings}</value>
        </Stat>
        <Stat>
          <label>Ingredient Overlap:</label>
          <value>{insights.overlap_percentage}%</value>
        </Stat>
        <Stat>
          <label>Bulk Opportunities:</label>
          <value>{insights.opportunities.length}</value>
        </Stat>
      </SummaryCard>
    </InsightsPanel>
  );
}
```

### API Endpoints for Sales & Bulk Optimization

```javascript
// Sales endpoints
app.get('/api/stores/:id/sales', getCurrentStoreSales);
app.post('/api/stores/:id/sales', addManualSale);
app.get('/api/sales/active', getActiveSales);
app.post('/api/sales/scrape', triggerSalesScrape);

// Bulk optimization endpoints
app.get('/api/recipes/:id/complementary', findComplementaryRecipes);
app.get('/api/meal-plans/:id/bulk-insights', getBulkPurchaseInsights);
app.post('/api/meal-plans/:id/optimize-bulk', optimizeForBulkPurchase);

// Enhanced recommendations
app.get('/api/recommendations/enhanced', getEnhancedRecommendations);
app.get('/api/recommendations/sales-based', getSalesBasedRecommendations);
```

### Updated Recommendation Weights

```javascript
const RECOMMENDATION_WEIGHTS = {
  // Base factors
  seasonal: 0.09,           // 9% - Seasonal ingredients
  budget: 0.09,             // 9% - Within budget
  variety: 0.07,            // 7% - Protein/cuisine variety
  nutrition: 0.07,          // 7% - Nutritional balance
  preferences: 0.07,        // 7% - Family preferences
  pantry: 0.05,             // 5% - Use pantry items
  time: 0.01,               // 1% - Time appropriateness
  
  // New factors
  sales: 0.25,              // 25% - Ingredients on sale
  bulk: 0.15,               // 15% - Bulk purchase potential
  overlap: 0.15,            // 15% - Ingredient overlap
  
  // Total: 100%
};
```
