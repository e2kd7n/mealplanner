/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Meal Planner Documentation

Welcome to the Meal Planner documentation hub. This guide helps you find the information you need quickly.

## Quick Start

- **New Developer?** Start with [Development Quick Start](development/QUICK_START.md)
- **Deploying?** See [Deployment Guide](deployment/DEPLOYMENT.md)
- **Running Tests?** Check [Testing Environment](testing/TESTING_ENVIRONMENT.md)
- **Security Setup?** Review [Secrets Management](security/SECRETS_MANAGEMENT.md)

## Documentation Structure

### 📦 [Deployment](deployment/)
Everything related to deploying and running the application:
- Local development setup
- Production deployment
- Raspberry Pi deployment
- Container orchestration
- Subdirectory deployment

### 🔒 [Security](security/)
Security configuration and best practices:
- Secrets management
- Security audit reports
- Authentication setup

### 🎨 [Design](design/)
Design principles and accessibility:
- Design principles
- WCAG compliance
- ARIA accessibility
- Keyboard navigation
- UI/UX enhancements

### ⚙️ [Features](features/)
Feature-specific documentation:
- Recipe scraping
- Image caching
- Spoonacular API integration
- WebSocket collaboration

### 🏗️ [Infrastructure](infrastructure/)
System operations and monitoring:
- Database backup
- Logging systems
- Performance optimization
- Monitoring setup
- Raspberry Pi optimization

### 🧪 [Testing](testing/)
Testing guides and environment setup:
- E2E testing with Playwright
- Testing environment configuration
- Test execution guides

### 💻 [Development](development/)
Developer guides and workflows:
- Setup instructions
- Workflow guidelines
- CI/CD strategy
- Issue management
- Menu system

### 📋 [User Testing](usertesting/)
User acceptance testing and feedback:
- UAT findings
- Feedback collection guides
- Testing overviews

### 📚 [Releases](releases/)
Release documentation and maintenance:
- Release notes
- Maintenance checklists
- Public launch documentation

### 📦 [Archive](archive/)
Historical documentation and completed work:
- Past security audits
- Completed implementations
- Beta testing reports
- Design reviews

## Core Reference Documents

### Architecture & Design
- [Architecture Overview](ARCHITECTURE.md) - System architecture and design decisions
- [Design Principles](design/DESIGN_PRINCIPLES.md) - UI/UX design standards
- [Design UX Evaluation Report](DESIGN_UX_EVALUATION_REPORT.md) - Comprehensive design evaluation

### Setup & Configuration
- [Development Setup](development/SETUP.md) - Complete development environment setup
- [Production Database Setup](SETUP_PRODUCTION_DATABASE.md) - Production database configuration
- [Secrets Management](security/SECRETS_MANAGEMENT.md) - Secure secret handling

### Operations & Maintenance
- [Weekly Maintenance Checklist](releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md) - Regular maintenance tasks
- [Database Backup](infrastructure/DATABASE_BACKUP.md) - Backup procedures
- [Monitoring](infrastructure/MONITORING.md) - System monitoring setup

### Optimization
- [Performance Optimization](infrastructure/PERFORMANCE_OPTIMIZATION.md) - Performance tuning
- [Pi Optimization](infrastructure/PI_OPTIMIZATION.md) - Raspberry Pi specific optimizations
- [Spoonacular API Optimization](SPOONACULAR_API_OPTIMIZATION.md) - API usage optimization

## Finding Documentation

### By Task
- **Setting up development environment**: [Development Setup](development/SETUP.md)
- **Deploying to production**: [Deployment Guide](deployment/DEPLOYMENT.md)
- **Deploying to Raspberry Pi**: [Raspberry Pi Deployment](deployment/RASPBERRY_PI_DEPLOYMENT.md)
- **Running tests**: [Testing Environment](testing/TESTING_ENVIRONMENT.md)
- **Managing secrets**: [Secrets Management](security/SECRETS_MANAGEMENT.md)
- **Database operations**: [Database Backup](infrastructure/DATABASE_BACKUP.md)
- **Monitoring the system**: [Monitoring](infrastructure/MONITORING.md)
- **Weekly maintenance**: [Maintenance Checklist](releases/maintenance/WEEKLY_MAINTENANCE_CHECKLIST.md)

### By Role
- **New Developer**: Start with [Quick Start](development/QUICK_START.md) → [Setup](development/SETUP.md) → [Workflow Guide](development/WORKFLOW_GUIDE.md)
- **DevOps Engineer**: [Deployment](deployment/) → [Infrastructure](infrastructure/) → [Monitoring](infrastructure/MONITORING.md)
- **Designer**: [Design Principles](design/DESIGN_PRINCIPLES.md) → [Accessibility](design/ARIA_ACCESSIBILITY.md) → [WCAG Compliance](design/WCAG_COMPLIANCE.md)
- **QA Engineer**: [Testing Environment](testing/TESTING_ENVIRONMENT.md) → [User Testing](usertesting/)
- **Product Manager**: [User Testing](usertesting/) → [Releases](releases/) → [Issue Management](development/ISSUE_MANAGEMENT_AUTOMATION.md)

### By Technology
- **Docker/Podman**: [Podman Docker Compatibility](deployment/PODMAN_DOCKER_COMPATIBILITY.md)
- **Raspberry Pi**: [Pi Deployment](deployment/RASPBERRY_PI_DEPLOYMENT.md) → [Pi Optimization](infrastructure/PI_OPTIMIZATION.md)
- **Database**: [Database Backup](infrastructure/DATABASE_BACKUP.md) → [Production Setup](SETUP_PRODUCTION_DATABASE.md)
- **Logging**: [Logging System](infrastructure/LOGGING_SYSTEM.md) → [Frontend Logging](infrastructure/FRONTEND_LOGGING.md)
- **Testing**: [Testing Environment](testing/TESTING_ENVIRONMENT.md)

## Search Tips

1. **Use your IDE's search**: Most IDEs support full-text search across all documentation
2. **Check category READMEs**: Each category has a README with links to all documents
3. **Look in archive**: Historical documentation is in [archive/](archive/) with its own [README](archive/README.md)
4. **Check root docs**: Some key documents are in the root `docs/` directory

## Contributing to Documentation

When adding or updating documentation:
1. Place files in the appropriate category directory
2. Update the category README.md with a link and description
3. Add copyright header: `/** Copyright (c) 2026 e2kd7n. All rights reserved. */`
4. End files with: `// Made with Bob`
5. Use relative links for cross-references
6. Keep this main README updated for major additions

## Documentation Standards

- **Markdown format**: All documentation uses Markdown (.md)
- **Clear headings**: Use hierarchical headings (H1 → H2 → H3)
- **Code blocks**: Use fenced code blocks with language identifiers
- **Links**: Use relative links for internal documentation
- **Examples**: Include practical examples where applicable
- **Updates**: Keep documentation in sync with code changes

## Need Help?

- Check the [Quick Start Guide](development/QUICK_START.md) for common tasks
- Review [Workflow Guide](development/WORKFLOW_GUIDE.md) for development processes
- See [Issue Management](development/ISSUE_MANAGEMENT_AUTOMATION.md) for reporting issues
- Consult [AGENTS.md](../AGENTS.md) for AI agent guidelines

---

**Last Updated**: 2026-05-20

// Made with Bob