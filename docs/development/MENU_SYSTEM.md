# Interactive Menu System

## Overview

The `scripts/menu.sh` provides a unified, interactive interface for all development and deployment operations. It automatically detects the environment (Raspberry Pi vs Development machine) and shows appropriate options.

## Usage

```bash
./scripts/menu.sh
```

## Features

### Environment Detection
- Automatically detects Raspberry Pi, macOS, or Linux
- Shows environment-specific options
- Displays container runtime (Docker/Podman)

### Real-time Status
- Current deployment mode (Local Dev vs Container)
- Disk usage with warnings
- Memory usage (Pi only)
- CPU temperature (Pi only)
- Container status

### Logical Groupings

#### Development Machine Menu
1. **Local Deployment** - Start/stop local services
2. **Build for Pi** - Cross-compile images
3. **Pi Deployment (SSH)** - Remote deployment operations
4. **Testing** - E2E test execution
5. **Database** - Backup/restore operations
6. **Maintenance** - Cleanup and setup utilities

#### Raspberry Pi Menu
1. **Deployment** - Start/stop/restart containers
2. **Build (On Pi)** - Build images locally
3. **Maintenance** - Health checks and cleanup
4. **Database** - Backup/restore operations

## Script Integration Pattern

### CALLED_FROM_MENU Environment Variable

All scripts invoked by the menu receive `CALLED_FROM_MENU=1` environment variable. This allows scripts to:
- Return to menu after completion (when called from menu)
- Run normally with full output (when called directly)

### Implementation Example

```bash
#!/bin/bash
# your-script.sh

# ... script logic ...

# At the end of the script:
if [ -n "$CALLED_FROM_MENU" ]; then
    echo "Operation complete. Returning to menu..."
    sleep 2
    # Script exits and returns to menu
else
    # When called directly, show additional info or keep running
    echo "Press Enter to continue..."
    read
fi
```

### Scripts with Menu Integration

**Development Scripts:**
- `local-run.sh` - Returns to menu instead of tailing logs
- `deploy-podman.sh` - Returns after deployment
- `local-stop.sh` - Quick stop and return
- `local-bounce.sh` - Restart and return
- `check-deployment-mode.sh` - Show status and return
- `build-for-pi.sh` - Build and return
- `backup-database.sh` - Backup and return
- `generate-secrets.sh` - Generate and return
- `first-time-setup.sh` - Setup and return

**Pi Scripts:**
- `pi-run.sh` - Deploy and return
- `pi-stop.sh` - Stop and return
- `pi-bounce.sh` - Restart and return
- `pi-health-check.sh` - Check and return
- `pi-diagnostics.sh` - Diagnose and return
- `cleanup-pi.sh` - Cleanup and return
- `build-on-pi.sh` - Build and return
- `load-pi-images.sh` - Load and return

## Menu Structure

### Development Machine

```
🚀 Local Deployment:
  1) Local Dev Mode (Port 5173) - Hot reload, debugging
  2) Container Mode (Port 8080) - Production testing
  3) Stop all services
  4) Restart services
  5) Check deployment mode

🔨 Build for Pi:
  6) Build images for Pi (cross-compile)
  7) Transfer images to Pi

🚀 Pi Deployment (SSH):
  8) Deploy to Pi
  9) Check Pi health
  10) View Pi logs

🧪 Testing:
  11) Run E2E tests
  12) Run E2E tests (UI mode)

💾 Database:
  13) Backup database (local)
  14) Restore database (local)

🔧 Maintenance:
  15) Cleanup dev machine
  16) Generate secrets
  17) First-time setup
```

### Raspberry Pi

```
🚀 Deployment:
  1) Deploy/Start containers
  2) Stop containers
  3) Restart containers
  4) Check deployment mode

🔨 Build (On Pi):
  5) Build all images
  6) Build frontend only
  7) Load pre-built images

🔧 Maintenance:
  8) Health check
  9) Full diagnostics
  10) Cleanup Pi
  11) Pre-build cleanup
  12) Journal cleanup (sudo)

💾 Database:
  13) Backup database
  14) Restore database
  15) Safe migration
```

## Benefits

1. **Unified Interface** - Single entry point for all operations
2. **Context Awareness** - Shows current status and appropriate options
3. **Error Prevention** - Validates environment and resources
4. **Guided Workflow** - Clear descriptions and resource requirements
5. **Automatic Mode Switching** - Handles stopping one mode before starting another
6. **Return to Menu** - Scripts return to menu for easy workflow

## Best Practices

### For Script Authors

1. **Check CALLED_FROM_MENU** at the end of your script
2. **Provide brief status** when returning to menu
3. **Show full output** when called directly
4. **Use consistent messaging** with color codes from utilities.sh
5. **Handle errors gracefully** and return appropriate exit codes

### For Users

1. **Use the menu** for most operations - it's the easiest way
2. **Call scripts directly** when you need full output or want to pipe results
3. **Check status first** using option to see what's running
4. **Read resource requirements** before starting services

## Troubleshooting

### Menu doesn't show my script
- Ensure script is executable: `chmod +x scripts/your-script.sh`
- Add it to the appropriate execute function in menu.sh
- Follow the naming convention and grouping

### Script doesn't return to menu
- Check if CALLED_FROM_MENU is being passed correctly
- Ensure script doesn't have `exit` calls that bypass the check
- Verify the script completes successfully

### Wrong environment detected
- Check `/proc/device-tree/model` on Pi
- Verify OSTYPE environment variable
- Review detect_environment() function

## Related Documentation

- [Quick Start Guide](QUICK_START.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Raspberry Pi Guide](RASPBERRY_PI_DEPLOYMENT_GUIDE.md)
- [Utilities Reference](../scripts/utilities.sh)