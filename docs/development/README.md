/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Development Documentation

This directory contains all documentation for developers working on the Meal Planner application.

## Quick Reference

### Common Tasks
- **Get started**: See [Quick Start](QUICK_START.md)
- **Set up environment**: See [Setup Guide](SETUP.md)
- **Learn workflow**: See [Workflow Guide](WORKFLOW_GUIDE.md)
- **Manage issues**: See [Issue Management Automation](ISSUE_MANAGEMENT_AUTOMATION.md)
- **Use menu system**: See [Menu System](MENU_SYSTEM.md)
- **Update GitHub issues**: See [GitHub Issues Update Plan](GITHUB_ISSUES_UPDATE_PLAN.md)

## Documentation Files

### [Quick Start](QUICK_START.md)
Fast-track guide for new developers:
- Prerequisites
- Quick setup steps
- First run
- Common commands
- Next steps
- Troubleshooting

**Get Running in 5 Minutes**:
1. Clone repository
2. Install dependencies
3. Set up environment
4. Run database migrations
5. Start development servers

### [Setup Guide](SETUP.md)
Comprehensive development environment setup:
- System requirements
- Tool installation (Node.js, pnpm, Podman/Docker)
- Repository setup
- Database configuration
- Environment variables
- Secret management
- Development tools
- IDE configuration

**Key Requirements**:
- Node.js 18+ (20+ recommended)
- pnpm 8+
- Podman or Docker
- PostgreSQL 14+
- Git

### [Workflow Guide](WORKFLOW_GUIDE.md)
Complete development workflow and best practices:
- Git workflow (branching, commits, PRs)
- Code review process
- Testing requirements
- Documentation standards
- Issue management
- Release process
- Maintenance tasks

**Workflow Overview**:
1. Create feature branch
2. Implement changes
3. Write tests
4. Update documentation
5. Submit PR
6. Code review
7. Merge and deploy

### [Menu System](MENU_SYSTEM.md)
Interactive menu for common development tasks:
- Check deployment mode
- Switch between local/container modes
- Run services
- Database operations
- Testing
- Maintenance tasks

**Usage**:
```bash
./scripts/menu.sh
```

**Features**:
- Mode detection and switching
- Service management
- Database operations
- Quick access to common tasks

### [Issue Management Automation](ISSUE_MANAGEMENT_AUTOMATION.md)
Automated issue management and tracking:
- Issue creation automation
- Priority management
- Issue lifecycle
- Automated updates
- GitHub integration
- Maintenance workflows

**Key Scripts**:
- `./scripts/create-github-issues.sh` - Create issues from templates
- `./scripts/update-issue-priorities.sh` - Update ISSUE_PRIORITIES.md
- `./scripts/maintenance-issue-check.sh` - Weekly issue review

### [GitHub Issues Update Plan](GITHUB_ISSUES_UPDATE_PLAN.md)
Plan for updating and managing GitHub issues:
- Issue templates
- Labeling strategy
- Priority system
- Milestone planning
- Issue triage process
- Automation opportunities

### [CI/CD Strategy](CICD_STRATEGY.md)
Continuous Integration and Deployment strategy:
- GitHub Actions workflows
- Automated testing
- Build process
- Deployment automation
- Quality gates
- Rollback procedures

**CI/CD Pipeline**:
1. Code pushed to GitHub
2. Automated tests run
3. Build artifacts created
4. Quality checks performed
5. Deploy to staging (if main branch)
6. Manual approval for production
7. Deploy to production

### [New Developer Quick Start](NEW_DEVELOPER_QUICK_START.md)
Onboarding guide for new team members:
- Team introduction
- Codebase overview
- Development setup
- First tasks
- Resources and contacts
- Common questions

## Development Environment

### Local Development Mode
**Port 5173** - Development with hot reload
```bash
# Start local development
./scripts/local-run.sh

# Stop local development
./scripts/local-stop.sh

# Restart services
./scripts/local-bounce.sh
```

**Features**:
- Hot module replacement
- Source maps
- Development tools
- Fast iteration

### Container Mode
**Port 8080** - Production-like environment
```bash
# Deploy with Podman
./scripts/deploy-podman.sh

# Check deployment mode
./scripts/check-deployment-mode.sh
```

**Features**:
- Production builds
- Container orchestration
- Realistic environment
- Performance testing

### Switching Modes
```bash
# Use interactive menu
./scripts/menu.sh

# Or check current mode
./scripts/check-deployment-mode.sh
```

## Development Workflow

### Daily Workflow
1. **Pull latest changes**: `git pull origin main`
2. **Check deployment mode**: `./scripts/menu.sh`
3. **Start services**: `./scripts/local-run.sh`
4. **Make changes**: Edit code with hot reload
5. **Run tests**: `pnpm test` (frontend), `npm test` (backend)
6. **Commit changes**: Follow commit message format
7. **Push and create PR**: Submit for review

### Feature Development
1. **Create feature branch**: `git checkout -b feature/description`
2. **Implement feature**: Write code and tests
3. **Update documentation**: Keep docs in sync
4. **Test thoroughly**: Unit, integration, E2E tests
5. **Submit PR**: Include description and testing notes
6. **Address feedback**: Respond to code review
7. **Merge**: Squash and merge to main

### Bug Fixes
1. **Create bug branch**: `git checkout -b fix/issue-number`
2. **Reproduce bug**: Write failing test
3. **Fix bug**: Implement solution
4. **Verify fix**: Ensure test passes
5. **Submit PR**: Reference issue number
6. **Merge**: After review approval

## Code Standards

### TypeScript
- Strict mode enabled
- Explicit return types preferred
- No unused locals or parameters
- ESLint + Prettier for formatting

### Commit Messages
Format: `<type>: <subject>`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Testing
- `chore`: Maintenance
- `ci`: CI/CD changes
- `build`: Build system

**Example**:
```
feat: add recipe import from URL

Implements recipe scraping functionality for supported websites.
Includes validation, error handling, and tests.

Fixes #123
```

### Code Review
- All PRs require review
- Address all comments
- Keep PRs focused and small
- Include tests
- Update documentation
- Pass all CI checks

### Testing Requirements
- Unit tests for new functions
- Integration tests for features
- E2E tests for user workflows
- Maintain test coverage
- Fix failing tests immediately

## Project Structure

### Frontend (`frontend/`)
```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── store/          # Redux store
│   ├── utils/          # Utility functions
│   ├── hooks/          # Custom hooks
│   └── types/          # TypeScript types
├── e2e/                # E2E tests
└── public/             # Static assets
```

### Backend (`backend/`)
```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── validation/     # Zod schemas
│   └── middleware/     # Express middleware
├── prisma/             # Database schema
└── tests/              # Backend tests
```

### Documentation (`docs/`)
```
docs/
├── deployment/         # Deployment guides
├── security/           # Security docs
├── design/             # Design principles
├── features/           # Feature docs
├── infrastructure/     # Infrastructure docs
├── testing/            # Testing guides
├── development/        # Developer guides
└── archive/            # Historical docs
```

## Development Tools

### Required Tools
- **Node.js 18+**: JavaScript runtime
- **pnpm 8+**: Package manager
- **Podman/Docker**: Container runtime
- **PostgreSQL 14+**: Database
- **Git**: Version control

### Recommended Tools
- **VS Code**: IDE with extensions
- **Postman/Insomnia**: API testing
- **pgAdmin**: Database management
- **Playwright Inspector**: E2E test debugging
- **React DevTools**: React debugging

### VS Code Extensions
- ESLint
- Prettier
- TypeScript
- Prisma
- GitLens
- Thunder Client (API testing)

## Common Commands

### Frontend
```bash
cd frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint
pnpm lint

# Format
pnpm format
```

### Backend
```bash
cd backend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Run tests
npm test

# Prisma commands
npx prisma migrate dev
npx prisma studio
npx prisma generate
```

### Database
```bash
# Run migrations
cd backend && npx prisma migrate dev

# Reset database
cd backend && npx prisma migrate reset

# Open Prisma Studio
cd backend && npx prisma studio

# Backup database
./scripts/backup-full.sh

# Safe migration with backup
./scripts/safe-migrate.sh
```

## Troubleshooting

### Port Already in Use
**Problem**: Port 5173 or 3000 already in use
**Solution**:
```bash
# Find process using port
lsof -i :5173
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use menu to stop services
./scripts/menu.sh
```

### Database Connection Issues
**Problem**: Cannot connect to database
**Solutions**:
- Verify DATABASE_URL in `.env`
- Check PostgreSQL is running
- Verify credentials
- Check network connectivity
- Review [Secrets Management](../security/SECRETS_MANAGEMENT.md)

### Build Failures
**Problem**: Build fails with errors
**Solutions**:
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear build cache: `rm -rf .next dist`
- Check Node.js version: `node --version`
- Review error messages
- Check [Setup Guide](SETUP.md)

### Test Failures
**Problem**: Tests failing unexpectedly
**Solutions**:
- Run tests in isolation
- Check test environment
- Clear test database
- Review test logs
- See [Testing Environment](../testing/TESTING_ENVIRONMENT.md)

## Related Documentation

### Getting Started
- [Quick Start](QUICK_START.md) - Fast setup
- [Setup Guide](SETUP.md) - Detailed setup
- [New Developer Quick Start](NEW_DEVELOPER_QUICK_START.md) - Onboarding

### Deployment
- [Local Development](../deployment/LOCAL_DEVELOPMENT.md) - Local setup
- [Deployment Guide](../deployment/DEPLOYMENT.md) - Production deployment

### Testing
- [Testing Environment](../testing/TESTING_ENVIRONMENT.md) - Test setup
- [Testing Guide](../testing/README.md) - Testing overview

### Infrastructure
- [Database Backup](../infrastructure/DATABASE_BACKUP.md) - Backup procedures
- [Logging System](../infrastructure/LOGGING_SYSTEM.md) - Logging setup

### Root Documentation
- [AGENTS.md](../../AGENTS.md) - AI agent guidelines
- [ISSUE_PRIORITIES.md](../../ISSUE_PRIORITIES.md) - Current priorities

## Best Practices

### Development
1. **Follow workflow** - Use established processes
2. **Write tests** - Test-driven development
3. **Document changes** - Keep docs updated
4. **Review code** - Participate in reviews
5. **Commit often** - Small, focused commits
6. **Use branches** - Feature branches for work
7. **Stay updated** - Pull latest changes regularly

### Code Quality
1. **TypeScript strict mode** - Type safety
2. **ESLint rules** - Follow linting rules
3. **Prettier formatting** - Consistent style
4. **No console.logs** - Use proper logging
5. **Error handling** - Handle all errors
6. **Code comments** - Explain complex logic
7. **Refactor regularly** - Keep code clean

### Collaboration
1. **Communicate** - Keep team informed
2. **Ask questions** - Don't hesitate to ask
3. **Share knowledge** - Document learnings
4. **Help others** - Review PRs, answer questions
5. **Be respectful** - Professional communication
6. **Give feedback** - Constructive code reviews
7. **Celebrate wins** - Acknowledge achievements

### Security
1. **Never commit secrets** - Use secret management
2. **Validate input** - All user input
3. **Sanitize output** - Prevent XSS
4. **Review dependencies** - Check for vulnerabilities
5. **Follow security docs** - See [Security](../security/)
6. **Report issues** - Security vulnerabilities
7. **Stay informed** - Security best practices

## Resources

### Documentation
- [Main Documentation Hub](../README.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Design Principles](../design/DESIGN_PRINCIPLES.md)

### External Resources
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Playwright Documentation](https://playwright.dev)
- [Express Documentation](https://expressjs.com)

### Community
- GitHub Issues - Bug reports and features
- Pull Requests - Code contributions
- Discussions - Questions and ideas

---

[← Back to Documentation Hub](../README.md)

// Made with Bob