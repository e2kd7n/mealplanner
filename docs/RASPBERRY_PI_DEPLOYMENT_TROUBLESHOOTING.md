# Raspberry Pi Deployment Troubleshooting

## Backend Container Exiting with Status 159

The backend container is exiting immediately after startup with exit code 159. This indicates a startup failure.

### Diagnostic Steps

Run these commands on your Raspberry Pi to diagnose the issue:

#### 1. Check Container Logs (Full Output)
```bash
cd ~/mealplanner
podman logs meals-backend 2>&1 | tail -100
```

#### 2. Verify Secrets Exist
```bash
ls -la ~/mealplanner/secrets/
cat ~/mealplanner/secrets/postgres_password.txt
cat ~/mealplanner/secrets/jwt_secret.txt
cat ~/mealplanner/secrets/jwt_refresh_secret.txt
cat ~/mealplanner/secrets/session_secret.txt
```

#### 3. Check Database Connectivity
```bash
podman exec meals-postgres pg_isready -U mealplanner -d meal_planner
```

#### 4. Verify Image Integrity
```bash
podman images | grep meals-backend
podman inspect meals-backend:latest | grep -A 5 "Entrypoint\|Cmd"
```

#### 5. Test Container Manually
```bash
# Try running the container interactively to see startup errors
podman run --rm -it \
  --network meals-network \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PORT=5432 \
  -e POSTGRES_DB=meal_planner \
  -e POSTGRES_USER=mealplanner \
  -v ~/mealplanner/secrets/postgres_password.txt:/run/secrets/postgres_password:ro \
  -v ~/mealplanner/secrets/jwt_secret.txt:/run/secrets/jwt_secret:ro \
  -v ~/mealplanner/secrets/jwt_refresh_secret.txt:/run/secrets/jwt_refresh_secret:ro \
  -v ~/mealplanner/secrets/session_secret.txt:/run/secrets/session_secret:ro \
  meals-backend:latest
```

### Common Issues and Solutions

#### Issue 1: Missing or Invalid Secrets
**Symptoms:** Container exits immediately, logs show "ERROR: secret not found"

**Solution:**
```bash
cd ~/mealplanner
./scripts/generate-secrets.sh
```

#### Issue 2: Database Not Ready
**Symptoms:** Container exits with database connection errors

**Solution:**
```bash
# Wait for postgres to be fully ready
podman-compose -f podman-compose.pi.yml up -d postgres
sleep 30
podman-compose -f podman-compose.pi.yml up -d backend
```

#### Issue 3: Memory Issues (OOM Killer)
**Symptoms:** Exit code 137 or 159, system logs show OOM

**Solution:**
```bash
# Check system memory
free -h

# Check for OOM events
sudo dmesg | grep -i "out of memory"

# Increase swap if needed
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

#### Issue 4: Corrupted Image
**Symptoms:** Container exits immediately with no clear error

**Solution:**
```bash
# Remove and reload the image
podman rmi meals-backend:latest
cd ~/mealplanner
./scripts/load-pi-images.sh
```

#### Issue 5: Entrypoint Script Issues
**Symptoms:** Container exits with shell script errors

**Solution:**
```bash
# Check if entrypoint script has correct line endings (LF not CRLF)
podman run --rm meals-backend:latest cat /app/docker-entrypoint.sh | file -

# If it shows CRLF, rebuild the image with correct line endings
```

#### Issue 6: Node.js Memory Limit Too Low
**Symptoms:** Container exits during startup, logs show heap errors

**Solution:**
Edit `podman-compose.pi.yml` and increase NODE_OPTIONS:
```yaml
environment:
  NODE_OPTIONS: --max-old-space-size=512  # Increase from 256
```

### Quick Recovery Steps

If you need to get the system running quickly:

```bash
cd ~/mealplanner

# 1. Stop everything
podman-compose -f podman-compose.pi.yml down

# 2. Regenerate secrets
./scripts/generate-secrets.sh

# 3. Start database first
podman-compose -f podman-compose.pi.yml up -d postgres

# 4. Wait for database to be ready
sleep 30

# 5. Start backend
podman-compose -f podman-compose.pi.yml up -d backend

# 6. Check logs immediately
podman logs -f meals-backend
```

### Collecting Diagnostic Information

If the issue persists, collect this information:

```bash
# System info
uname -a
free -h
df -h

# Podman info
podman version
podman info

# Container status
podman-compose -f podman-compose.pi.yml ps

# All container logs
podman logs meals-postgres > postgres.log 2>&1
podman logs meals-backend > backend.log 2>&1

# System logs
sudo journalctl -u podman --since "1 hour ago" > podman-system.log
```

### Next Steps

1. Run the diagnostic commands above
2. Check the logs for specific error messages
3. Apply the appropriate solution based on the error
4. If issue persists, provide the log output for further analysis

---

*Last Updated: 2026-04-28*