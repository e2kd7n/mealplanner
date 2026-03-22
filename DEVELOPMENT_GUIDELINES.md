# Development Guidelines

## Test User Setup

### Important: Production Data Protection

**NEVER add test data to the production "Erik" user or associated family.**

All development and testing must be done using the dedicated test accounts.

---

## Test Accounts

### Test User (Regular User)
- **Email:** `test@example.com`
- **Password:** `TestPass123!`
- **Family Name:** Test Family
- **Role:** user
- **User ID:** `test-user-00-0000-0000-000000000001`

**Includes:**
- 2 family members (Test Child, Test Teen)
- User preferences (vegetarian, Italian/Mexican cuisine)
- Sample recipe (Spaghetti Bolognese)
- Sample meal plan
- Sample grocery list
- Pantry inventory items

### Test Admin (Admin User)
- **Email:** `testadmin@example.com`
- **Password:** `AdminPass123!`
- **Family Name:** Test Admin Family
- **Role:** admin
- **User ID:** `test-admin-0-0000-0000-000000000002`

---

## Database Setup

### Initial Setup

The test data is automatically loaded when the database is initialized:

```bash
# Using Podman
podman-compose up -d postgres

# Or manually run the SQL script
psql -U mealplanner -d mealplanner -f database/init/02-test-data.sql
```

### Test Data Includes

1. **Users:**
   - Test user (regular)
   - Test admin (admin role)

2. **Ingredients (15 common items):**
   - Produce: Tomato, Onion, Garlic
   - Protein: Chicken Breast, Ground Beef, Eggs
   - Grains: Pasta, Rice, Flour
   - Dairy: Milk, Cheese, Butter
   - Pantry: Olive Oil, Salt, Black Pepper

3. **Sample Recipe:**
   - Spaghetti Bolognese
   - 5 ingredients
   - 5 instruction steps
   - Public recipe

4. **Sample Data:**
   - Meal plan (7 days)
   - Grocery list (3 items)
   - Pantry inventory (3 items)
   - Recipe rating

---

## Development Workflow

### 1. Always Use Test Accounts

```typescript
// ❌ WRONG - Don't use production user
const erikUserId = 'c70eaeea-20eb-40ac-8ee8-1a7fd947dc57';

// ✅ CORRECT - Use test user
const testUserId = 'test-user-00-0000-0000-000000000001';
```

### 2. Login for Testing

Use the test credentials in the login form:
- Email: `test@example.com`
- Password: `TestPass123!`

### 3. Creating Test Data

When creating test data programmatically:

```typescript
// Always check if you're using test user
if (userId.startsWith('test-')) {
  // Safe to create test data
  await createTestData(userId);
} else {
  throw new Error('Cannot create test data for production users');
}
```

### 4. Resetting Test Data

To reset test data to initial state:

```bash
# Drop and recreate test user data
psql -U mealplanner -d mealplanner -c "
  DELETE FROM recipe_ratings WHERE user_id LIKE 'test-%';
  DELETE FROM pantry_inventory WHERE user_id LIKE 'test-%';
  DELETE FROM grocery_list_items WHERE grocery_list_id IN (SELECT id FROM grocery_lists WHERE user_id LIKE 'test-%');
  DELETE FROM grocery_lists WHERE user_id LIKE 'test-%';
  DELETE FROM planned_meals WHERE meal_plan_id IN (SELECT id FROM meal_plans WHERE user_id LIKE 'test-%');
  DELETE FROM meal_plans WHERE user_id LIKE 'test-%';
  DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE user_id LIKE 'test-%');
  DELETE FROM recipes WHERE user_id LIKE 'test-%';
  DELETE FROM family_members WHERE user_id LIKE 'test-%';
  DELETE FROM user_preferences WHERE user_id LIKE 'test-%';
  DELETE FROM users WHERE id LIKE 'test-%';
"

# Then re-run the test data script
psql -U mealplanner -d mealplanner -f database/init/02-test-data.sql
```

---

## Code Review Checklist

Before committing code, verify:

- [ ] No hardcoded production user IDs
- [ ] No test data creation for production users
- [ ] All test code uses test user accounts
- [ ] No modifications to Erik's user data
- [ ] Test data is properly isolated
- [ ] Database queries filter by user ID correctly

---

## API Testing

### Using Test User Token

```bash
# Login as test user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Use the returned token for authenticated requests
curl -X GET http://localhost:3000/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Admin Testing

```bash
# Login as test admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testadmin@example.com","password":"AdminPass123!"}'

# Access admin endpoints
curl -X GET http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

---

## Production User Protection

### Database Constraints

The production user "Erik" has the following protections:

1. **User ID:** `c70eaeea-20eb-40ac-8ee8-1a7fd947dc57`
2. **Email:** (production email)
3. **Family Name:** Erik

### Code Guards

Implement guards in your code:

```typescript
// Example guard function
function isProductionUser(userId: string): boolean {
  return userId === 'c70eaeea-20eb-40ac-8ee8-1a7fd947dc57';
}

function isTestUser(userId: string): boolean {
  return userId.startsWith('test-');
}

// Use in your code
if (isProductionUser(userId)) {
  throw new Error('Cannot modify production user data in development');
}

if (!isTestUser(userId)) {
  console.warn('Warning: Operating on non-test user');
}
```

---

## Environment-Specific Behavior

### Development Environment

```typescript
if (process.env.NODE_ENV === 'development') {
  // Only allow test users in development
  if (!isTestUser(userId)) {
    throw new Error('Development mode: Use test users only');
  }
}
```

### Production Environment

```typescript
if (process.env.NODE_ENV === 'production') {
  // Prevent test users in production
  if (isTestUser(userId)) {
    throw new Error('Test users not allowed in production');
  }
}
```

---

## Testing Best Practices

### 1. Isolation

Each test should:
- Use test user accounts
- Clean up after itself
- Not affect other tests
- Not modify production data

### 2. Idempotency

Test data scripts should be idempotent:
- Use `ON CONFLICT DO NOTHING`
- Check for existing data
- Safe to run multiple times

### 3. Documentation

Document any test data you create:
- Purpose of the data
- How to clean it up
- Dependencies

---

## Troubleshooting

### Test User Not Found

```bash
# Verify test user exists
psql -U mealplanner -d mealplanner -c "SELECT id, email, family_name FROM users WHERE email = 'test@example.com';"

# If not found, run test data script
psql -U mealplanner -d mealplanner -f database/init/02-test-data.sql
```

### Cannot Login with Test User

1. Check password hash is correct
2. Verify user is not blocked
3. Check database connection
4. Review backend logs

### Test Data Conflicts

```bash
# Clear all test data
psql -U mealplanner -d mealplanner -c "DELETE FROM users WHERE id LIKE 'test-%';"

# Recreate test data
psql -U mealplanner -d mealplanner -f database/init/02-test-data.sql
```

---

## Summary

**Golden Rules:**
1. ✅ Always use test@example.com for development
2. ✅ Never modify Erik's production data
3. ✅ Test data IDs start with 'test-'
4. ✅ Use guards to prevent production data modification
5. ✅ Document any new test data you create

**Quick Reference:**
- Test User: `test@example.com` / `TestPass123!`
- Test Admin: `testadmin@example.com` / `AdminPass123!`
- Test Data Script: `database/init/02-test-data.sql`
- Reset Command: See "Resetting Test Data" section above