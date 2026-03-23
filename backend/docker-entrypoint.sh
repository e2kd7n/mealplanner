#!/bin/sh
set -e

# Function to URL encode a string
urlencode() {
    echo "$1" | sed 's/:/%3A/g; s/\//%2F/g; s/+/%2B/g; s/=/%3D/g'
}

# Construct DATABASE_URL from environment variables and secrets
if [ -f /run/secrets/postgres_password ]; then
    POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
    # URL encode the password to handle special characters
    POSTGRES_PASSWORD_ENCODED=$(urlencode "$POSTGRES_PASSWORD")
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD_ENCODED}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"
    echo "DATABASE_URL constructed from secrets"
else
    echo "ERROR: postgres_password secret not found"
    exit 1
fi

# Start the application
exec node dist/index.js

# Made with Bob
