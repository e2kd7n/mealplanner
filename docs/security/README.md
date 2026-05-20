/** Copyright (c) 2026 e2kd7n. All rights reserved. */

# Security Documentation

This directory contains all security-related documentation for the Meal Planner application.

## Quick Reference

### Common Tasks
- **Set up secrets**: See [Secrets Management](SECRETS_MANAGEMENT.md)
- **Review security audit**: See audit JSON files
- **Configure authentication**: See [Secrets Management](SECRETS_MANAGEMENT.md#jwt-configuration)
- **Secure deployment**: See [Deployment Guide](../deployment/DEPLOYMENT.md)

## Documentation Files

### [Secrets Management](SECRETS_MANAGEMENT.md)
Comprehensive guide for managing secrets securely:
- Secret storage locations (`/run/secrets/` for containers)
- Environment variable configuration
- JWT secret generation and rotation
- Database credential management
- API key handling (Spoonacular)
- Secret validation and entropy checks
- Path traversal protection
- Best practices for secret handling

**Key Features**:
- Never use `process.env` directly for secrets
- Always use `getSecret()` or `getSecretCached()` utilities
- Secrets loaded from validated file paths only
- Automatic weak pattern detection
- Entropy validation for security

### Security Audit Reports

#### [security-audit-backend-current.json](security-audit-backend-current.json)
Current backend security audit results:
- Dependency vulnerabilities
- Security advisories
- Severity levels
- Recommended actions

#### [security-audit-frontend-current.json](security-audit-frontend-current.json)
Current frontend security audit results:
- Frontend dependency vulnerabilities
- Client-side security issues
- Package audit results
- Update recommendations

## Security Architecture

### Authentication & Authorization
- **JWT-based authentication** - Secure token-based auth
- **Token expiration** - Configurable token lifetime
- **Secure token storage** - HttpOnly cookies (backend), secure storage (frontend)
- **Password hashing** - bcrypt with appropriate rounds
- **Session management** - Secure session handling

### Secret Management
- **File-based secrets** - Secrets stored in `/run/secrets/` (Docker/Podman)
- **Environment isolation** - Separate secrets per environment
- **No hardcoded secrets** - All secrets externalized
- **Secret validation** - Entropy and pattern checks
- **Caching** - Secure in-memory caching with `getSecretCached()`

### Data Protection
- **Input validation** - Zod schemas for all requests
- **SQL injection prevention** - Prisma ORM with parameterized queries
- **XSS prevention** - DOMPurify sanitization
- **CSRF protection** - Token-based CSRF protection
- **Secure headers** - Security headers configured in nginx

### Database Security
- **Connection pooling** - Configured via DATABASE_URL parameters
- **Encrypted connections** - SSL/TLS for database connections
- **Least privilege** - Database users with minimal required permissions
- **Backup encryption** - Encrypted database backups
- **Migration safety** - Automatic backups before migrations

### API Security
- **Rate limiting** - Configurable rate limits per endpoint
- **Input sanitization** - All user input sanitized
- **Error handling** - No sensitive data in error messages
- **CORS configuration** - Strict CORS policies
- **API key protection** - Secure API key storage and rotation

## Security Best Practices

### Development
1. **Never commit secrets** - Use `.gitignore` for sensitive files
2. **Use secret utilities** - Always use `getSecret()` functions
3. **Validate input** - Use Zod schemas for all user input
4. **Sanitize output** - Use DOMPurify for user-generated content
5. **Review dependencies** - Regular security audits
6. **Test security** - Include security tests in test suite

### Deployment
1. **Use HTTPS** - Always use SSL/TLS in production
2. **Secure secrets** - Store secrets in `/run/secrets/` or secure vault
3. **Rotate secrets** - Regular secret rotation schedule
4. **Monitor logs** - Watch for security-related errors
5. **Update dependencies** - Apply security patches promptly
6. **Backup regularly** - Encrypted backups with secure storage

### Operations
1. **Monitor access** - Track authentication attempts
2. **Review logs** - Regular log review for suspicious activity
3. **Update regularly** - Keep all dependencies current
4. **Audit periodically** - Regular security audits
5. **Incident response** - Have incident response plan ready
6. **Document changes** - Track all security-related changes

## Security Checklist

### Initial Setup
- [ ] Generate strong JWT secret
- [ ] Configure database credentials
- [ ] Set up secret storage (`/run/secrets/`)
- [ ] Configure HTTPS/SSL
- [ ] Set up CORS policies
- [ ] Configure rate limiting
- [ ] Review security headers

### Regular Maintenance
- [ ] Run security audits (`npm audit`)
- [ ] Review dependency updates
- [ ] Rotate secrets (quarterly)
- [ ] Review access logs
- [ ] Update security documentation
- [ ] Test backup restoration
- [ ] Verify encryption

### Before Deployment
- [ ] Review [Secrets Management](SECRETS_MANAGEMENT.md)
- [ ] Verify all secrets configured
- [ ] Test authentication flow
- [ ] Verify HTTPS configuration
- [ ] Check security headers
- [ ] Run security audit
- [ ] Test rate limiting

## Common Security Issues

### Secret Exposure
**Problem**: Secrets committed to version control or exposed in logs
**Solution**: 
- Use `.gitignore` for secret files
- Use `getSecret()` utilities
- Configure logger to sanitize sensitive fields
- Review [Secrets Management](SECRETS_MANAGEMENT.md)

### Weak Secrets
**Problem**: Weak or predictable secrets
**Solution**:
- Use `./scripts/generate-secrets.sh` for strong secrets
- Minimum entropy requirements enforced
- Regular secret rotation
- Avoid common patterns

### Dependency Vulnerabilities
**Problem**: Vulnerable dependencies
**Solution**:
- Run `npm audit` regularly
- Apply security patches promptly
- Review audit reports
- Update dependencies weekly

### Authentication Issues
**Problem**: Weak authentication or session management
**Solution**:
- Use JWT with appropriate expiration
- Implement secure token storage
- Configure HttpOnly cookies
- Review authentication flow

## Security Utilities

### Backend Utilities
- `backend/src/utils/secrets.ts` - Secret management functions
  - `getSecret()` - Load secret from file
  - `getSecretCached()` - Load with caching
  - `getDatabaseUrl()` - Construct database URL from secrets
- `backend/src/utils/sanitize.ts` - Input sanitization
  - DOMPurify wrapper for user input
- `backend/src/utils/jwt.ts` - JWT token management
  - Token generation and validation

### Frontend Utilities
- `frontend/src/utils/logger.ts` - Secure logging
  - Auto-sanitizes sensitive fields (password, token, secret, apiKey)
- `frontend/src/utils/errorHandler.ts` - Error handling
  - No sensitive data in error messages

## Related Documentation

### Deployment
- [Deployment Guide](../deployment/DEPLOYMENT.md) - Secure deployment practices
- [Secrets Management](SECRETS_MANAGEMENT.md) - Detailed secret handling

### Infrastructure
- [Database Backup](../infrastructure/DATABASE_BACKUP.md) - Secure backup procedures
- [Logging System](../infrastructure/LOGGING_SYSTEM.md) - Secure logging configuration

### Development
- [Setup Guide](../development/SETUP.md) - Secure development setup
- [Workflow Guide](../development/WORKFLOW_GUIDE.md) - Security in development workflow

## Security Contacts

For security issues:
1. **Do not** create public GitHub issues for security vulnerabilities
2. Contact the maintainers directly
3. Provide detailed information about the vulnerability
4. Allow time for patch development before disclosure

## Compliance

### Standards
- **OWASP Top 10** - Protection against common vulnerabilities
- **GDPR** - User data protection and privacy
- **WCAG 2.1 AA** - Accessibility standards (see [Design](../design/))

### Auditing
- Regular dependency audits
- Periodic security reviews
- Automated security scanning
- Manual code reviews

---

[← Back to Documentation Hub](../README.md)

// Made with Bob