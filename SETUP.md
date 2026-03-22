# Development Environment Setup Guide

## Prerequisites Installation for macOS

This guide will help you set up the development environment for the Family Meal Planner application.

## 1. Install Homebrew (if not already installed)

Homebrew is a package manager for macOS that makes installing development tools easy.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the instructions to add Homebrew to your PATH.

## 2. Install Node.js

We'll use Node.js LTS (Long Term Support) version:

```bash
brew install node
```

Verify installation:
```bash
node --version  # Should show v20.x.x or similar
npm --version   # Should show 10.x.x or similar
```

## 3. Install pnpm (Recommended Package Manager)

According to the project plan, we're using pnpm as the package manager:

```bash
npm install -g pnpm
```

Verify installation:
```bash
pnpm --version  # Should show 8.x.x or similar
```

## 4. Install Podman and Podman Compose

Podman is a daemonless container engine that's compatible with Docker. We'll use it for running PostgreSQL, Redis, and containerizing the application.

### Install Podman
```bash
brew install podman
```

### Install Podman Compose
```bash
brew install podman-compose
```

### Initialize Podman Machine (required on macOS)
```bash
podman machine init
podman machine start
```

Verify installation:
```bash
podman --version
podman-compose --version
podman machine list  # Should show a running machine
```

### Set up Podman alias (optional, for Docker compatibility)
```bash
# Optional: Create aliases if you prefer docker commands
echo 'alias docker=podman' >> ~/.zshrc
echo 'alias docker-compose=podman-compose' >> ~/.zshrc
source ~/.zshrc
```

## 5. Install Git (if not already installed)

```bash
brew install git
```

Configure Git:
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 6. Optional but Recommended Tools

### VS Code Extensions
If using VS Code, install these extensions:
- ESLint
- Prettier - Code formatter
- TypeScript Vue Plugin (Volar)
- Prisma
- Docker
- GitLens

### PostgreSQL Client (for database management)
```bash
brew install postgresql@15
```

This installs the PostgreSQL client tools (psql) without running a server.

## 7. Verify All Installations

Run this command to verify everything is installed:

```bash
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "pnpm: $(pnpm --version)"
echo "Podman: $(podman --version)"
echo "Git: $(git --version)"
```

## Next Steps

Once all tools are installed, you can proceed with project initialization:

### 1. Initialize Frontend (React + TypeScript + Vite)
```bash
cd frontend
pnpm create vite . --template react-ts
pnpm install
```

### 2. Initialize Backend (Node.js + Express + TypeScript)
```bash
cd backend
pnpm init
pnpm add express cors dotenv
pnpm add -D typescript @types/node @types/express @types/cors ts-node nodemon
pnpm add prisma @prisma/client
pnpm add bcrypt jsonwebtoken
pnpm add -D @types/bcrypt @types/jsonwebtoken
```

### 3. Start Podman Services
```bash
# From project root
podman-compose up -d
```

## Troubleshooting

### Issue: Command not found after installation
**Solution**: Restart your terminal or run:
```bash
source ~/.zshrc  # or ~/.bash_profile for bash
```

### Issue: Podman machine not running
**Solution**: Start the Podman machine:
```bash
podman machine start
```

### Issue: Podman socket connection errors
**Solution**: Restart the Podman machine:
```bash
podman machine stop
podman machine start
```

### Issue: Permission denied errors with npm/pnpm
**Solution**: Never use sudo with npm/pnpm. If you have permission issues:
```bash
# Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Issue: Port already in use
**Solution**: Check what's using the port and stop it:
```bash
lsof -i :3000  # Check port 3000
lsof -i :5432  # Check PostgreSQL port
kill -9 <PID>  # Kill the process
```

## System Requirements

- **macOS**: 10.15 (Catalina) or later
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space minimum
- **Processor**: Intel or Apple Silicon (M1/M2/M3)

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [pnpm Documentation](https://pnpm.io/)
- [Podman Documentation](https://docs.podman.io/)
- [Vite Documentation](https://vitejs.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## Ready to Build!

Once you've completed this setup, return to the main development workflow and we'll begin building the application! 🚀