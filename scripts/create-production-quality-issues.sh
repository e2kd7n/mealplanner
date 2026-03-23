#!/bin/bash

# Production Quality GitHub Issues Creation Script
# Creates detailed issues for all recommendations from senior developer review
# Date: 2026-03-22

set -e

REPO="e2kd7n/mealplanner"

echo "Creating comprehensive GitHub issues for production quality improvements..."
echo "Repository: $REPO"
echo ""

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    
    echo "Creating issue: $title"
    gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" || echo "Failed to create issue: $title"
    sleep 1
}

# ============================================================================
# P0 - CRITICAL (Must fix immediately)
# ============================================================================

create_issue \
"[P0] Add Environment Variable Validation on Startup" \
"## Problem
No validation of required environment variables on application startup. If critical env vars are missing or invalid, the application fails with cryptic errors deep in the code.

## Impact
- Difficult to debug deployment issues
- Poor developer experience
- Silent failures in production
- Wasted time troubleshooting configuration

## Required Environment Variables

### Backend
- \`DATABASE_URL\` or components (\`POSTGRES_HOST\`, \`POSTGRES_PORT\`, \`POSTGRES_DB\`, \`POSTGRES_USER\`)
- \`JWT_SECRET\` (via secrets or env)
- \`JWT_REFRESH_SECRET\` (via secrets or env)
- \`SESSION_SECRET\` (via secrets or env)
- \`CORS_ORIGIN\`
- \`NODE_ENV\`

### Frontend
- \`VITE_API_URL\`

## Implementation

### Backend (\`backend/src/index.ts\`)
\`\`\`typescript
// Add before any other initialization
function validateEnvironment() {
  const required = [
    'NODE_ENV',
    'PORT',
    'CORS_ORIGIN',
  ];
  
  const missing: string[] = [];
  
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check secrets are accessible
  try {
    getDatabaseUrl(); // Will throw if secrets missing
    getJwtConfig(); // Will throw if secrets missing
  } catch (error) {
    logger.error('Failed to load required secrets:', error);
    process.exit(1);
  }
  
  if (missing.length > 0) {
    logger.error(\`Missing required environment variables: \${missing.join(', ')}\`);
    logger.error('Please check your .env file and ensure all required variables are set');
    process.exit(1);
  }
  
  logger.info('Environment validation passed');
}

// Call before starting server
validateEnvironment();
\`\`\`

## Testing
1. Start app with missing env var
2. Verify clear error message
3. Verify app exits with code 1
4. Add env var and verify app starts

## Files to Modify
- \`backend/src/index.ts\`
- \`frontend/src/main.tsx\` (optional, for frontend validation)

## Acceptance Criteria
- [ ] Clear error messages for missing variables
- [ ] App exits immediately with non-zero code
- [ ] Lists all missing variables at once
- [ ] Validates secrets are accessible
- [ ] Logs success message when validation passes" \
"priority: critical,P0,configuration,devops"

create_issue \
"[P0] Update README to Reflect Actual Project Status" \
"## Problem
README.md line 3 claims \"Version: 1.0.0 (MVP) - ✅ Production Ready\" but:
- No automated tests exist
- Several quality measures missing
- Documentation inaccuracies
- Security improvements needed

This is misleading to users and stakeholders.

## Current Status
\`\`\`markdown
**Version:** 1.0.0 (MVP) - ✅ Production Ready
\`\`\`

## Proposed Update
\`\`\`markdown
**Version:** 1.0.0 (MVP) - ⚠️ Beta - Quality Improvements in Progress
**Status:** Core features functional, quality measures being implemented
\`\`\`

## Additional Changes Needed

### Add Known Issues Section
\`\`\`markdown
## ⚠️ Known Issues & Limitations

### In Progress
- Automated test suite implementation (#[issue-number])
- Comprehensive error handling (#[issue-number])
- Rate limiting on auth endpoints (#[issue-number])

### Planned
- API documentation (Swagger/OpenAPI)
- Performance monitoring
- Advanced PWA features

See [GitHub Issues](https://github.com/e2kd7n/mealplanner/issues) for complete list.
\`\`\`

### Update Feature Status
Change from absolute checkmarks to realistic status:
- ✅ Implemented and tested
- ⚠️ Implemented, needs testing
- 🚧 In progress
- ⏳ Planned

## Files to Modify
- \`README.md\`
- \`BUILD_STATUS.md\` (update to current reality)
- \`MVP_RELEASE_SUMMARY.md\` (add caveats)

## Acceptance Criteria
- [ ] Status accurately reflects current state
- [ ] Known issues section added
- [ ] Feature status uses realistic indicators
- [ ] Links to GitHub issues for tracking
- [ ] No misleading \"production ready\" claims" \
"priority: critical,P0,documentation"

# ============================================================================
# P1 - HIGH PRIORITY (Should fix soon)
# ============================================================================

create_issue \
"[P1] Implement Basic Automated Test Suite" \
"## Problem
Zero automated tests despite claiming \"production ready\". The \`package.json\` test script just echoes an error:
\`\`\`json
\"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"
\`\`\`

## Impact
- Cannot verify functionality after changes
- High risk of regressions
- Cannot safely refactor
- Not actually production-ready

## Implementation Plan

### Phase 1: Setup Test Infrastructure

#### Backend Tests (Jest + Supertest)
\`\`\`bash
cd backend
pnpm add -D jest @types/jest ts-jest supertest @types/supertest
\`\`\`

**jest.config.js:**
\`\`\`javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
\`\`\`

#### Frontend Tests (Vitest + React Testing Library)
\`\`\`bash
cd frontend
pnpm add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
\`\`\`

**vitest.config.ts:**
\`\`\`typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
\`\`\`

### Phase 2: Critical Path Tests

#### Backend Priority Tests
1. **Authentication** (\`src/controllers/__tests__/auth.controller.test.ts\`)
   - Login with valid credentials
   - Login with invalid credentials
   - Token refresh
   - Logout

2. **Recipe CRUD** (\`src/controllers/__tests__/recipe.controller.test.ts\`)
   - Create recipe
   - Get recipes with filters
   - Update recipe
   - Delete recipe

3. **Date Handling** (\`src/utils/__tests__/dateHelpers.test.ts\`)
   - formatDateForAPI in different timezones
   - Date parsing from API
   - Edge cases (DST transitions, etc.)

4. **Meal Plan Operations** (\`src/controllers/__tests__/mealPlan.controller.test.ts\`)
   - Create meal plan
   - Add meal to plan
   - Update meal date/time
   - Delete meal

#### Frontend Priority Tests
1. **Authentication Flow** (\`src/pages/__tests__/Login.test.tsx\`)
   - Render login form
   - Submit with valid credentials
   - Handle errors

2. **Recipe List** (\`src/pages/__tests__/Recipes.test.tsx\`)
   - Render recipe cards
   - Filter by meal type
   - Search recipes

3. **Date Utilities** (\`src/utils/__tests__/dateHelpers.test.tsx\`)
   - Format dates correctly
   - Handle timezone conversions

### Phase 3: Integration Tests
- End-to-end user flows
- API integration tests
- Database transaction tests

## Package.json Updates

### Backend
\`\`\`json
{
  \"scripts\": {
    \"test\": \"jest\",
    \"test:watch\": \"jest --watch\",
    \"test:coverage\": \"jest --coverage\"
  }
}
\`\`\`

### Frontend
\`\`\`json
{
  \"scripts\": {
    \"test\": \"vitest\",
    \"test:ui\": \"vitest --ui\",
    \"test:coverage\": \"vitest --coverage\"
  }
}
\`\`\`

## Success Criteria
- [ ] Test infrastructure set up
- [ ] At least 20 backend tests passing
- [ ] At least 15 frontend tests passing
- [ ] Critical paths covered (auth, recipes, meal plans)
- [ ] CI/CD integration (future)
- [ ] Coverage reports generated

## Estimated Effort
- Setup: 2 hours
- Backend tests: 6-8 hours
- Frontend tests: 4-6 hours
- **Total: 12-16 hours**" \
"priority: high,P1,testing,quality"

create_issue \
"[P1] Implement Comprehensive Error Handling" \
"## Problem
Frontend lacks comprehensive error handling. Users see no feedback when API requests fail, leading to confusion and poor UX.

## Current Issues
- Silent failures on network errors
- No retry mechanism
- No user-friendly error messages
- No global error boundary
- Inconsistent error response format from backend

## Implementation Plan

### 1. Global Error Boundary (Frontend)

**Create \`frontend/src/components/ErrorBoundary.tsx\`:**
\`\`\`typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant=\"h4\" gutterBottom>
            Oops! Something went wrong
          </Typography>
          <Typography variant=\"body1\" color=\"text.secondary\" gutterBottom>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button
            variant=\"contained\"
            onClick={() => window.location.href = '/'}
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
\`\`\`

### 2. Toast Notification System

**Install notistack:**
\`\`\`bash
cd frontend
pnpm add notistack
\`\`\`

**Wrap app in \`App.tsx\`:**
\`\`\`typescript
import { SnackbarProvider } from 'notistack';

<SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
  <ErrorBoundary>
    {/* existing app */}
  </ErrorBoundary>
</SnackbarProvider>
\`\`\`

### 3. Enhanced API Error Handling

**Update \`frontend/src/services/api.ts\`:**
\`\`\`typescript
import { enqueueSnackbar } from 'notistack';

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableAxiosConfig;
    
    // Handle specific error codes
    if (error.response?.status === 401 && !config._retry) {
      // Token refresh logic (already exists)
    }
    
    // User-friendly error messages
    const message = getErrorMessage(error);
    enqueueSnackbar(message, { variant: 'error' });
    
    // Retry logic for network errors
    if (!error.response && config.retryCount < 3) {
      config.retryCount = (config.retryCount || 0) + 1;
      await new Promise(resolve => setTimeout(resolve, 1000 * config.retryCount));
      return api(config);
    }
    
    return Promise.reject(error);
  }
);

function getErrorMessage(error: AxiosError): string {
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  
  const data = error.response.data as any;
  return data?.error?.message || data?.message || 'An error occurred';
}
\`\`\`

### 4. Standardize Backend Error Responses

**Update \`backend/src/middleware/errorHandler.ts\`:**
\`\`\`typescript
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || 'APP_ERROR';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      code,
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
  });
}
\`\`\`

### 5. Loading States

Add loading states to all async operations:
\`\`\`typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

try {
  setLoading(true);
  setError(null);
  await someAsyncOperation();
} catch (err) {
  setError(err.message);
  enqueueSnackbar(err.message, { variant: 'error' });
} finally {
  setLoading(false);
}
\`\`\`

## Files to Modify
- \`frontend/src/components/ErrorBoundary.tsx\` (create)
- \`frontend/src/services/api.ts\`
- \`frontend/src/App.tsx\`
- \`backend/src/middleware/errorHandler.ts\`
- All page components (add loading/error states)

## Acceptance Criteria
- [ ] Global error boundary catches React errors
- [ ] Toast notifications for all API errors
- [ ] Retry logic for network failures
- [ ] User-friendly error messages
- [ ] Loading states on all async operations
- [ ] Standardized error response format
- [ ] Offline detection and messaging

## Estimated Effort
8-10 hours" \
"priority: high,P1,error-handling,ux"

create_issue \
"[P1] Add Rate Limiting to Authentication Endpoints" \
"## Problem
Rate limiting is only applied to \`/api/\` routes globally. Authentication endpoints need stricter limits to prevent brute force attacks and credential stuffing.

## Security Risk
- Vulnerable to brute force password attacks
- No protection against credential stuffing
- Could lead to account compromise
- No lockout mechanism

## Current Implementation
\`\`\`typescript
// backend/src/index.ts
app.use('/api/', rateLimiter); // Generic rate limit
\`\`\`

## Proposed Implementation

### 1. Create Auth-Specific Rate Limiter

**\`backend/src/middleware/authRateLimiter.ts\`:**
\`\`\`typescript
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

// Strict rate limit for login attempts
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(\`Rate limit exceeded for login from IP: \${req.ip}\`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many login attempts. Please try again in 15 minutes.',
      },
    });
  },
});

// Moderate rate limit for registration
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REGISTRATIONS',
      message: 'Too many registration attempts. Please try again later.',
    },
  },
});

// Rate limit for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_RESET_REQUESTS',
      message: 'Too many password reset requests. Please try again later.',
    },
  },
});
\`\`\`

### 2. Apply to Auth Routes

**Update \`backend/src/routes/auth.routes.ts\`:**
\`\`\`typescript
import { loginLimiter, registerLimiter } from '../middleware/authRateLimiter';

router.post('/login', loginLimiter, login);
router.post('/register', registerLimiter, register);
router.post('/refresh', loginLimiter, refreshToken);
\`\`\`

### 3. Add Account Lockout (Optional Enhancement)

**\`backend/src/middleware/accountLockout.ts\`:**
\`\`\`typescript
import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export async function checkAccountLockout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { email } = req.body;
  
  if (!email) {
    return next();
  }
  
  // Check failed attempts (would need to add to User model)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { 
      failedLoginAttempts: true,
      lastFailedLogin: true,
      isBlocked: true 
    },
  });
  
  if (!user) {
    return next();
  }
  
  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: 'Account is locked. Please contact support.',
      },
    });
  }
  
  // Check if account is temporarily locked
  if (
    user.failedLoginAttempts >= LOCKOUT_THRESHOLD &&
    user.lastFailedLogin &&
    Date.now() - user.lastFailedLogin.getTime() < LOCKOUT_DURATION
  ) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'ACCOUNT_TEMPORARILY_LOCKED',
        message: 'Too many failed attempts. Account locked for 30 minutes.',
      },
    });
  }
  
  next();
}
\`\`\`

## Testing

### Manual Testing
\`\`\`bash
# Test login rate limit
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \\
    -H \"Content-Type: application/json\" \\
    -d '{\"email\":\"test@example.com\",\"password\":\"wrong\"}'
  echo \"Attempt \$i\"
done
# 6th attempt should return 429
\`\`\`

### Automated Tests
\`\`\`typescript
describe('Auth Rate Limiting', () => {
  it('should block after 5 failed login attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });
    }
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });
    
    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('TOO_MANY_ATTEMPTS');
  });
});
\`\`\`

## Files to Modify
- \`backend/src/middleware/authRateLimiter.ts\` (create)
- \`backend/src/routes/auth.routes.ts\`
- \`backend/src/middleware/accountLockout.ts\` (create, optional)
- \`backend/prisma/schema.prisma\` (add lockout fields, optional)

## Acceptance Criteria
- [ ] Login limited to 5 attempts per 15 minutes
- [ ] Registration limited to 3 per hour
- [ ] Clear error messages for rate limit exceeded
- [ ] Logs rate limit violations
- [ ] Tests verify rate limiting works
- [ ] Optional: Account lockout after repeated failures

## Estimated Effort
4-6 hours (basic), 8-10 hours (with account lockout)" \
"priority: high,P1,security,authentication"

create_issue \
"[P1] Add Input Sanitization for User Content" \
"## Problem
Recipe instructions and other user-generated content accept arbitrary HTML/text without sanitization, creating potential XSS vulnerabilities.

## Security Risk
- Stored XSS attacks possible
- Malicious scripts could be injected
- User data at risk
- Session hijacking potential

## Vulnerable Fields
- Recipe instructions
- Recipe descriptions
- Recipe titles
- Grocery list item notes
- Meal plan notes
- User profile data

## Implementation Plan

### 1. Backend Sanitization

**Install sanitization library:**
\`\`\`bash
cd backend
pnpm add dompurify jsdom
pnpm add -D @types/dompurify @types/jsdom
\`\`\`

**Create sanitization utility (\`backend/src/utils/sanitize.ts\`):**
\`\`\`typescript
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window as unknown as Window);

// Configure allowed tags and attributes
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
];

const ALLOWED_ATTR = ['class'];

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
  });
}

export function sanitizeText(text: string): string {
  // Remove all HTML tags
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
}

export function sanitizeRecipeData(data: any): any {
  return {
    ...data,
    title: sanitizeText(data.title),
    description: data.description ? sanitizeHtml(data.description) : null,
    instructions: Array.isArray(data.instructions)
      ? data.instructions.map((inst: string) => sanitizeHtml(inst))
      : sanitizeHtml(data.instructions),
  };
}
\`\`\`

### 2. Apply to Controllers

**Update \`backend/src/controllers/recipe.controller.ts\`:**
\`\`\`typescript
import { sanitizeRecipeData } from '../utils/sanitize';

export async function createRecipe(req: Request, res: Response) {
  // Sanitize input
  const sanitizedData = sanitizeRecipeData(req.body);
  
  // Continue with sanitized data
  const recipe = await prisma.recipe.create({
    data: sanitizedData,
  });
  
  // ...
}
\`\`\`

### 3. Frontend Sanitization (Defense in Depth)

**Install DOMPurify for frontend:**
\`\`\`bash
cd frontend
pnpm add dompurify
pnpm add -D @types/dompurify
\`\`\`

**Create utility (\`frontend/src/utils/sanitize.ts\`):**
\`\`\`typescript
import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: [],
  });
}

// Use when rendering user content
export function SafeHtml({ html }: { html: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(html)
      }}
    />
  );
}
\`\`\`

### 4. Validation Schema Updates

**Update \`backend/src/validation/schemas.ts\`:**
\`\`\`typescript
import { z } from 'zod';

// Add custom sanitization transform
const sanitizedString = z.string().transform((val) => sanitizeText(val));

export const createRecipeSchema = z.object({
  title: sanitizedString.min(1).max(200),
  description: z.string().max(1000).optional().transform((val) => 
    val ? sanitizeHtml(val) : null
  ),
  instructions: z.array(z.string()).transform((arr) =>
    arr.map(inst => sanitizeHtml(inst))
  ),
  // ... other fields
});
\`\`\`

### 5. Content Security Policy Enhancement

**Update \`nginx/default.conf\` (already done):**
\`\`\`nginx
add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:;\" always;
\`\`\`

## Testing

### XSS Attack Tests
\`\`\`typescript
describe('Input Sanitization', () => {
  it('should remove script tags from recipe instructions', async () => {
    const malicious = '<script>alert(\"XSS\")</script>Mix ingredients';
    const response = await request(app)
      .post('/api/recipes')
      .send({
        title: 'Test Recipe',
        instructions: [malicious],
      });
    
    expect(response.body.data.instructions[0]).not.toContain('<script>');
    expect(response.body.data.instructions[0]).toContain('Mix ingredients');
  });
  
  it('should remove event handlers', async () => {
    const malicious = '<p onclick=\"alert(1)\">Click me</p>';
    const sanitized = sanitizeHtml(malicious);
    expect(sanitized).not.toContain('onclick');
  });
});
\`\`\`

## Files to Modify
- \`backend/src/utils/sanitize.ts\` (create)
- \`backend/src/controllers/recipe.controller.ts\`
- \`backend/src/controllers/groceryList.controller.ts\`
- \`backend/src/controllers/mealPlan.controller.ts\`
- \`backend/src/validation/schemas.ts\`
- \`frontend/src/utils/sanitize.ts\` (create)
- \`frontend/src/components/SafeHtml.tsx\` (create)

## Acceptance Criteria
- [ ] All user input sanitized on backend
- [ ] Script tags removed
- [ ] Event handlers removed
- [ ] Safe HTML tags preserved (p, br, strong, etc.)
- [ ] Frontend also sanitizes (defense in depth)
- [ ] Tests verify XSS prevention
- [ ] CSP headers properly configured

## Estimated Effort
6-8 hours" \
"priority: high,P1,security,validation"

# ============================================================================
# P2 - MEDIUM PRIORITY
# ============================================================================

create_issue \
"[P2] Create Troubleshooting Guide" \
"## Problem
No comprehensive troubleshooting guide for common issues. Users and developers struggle with:
- Database connection errors
- Authentication problems
- Image loading failures
- Port conflicts
- Container startup issues

## Implementation

Create \`TROUBLESHOOTING.md\` with the following sections:

### 1. Common Issues

#### Database Connection Errors
\`\`\`
Error: Can't reach database server at postgres:5432
Solution:
1. Check if postgres container is running: podman ps
2. Verify DATABASE_URL in .env
3. Check secrets are properly mounted
4. Restart postgres: podman-compose restart postgres
\`\`\`

#### Authentication Fails
\`\`\`
Error: Invalid token / 401 Unauthorized
Solutions:
1. Clear browser localStorage
2. Check JWT secrets are set
3. Verify token expiration settings
4. Check CORS_ORIGIN matches frontend URL
\`\`\`

#### Images Not Loading
\`\`\`
Error: CSP violation / Images show \"No Image\"
Solutions:
1. Check nginx CSP header includes blob: and https:
2. Verify image proxy endpoint working
3. Check CORS headers
4. Clear browser cache
\`\`\`

#### Port Already in Use
\`\`\`
Error: Port 8080 already in use
Solutions:
1. Find process: lsof -i :8080
2. Kill process: kill -9 <PID>
3. Or change port in podman-compose.yml
\`\`\`

### 2. Debug Commands

\`\`\`bash
# Check container status
podman-compose ps

# View logs
podman logs meals-backend
podman logs meals-postgres

# Check database
podman exec -it meals-postgres psql -U mealplanner -d meal_planner

# Test API
curl http://localhost:8080/health

# Check secrets
podman exec meals-backend ls -la /run/secrets/
\`\`\`

### 3. Reset Procedures

#### Full Reset
\`\`\`bash
podman-compose down
podman volume rm mealplanner_postgres_data
podman-compose up -d
\`\`\`

#### Database Only
\`\`\`bash
podman-compose restart postgres
podman exec -i meals-postgres psql -U mealplanner -d meal_planner < database/init/02-test-data.sql
\`\`\`

### 4. Performance Issues

#### Slow Queries
- Check database indexes
- Review Prisma query patterns
- Enable query logging

#### High Memory Usage
- Check for memory leaks
- Review cache size
- Monitor container resources

### 5. Development Issues

#### Hot Reload Not Working
- Check nodemon configuration
- Verify volume mounts
- Restart dev server

#### TypeScript Errors
- Run: pnpm build
- Check tsconfig.json
- Clear node_modules and reinstall

## Files to Create
- \`TROUBLESHOOTING.md\`

## Acceptance Criteria
- [ ] Covers all common issues from user testing
- [ ] Includes debug commands
- [ ] Has reset procedures
- [ ] Links to relevant documentation
- [ ] Easy to search and navigate

## Estimated Effort
3-4 hours" \
"priority: medium,P2,documentation,support"

create_issue \
"[P2] Decide on Caching Strategy: Redis vs NodeCache" \
"## Problem
Misleading architecture: Redis container runs but application uses NodeCache (in-memory). This causes:
- Wasted resources running Redis
- Cache doesn't persist across restarts
- Cannot scale horizontally
- Documentation inaccuracy

## Current State
- \`podman-compose.yml\` includes Redis service
- \`backend/src/utils/cache.ts\` uses NodeCache
- Documentation claims Redis caching
- No actual Redis client initialization

## Options

### Option A: Remove Redis (Recommended for MVP)
**Pros:**
- Simpler architecture
- Fewer dependencies
- Sufficient for single-instance deployment
- No additional configuration needed

**Cons:**
- Cache lost on restart
- Cannot scale horizontally
- No shared cache across instances

**Implementation:**
1. Remove Redis from \`podman-compose.yml\`
2. Update documentation
3. Keep NodeCache implementation
4. Add note about Redis for future scaling

### Option B: Implement Redis Properly
**Pros:**
- Cache persists across restarts
- Can scale horizontally
- Better for production
- Shared cache across instances

**Cons:**
- More complex
- Additional configuration
- Requires Redis client setup
- More moving parts

**Implementation:**
1. Install redis client: \`pnpm add redis\`
2. Create Redis client in \`backend/src/utils/cache.ts\`
3. Update all cache operations
4. Add Redis health checks
5. Update documentation

## Recommendation

**For MVP: Option A (Remove Redis)**
- Simpler is better for current scale
- Can add Redis later when needed
- Reduces complexity and maintenance

**For Production Scale: Option B (Implement Redis)**
- When horizontal scaling needed
- When cache persistence critical
- When multiple instances required

## Implementation (Option A - Recommended)

### 1. Update podman-compose.yml
Remove Redis service entirely

### 2. Update Documentation
- README.md: Remove Redis from tech stack
- ARCHITECTURE.md: Update caching section
- Add note: \"Redis support planned for horizontal scaling\"

### 3. Keep Current Implementation
NodeCache is working fine for single instance

## Implementation (Option B - If Chosen)

### 1. Install Redis Client
\`\`\`bash
cd backend
pnpm add redis
pnpm add -D @types/redis
\`\`\`

### 2. Update cache.ts
\`\`\`typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
});

redisClient.on('error', (err) => logger.error('Redis error:', err));

export async function initializeCache() {
  await redisClient.connect();
  logger.info('Redis cache initialized');
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheSet(
  key: string,
  value: any,
  ttlSeconds: number = 600
): Promise<void> {
  await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
}
\`\`\`

## Decision Criteria
- Current scale: Single instance → Option A
- Future scale: Multiple instances → Option B
- Cache persistence critical → Option B
- Simplicity preferred → Option A

## Files to Modify
- \`podman-compose.yml\`
- \`backend/src/utils/cache.ts\`
- \`README.md\`
- \`docs/ARCHITECTURE.md\`

## Acceptance Criteria
- [ ] Decision documented
- [ ] Implementation matches documentation
- [ ] No unused services running
- [ ] Cache works as expected
- [ ] Tests updated

## Estimated Effort
- Option A: 1-2 hours
- Option B: 4-6 hours" \
"priority: medium,P2,architecture,caching,technical-debt"

create_issue \
"[P2] Remove Unused Files and Dead Code" \
"## Problem
Repository contains unused files and dead code that cause confusion:
- \`docker-compose.yml.REFERENCE_ONLY\` - unclear purpose
- Unused variables in components
- Multiple overlapping documentation files
- Outdated test data SQL

## Files to Review

### 1. docker-compose.yml.REFERENCE_ONLY
**Action:** Delete or move to \`docs/examples/\`
**Reason:** Confusing which compose file to use

### 2. Unused Variables
**File:** \`frontend/src/pages/MealPlanner.tsx\` line 97
\`\`\`typescript
const [, setFamilyMembersLoading] = useState(false);
\`\`\`
**Action:** Remove or use for loading state

### 3. Overlapping Documentation
**Files:**
- \`USER_TESTING_SUMMARY.md\`
- \`USER_TESTING_BUG_SUMMARY.md\` (referenced but doesn't exist)
- \`USER_TESTING_ISSUES_LOG.md\`
- \`P0_BUG_FIXES_PLAN.md\`

**Action:** Consolidate into:
- \`docs/testing/USER_TESTING_RESULTS.md\` (archive)
- GitHub issues for active bugs

### 4. Outdated Test Data
**File:** \`database/init/02-test-data.sql\`
**Issue:** Schema mismatch with current Prisma schema
**Action:** Update or remove, document that UI should be used

### 5. Unused Scripts
Review \`scripts/\` directory for:
- Duplicate scripts
- Outdated scripts
- Scripts that should be npm scripts

## Implementation Plan

### Phase 1: Safe Deletions
\`\`\`bash
# Move reference file
mkdir -p docs/examples
mv docker-compose.yml.REFERENCE_ONLY docs/examples/

# Archive old testing docs
mkdir -p docs/archive
mv USER_TESTING_*.md docs/archive/
mv P0_BUG_FIXES_PLAN.md docs/archive/
\`\`\`

### Phase 2: Code Cleanup
- Remove unused imports
- Remove unused variables
- Remove commented-out code
- Remove console.log statements

### Phase 3: Documentation Cleanup
- Update README to remove references to deleted files
- Create clear documentation structure
- Add README in docs/ explaining organization

## Linting Rules

Add ESLint rules to prevent future issues:
\`\`\`json
{
  \"rules\": {
    \"no-unused-vars\": \"error\",
    \"no-console\": \"warn\",
    \"@typescript-eslint/no-unused-vars\": \"error\"
  }
}
\`\`\`

## Files to Modify/Delete
- \`docker-compose.yml.REFERENCE_ONLY\` → delete or move
- \`frontend/src/pages/MealPlanner.tsx\` → fix unused var
- \`USER_TESTING_*.md\` → archive
- \`database/init/02-test-data.sql\` → update or document
- Various files → remove dead code

## Acceptance Criteria
- [ ] No unused files in root directory
- [ ] No unused variables (ESLint passes)
- [ ] Clear documentation structure
- [ ] No commented-out code
- [ ] No console.log in production code

## Estimated Effort
2-3 hours" \
"priority: medium,P2,technical-debt,cleanup"

create_issue \
"[P2] Add Frontend Logging Strategy" \
"## Problem
Frontend has no structured logging. Console.log statements scattered throughout code with no:
- Log levels
- Structured format
- Error tracking
- Production monitoring

## Impact
- Difficult to debug production issues
- No visibility into user errors
- Cannot track user flows
- No performance monitoring

## Implementation Plan

### 1. Install Logging Library

\`\`\`bash
cd frontend
pnpm add loglevel
\`\`\`

### 2. Create Logger Utility

**\`frontend/src/utils/logger.ts\`:**
\`\`\`typescript
import log from 'loglevel';

// Configure based on environment
if (import.meta.env.PROD) {
  log.setLevel('warn');
} else {
  log.setLevel('debug');
}

// Add custom formatting
const originalFactory = log.methodFactory;
log.methodFactory = function (methodName, logLevel, loggerName) {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  
  return function (...args) {
    const timestamp = new Date().toISOString();
    const prefix = \`[\${timestamp}] [\${methodName.toUpperCase()}]\`;
    rawMethod(prefix, ...args);
  };
};

log.setLevel(log.getLevel()); // Apply custom formatting

export const logger = {
  debug: (...args: any[]) => log.debug(...args),
  info: (...args: any[]) => log.info(...args),
  warn: (...args: any[]) => log.warn(...args),
  error: (...args: any[]) => log.error(...args),
};

// Optional: Send errors to monitoring service
export function logError(error: Error, context?: Record<string, any>) {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    context,
  });
  
  // TODO: Send to Sentry or similar service
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { extra: context });
  // }
}
\`\`\`

### 3. Replace console.log

**Before:**
\`\`\`typescript
console.log('Loading recipes...');
console.error('Failed to load:', error);
\`\`\`

**After:**
\`\`\`typescript
import { logger, logError } from '../utils/logger';

logger.debug('Loading recipes...');
logError(error, { component: 'RecipeList', action: 'load' });
\`\`\`

### 4. Add Performance Logging

**\`frontend/src/utils/performance.ts\`:**
\`\`\`typescript
import { logger } from './logger';

export function measurePerformance(name: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = performance.now() - start;
      logger.debug(\`Performance [\${name}]: \${duration.toFixed(2)}ms\`);
      
      // Warn if slow
      if (duration > 1000) {
        logger.warn(\`Slow operation [\${name}]: \${duration.toFixed(2)}ms\`);
      }
    },
  };
}

// Usage
const perf = measurePerformance('Load Recipes');
await fetchRecipes();
perf.end();
\`\`\`

### 5. Add User Action Tracking

**\`frontend/src/utils/analytics.ts\`:**
\`\`\`typescript
import { logger } from './logger';

export function trackUserAction(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  logger.info('User action:', { action, category, label, value });
  
  // TODO: Send to analytics service
  // if (import.meta.env.PROD) {
  //   gtag('event', action, { category, label, value });
  // }
}

// Usage
trackUserAction('create_recipe', 'recipes', 'breakfast');
trackUserAction('add_to_meal_plan', 'meal_planning', recipeId);
\`\`\`

### 6. Error Boundary Integration

Update ErrorBoundary to use logger:
\`\`\`typescript
import { logError } from '../utils/logger';

public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  logError(error, {
    componentStack: errorInfo.componentStack,
    component: 'ErrorBoundary',
  });
}
\`\`\`

### 7. API Error Logging

Update api.ts to log errors:
\`\`\`typescript
import { logger } from '../utils/logger';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    logger.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
\`\`\`

## Optional: Add Sentry Integration

\`\`\`bash
pnpm add @sentry/react
\`\`\`

\`\`\`typescript
import * as Sentry from '@sentry/react';

