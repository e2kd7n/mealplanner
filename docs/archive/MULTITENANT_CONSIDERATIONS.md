# Multi-Tenant Deployment Considerations

## Overview

This application is currently configured for **single-family deployment**, where all users within the deployment share access to all recipes and resources. This document outlines the features and changes that would need to be re-enabled or implemented for a multi-tenant deployment where multiple families use the same instance with data isolation.

## Current Single-Family Configuration

### Recipe Sharing
- **Current Behavior**: All recipes are visible to all users in the system
- **Implementation**: Recipe filtering by `userId` has been removed from the `getRecipes` endpoint
- **Location**: `backend/src/controllers/recipe.controller.ts`

### Access Control
- **Current Behavior**: All users can view any recipe; only the creator can edit/delete
- **Implementation**: `canAccessRecipe()` function returns `true` for all recipes
- **Location**: `backend/src/controllers/recipe.controller.ts`

### Database Schema
- **Current State**: `isPublic` field has been removed from the Recipe model
- **Migration**: `20260323173259_remove_is_public_field`
- **Location**: `backend/prisma/schema.prisma`

## Features to Re-Enable for Multi-Tenant Deployment

### 1. Recipe Privacy and Access Control

#### Database Schema Changes
**File**: `backend/prisma/schema.prisma`

Uncomment the following in the Recipe model:
```prisma
model Recipe {
  // ... other fields ...
  isPublic       Boolean    @default(false) @map("is_public")
  // ... other fields ...
  
  @@index([isPublic])
}
```

**Migration Required**: Create a new migration to add back the `is_public` column and index.

#### Controller Changes
**File**: `backend/src/controllers/recipe.controller.ts`

1. **Update `getRecipes` function** (lines ~134-140):
```typescript
// Uncomment these lines:
const userId = getUserId(req);
where.userId = userId;
```

2. **Update `canAccessRecipe` function** (lines ~47-56):
```typescript
// Replace return true with:
return recipe.userId === requestUserId;
```

3. **Update `getRecipeById` function** (lines ~271-276):
```typescript
// Uncomment the access control check:
const userId = getUserId(req);
if (!canAccessRecipe(recipe, userId)) {
  throw new AppError('Access denied', 403);
}
```

### 2. Public Recipe Sharing

For multi-tenant deployments, you may want to allow users to share recipes publicly:

#### Additional Features to Implement

1. **Public Recipe Gallery**
   - Create a new endpoint to fetch public recipes from all users
   - Filter by `isPublic = true` and optionally by `userId != currentUser`

2. **Recipe Cloning**
   - Allow users to clone public recipes from other users
   - Create a new recipe with the same content but owned by the current user

3. **Recipe Discovery**
   - Implement search across public recipes
   - Add filtering by cuisine, difficulty, etc. for public recipes

### 3. Data Isolation Considerations

#### User Data Separation
- **Meal Plans**: Already isolated by `userId` - no changes needed
- **Grocery Lists**: Already isolated by `userId` - no changes needed
- **Pantry Inventory**: Already isolated by `userId` - no changes needed
- **Family Members**: Already isolated by `userId` - no changes needed
- **Recipes**: Need to re-enable `userId` filtering as described above

#### Shared Resources
Consider which resources should be shared vs. isolated:
- **Ingredients**: Currently shared across all users (by design)
- **Recipe Ratings**: Consider if ratings should be visible across tenants

### 4. Additional Security Considerations

#### API Endpoints to Review
1. **Recipe Import**: Ensure imported recipes are assigned to the correct user
2. **Recipe Search**: Implement proper filtering for multi-tenant access
3. **Recipe Recommendations**: Filter recommendations based on user's own recipes or public recipes

#### Testing Requirements
- Test recipe visibility across different users
- Test recipe modification permissions
- Test data isolation between tenants
- Test public recipe sharing functionality

### 5. Performance Considerations

#### Indexing
The `isPublic` index has been removed. When re-enabling multi-tenant:
- Restore the `@@index([isPublic])` in the schema
- Consider composite indexes like `@@index([userId, isPublic])` for better query performance

#### Caching
Current cache keys may need adjustment:
- **File**: `backend/src/controllers/recipe.controller.ts`
- Cache keys should include `userId` to prevent cross-tenant cache pollution
- Review `getRecipeListCacheKey()` and `getRecipeCacheKey()` functions

### 6. Migration Path

To convert from single-family to multi-tenant:

1. **Database Migration**:
   ```bash
   cd backend
   # Uncomment isPublic field in schema.prisma
   npx prisma migrate dev --name add_is_public_field
   ```

2. **Code Changes**:
   - Uncomment all sections marked with `// MULTITENANT:` in the codebase
   - Search for "MULTITENANT" comments across the project

3. **Data Migration**:
   - Decide default `isPublic` value for existing recipes
   - Consider if existing recipes should be public or private by default

4. **Testing**:
   - Create multiple test users
   - Verify recipe isolation
   - Test public recipe sharing
   - Verify access control enforcement

## Search for Multi-Tenant Markers

To find all locations that need changes for multi-tenant deployment:

```bash
# Search for MULTITENANT comments
grep -r "MULTITENANT" backend/src/
grep -r "MULTITENANT" backend/prisma/

# Key files to review:
# - backend/src/controllers/recipe.controller.ts
# - backend/prisma/schema.prisma
```

## Summary

The application is currently optimized for single-family use where recipe sharing is the default behavior. Converting to multi-tenant requires:

1. Re-enabling the `isPublic` field in the database schema
2. Restoring `userId` filtering in recipe queries
3. Implementing proper access control checks
4. Adding public recipe discovery features
5. Updating cache strategies for tenant isolation
6. Comprehensive testing of data isolation

All necessary code changes are marked with `// MULTITENANT:` comments for easy identification.

---

**Last Updated**: 2026-03-23  
**Current Deployment Mode**: Single-Family  
**Migration Status**: Schema and controllers updated for single-family use