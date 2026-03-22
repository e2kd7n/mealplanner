#!/bin/bash

# Project Initialization Script
# This script sets up the frontend and backend projects

set -e  # Exit on error

echo "🚀 Initializing Family Meal Planner Project..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js is not installed. Please install Node.js first.${NC}"
    echo "See SETUP.md for installation instructions."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm is not installed. Installing pnpm...${NC}"
    npm install -g pnpm
fi

# Check if podman is installed
if ! command -v podman &> /dev/null; then
    echo -e "${YELLOW}⚠️  Podman is not installed. Please install Podman first.${NC}"
    echo "See SETUP.md for installation instructions."
    exit 1
fi

echo -e "${BLUE}📦 Node.js version: $(node --version)${NC}"
echo -e "${BLUE}📦 pnpm version: $(pnpm --version)${NC}"
echo -e "${BLUE}📦 Podman version: $(podman --version)${NC}"
echo ""

# Initialize Frontend
echo -e "${GREEN}🎨 Initializing Frontend (React + TypeScript + Vite)...${NC}"
cd frontend

if [ ! -f "package.json" ]; then
    pnpm create vite . --template react-ts
    echo -e "${GREEN}✅ Frontend initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend already initialized${NC}"
fi

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
pnpm install

# Add additional frontend dependencies
echo -e "${BLUE}📦 Adding Material-UI and other dependencies...${NC}"
pnpm add @mui/material @emotion/react @emotion/styled
pnpm add @reduxjs/toolkit react-redux react-router-dom
pnpm add axios zod react-hook-form @hookform/resolvers
pnpm add date-fns recharts
pnpm add -D @types/react-redux

cd ..
echo -e "${GREEN}✅ Frontend setup complete${NC}"
echo ""

# Initialize Backend
echo -e "${GREEN}🔧 Initializing Backend (Node.js + Express + TypeScript)...${NC}"
cd backend

if [ ! -f "package.json" ]; then
    pnpm init
    echo -e "${GREEN}✅ Backend initialized${NC}"
else
    echo -e "${YELLOW}⚠️  Backend already initialized${NC}"
fi

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
pnpm add express cors dotenv
pnpm add bcrypt jsonwebtoken
pnpm add prisma @prisma/client
pnpm add node-cache
pnpm add express-rate-limit helmet
pnpm add winston

pnpm add -D typescript @types/node @types/express @types/cors
pnpm add -D @types/bcrypt @types/jsonwebtoken
pnpm add -D ts-node nodemon
pnpm add -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
pnpm add -D eslint prettier

cd ..
echo -e "${GREEN}✅ Backend setup complete${NC}"
echo ""

# Copy environment files
echo -e "${GREEN}📝 Setting up environment files...${NC}"

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env${NC}"
else
    echo -e "${YELLOW}⚠️  .env already exists${NC}"
fi

if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Created backend/.env${NC}"
else
    echo -e "${YELLOW}⚠️  backend/.env already exists${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ Created frontend/.env${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/.env already exists${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Project initialization complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review and update .env files with your configuration"
echo "2. Start Podman services: ${YELLOW}podman-compose up -d${NC}"
echo "3. Initialize database: ${YELLOW}cd backend && pnpm prisma migrate dev${NC}"
echo "4. Start backend: ${YELLOW}cd backend && pnpm dev${NC}"
echo "5. Start frontend: ${YELLOW}cd frontend && pnpm dev${NC}"
echo ""
echo -e "${BLUE}For more information, see README.md${NC}"

# Made with Bob
