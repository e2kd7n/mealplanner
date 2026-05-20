# Security Setup Guide

## 🔒 Critical Security Requirements

**BEFORE running this application, you MUST generate secure secrets.**

### ⚠️ Why This Matters

Using default or weak secrets can lead to:
- Complete authentication bypass
- Database compromise
- Data breaches affecting all users
- Legal liability and regulatory fines
- Reputation damage

**Cost of a breach: $940,000 - $5,800,000**  
**Cost to prevent: 15 minutes of your time**

---

## 🚀 Quick Start (Required)

### Step 1: Generate Secure Secrets

```bash
# Make the script executable
chmod +x scripts/generate-secrets.sh

# Generate all secrets (takes ~10 seconds)
./scripts/generate-secrets.sh
```

This creates:
- `secrets/postgres_password.txt` - Database password (32 chars)
- `secrets/jwt_secret.txt` - JWT signing secret (64 chars)
- `secrets/jwt_refresh_secret.txt` - JWT refresh secret (64 chars)
- `secrets/session_secret.txt` - Session secret (48 chars)

### Step 2: Verify Secrets Were Created

```bash
ls -la secrets/
```

You should see 4 `.txt` files with 600 permissions (read/write for owner only).

### Step 3: Choose Your Setup Method

#### Option A: Docker/Podman (Recommended)

```bash
# Secrets are automatically loaded from /run/secrets/
podman-compose up -d
```

✅ Most secure - secrets never in environment variables  
✅ Automatic - no manual configuration needed  
✅ Production-ready

#### Option B: Local Development (Without Docker)

```bash
# 1. Copy example files
cp .env.example .env
cp backend/.env.example backend/.env

# 2. Manually update .env files with generated secrets
# Replace placeholders with actual values from secrets/ directory

# For .env:
POSTGRES_PASSWORD=$(cat secrets/postgres_password.txt)
JWT_SECRET=$(cat secrets/jwt_secret.txt)
JWT_REFRESH_SECRET=$(cat secrets/jwt_refresh_secret.txt)

# For backend/.env:
# Update DATABASE_URL with postgres_password
# Update JWT_SECRET with jwt_secret
# Update JWT_REFRESH_SECRET with jwt_refresh_secret
# Update SESSION_SECRET with session_secret

# 3. Start services
npm run dev
```

---

## 🛡️ Security Best Practices

### DO ✅

- **Always run `generate-secrets.sh` for new environments**
- **Use different secrets for dev/staging/production**
- **Rotate secrets every 90 days** (tracked in metadata files)
- **Keep secrets/ directory in .gitignore** (already configured)
- **Use 600 permissions on secret files** (automatically set)
- **Back up secrets securely** (encrypted, separate from code)

### DON'T ❌

- **Never commit secrets to version control**
- **Never share secrets via email/chat/Slack**
- **Never use weak or predictable passwords**
- **Never reuse secrets across environments**
- **Never log secret values**
- **Never use placeholder values from .env.example**

---

## 🔍 Verifying Your Setup

### Check 1: Secrets Exist

```bash
# All 4 files should exist
test -f secrets/postgres_password.txt && echo "✓ postgres_password" || echo "✗ MISSING"
test -f secrets/jwt_secret.txt && echo "✓ jwt_secret" || echo "✗ MISSING"
test -f secrets/jwt_refresh_secret.txt && echo "✓ jwt_refresh_secret" || echo "✗ MISSING"
test -f secrets/session_secret.txt && echo "✓ session_secret" || echo "✗ MISSING"
```

### Check 2: Secrets Are Strong

```bash
# Check secret lengths (should be 32+ characters)
wc -c secrets/*.txt
```

### Check 3: Secrets Are Not Placeholders

```bash
# Should return nothing (no matches)
grep -r "REPLACE_WITH\|changeme\|your-super-secret" secrets/ 2>/dev/null
```

### Check 4: .env Files Don't Have Weak Secrets

```bash
# Should return nothing if properly configured
grep -E "changeme|REPLACE_WITH|your-super-secret" backend/.env 2>/dev/null
```

---

## 🚨 Common Mistakes & Fixes

### Mistake 1: Forgot to Generate Secrets

**Symptom:** Application fails to start with "Secret not found" error

**Fix:**
```bash
./scripts/generate-secrets.sh
podman-compose restart
```

### Mistake 2: Used Placeholder Values

**Symptom:** Application starts but authentication doesn't work properly

**Fix:**
```bash
# Regenerate secrets
./scripts/generate-secrets.sh

# Update .env files with new secrets
# Restart application
```

### Mistake 3: Committed Secrets to Git

**Symptom:** Secrets visible in git history

**Fix:**
```bash
# Remove from current commit
git rm --cached .env backend/.env secrets/*.txt

# Remove from history (DANGEROUS - coordinate with team)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env backend/.env secrets/*.txt" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if you understand the implications)
git push origin --force --all
```

**Then:** Immediately rotate all secrets and update production.

### Mistake 4: Lost Secrets

**Symptom:** Can't access database or authenticate users

**Fix:**
```bash
# Check for backups
ls -la secrets.backup.*

# If backup exists, restore it
cp -r secrets.backup.YYYYMMDD_HHMMSS/* secrets/

# If no backup, regenerate (will require database password reset)
./scripts/generate-secrets.sh
```

---

## 🔄 Secret Rotation

Secrets should be rotated every 90 days. The generation script tracks this in metadata files.

### Rotation Process

```bash
# 1. Generate new secrets (backs up old ones automatically)
./scripts/generate-secrets.sh

# 2. Update database password (if rotating postgres_password)
podman exec meals-postgres psql -U mealplanner -d meal_planner
ALTER USER mealplanner WITH PASSWORD 'new_password_from_file';
\q

# 3. Restart services
podman-compose restart

# 4. Verify services are running
podman-compose ps
podman-compose logs backend | tail -20
```

### Rotation Schedule

| Secret | Rotation Frequency | Impact |
|--------|-------------------|---------|
| `postgres_password` | 90 days | Requires database update |
| `jwt_secret` | 90 days | Invalidates all sessions |
| `jwt_refresh_secret` | 90 days | Requires re-login |
| `session_secret` | 90 days | Invalidates all sessions |

---

## 📊 Security Checklist

Before deploying to production:

- [ ] Generated secrets with `./scripts/generate-secrets.sh`
- [ ] Verified all 4 secret files exist in `secrets/` directory
- [ ] Confirmed secrets are at least 32 characters long
- [ ] Checked that `.env` files don't contain placeholder values
- [ ] Verified `secrets/` directory is in `.gitignore`
- [ ] Tested application starts successfully
- [ ] Confirmed authentication works (login/logout)
- [ ] Set up secret rotation reminders (90 days)
- [ ] Created encrypted backup of secrets
- [ ] Documented secret locations for team
- [ ] Different secrets for each environment (dev/staging/prod)

---

## 🆘 Emergency Procedures

### If Secrets Are Compromised

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

4. **Invalidate all user sessions** (automatic with JWT rotation)

5. **Audit access logs** for unauthorized access
   ```bash
   podman-compose logs backend | grep -i "auth\|login\|secret"
   ```

6. **Notify security team** and affected users if required

7. **Review and update security procedures**

---

## 📚 Additional Resources

- [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) - Detailed secrets management guide
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12-Factor App: Config](https://12factor.net/config)
- [CWE-798: Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)

---

## 💬 Support

If you encounter issues:

1. Check this documentation
2. Review application logs: `podman-compose logs backend`
3. Verify secrets exist: `ls -la secrets/`
4. Check file permissions: `ls -l secrets/*.txt`
5. Contact the development team

---

**Remember: Security is not optional. Take 15 minutes now to prevent a $5M breach later.**

---

*Last Updated: 2026-03-23*  
*Version: 1.0.0*