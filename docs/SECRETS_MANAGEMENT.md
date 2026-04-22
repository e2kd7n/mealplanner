# Secrets Management Guide

## Overview

This project uses Podman Secrets for secure credential management. Secrets are stored in files outside of version control and mounted into containers at runtime.

## 🔒 Security Features

- **No Hardcoded Credentials**: All sensitive data is stored in separate secret files
- **Git-Ignored**: Secrets directory is excluded from version control
- **Strong Password Generation**: Automated generation of cryptographically secure passwords
- **Podman Secrets Integration**: Secrets are mounted as read-only files in containers
- **Environment Separation**: Different secrets for development, staging, and production

## 📁 Directory Structure

```
meal-planner/
├── secrets/                    # Git-ignored directory for secrets
│   ├── .gitkeep               # Keeps directory in git
│   ├── postgres_password.txt  # PostgreSQL password (generated)
│   ├── jwt_secret.txt         # JWT signing secret (generated)
│   ├── jwt_refresh_secret.txt # JWT refresh token secret (generated)
│   └── session_secret.txt     # Session secret (generated)
└── scripts/
    └── generate-secrets.sh    # Secret generation script
```

## 🚀 Quick Start

### First-Time Setup

1. **Generate Secrets**
   ```bash
   chmod +x scripts/generate-secrets.sh
   ./scripts/generate-secrets.sh
   ```

2. **Verify Secrets Created**
   ```bash
   ls -la secrets/
   ```
   You should see all 5 secret files created.

3. **Start Services**
   ```bash
   podman-compose up -d
   ```

### Regenerating Secrets

⚠️ **Warning**: Regenerating secrets will invalidate existing sessions and require database password updates.

```bash
./scripts/generate-secrets.sh
```

The script will:
- Prompt for confirmation before overwriting
- Create a timestamped backup of existing secrets
- Generate new secure random passwords

## 🔧 How It Works

### Docker Compose Integration

Secrets are defined in `podman-compose.yml`:

```yaml
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
  redis_password:
    file: ./secrets/redis_password.txt
  # ... other secrets
```

### Container Access

Secrets are mounted as read-only files in containers at `/run/secrets/`:

```yaml
services:
  backend:
    secrets:
      - postgres_password
      - redis_password
      - jwt_secret
```

### Application Usage

The application reads secrets from files:

```typescript
// Example: Reading a secret in Node.js
import fs from 'fs';

const getSecret = (secretName: string): string => {
  const secretPath = `/run/secrets/${secretName}`;
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
  // Fallback to environment variable for local development
  return process.env[secretName.toUpperCase()] || '';
};

const dbPassword = getSecret('postgres_password');
```

## 🏠 Local Development (Without Docker)

For local development without Docker:

1. **Generate Secrets**
   ```bash
   ./scripts/generate-secrets.sh
   ```

2. **Create `.env` File**
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Manually Set Secrets**
   ```bash
   # Read secrets and update .env file
   export POSTGRES_PASSWORD=$(cat secrets/postgres_password.txt)
   export REDIS_PASSWORD=$(cat secrets/redis_password.txt)
   export JWT_SECRET=$(cat secrets/jwt_secret.txt)
   export JWT_REFRESH_SECRET=$(cat secrets/jwt_refresh_secret.txt)
   export SESSION_SECRET=$(cat secrets/session_secret.txt)
   ```

4. **Update `.env` File**
   Replace placeholder values in `backend/.env` with actual secrets from the files.

## 🔐 Best Practices

### DO ✅

- **Always use the generation script** for creating secrets
- **Keep secrets directory permissions restrictive** (600 for files, 700 for directory)
- **Use different secrets for each environment** (dev, staging, production)
- **Rotate secrets regularly** (at least quarterly)
- **Back up secrets securely** (encrypted, separate from code)
- **Use environment-specific secrets** for production deployments

### DON'T ❌

- **Never commit secrets to version control**
- **Never share secrets via email or chat**
- **Never use weak or predictable passwords**
- **Never reuse secrets across environments**
- **Never log secret values**
- **Never hardcode secrets in application code**

## 🔄 Secret Rotation

To rotate secrets:

1. **Generate New Secrets**
   ```bash
   ./scripts/generate-secrets.sh
   ```

2. **Update Database Password** (if rotating postgres_password)
   ```bash
   podman exec meals-postgres psql -U mealplanner -d meal_planner
   ALTER USER mealplanner WITH PASSWORD 'new_password_from_file';
   ```

3. **Restart Services**
   ```bash
   podman-compose restart
   ```

4. **Verify Services**
   ```bash
   podman-compose ps
   podman-compose logs backend
   ```

## 🚨 Emergency Procedures

### Secrets Compromised

If secrets are compromised:

1. **Immediately rotate all secrets**
   ```bash
   ./scripts/generate-secrets.sh
   ```

2. **Update production secrets** in your deployment platform

3. **Restart all services**
   ```bash
   podman-compose down
   podman-compose up -d
   ```

4. **Invalidate all user sessions**

5. **Audit access logs** for unauthorized access

6. **Notify security team** if applicable

### Lost Secrets

If secrets are lost:

1. **Check backups** created by generate-secrets.sh
   ```bash
   ls -la secrets.backup.*
   ```

2. **If no backup exists**, generate new secrets and reconfigure:
   ```bash
   ./scripts/generate-secrets.sh
   # Update database passwords manually
   # Users will need to re-authenticate
   ```

## 📊 Monitoring

Monitor secret-related issues:

- Failed authentication attempts
- Database connection errors
- Redis connection errors
- JWT validation failures

Check logs:
```bash
podman-compose logs backend | grep -i "secret\|password\|auth"
```

## 🔍 Troubleshooting

### "Secret file not found" Error

**Problem**: Container can't find secret file

**Solution**:
```bash
# Verify secrets exist
ls -la secrets/

# Regenerate if missing
./scripts/generate-secrets.sh

# Restart services
podman-compose restart
```

### "Permission denied" Error

**Problem**: Secret files have wrong permissions

**Solution**:
```bash
chmod 600 secrets/*.txt
chmod 700 secrets/
```

### Database Connection Failed

**Problem**: PostgreSQL password mismatch

**Solution**:
```bash
# Check if secret file exists and has content
cat secrets/postgres_password.txt

# Verify container can read secret
podman exec meals-backend cat /run/secrets/postgres_password

# If mismatch, update database password
podman exec meals-postgres psql -U mealplanner -d meal_planner
ALTER USER mealplanner WITH PASSWORD 'password_from_secret_file';
```

## 📚 Additional Resources

- [Podman Secrets Documentation](https://docs.podman.io/en/latest/markdown/podman-secret.1.html)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)

## 🆘 Support

For issues or questions:
1. Check this documentation
2. Review application logs
3. Check Docker Compose logs
4. Consult the development team

---

**Last Updated**: 2026-03-15  
**Version**: 1.0.0