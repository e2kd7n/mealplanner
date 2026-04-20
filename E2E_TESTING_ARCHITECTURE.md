# E2E Testing Architecture

**Visual guide to the E2E testing structure for Issue #47**

---

## Test Architecture Overview

```mermaid
graph TB
    subgraph "Test Execution"
        A[Developer/CI] --> B[Playwright Test Runner]
        B --> C[Test Files]
    end
    
    subgraph "Test Infrastructure"
        C --> D[Fixtures]
        C --> E[Page Objects]
        C --> F[Helpers]
        
        D --> D1[Auth Fixture]
        D --> D2[Test Data Generator]
        
        E --> E1[LoginPage]
        E --> E2[RecipesPage]
        E --> E3[MealPlannerPage]
        
        F --> F1[API Helpers]
        F --> F2[DB Helpers]
    end
    
    subgraph "Application Under Test"
        C --> G[Frontend App]
        F1 --> H[Backend API]
        F2 --> I[Database]
        
        G --> H
        H --> I
    end
    
    subgraph "Results"
        B --> J[HTML Report]
        B --> K[Screenshots]
        B --> L[Videos]
        B --> M[JUnit XML]
    end
```

---

## Test Flow Diagram

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant PT as Playwright
    participant Fix as Fixtures
    participant PO as Page Objects
    participant App as Application
    participant API as Backend API
    
    Dev->>PT: Run test
    PT->>Fix: Setup test data
    Fix->>API: Create test user/recipe
    API-->>Fix: Return test data
    
    PT->>PO: Initialize page object
    PO->>App: Navigate to page
    App-->>PO: Page loaded
    
    PT->>PO: Perform actions
    PO->>App: Click, fill, etc.
    App->>API: API requests
    API-->>App: API responses
    App-->>PO: UI updates
    
    PT->>PO: Assert expectations
    PO->>App: Check elements
    App-->>PO: Element states
    PO-->>PT: Assertion results
    
    PT->>Fix: Cleanup test data
    Fix->>API: Delete test data
    
    PT-->>Dev: Test results
```

---

## File Organization

```mermaid
graph LR
    subgraph "frontend/e2e/"
        A[tests/] --> A1[auth/]
        A --> A2[recipes/]
        A --> A3[meal-planner/]
        A --> A4[grocery-list/]
        A --> A5[recipe-import/]
        
        B[fixtures/] --> B1[auth.fixture.ts]
        B --> B2[test-data.ts]
        
        C[page-objects/] --> C1[LoginPage.ts]
        C --> C2[RecipesPage.ts]
        C --> C3[MealPlannerPage.ts]
        
        D[helpers/] --> D1[api-helpers.ts]
        D --> D2[db-helpers.ts]
        
        E[playwright.config.ts]
    end
```

---

## Test Execution Flow

```mermaid
flowchart TD
    Start[Test Starts] --> Setup[Setup Phase]
    Setup --> CreateData[Create Test Data]
    CreateData --> Auth[Authenticate if needed]
    Auth --> Navigate[Navigate to Page]
    Navigate --> Action[Perform Actions]
    Action --> Assert[Assert Expectations]
    Assert --> Pass{Test Passed?}
    Pass -->|Yes| Cleanup[Cleanup Test Data]
    Pass -->|No| Screenshot[Take Screenshot/Video]
    Screenshot --> Cleanup
    Cleanup --> End[Test Ends]
```

---

## Phase 1 Implementation

```mermaid
gantt
    title Phase 1: Authentication & Recipe Management
    dateFormat YYYY-MM-DD
    section Setup
    Install Playwright           :a1, 2026-04-20, 1d
    Create Config               :a2, after a1, 1d
    section Infrastructure
    Create Fixtures             :b1, after a2, 2d
    Create Page Objects         :b2, after a2, 2d
    Create Helpers              :b3, after b2, 1d
    section Tests
    Auth Tests                  :c1, after b3, 2d
    Recipe Browse Tests         :c2, after c1, 2d
    Recipe CRUD Tests           :c3, after c2, 3d
    section CI/CD
    GitHub Actions Setup        :d1, after c3, 1d
```

---

## Phase 2 Implementation

```mermaid
gantt
    title Phase 2: Extended Flows
    dateFormat YYYY-MM-DD
    section Meal Planning
    Meal Plan Tests             :a1, 2026-05-04, 3d
    section Grocery Lists
    Grocery List Tests          :b1, after a1, 3d
    section Recipe Import
    Import Tests                :c1, after b1, 2d
    section Documentation
    Final Documentation         :d1, after c1, 2d
```

---

## Test Data Flow

```mermaid
flowchart LR
    subgraph "Test Data Creation"
        A[Test Starts] --> B[Generate Unique Data]
        B --> C[Create via API]
        C --> D[Store IDs]
    end
    
    subgraph "Test Execution"
        D --> E[Use in Test]
        E --> F[Verify Results]
    end
    
    subgraph "Cleanup"
        F --> G[Delete via API]
        G --> H[Test Ends]
    end
```

---

## Browser Testing Matrix

```mermaid
graph TB
    subgraph "Browsers"
        A[Chromium]
        B[Firefox]
        C[WebKit/Safari]
    end
    
    subgraph "Test Suites"
        D[Auth Tests]
        E[Recipe Tests]
        F[Meal Plan Tests]
        G[Grocery Tests]
        H[Import Tests]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    
    B --> D
    B --> E
    B --> F
    B --> G
    B --> H
    
    C --> D
    C --> E
    C --> F
    C --> G
    C --> H
```

---

## CI/CD Pipeline

```mermaid
flowchart TD
    A[Git Push/PR] --> B[GitHub Actions Triggered]
    B --> C[Setup Environment]
    C --> D[Start Services]
    D --> D1[PostgreSQL]
    D --> D2[Redis]
    D --> D3[Backend]
    D --> D4[Frontend]
    
    D1 --> E[Run Migrations]
    D2 --> E
    D3 --> E
    D4 --> E
    
    E --> F[Install Playwright]
    F --> G[Run E2E Tests]
    
    G --> H{Tests Pass?}
    H -->|Yes| I[Generate Report]
    H -->|No| J[Capture Failures]
    
    J --> K[Screenshots]
    J --> L[Videos]
    J --> M[Logs]
    
    I --> N[Upload Artifacts]
    K --> N
    L --> N
    M --> N
    
    N --> O[Notify Results]
```

---

## Page Object Pattern

```mermaid
classDiagram
    class BasePage {
        +Page page
        +goto()
        +waitForLoad()
    }
    
    class LoginPage {
        +Locator emailInput
        +Locator passwordInput
        +Locator loginButton
        +login(email, password)
        +expectError(message)
    }
    
    class RecipesPage {
        +Locator searchInput
        +Locator filterButton
        +Locator recipeCards
        +searchRecipes(query)
        +filterByDifficulty(level)
        +clickRecipe(title)
    }
    
    class CreateRecipePage {
        +Locator titleInput
        +Locator descriptionInput
        +Locator submitButton
        +fillBasicInfo(data)
        +addIngredient(ingredient)
        +addInstruction(step)
        +submit()
    }
    
    BasePage <|-- LoginPage
    BasePage <|-- RecipesPage
    BasePage <|-- CreateRecipePage
```

---

## Test Fixture Pattern

```mermaid
classDiagram
    class BaseFixture {
        +Page page
        +APIRequestContext request
    }
    
    class AuthFixture {
        +LoginPage loginPage
        +Page authenticatedPage
        +authenticate()
    }
    
    class RecipeFixture {
        +createTestRecipe()
        +deleteTestRecipe()
        +generateRecipeData()
    }
    
    class TestDataFixture {
        +generateTestUser()
        +generateTestRecipe()
        +generateTestMealPlan()
    }
    
    BaseFixture <|-- AuthFixture
    BaseFixture <|-- RecipeFixture
    BaseFixture <|-- TestDataFixture
```

---

## Error Handling Flow

```mermaid
flowchart TD
    A[Test Execution] --> B{Error Occurs?}
    B -->|No| C[Test Passes]
    B -->|Yes| D[Capture Context]
    
    D --> E[Take Screenshot]
    D --> F[Record Video]
    D --> G[Save Logs]
    D --> H[Save Trace]
    
    E --> I[Retry Test?]
    F --> I
    G --> I
    H --> I
    
    I -->|Yes, Retry < 2| A
    I -->|No| J[Mark Test Failed]
    
    J --> K[Upload Artifacts]
    K --> L[Generate Report]
```

---

## Key Design Principles

### 1. Separation of Concerns
- **Tests**: Business logic and assertions
- **Page Objects**: UI interactions and selectors
- **Fixtures**: Test data and setup
- **Helpers**: Utility functions and API calls

### 2. Test Independence
- Each test creates its own data
- Tests can run in any order
- No shared state between tests
- Cleanup after each test

### 3. Maintainability
- DRY principle with page objects
- Reusable fixtures and helpers
- Clear naming conventions
- Comprehensive documentation

### 4. Reliability
- Auto-waiting for elements
- Retry logic for flaky operations
- Proper error handling
- Screenshot/video on failure

### 5. Scalability
- Parallel test execution
- Modular test structure
- Easy to add new tests
- CI/CD integration

---

## Success Metrics Dashboard

```mermaid
graph LR
    subgraph "Metrics"
        A[Test Coverage] --> A1[100% Critical Flows]
        B[Execution Time] --> B1[< 5 minutes]
        C[Flakiness Rate] --> C1[< 5%]
        D[Pass Rate] --> D1[> 95%]
    end
    
    subgraph "Monitoring"
        E[GitHub Actions]
        F[Test Reports]
        G[Trend Analysis]
    end
    
    A1 --> E
    B1 --> E
    C1 --> E
    D1 --> E
    
    E --> F
    F --> G
```

---

## Resources & References

- **Implementation Plan**: [E2E_TESTING_IMPLEMENTATION_PLAN.md](E2E_TESTING_IMPLEMENTATION_PLAN.md)
- **Quick Start Guide**: [E2E_TESTING_QUICK_START.md](E2E_TESTING_QUICK_START.md)
- **Playwright Docs**: https://playwright.dev
- **GitHub Issue**: #47

---

Made with Bob