# Pi Fan Status Check - GPIO 18 Already in Use

**Error:** `Device or resource busy` on GPIO 18  
**This is GOOD NEWS** - Something is already controlling your fan!

---

## Check What's Using GPIO 18

Run these commands to see what's controlling the fan:

```bash
# Check GPIO 18 status
gpioinfo gpiochip0 | grep -A1 "line  18"

# Check boot config for fan overlay
grep -i "gpio-fan" /boot/firmware/config.txt

# Check device tree overlays
vcgencmd get_config dtoverlay | grep -i fan

# Check if fan is currently on/off
# (This will show the current state even if we can't control it)
gpioget gpiochip0 18
```

---

## Likely Scenarios

### Scenario 1: Fan Already Configured ✅

If `grep gpio-fan /boot/firmware/config.txt` shows a line like:
```
dtoverlay=gpio-fan,gpiopin=18,temp=80000
```

**This means:**
- ✅ Fan control is already set up
- ⚠️ Trigger temperature might be too high (80°C default)
- 🔧 You just need to lower the temperature threshold

**Fix:** Edit the existing line to lower the temperature:

```bash
sudo nano /boot/firmware/config.txt

# Change from:
dtoverlay=gpio-fan,gpiopin=18,temp=80000

# To:
dtoverlay=gpio-fan,gpiopin=18,temp=60000,hyst=5000

# Save and reboot
sudo reboot
```

### Scenario 2: ClusterHAT Using GPIO 18

The ClusterHAT might be managing GPIO 18 for its own purposes. Check:

```bash
# Check ClusterHAT config
cat /boot/firmware/config.txt | grep -i cluster

# Check what's using GPIO 18
lsof | grep gpio
ps aux | grep gpio
```

### Scenario 3: Kernel Driver Owns GPIO 18

A kernel driver might have claimed GPIO 18. Check:

```bash
# See what kernel module owns it
gpioinfo gpiochip0 | grep "line  18"
# Look for "consumer" field - shows what's using it
```

---

## Quick Diagnostic Script

Run this to get all the info:

```bash
cat > /tmp/fan-diagnostic.sh << 'EOF'
#!/bin/bash
echo "=== Fan Diagnostic Report ==="
echo ""

echo "1. Current Temperature:"
vcgencmd measure_temp
echo ""

echo "2. GPIO 18 Status:"
gpioinfo gpiochip0 | grep -A1 "line  18"
echo ""

echo "3. GPIO 18 Current Value:"
gpioget gpiochip0 18 2>&1 || echo "Cannot read (in use by kernel)"
echo ""

echo "4. Boot Config Fan Settings:"
grep -i "gpio-fan\|fan" /boot/firmware/config.txt | grep -v "^#"
echo ""

echo "5. Active Device Tree Overlays:"
vcgencmd get_config dtoverlay | grep -i fan
echo ""

echo "6. ClusterHAT Status:"
clusterhat status 2>/dev/null || echo "ClusterHAT command not available"
echo ""

echo "7. Processes Using GPIO:"
ps aux | grep -i gpio | grep -v grep
echo ""

echo "=== End Report ==="
EOF

chmod +x /tmp/fan-diagnostic.sh
bash /tmp/fan-diagnostic.sh
```

---

## Most Likely Solution

Based on the "Device or resource busy" error, **the fan is probably already configured** but with the default 80°C trigger temperature.

**To fix:**

1. Check current config:
   ```bash
   grep gpio-fan /boot/firmware/config.txt
   ```

2. If it exists, edit it:
   ```bash
   sudo nano /boot/firmware/config.txt
   # Change temp=80000 to temp=60000
   ```

3. If it doesn't exist, add it:
   ```bash
   echo "dtoverlay=gpio-fan,gpiopin=18,temp=60000,hyst=5000" | sudo tee -a /boot/firmware/config.txt
   ```

4. Reboot:
   ```bash
   sudo reboot
   ```

---

## Alternative: Check if Fan is Working

Even though you can't manually control GPIO 18, you can check if the fan is working:

```bash
# Heat up the CPU to trigger the fan
stress-ng --cpu 4 --timeout 60s

# Watch temperature (fan should kick in at threshold)
watch -n 1 vcgencmd measure_temp

# Install stress-ng if needed:
sudo apt-get install -y stress-ng
```

If temperature stays below 80°C during stress test, the fan is working but threshold is too high.

---

## Summary

The "Device or resource busy" error means:
- ✅ GPIO 18 is already claimed (good!)
- ✅ Something is managing the fan
- ⚠️ The trigger temperature might be too high (default 80°C)

**Next step:** Run the diagnostic script above to see what's controlling GPIO 18 and what the current temperature threshold is.