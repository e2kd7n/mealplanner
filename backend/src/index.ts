/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */


import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer, Server as HttpServer } from 'http';
import { createServer as createHttpsServer, Server as HttpsServer } from 'https';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Validate environment variables before proceeding
import { validateEnvironment } from './utils/validateEnv';
import { getHealthStatus } from './utils/monitoring';
validateEnvironment();

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import familyMemberRoutes from './routes/familyMember.routes';
import recipeRoutes from './routes/recipe.routes';
import recipeImportRoutes from './routes/recipeImport.routes';
import recipeBrowseRoutes from './routes/recipeBrowse.routes';
import mealPlanRoutes from './routes/mealPlan.routes';
import groceryListRoutes from './routes/groceryList.routes';
import ingredientRoutes from './routes/ingredient.routes';
import pantryRoutes from './routes/pantry.routes';
import adminRoutes from './routes/admin.routes';
import imageRoutes from './routes/image.routes';
import logsRoutes from './routes/logs.routes';
import feedbackRoutes from './routes/feedback.routes';
import appSettingsRoutes from './routes/appSettings.routes';
import visualAuthRoutes from './routes/visualAuth.routes';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import rateLimiter from './middleware/rateLimiter';
import { conditionalCsrfProtection, csrfProtection, getCsrfToken, csrfErrorHandler } from './middleware/csrf';

// Import utilities
import { logger } from './utils/logger';
import { initializeCache } from './utils/cache';
import { metricsMiddleware } from './utils/monitoring';
import { promRegistry } from './utils/prometheus';
import logPruner from './utils/logPruner';
import { initializeWebSocket } from './services/websocket.service';
import { appSettingsService } from './services/appSettings.service';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
const HOST = process.env.HOST || '0.0.0.0';
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || '/app/certs/key.pem';
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || '/app/certs/cert.pem';

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser (required for CSRF)
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Performance metrics tracking
app.use(metricsMiddleware);

// Rate limiting
app.use('/api/', rateLimiter);

// CSRF protection for API routes (conditionally applied)
app.use('/api/', conditionalCsrfProtection);

// Welcome endpoint - minimal information disclosure
app.get('/', (_req, res) => {
  res.json({
    name: 'Meal Planner API',
    status: 'running',
    documentation: 'Contact administrator for API documentation',
  });
});

// Health check endpoints
app.get('/health', async (_req, res) => {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Simple health check for load balancers
app.get('/health/live', (_req, res) => {
  res.json({ status: 'ok' });
});

// Prometheus metrics — not proxied by Nginx so only reachable from within the
// Docker network (Prometheus scrapes it directly at backend:3000/metrics)
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', promRegistry.contentType);
    res.end(await promRegistry.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// CSRF token endpoint (needs CSRF middleware but doesn't validate token)
// Apply csrfProtection directly here so it initializes but doesn't validate
app.get('/api/csrf-token', csrfProtection, getCsrfToken);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', visualAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/family-members', familyMemberRoutes);
app.use('/api/recipes/import', recipeImportRoutes);
app.use('/api/recipes/browse', recipeBrowseRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/grocery-lists', groceryListRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/settings', appSettingsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/setup', appSettingsRoutes);

// Serve static files from frontend build (in production)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../public');
  app.use(express.static(frontendPath));
  
  // Catch-all route for SPA - must be after API routes
  // Only catch routes that don't start with /api or /health
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // 404 handler for development (when frontend runs separately)
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.path} not found`,
    });
  });
}

// CSRF error handler (before general error handler)
app.use(csrfErrorHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Create HTTP or HTTPS server based on configuration
let server: HttpServer | HttpsServer;
if (USE_HTTPS) {
  // In production, fail closed if HTTPS is required but certs are missing
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!existsSync(SSL_KEY_PATH) || !existsSync(SSL_CERT_PATH)) {
    const errorMsg = `HTTPS enabled but certificates not found at ${SSL_KEY_PATH} or ${SSL_CERT_PATH}`;
    if (isProduction) {
      logger.error(`${errorMsg} - refusing to start in production without HTTPS`);
      throw new Error(errorMsg);
    } else {
      logger.warn(`${errorMsg} - falling back to HTTP in development`);
      server = createServer(app);
    }
  } else {
    try {
      const httpsOptions = {
        key: readFileSync(SSL_KEY_PATH),
        cert: readFileSync(SSL_CERT_PATH),
      };
      server = createHttpsServer(httpsOptions, app);
      logger.info('HTTPS server configured');
    } catch (error) {
      const errorMsg = 'Failed to load SSL certificates';
      if (isProduction) {
        logger.error(`${errorMsg} - refusing to start in production without HTTPS:`, error);
        throw error;
      } else {
        logger.error(`${errorMsg}, falling back to HTTP in development:`, error);
        server = createServer(app);
      }
    }
  }
} else {
  server = createServer(app);
}

// Initialize services and start server
async function startServer() {
  try {
    // Initialize in-memory cache
    initializeCache();
    logger.info('In-memory cache initialized successfully');

    // Start log pruner (runs every 24 hours by default)
    logPruner.start();
    logger.info('Log pruner started');

    // Initialize app settings (seeds DB defaults / env-var migration)
    await appSettingsService.initialize();
    logger.info('App settings initialized');

    // Initialize WebSocket service
    initializeWebSocket(server);
    logger.info('WebSocket service initialized');

    // Start server
    const serverPort = USE_HTTPS && existsSync(SSL_KEY_PATH) && existsSync(SSL_CERT_PATH) ? HTTPS_PORT : PORT;
    const protocol = USE_HTTPS && existsSync(SSL_KEY_PATH) && existsSync(SSL_CERT_PATH) ? 'https' : 'http';
    
    server.listen(serverPort, () => {
      logger.info(`Server running on ${protocol}://${HOST}:${serverPort}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (USE_HTTPS) {
        logger.info(`HTTPS enabled: ${existsSync(SSL_KEY_PATH) && existsSync(SSL_CERT_PATH)}`);
      }
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
