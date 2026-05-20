# New Developer Quick Start Guide

**Welcome to the Meal Planner Project!**

This guide will help you get up and running quickly. For detailed information, see the full documentation in the `docs/` directory.

---

## 🚀 Quick Setup (5 minutes)

### Prerequisites
- Node.js 20+
- pnpm (or npm)
- PostgreSQL 16
- Git

### 1. Clone and Install
```bash
git clone <repository-url>
cd mealplanner

# Install dependencies
cd backend && pnpm install
cd ../frontend && pnpm install
```

### 2. Setup Environment
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Frontend  
cp frontend/.env.example frontend/.env
# Default values work for local development
```

### 3. Setup Database
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 5. Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Quick Test Login: Use the "Quick Test Login (Smith Family)" button

---

## 📁 Project Structure

```
mealplanner/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Auth, validation, etc.
│   │   ├── utils/       # Helpers, logger
│   │   └── validation/  # Zod schemas
│   ├── prisma/          # Database schema & migrations
│   └── package.json
│
├── frontend/            # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── store/      # Redux state management
│   │   ├── hooks/      # Custom React hooks
│   │   ├── services/   # API clients
│   │   └── utils/      # Helpers, logger
│   └── package.json
│
├── docs/               # Documentation
│   ├── ARCHITECTURE.md # System architecture
│   ├── SETUP.md       # Detailed setup guide
│   └── releases/      # Release notes
│
├── scripts/           # Utility scripts
├── nginx/             # Nginx configuration
└── database/          # SQL initialization scripts
```

---

## 🔑 Key Concepts

### Authentication
- JWT-based authentication
- Access tokens (15 min) + Refresh tokens (7 days)
- Tokens stored in localStorage
- Auth middleware on protected routes

### State Management
- Redux Toolkit for global state
- React Query for server state (planned)
- Local state with useState/useReducer

### API Communication
- RESTful API
- Axios for HTTP requests
- CSRF protection enabled
- Rate limiting on all endpoints

### Logging
- **Development:** Console logging enabled
- **Production:** Clean console, errors sent to backend
- Logger utility: `frontend/src/utils/logger.ts`
- Always wrap console statements in `if (import.meta.env.DEV)` checks

---

## 🛠️ Common Development Tasks

### Adding a New API Endpoint

1. **Create route** in `backend/src/routes/`
```typescript
// backend/src/routes/myfeature.routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  // Your logic here
  res.json({ data: [] });
});

export default router;
```

2. **Register route** in `backend/src/index.ts`
```typescript
import myFeatureRoutes from './routes/myfeature.routes';
app.use('/api/myfeature', myFeatureRoutes);
```

3. **Add validation** in `backend/src/validation/schemas.ts`
```typescript
export const myFeatureSchema = z.object({
  name: z.string().min(1).max(100),
  // ...
});
```

### Adding a New Frontend Page

1. **Create page component** in `frontend/src/pages/`
```typescript
// frontend/src/pages/MyFeature.tsx
import React from 'react';

const MyFeature: React.FC = () => {
  return <div>My Feature</div>;
};

export default MyFeature;
```

2. **Add route** in `frontend/src/App.tsx`
```typescript
<Route path="/myfeature" element={
  <PrivateRoute>
    <MyFeature />
  </PrivateRoute>
} />
```

3. **Add navigation** in `frontend/src/components/Layout.tsx`

### Database Changes

1. **Update schema** in `backend/prisma/schema.prisma`
2. **Create migration**
```bash
cd backend
npx prisma migrate dev --name add_my_feature
```
3. **Update seed data** if needed in `backend/prisma/seed.ts`

### Adding Redux State

1. **Create slice** in `frontend/src/store/slices/`
```typescript
// frontend/src/store/slices/myFeatureSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchMyData = createAsyncThunk(
  'myFeature/fetch',
  async () => {
    const response = await api.get('/myfeature');
    return response.data;
  }
);

const myFeatureSlice = createSlice({
  name: 'myFeature',
  initialState: { data: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMyData.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

export default myFeatureSlice.reducer;
```

2. **Register in store** in `frontend/src/store/index.ts`

---

## 🐛 Debugging Tips

### Backend Debugging
```typescript
// Use the logger utility
import logger from './utils/logger';

logger.info('Processing request', 'MyController', { userId, data });
logger.error('Failed to process', 'MyController', { error });
```

### Frontend Debugging
```typescript
// Development only
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}

// Production error tracking
import logger from '@/utils/logger';
logger.error('Failed to load', 'MyComponent', { error });
```

### Database Debugging
```bash
# View database
npx prisma studio

# Check migrations
npx prisma migrate status

# Reset database (CAUTION: deletes all data)
npx prisma migrate reset
```

---

## 📝 Code Style Guidelines

### TypeScript
- Use strict type checking
- Avoid `any` types
- Use interfaces for object shapes
- Use enums for constants

### React
- Functional components with hooks
- Use TypeScript for props
- Memoize expensive computations
- Keep components small and focused

### Naming Conventions
- **Files:** camelCase for utilities, PascalCase for components
- **Components:** PascalCase (e.g., `MyComponent.tsx`)
- **Functions:** camelCase (e.g., `fetchUserData`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Interfaces:** PascalCase with `I` prefix (e.g., `IUser`)

### Logging Rules
- ❌ NO `console.log()` in production code
- ✅ Use logger utility for errors
- ✅ Wrap debug console in DEV checks
- ✅ Sanitize sensitive data in logs

---

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# E2E tests
npm run test:e2e
```

### Writing Tests
- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Component tests for React components
- E2E tests for critical user flows

---

## 📚 Additional Resources

### Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SETUP.md](./SETUP.md) - Detailed setup guide
- [SECURITY_SETUP.md](./SECURITY_SETUP.md) - Security configuration
- [FRONTEND_LOGGING.md](./FRONTEND_LOGGING.md) - Logging details

### External Resources
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Material-UI Documentation](https://mui.com)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)

---

## 🆘 Getting Help

### Common Issues

**Port already in use:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**Database connection failed:**
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

**Module not found:**
```bash
# Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**Prisma issues:**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset database
npx prisma migrate reset
```

### Getting Support
1. Check existing documentation
2. Search closed GitHub issues
3. Ask in team chat
4. Create a GitHub issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details

---

## ✅ Checklist for First Contribution

- [ ] Read this guide
- [ ] Set up development environment
- [ ] Run application locally
- [ ] Explore the codebase
- [ ] Read ARCHITECTURE.md
- [ ] Make a small test change
- [ ] Run tests
- [ ] Create a pull request
- [ ] Celebrate! 🎉

---

**Happy Coding!** 🚀

For questions or issues, please refer to the main documentation or reach out to the team.