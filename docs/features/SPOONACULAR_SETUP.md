# Spoonacular API Setup Guide

## Overview

The Browse Recipes feature requires a Spoonacular API key to search and retrieve recipe data from their database of 360,000+ recipes.

---

## Getting a Spoonacular API Key

### 1. Sign Up for Spoonacular
1. Go to https://spoonacular.com/food-api
2. Click "Get Started" or "Sign Up"
3. Create a free account

### 2. Get Your API Key
1. Log in to your Spoonacular account
2. Go to your dashboard: https://spoonacular.com/food-api/console#Dashboard
3. Your API key will be displayed on the dashboard
4. Copy the API key (it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 3. Free Tier Limits
- **150 requests per day**
- **1 request per second**
- Sufficient for development and small-scale testing

### 4. Paid Plans (Optional)
If you need more requests:
- **Mega Plan:** $49/month - 5,000 requests/day
- **Ultra Plan:** $149/month - 50,000 requests/day
- **Custom Plans:** Available for higher volumes

---

## Configuration

### Local Development

#### Option 1: Using .env file (Recommended)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and add your Spoonacular API key:
   ```bash
   # Find this line in backend/.env
   SPOONACULAR_API_KEY=
   
   # Replace with your actual key
   SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

4. Save the file

5. Restart the backend server:
   ```bash
   # If using run-local.sh
   ./scripts/run-local.sh
   
   # Or if running backend directly
   cd backend
   pnpm dev
   ```

#### Option 2: Using Environment Variable

Set the environment variable directly in your shell:

```bash
# Bash/Zsh
export SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Or add to your ~/.bashrc or ~/.zshrc for persistence
echo 'export SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6' >> ~/.bashrc
source ~/.bashrc
```

---

### Docker/Podman Deployment

#### Option 1: Using .env file

1. Create or edit `backend/.env`:
   ```bash
   SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

2. The `podman-compose.yml` will automatically load this file

#### Option 2: Using Docker Secrets (Production Recommended)

1. Create a secret file:
   ```bash
   echo "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" > secrets/spoonacular_api_key.txt
   chmod 600 secrets/spoonacular_api_key.txt
   ```

2. Update `podman-compose.yml` to use the secret:
   ```yaml
   services:
     backend:
       secrets:
         - spoonacular_api_key
       environment:
         SPOONACULAR_API_KEY_FILE: /run/secrets/spoonacular_api_key
   
   secrets:
     spoonacular_api_key:
       file: ./secrets/spoonacular_api_key.txt
   ```

3. Update backend code to read from file if `SPOONACULAR_API_KEY_FILE` is set

---

### Production Deployment

#### Raspberry Pi / Self-Hosted

1. SSH into your server:
   ```bash
   ssh user@your-server-ip
   ```

2. Navigate to the project directory:
   ```bash
   cd /path/to/mealplanner
   ```

3. Edit the backend .env file:
   ```bash
   nano backend/.env
   # or
   vim backend/.env
   ```

4. Add your API key:
   ```bash
   SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```

5. Restart the containers:
   ```bash
   podman-compose down
   podman-compose up -d
   ```

#### Cloud Platforms

**Heroku:**
```bash
heroku config:set SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**AWS (Environment Variables):**
- Add to Elastic Beanstalk environment configuration
- Or use AWS Secrets Manager

**Google Cloud:**
```bash
gcloud run services update meal-planner-backend \
  --set-env-vars SPOONACULAR_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Azure:**
- Add to App Service Configuration → Application Settings

---

## Verification

### Check if API Key is Loaded

1. Start the backend server
2. Check the logs for any Spoonacular-related errors
3. The service will log a warning if the API key is missing

### Test the Browse Recipes Feature

1. Log in to the application
2. Navigate to "Browse Recipes" in the menu
3. Search for a recipe (e.g., "pasta")
4. If results appear, the API key is working correctly
5. If you see an error, check:
   - API key is correct
   - Backend server restarted after adding key
   - No typos in the environment variable name

### Check API Usage

Monitor your API usage on the Spoonacular dashboard:
- https://spoonacular.com/food-api/console#Dashboard
- Shows requests used today
- Shows remaining requests
- Resets daily at midnight UTC

---

## Troubleshooting

### "API key is missing" Error

**Problem:** Backend can't find the API key

**Solutions:**
1. Verify the key is in `backend/.env`
2. Check the variable name is exactly `SPOONACULAR_API_KEY`
3. Restart the backend server
4. Check for typos or extra spaces

### "401 Unauthorized" Error

**Problem:** API key is invalid

**Solutions:**
1. Verify the API key is correct (copy from Spoonacular dashboard)
2. Check if the key has been revoked
3. Generate a new API key if needed

### "402 Payment Required" Error

**Problem:** Daily request limit exceeded

**Solutions:**
1. Wait until midnight UTC for limit reset
2. Upgrade to a paid plan
3. Implement request caching (future enhancement)

### "429 Too Many Requests" Error

**Problem:** Rate limit exceeded (1 request/second)

**Solutions:**
1. Implement request throttling in the code
2. Add delays between requests
3. Upgrade to a paid plan for higher rate limits

### No Results Returned

**Problem:** Search returns empty results

**Solutions:**
1. Try different search terms
2. Check if filters are too restrictive
3. Verify API key is working (check dashboard)
4. Check backend logs for errors

---

## Security Best Practices

### ⚠️ IMPORTANT

1. **Never commit API keys to version control**
   - Add `.env` to `.gitignore` (already done)
   - Never commit `.env` files

2. **Use different keys for different environments**
   - Development key for local testing
   - Production key for live deployment

3. **Rotate keys periodically**
   - Generate new keys every 6-12 months
   - Update in all environments

4. **Monitor usage**
   - Check Spoonacular dashboard regularly
   - Set up alerts for unusual activity

5. **Restrict key access**
   - Only backend server should have the key
   - Never expose in frontend code
   - Never log the full key

---

## API Key Location Summary

| Environment | Location | Method |
|-------------|----------|--------|
| Local Dev | `backend/.env` | Environment file |
| Docker/Podman | `backend/.env` or secrets | Environment file or Docker secrets |
| Heroku | Config Vars | `heroku config:set` |
| AWS | Environment Variables | Elastic Beanstalk config or Secrets Manager |
| Google Cloud | Environment Variables | `gcloud run services update` |
| Azure | Application Settings | Portal or CLI |

---

## Code Reference

The API key is used in:
- **File:** `backend/src/services/spoonacular.service.ts`
- **Line:** 9
- **Code:** `const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;`

The service checks if the key is present and logs a warning if missing.

---

## Support

If you need help:
1. Check Spoonacular documentation: https://spoonacular.com/food-api/docs
2. Contact Spoonacular support: support@spoonacular.com
3. Check application logs for detailed error messages

---

## Quick Start Checklist

- [ ] Sign up for Spoonacular account
- [ ] Get API key from dashboard
- [ ] Add key to `backend/.env` file
- [ ] Restart backend server
- [ ] Test Browse Recipes feature
- [ ] Verify API usage on dashboard
- [ ] Set up production key (when deploying)

---

**Last Updated:** 2026-04-20