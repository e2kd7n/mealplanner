# System Architecture Documentation

**Copyright (c) 2026 Erik Didriksen. All rights reserved.**

**Version:** 2.0.0
**Last Updated:** March 22, 2026
**Status:** Production (Simplified Architecture)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Goals](#architecture-goals)
3. [High-Level Architecture](#high-level-architecture)
4. [Technology Stack](#technology-stack)
5. [Component Architecture](#component-architecture)
6. [Data Architecture](#data-architecture)
7. [Security Architecture](#security-architecture)
8. [Integration Architecture](#integration-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Design Patterns](#design-patterns)
11. [Scalability Considerations](#scalability-considerations)
12. [Future Architecture Plans](#future-architecture-plans)

---

## System Overview

The Meal Planner application is a full-stack Progressive Web Application (PWA) designed to help families manage meal planning, recipe organization, grocery shopping, and pantry inventory. The system follows a modern three-tier architecture with clear separation of concerns.

### Core Capabilities

- **Recipe Management**: Create, store, search, and rate recipes
- **Meal Planning**: Weekly meal planning with family member assignments
- **Grocery Lists**: Automated list generation from meal plans
- **Pantry Tracking**: Inventory management with expiration tracking
- **User Management**: Multi-user support with preferences and family members
- **Offline Support**: PWA capabilities for offline access
- **Recipe Import**: URL-based and OCR-based recipe import using Docling

### Target Users

- Primary: Families (2-6 members)
- Use Case: Weekly meal planning and grocery shopping
- Deployment: Self-hosted (Raspberry Pi compatible)

---

## Architecture Goals

### Primary Goals

1. **Simplicity**: Easy to understand, maintain, and extend
2. **Reliability**: Robust error handling and data integrity
3. **Performance**: Fast response times and efficient resource usage
4. **Security**: Secure authentication, authorization, and data protection
5. **Scalability**: Support for multiple families without performance degradation
6. **Maintainability**: Clean code, good documentation, automated testing
7. **Offline-First**: PWA capabilities for offline access
8. **Self-Hostable**: Run on modest hardware (Raspberry Pi 4+)

### Non-Goals

- Multi-tenancy at scale (designed for small family deployments)
- Real-time collaboration (async updates are sufficient)
- Mobile native apps (PWA provides mobile experience)
- Social features (private family use)

---

## High-Level Architecture

### Simplified 2-Container Architecture (Current)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + Material-UI + Redux Toolkit     │  │
│  │  Progressive Web App (PWA) with Service Workers          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS/REST
┌─────────────────────────────────────────────────────────────────┐
│                      Application Container                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Node.js 20 + Express.js + TypeScript                    │  │
│  │  Native HTTPS support (Node.js https module)             │  │
│  │  RESTful API with JWT Authentication                     │  │
│  │  Serves static frontend files (production)               │  │
│  │  Middleware: Auth, Validation, Rate Limiting, Logging    │  │
│  │  In-memory cache (node-cache)                            │  │
│  │  Ports: 3000 (HTTP), 443 (HTTPS)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Database Container                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PostgreSQL 16 (Prisma ORM)                              │  │
│  │  Port: 5432                                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Architecture Evolution:**
- **v1.0 (Original)**: 5 containers (Nginx, Frontend, Backend, PostgreSQL, Redis)
- **v2.0 (Current)**: 2 containers (Application, PostgreSQL) - 60% reduction

See [`ARCHITECTURE_EVALUATION.md`](../ARCHITECTURE_EVALUATION.md) for detailed analysis and migration phases.

### Request Flow

1. **Client Request**: User interacts with React UI
2. **Service Worker**: Checks cache for offline support
3. **Node.js HTTPS/HTTP**: Direct connection to backend (no proxy)
4. **Express Middleware**: Authentication, validation, rate limiting
5. **Controller**: Business logic processing
6. **Prisma ORM**: Database queries with type safety
7. **In-Memory Cache**: node-cache for API response caching
8. **Response**: JSON data returned to client
9. **Redux Store**: State management and UI update

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **React** | 19.2+ | UI Framework | Modern, component-based, large ecosystem |
| **TypeScript** | 5.9+ | Type Safety | Catch errors at compile time, better IDE support |
| **Vite** | 8.0+ | Build Tool | Fast HMR, modern bundling, excellent DX |
| **Material-UI** | 7.3+ | UI Components | Comprehensive component library, accessibility |
| **Redux Toolkit** | 2.11+ | State Management | Predictable state, DevTools, RTK Query |
| **React Router** | 7.13+ | Routing | Standard routing solution, nested routes |
| **Axios** | 1.13+ | HTTP Client | Interceptors, request/response transformation |
| **Workbox** | Latest | PWA/Service Workers | Offline support, caching strategies |

### Backend Stack

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Node.js** | 20 LTS | Runtime | Mature, performant, large ecosystem |
| **Express.js** | 4.22+ | Web Framework | Minimal, flexible, well-documented |
| **TypeScript** | 5.9+ | Type Safety | Shared types with frontend, better DX |
| **Prisma** | Latest | ORM | Type-safe queries, migrations, excellent DX |
| **PostgreSQL** | 16+ | Database | ACID compliance, JSON support, reliability |
| **node-cache** | 5+ | In-Memory Cache | Simple, fast, no external dependencies |
| **JWT** | Latest | Authentication | Stateless, scalable, standard |
| **Zod** | 4.3+ | Validation | Type-safe validation, schema inference |
| **Winston** | Latest | Logging | Structured logging, multiple transports |

### DevOps Stack

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Podman** | Latest | Container Runtime | Rootless, daemonless, Raspberry Pi compatible |
| **Podman Compose** | Latest | Container Orchestration | Simple multi-container management |
| **pnpm** | 8+ | Package Manager | Fast, disk-efficient, strict dependencies |

**Note:** Nginx was removed in v2.0. Native Node.js HTTPS module handles SSL/TLS termination.

---

## Component Architecture

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # App layout wrapper
│   │   └── PrivateRoute.tsx # Protected route wrapper
│   ├── pages/               # Page components (routes)
│   │   ├── Dashboard.tsx
│   │   ├── Recipes.tsx
│   │   ├── CreateRecipe.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── MealPlanner.tsx
│   │   ├── GroceryList.tsx
│   │   ├── Pantry.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── store/               # Redux store
│   │   ├── index.ts         # Store configuration
│   │   ├── hooks.ts         # Typed hooks
│   │   └── slices/          # Redux slices
│   │       ├── authSlice.ts
│   │       ├── recipesSlice.ts
│   │       ├── mealPlansSlice.ts
│   │       ├── groceryListsSlice.ts
│   │       └── pantrySlice.ts
│   ├── services/            # API services
│   │   └── api.ts           # Axios instance and API calls
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── assets/              # Static assets
│   └── theme.ts             # MUI theme configuration
```

#### Component Patterns

1. **Container/Presentational Pattern**: Separate logic from presentation
2. **Custom Hooks**: Reusable stateful logic
3. **Context API**: Global state for authentication
4. **Redux Slices**: Feature-based state management
5. **Service Layer**: Centralized API calls

### Backend Architecture

```
backend/
├── src/
│   ├── index.ts             # Application entry point
│   ├── controllers/         # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── recipe.controller.ts
│   │   ├── mealPlan.controller.ts
│   │   ├── groceryList.controller.ts
│   │   ├── pantry.controller.ts
│   │   ├── ingredient.controller.ts
│   │   ├── user.controller.ts
│   │   └── familyMember.controller.ts
│   ├── routes/              # Route definitions
│   │   ├── auth.routes.ts
│   │   ├── recipe.routes.ts
│   │   ├── mealPlan.routes.ts
│   │   ├── groceryList.routes.ts
│   │   ├── pantry.routes.ts
│   │   ├── ingredient.routes.ts
│   │   ├── user.routes.ts
│   │   └── familyMember.routes.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── validate.ts      # Request validation
│   │   ├── errorHandler.ts  # Error handling
│   │   ├── logger.ts        # Request logging
│   │   └── rateLimiter.ts   # Rate limiting
│   ├── validation/          # Validation schemas
│   │   └── schemas.ts       # Zod schemas
│   ├── utils/               # Utility functions
│   │   ├── prisma.ts        # Prisma client
│   │   ├── cache.ts         # In-memory cache (node-cache)
│   │   ├── jwt.ts           # JWT utilities
│   │   ├── logger.ts        # Winston logger
│   │   └── secrets.ts       # Secrets management
│   └── prisma/              # Database
│       ├── schema.prisma    # Database schema
│       └── migrations/      # Database migrations
```

#### Backend Patterns

1. **MVC Pattern**: Model-View-Controller separation
2. **Middleware Chain**: Request processing pipeline
3. **Repository Pattern**: Data access abstraction (via Prisma)
4. **Service Layer**: Business logic separation
5. **Dependency Injection**: Loose coupling

---

## Data Architecture

### Database Schema

#### Core Entities

```
User
├── id (UUID, PK)
├── email (unique)
├── password (hashed)
├── familyName
├── createdAt
└── updatedAt

UserPreferences
├── id (UUID, PK)
├── userId (FK → User)
├── dietaryRestrictions (JSON)
├── cookingSkillLevel
├── avoidedIngredients (JSON)
└── updatedAt

FamilyMember
├── id (UUID, PK)
├── userId (FK → User)
├── name
├── ageGroup
├── dietaryRestrictions (JSON)
├── cookingSkillLevel
├── avoidedIngredients (JSON)
└── createdAt

Recipe
├── id (UUID, PK)
├── userId (FK → User)
├── title
├── description
├── source
├── externalId
├── prepTime
├── cookTime
├── servings
├── difficulty
├── kidFriendly
├── cuisineType
├── mealType
├── imageUrl
├── instructions (JSON)
├── nutritionInfo (JSON)
├── costEstimate
├── isPublic
├── createdAt
└── updatedAt

RecipeIngredient
├── id (UUID, PK)
├── recipeId (FK → Recipe)
├── ingredientId (FK → Ingredient)
├── quantity
├── unit
└── notes

Ingredient
├── id (UUID, PK)
├── name (unique)
├── category
├── defaultUnit
└── createdAt

RecipeRating
├── id (UUID, PK)
├── recipeId (FK → Recipe)
├── userId (FK → User)
├── rating (1-5)
├── notes
├── wouldMakeAgain
└── createdAt

MealPlan
├── id (UUID, PK)
├── userId (FK → User)
├── weekStartDate
├── status
├── createdAt
└── updatedAt

PlannedMeal
├── id (UUID, PK)
├── mealPlanId (FK → MealPlan)
├── recipeId (FK → Recipe)
├── date
├── mealType
├── servings
├── assignedCookId (FK → FamilyMember)
├── notes
└── createdAt

GroceryList
├── id (UUID, PK)
├── userId (FK → User)
├── mealPlanId (FK → MealPlan, nullable)
├── name
├── status
├── createdAt
└── updatedAt

GroceryListItem
├── id (UUID, PK)
├── groceryListId (FK → GroceryList)
├── ingredientId (FK → Ingredient)
├── quantity
├── unit
├── category
├── checked
├── notes
└── addedAt

PantryItem
├── id (UUID, PK)
├── userId (FK → User)
├── ingredientId (FK → Ingredient)
├── quantity
├── unit
├── location
├── expirationDate
├── purchaseDate
└── updatedAt
```

### Data Relationships

- **One-to-Many**: User → Recipes, User → MealPlans, Recipe → RecipeIngredients
- **Many-to-Many**: Recipe ↔ Ingredient (via RecipeIngredient)
- **One-to-One**: User → UserPreferences
- **Hierarchical**: MealPlan → PlannedMeals, GroceryList → GroceryListItems

### Data Flow

1. **Recipe Creation**: User → Recipe → RecipeIngredients → Ingredients
2. **Meal Planning**: User → MealPlan → PlannedMeals → Recipes
3. **Grocery List**: MealPlan → PlannedMeals → RecipeIngredients → GroceryListItems
4. **Pantry Update**: GroceryList → GroceryListItems → PantryItems

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
└─────────────────────────────────────────────────────────────┘

1. User Login
   ↓
2. Validate Credentials (bcrypt password hash)
   ↓
3. Generate JWT Tokens
   ├── Access Token (15 min expiry)
   └── Refresh Token (7 days expiry)
   ↓
4. Store Refresh Token in Redis
   ↓
5. Return Tokens to Client
   ↓
6. Client stores in localStorage
   ↓
7. Include Access Token in Authorization header
   ↓
8. Middleware validates JWT
   ↓
9. Extract user ID from token
   ↓
10. Attach user to request object
```

### Security Layers

1. **Transport Security**
   - HTTPS/TLS encryption
   - Secure cookies (httpOnly, secure, sameSite)
   - CORS configuration

2. **Authentication**
   - JWT-based stateless authentication
   - Bcrypt password hashing (10 rounds)
   - Refresh token rotation
   - Session management via Redis

3. **Authorization**
   - Role-based access control (RBAC)
   - Resource ownership validation
   - Private/public recipe visibility

4. **Input Validation**
   - Zod schema validation
   - SQL injection prevention (Prisma parameterized queries)
   - XSS prevention (input sanitization)
   - CSRF protection

5. **Rate Limiting**
   - Per-IP rate limiting
   - Per-user rate limiting
   - Endpoint-specific limits

6. **Secrets Management**
   - Environment variables
   - Secrets rotation procedures
   - No secrets in code/git

### Security Best Practices

- **Password Policy**: Minimum 8 characters, complexity requirements
- **Token Expiry**: Short-lived access tokens, longer refresh tokens
- **Audit Logging**: All authentication events logged
- **Error Handling**: Generic error messages (no information leakage)
- **Dependency Scanning**: Regular security audits

---

## Integration Architecture

### Internal Integrations

```
┌──────────────┐
│   Frontend   │
└──────┬───────┘
       │ REST API
       ↓
┌──────────────┐     ┌──────────────┐
│   Backend    │────→│   Database   │
└──────┬───────┘     └──────────────┘
       │
       ↓
┌──────────────┐
│    Redis     │
└──────────────┘
```

### External Integrations (Planned)

1. **Docling** (Primary Document Parser)
   - URL-based recipe import
   - OCR-based recipe card import
   - PDF cookbook parsing

2. **Recipe Scrapers** (Secondary Parser)
   - Site-specific recipe extraction
   - 100+ supported recipe sites

3. **Nutrition APIs** (Planned)
   - USDA FoodData Central
   - Nutritionix API
   - Edamam Nutrition API

4. **MyFitnessPal** (Planned)
   - Nutrition tracking integration
   - OAuth authentication

5. **AllRecipes.com** (Planned)
   - Recipe import
   - API integration

### Integration Patterns

- **API Gateway Pattern**: Centralized API routing
- **Circuit Breaker**: Fault tolerance for external APIs
- **Retry Logic**: Exponential backoff for failed requests
- **Caching**: Redis caching for external API responses
- **Rate Limiting**: Respect external API limits

---

## Deployment Architecture

### Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker/Podman Host                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Nginx Container (Port 80/443)                         │ │
│  │  - SSL termination                                     │ │
│  │  - Static file serving                                 │ │
│  │  - Reverse proxy                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Frontend Container (Port 5173)                        │ │
│  │  - React app (production build)                        │ │
│  │  - Served by Nginx                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Backend Container (Port 3000)                         │ │
│  │  - Node.js Express API                                 │ │
│  │  - Health checks                                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL Container (Port 5432)                      │ │
│  │  - Persistent volume                                   │ │
│  │  - Automated backups                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Redis Container (Port 6379)                           │ │
│  │  - Session storage                                     │ │
│  │  - Cache layer                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Environments

1. **Development**
   - Local Docker Compose
   - Hot module reloading
   - Debug logging
   - Test data

2. **Production (Raspberry Pi)**
   - Podman Compose
   - ARM64 images
   - Production logging
   - Real data
   - Automated backups

### Deployment Process

1. Build Docker images
2. Push to registry (optional)
3. Pull on target host
4. Run database migrations
5. Start containers with compose
6. Health check verification
7. Smoke tests

---

## Design Patterns

### Frontend Patterns

1. **Component Composition**: Build complex UIs from simple components
2. **Container/Presentational**: Separate logic from UI
3. **Custom Hooks**: Reusable stateful logic
4. **Higher-Order Components**: Cross-cutting concerns
5. **Render Props**: Flexible component composition
6. **Redux Slices**: Feature-based state management
7. **Thunks**: Async action creators

### Backend Patterns

1. **MVC (Model-View-Controller)**: Separation of concerns
2. **Middleware Chain**: Request processing pipeline
3. **Repository Pattern**: Data access abstraction
4. **Factory Pattern**: Object creation
5. **Singleton Pattern**: Single instance (Prisma, Redis clients)
6. **Strategy Pattern**: Interchangeable algorithms
7. **Observer Pattern**: Event-driven architecture

### API Design Patterns

1. **RESTful API**: Resource-based URLs, HTTP verbs
2. **Pagination**: Cursor-based pagination for large datasets
3. **Filtering**: Query parameters for filtering
4. **Sorting**: Query parameters for sorting
5. **Versioning**: URL-based versioning (future)
6. **HATEOAS**: Hypermedia links (future)

---

## Scalability Considerations

### Current Scale

- **Users**: 1-10 families (4-40 users)
- **Recipes**: 100-1000 per family
- **Requests**: <100 req/min
- **Storage**: <10 GB
- **Hardware**: Raspberry Pi 4 (4GB RAM)

### Scaling Strategies

#### Vertical Scaling (Current Approach)

- Increase hardware resources
- Optimize queries
- Add indexes
- Implement caching

#### Horizontal Scaling (Future)

1. **Database**
   - Read replicas
   - Connection pooling
   - Query optimization

2. **Application**
   - Load balancing
   - Stateless design (JWT)
   - Session storage in Redis

3. **Cache**
   - Redis cluster
   - Cache warming
   - Cache invalidation

4. **Storage**
   - CDN for images
   - Object storage (S3-compatible)

### Performance Optimizations

1. **Database**
   - Indexes on foreign keys
   - Composite indexes for common queries
   - Query result caching
   - Connection pooling

2. **API**
   - Response compression
   - ETags for caching
   - Pagination for large datasets
   - Lazy loading

3. **Frontend**
   - Code splitting
   - Lazy loading routes
   - Image optimization
   - Service worker caching

---

## Future Architecture Plans

### Short-Term (3-6 months)

1. **Recipe Import System**
   - Docling integration for URL/OCR import
   - Multi-parser consensus algorithm
   - Image processing pipeline

2. **Nutrition Integration**
   - USDA FoodData Central API
   - Automatic nutrition calculation
   - Nutrition dashboard

3. **Admin Dashboard**
   - User management
   - System monitoring
   - Analytics

### Medium-Term (6-12 months)

1. **Real-Time Features**
   - WebSocket support
   - Live meal plan collaboration
   - Push notifications

2. **Mobile App**
   - React Native app
   - Offline-first architecture
   - Camera integration for OCR

3. **AI Features**
   - Recipe recommendations
   - Meal plan generation
   - Ingredient substitutions

### Long-Term (12+ months)

1. **Multi-Tenancy**
   - Support for multiple families
   - Tenant isolation
   - Shared recipes marketplace

2. **Advanced Analytics**
   - Cost tracking
   - Nutrition trends
   - Waste reduction insights

3. **Third-Party Integrations**
   - Grocery delivery APIs
   - Smart home integration
   - Fitness tracker integration

---

## Monitoring & Observability

### Logging

- **Winston**: Structured logging
- **Log Levels**: error, warn, info, debug
- **Log Rotation**: Daily rotation, 14-day retention
- **Log Aggregation**: Centralized logging (future)

### Metrics

- **Application Metrics**: Request rate, response time, error rate
- **System Metrics**: CPU, memory, disk usage
- **Database Metrics**: Query performance, connection pool
- **Cache Metrics**: Hit rate, memory usage

### Health Checks

- **Liveness**: Is the service running?
- **Readiness**: Is the service ready to accept traffic?
- **Dependency Checks**: Database, Redis connectivity

### Alerting (Future)

- **Critical**: Service down, database unavailable
- **Warning**: High error rate, slow queries
- **Info**: Deployment events, configuration changes

---

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Daily automated backups
   - 30-day retention
   - Offsite storage

2. **Configuration Backups**
   - Environment variables
   - Docker compose files
   - Nginx configuration

3. **Code Backups**
   - Git repository
   - Tagged releases

### Recovery Procedures

1. **Database Restore**
   - Stop application
   - Restore from backup
   - Run migrations
   - Verify data integrity
   - Restart application

2. **Full System Restore**
   - Provision new hardware
   - Install Docker/Podman
   - Clone repository
   - Restore database
   - Start containers

### RTO/RPO

- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

---

## Conclusion

This architecture provides a solid foundation for a family meal planning application with room for growth. The design prioritizes simplicity, maintainability, and self-hosting capabilities while maintaining professional standards for security, performance, and reliability.

### Key Strengths

- **Modern Stack**: Latest stable versions of proven technologies
- **Type Safety**: TypeScript throughout for better DX and fewer bugs
- **Security**: Multiple layers of security controls
- **Scalability**: Designed to scale from single family to multiple families
- **Maintainability**: Clean architecture, good documentation, automated testing
- **Self-Hostable**: Runs on modest hardware (Raspberry Pi)

### Areas for Improvement

- Add comprehensive monitoring and alerting
- Implement automated testing (unit, integration, e2e)
- Add CI/CD pipeline
- Implement feature flags
- Add performance profiling

---

**Document Maintained By**: Development Team  
**Review Schedule**: Quarterly  
**Next Review**: June 15, 2026
