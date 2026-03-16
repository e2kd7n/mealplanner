/**
 * Copyright (c) 2026 Erik Didriksen
 * All rights reserved.
 */


import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import familyMemberRoutes from './routes/familyMember.routes';
import recipeRoutes from './routes/recipe.routes';
import recipeImportRoutes from './routes/recipeImport.routes';
import mealPlanRoutes from './routes/mealPlan.routes';
import groceryListRoutes from './routes/groceryList.routes';
import ingredientRoutes from './routes/ingredient.routes';
import pantryRoutes from './routes/pantry.routes';
import adminRoutes from './routes/admin.routes';
import imageRoutes from './routes/image.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import rateLimiter from './middleware/rateLimiter';

// Import utilities
import { logger } from './utils/logger';
import { connectRedis } from './utils/redis';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/', rateLimiter);

// Welcome endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Meal Planner API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      familyMembers: '/api/family-members',
      recipes: '/api/recipes',
      recipeImport: '/api/recipes/import',
      mealPlans: '/api/meal-plans',
      groceryLists: '/api/grocery-lists',
      ingredients: '/api/ingredients',
      pantry: '/api/pantry',
      admin: '/api/admin',
      images: '/api/images',
    },
    documentation: 'See README.md for API documentation',
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/recipes/import', recipeImportRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/grocery-lists', groceryListRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/images', imageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize services and start server
async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Press CTRL+C to stop');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
startServer();

export default app;

// Made with Bob
