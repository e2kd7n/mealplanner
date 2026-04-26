#!/bin/bash

# Fix line endings on scripts (convert CRLF to LF)
# Run this on the Pi if you encounter "r#!/bin/bash" errors

echo "🔧 Fixing line endings in scripts..."

# Fix all shell scripts in the scripts directory
for script in scripts/*.sh; do
    if [ -f "$script" ]; then
        echo "  Fixing: $script"
        # Remove carriage returns
        sed -i 's/\r$//' "$script"
        # Ensure executable
        chmod +x "$script"
    fi
done

echo "✅ Line endings fixed!"
echo ""
echo "You can now run your scripts normally."

# Made with Bob
