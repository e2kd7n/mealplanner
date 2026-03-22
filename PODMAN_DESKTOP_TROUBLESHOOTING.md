# Podman Desktop Troubleshooting

## Images Not Showing in Podman Desktop

If you've built images using the terminal but don't see them in Podman Desktop, here are the common causes and solutions:

### 1. Check Which Podman Machine/Connection is Active

Podman Desktop might be connected to a different Podman machine than your terminal.

**In Terminal:**
```bash
# Check which machine is running
podman machine list

# Check current connection
podman system connection list
```

**In Podman Desktop:**
- Click on the **Settings** icon (gear) in the bottom left
- Go to **Resources** → **Podman**
- Check which machine is selected/active
- Make sure it matches the one your terminal is using

### 2. Refresh Podman Desktop

Sometimes Podman Desktop needs a manual refresh:

**Option A: Refresh the view**
- In Podman Desktop, click the **refresh icon** (circular arrow) in the Images section

**Option B: Restart Podman Desktop**
- Quit Podman Desktop completely
- Reopen it

### 3. Verify Images Exist in Terminal

```bash
# List all images
podman images

# Look specifically for your meal planner images
podman images | grep meals
```

You should see:
```
localhost/meals-backend    latest    <image-id>    <time>    <size>
localhost/meals-frontend   latest    <image-id>    <time>    <size>
```

### 4. Check Podman Machine Status (macOS/Windows)

On macOS and Windows, Podman runs in a VM. Ensure it's running:

```bash
# Check machine status
podman machine list

# If not running, start it
podman machine start

# Verify connection
podman system connection list
```

### 5. Build Images with Correct Context

If images still don't appear, ensure you're building in the correct Podman context:

```bash
# Check current context
podman context list

# Use the default context
podman context use podman-machine-default

# Then rebuild
./scripts/build-for-pi.sh
```

### 6. Podman Desktop Connection Issues

**Reset Podman Desktop connection:**

1. In Podman Desktop, go to **Settings** → **Resources**
2. Find your Podman machine
3. Click **Restart** or **Stop** then **Start**
4. Refresh the Images view

### 7. Manual Verification Commands

Run these commands to verify everything is working:

```bash
# 1. Check Podman is working
podman version

# 2. Check machine is running (macOS/Windows)
podman machine list

# 3. List all images
podman images

# 4. Check image details
podman inspect meals-backend:latest
podman inspect meals-frontend:latest

# 5. Check if images are in the correct format
podman images --format "{{.Repository}}:{{.Tag}} {{.ID}}"
```

### 8. Common Scenarios

#### Scenario A: Images in Terminal, Not in Desktop
**Cause:** Podman Desktop is connected to a different machine/context

**Solution:**
```bash
# Find which machine has your images
podman machine list
podman --connection podman-machine-default images

# In Podman Desktop, switch to that machine in Settings
```

#### Scenario B: Built with Docker, Want to Use in Podman Desktop
**Cause:** Docker and Podman use separate image stores

**Solution:**
```bash
# Export from Docker
docker save -o meals-backend.tar meals-backend:latest
docker save -o meals-frontend.tar meals-frontend:latest

# Import to Podman
podman load -i meals-backend.tar
podman load -i meals-frontend.tar
```

#### Scenario C: Images Disappear After Restart
**Cause:** Images might be in a temporary machine or wrong storage location

**Solution:**
```bash
# Check storage location
podman info | grep -A 5 "store"

# Ensure machine is persistent
podman machine list
# Look for "Currently running" status
```

### 9. Alternative: Use Terminal Commands

You don't need Podman Desktop to work with images. Use terminal commands:

```bash
# List images
podman images

# Remove images
podman rmi meals-backend:latest

# Build images
./scripts/build-for-pi.sh

# Save images
podman save -o meals-backend.tar meals-backend:latest

# Load images
podman load -i meals-backend.tar

# Inspect images
podman inspect meals-backend:latest
```

### 10. Debug Information to Collect

If issues persist, collect this information:

```bash
# System info
podman version
podman info

# Machine info (macOS/Windows)
podman machine list
podman machine inspect podman-machine-default

# Connection info
podman system connection list

# Image info
podman images --all
podman images --digests

# Storage info
podman system df
```

## Quick Fix Checklist

- [ ] Podman machine is running (`podman machine list`)
- [ ] Terminal and Desktop use same machine/connection
- [ ] Refreshed Podman Desktop view
- [ ] Images exist in terminal (`podman images`)
- [ ] Correct context selected (`podman context list`)
- [ ] Restarted Podman Desktop
- [ ] Checked Podman Desktop Settings → Resources

## Still Having Issues?

If images still don't appear in Podman Desktop but work in terminal:

**Workaround:** Use terminal commands exclusively. Podman Desktop is optional - all functionality is available via CLI:

```bash
# Build
./scripts/build-for-pi.sh

# View images
podman images

# Save for transfer
# (already done by build-for-pi.sh)

# Transfer to Pi
scp pi-images/*.tar pi@raspberrypi.local:~/mealplanner/pi-images/
```

The images will work perfectly fine even if Podman Desktop doesn't display them!

---

Made with Bob