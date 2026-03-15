-- Database Initialization Script
-- This script runs automatically when PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create custom types (enums will be created by Prisma migrations)
-- This file is mainly for extensions and initial setup

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE meal_planner TO mealplanner;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully';
END $$;

-- Made with Bob
