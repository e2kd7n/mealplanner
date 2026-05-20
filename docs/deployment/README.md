/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Deployment Documentation

This directory contains all documentation related to deploying and running the Meal Planner application in various environments.

## Quick Reference

### Common Tasks
- **Start local development**: See [Local Development](LOCAL_DEVELOPMENT.md)
- **Deploy to production**: See [Deployment Guide](DEPLOYMENT.md)
- **Deploy to Raspberry Pi**: See [Raspberry Pi Deployment](RASPBERRY_PI_DEPLOYMENT.md)
- **Build locally**: See [Build Locally](BUILD_LOCALLY.md)
- **Troubleshoot Pi issues**: See [Raspberry Pi Troubleshooting](RASPBERRY_PI_TROUBLESHOOTING.md)

### Deployment Modes
The application supports two distinct deployment modes:
1. **Local Development** (port 5173) - Hot reload, development tools
2. **Container** (port 8080) - Production-ready, optimized builds

Use `./scripts/menu.sh` to check current mode and switch between them.

## Documentation Files

### Getting Started

#### [Local Development](LOCAL_DEVELOPMENT.md)
Complete guide for running the application locally for development:
- Prerequisites and dependencies
- Environment setup
- Running frontend and backend
- Hot reload configuration
- Development tools

#### [Build Locally](BUILD_LOCALLY.md)
Instructions for building the application locally:
- Build process overview
- Frontend build with Vite
- Backend compilation
- Build optimization
- Troubleshooting build issues

### Production Deployment

#### [Deployment Guide](DEPLOYMENT.md)
Comprehensive production deployment guide:
- Container orchestration with Podman/Docker
- Environment configuration
- Secret management
- Database setup
- Reverse proxy configuration
- SSL/TLS setup
- Health checks and monitoring

#### [Subdirectory Deployment](SUBDIRECTORY_DEPLOYMENT.md)
Deploy the application under a subdirectory path:
- Nginx configuration for subdirectories
- Frontend routing adjustments
- API path configuration
- Asset path handling

### Raspberry Pi Deployment

#### [Raspberry Pi Deployment](RASPBERRY_PI_DEPLOYMENT.md)
Complete guide for deploying to Raspberry Pi:
- Hardware requirements
- OS setup and configuration
- ARM-specific build considerations
- Performance optimization
- Resource constraints
- Monitoring on Pi

#### [Raspberry Pi Troubleshooting](RASPBERRY_PI_TROUBLESHOOTING.md)
Common issues and solutions for Pi deployment:
- Build failures on ARM
- Memory issues
- Performance problems
- Network configuration
- Storage optimization
- Container issues

#### [SD Card Cloning Guide](SD_CARD_CLONING_GUIDE.md)
Clone SD cards for multiple Pi deployments:
- Backup and restore procedures
- Image creation
- Cloning tools
- Post-clone configuration
- Network setup for clones

### Container Management

#### [Podman Docker Compatibility](PODMAN_DOCKER_COMPATIBILITY.md)
Using Podman as a Docker alternative:
- Podman vs Docker differences
- Command compatibility
- Rootless containers
- Pod management
- Migration from Docker
- Troubleshooting

## Deployment Options Overview

### Local Development
**Best for**: Active development, testing, debugging
- **Port**: 5173 (frontend), 3000 (backend)
- **Hot Reload**: Enabled
- **Build**: Development mode
- **Tools**: Full dev tools, source maps
- **Start**: `./scripts/local-run.sh`

### Container (Production)
**Best for**: Production, staging, testing production builds
- **Port**: 8080 (unified)
- **Hot Reload**: Disabled
- **Build**: Production optimized
- **Tools**: Minimal, optimized
- **Start**: `./scripts/deploy-podman.sh`

### Raspberry Pi
**Best for**: Edge deployment, home server, low-power hosting
- **Architecture**: ARM64
- **Resources**: Limited (1-4GB RAM)
- **Build**: Optimized for ARM
- **Monitoring**: Lightweight tools
- **Start**: `./scripts/pi-deploy-from-registry.sh`

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/mealplanner

# JWT Secret
JWT_SECRET=your-secret-key

# Spoonacular API (optional)
SPOONACULAR_API_KEY=your-api-key

# Node Environment
NODE_ENV=production
```

### Secret Management
Secrets should be stored in `/run/secrets/` (Docker/Podman) or secure file paths. See [Secrets Management](../security/SECRETS_MANAGEMENT.md) for details.

## Deployment Checklist

### Pre-Deployment
- [ ] Review [Deployment Guide](DEPLOYMENT.md)
- [ ] Configure environment variables
- [ ] Set up secrets management
- [ ] Configure database connection
- [ ] Test database migrations
- [ ] Build and test locally

### Deployment
- [ ] Deploy containers
- [ ] Run database migrations
- [ ] Verify health checks
- [ ] Test API endpoints
- [ ] Test frontend access
- [ ] Configure monitoring

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Verify database connectivity
- [ ] Test user authentication
- [ ] Check performance metrics
- [ ] Set up automated backups
- [ ] Document deployment specifics

## Troubleshooting

### Common Issues

**Container won't start**
- Check logs: `podman logs mealplanner-backend`
- Verify environment variables
- Check port conflicts
- Review [Deployment Guide](DEPLOYMENT.md)

**Database connection fails**
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database is running
- Review [Secrets Management](../security/SECRETS_MANAGEMENT.md)

**Build fails on Raspberry Pi**
- Check available memory
- Review [Pi Troubleshooting](RASPBERRY_PI_TROUBLESHOOTING.md)
- Verify ARM compatibility
- Check [Pi Optimization](../infrastructure/PI_OPTIMIZATION.md)

**Frontend not loading**
- Check nginx configuration
- Verify asset paths
- Review [Subdirectory Deployment](SUBDIRECTORY_DEPLOYMENT.md)
- Check browser console for errors

## Related Documentation

### Infrastructure
- [Database Backup](../infrastructure/DATABASE_BACKUP.md) - Backup procedures
- [Monitoring](../infrastructure/MONITORING.md) - System monitoring
- [Performance Optimization](../infrastructure/PERFORMANCE_OPTIMIZATION.md) - Performance tuning
- [Pi Optimization](../infrastructure/PI_OPTIMIZATION.md) - Raspberry Pi optimizations

### Security
- [Secrets Management](../security/SECRETS_MANAGEMENT.md) - Secure secret handling

### Development
- [Setup Guide](../development/SETUP.md) - Development environment setup
- [Workflow Guide](../development/WORKFLOW_GUIDE.md) - Development workflows

## Scripts Reference

### Local Development
- `./scripts/local-run.sh` - Start local development
- `./scripts/local-stop.sh` - Stop local services
- `./scripts/local-bounce.sh` - Restart local services

### Container Deployment
- `./scripts/deploy-podman.sh` - Deploy with Podman
- `./scripts/check-deployment-mode.sh` - Check current mode

### Raspberry Pi
- `./scripts/pi-deploy-from-registry.sh` - Deploy to Pi
- `./scripts/pi-bounce.sh` - Restart Pi services
- `./scripts/build-for-pi.sh` - Build for ARM architecture
- `./scripts/load-pi-images.sh` - Load images to Pi

### Utilities
- `./scripts/menu.sh` - Interactive deployment menu
- `./scripts/check-platform.sh` - Check platform compatibility
- `./scripts/check-pi-architecture.sh` - Verify Pi architecture

## Best Practices

1. **Always use scripts** - Don't run services manually
2. **Check deployment mode** - Use `./scripts/menu.sh` before starting
3. **Test locally first** - Verify changes in local mode before deploying
4. **Monitor after deployment** - Watch logs and metrics after deploying
5. **Keep secrets secure** - Never commit secrets to version control
6. **Document changes** - Update deployment docs when changing configuration
7. **Use health checks** - Verify services are healthy after deployment
8. **Backup before migrating** - Always backup database before schema changes

---

[← Back to Documentation Hub](../README.md)

// Made with Bob