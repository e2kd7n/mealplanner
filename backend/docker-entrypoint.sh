#!/bin/sh
set -e

# Function to URL encode a string
urlencode() {
    echo "$1" | sed 's/:/%3A/g; s/\//%2F/g; s/+/%2B/g; s/=/%3D/g'
}

echo "Loading secrets from /run/secrets..."

# Construct DATABASE_URL from environment variables and secrets
if [ -f /run/secrets/postgres_password ]; then
    POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
    # URL encode the password to handle special characters
    POSTGRES_PASSWORD_ENCODED=$(urlencode "$POSTGRES_PASSWORD")
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD_ENCODED}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    echo "✓ DATABASE_URL constructed from secrets"
else
    echo "ERROR: postgres_password secret not found at /run/secrets/postgres_password"
    exit 1
fi

# Load JWT_SECRET
if [ -f /run/secrets/jwt_secret ]; then
    export JWT_SECRET=$(cat /run/secrets/jwt_secret)
    echo "✓ JWT_SECRET loaded from secrets"
else
    echo "ERROR: jwt_secret not found at /run/secrets/jwt_secret"
    exit 1
fi

# Load JWT_REFRESH_SECRET
if [ -f /run/secrets/jwt_refresh_secret ]; then
    export JWT_REFRESH_SECRET=$(cat /run/secrets/jwt_refresh_secret)
    echo "✓ JWT_REFRESH_SECRET loaded from secrets"
else
    echo "ERROR: jwt_refresh_secret not found at /run/secrets/jwt_refresh_secret"
    exit 1
fi

# Load SESSION_SECRET
if [ -f /run/secrets/session_secret ]; then
    export SESSION_SECRET=$(cat /run/secrets/session_secret)
    echo "✓ SESSION_SECRET loaded from secrets"
else
    echo "ERROR: session_secret not found at /run/secrets/session_secret"
    exit 1
fi

echo "All secrets loaded successfully. Starting application..."

# Start the application
exec node dist/index.js

# Made with Bob
