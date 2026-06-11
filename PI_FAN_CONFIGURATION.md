# Raspberry Pi Fan Configuration Guide

**Date:** 2026-06-11  
**Current Temperature:** 66.2°C (needs adjustment)

---

## Overview

The Raspberry Pi 4B has built-in fan control via GPIO that can be configured through the boot configuration file. The default trigger temperature is typically 80°C, but you can lower it to prevent thermal throttling.

---

## Method 1: Edit /boot/firmware/config.txt (Recommended)

### Step 1: Edit the Configuration File

SSH into your Pi and edit the boot config:

```bash
sudo nano /boot/firmware/config.txt
```

### Step 2: Add Fan Control Settings

Add these lines at the end of the file (or modify if they already exist):

```ini
# Fan control settings for ClusterHAT
dtoverlay=gpio-fan,gpiopin=18,temp=60000

# Alternative with hysteresis (recommended):
dtoverlay=gpio-fan,gpiopin=18,temp=60000,hyst=5000
```

**Parameters:**
- `gpiopin=18` - GPIO pin connected to fan (ClusterHAT uses GPIO 18)
- `temp=60000` - Temperature in millidegrees (60000 = 60°C)
- `hyst=5000` - Hysteresis in millidegrees (5000 = 5°C)

**Hysteresis Explanation:**
- Fan turns ON at 60°C
- Fan turns OFF at 55°C (60°C - 5°C)
- Prevents rapid on/off cycling

### Step 3: Save and Reboot
---

## Apply Fan Control Without Rebooting

**Unfortunately, you cannot reload `/boot/firmware/config.txt` without rebooting** because device tree overlays are loaded during boot. However, you can manually control the fan immediately:

### Option 1: Manual Fan Control (Immediate - Using sysfs)

**Turn fan ON using Linux GPIO sysfs interface:**

```bash
# Export GPIO 18
echo 18 | sudo tee /sys/class/gpio/export

# Set as output
echo out | sudo tee /sys/class/gpio/gpio18/direction

# Turn fan ON
echo 1 | sudo tee /sys/class/gpio/gpio18/value

# Verify fan is running
cat /sys/class/gpio/gpio18/value  # Should return 1

# Monitor temperature
watch -n 2 vcgencmd measure_temp
```

**To turn fan off later:**
```bash
echo 0 | sudo tee /sys/class/gpio/gpio18/value
```

**To cleanup (unexport GPIO):**
```bash
echo 18 | sudo tee /sys/class/gpio/unexport
```

**Alternative: Install gpio command (optional):**
```bash
sudo apt-get update
sudo apt-get install -y wiringpi
# Then use: gpio -g mode 18 out && gpio -g write 18 1
```

### Option 2: Quick Python Script (Temporary Auto-Control)

Create a temporary fan control script that runs until reboot:

```bash
# Create temporary script
cat > /tmp/fan-control-temp.py << 'EOF'
#!/usr/bin/env python3
from gpiozero import OutputDevice
from time import sleep
import subprocess

FAN_PIN = 18
TEMP_ON = 60.0
TEMP_OFF = 55.0

fan = OutputDevice(FAN_PIN)

def get_temp():
    result = subprocess.run(['vcgencmd', 'measure_temp'], 
                          capture_output=True, text=True)
    temp = float(result.stdout.strip().split('=')[1].split("'")[0])
    return temp

print("Fan control active (Ctrl+C to stop)")
print(f"Fan ON at {TEMP_ON}°C, OFF at {TEMP_OFF}°C")

try:
    while True:
        temp = get_temp()
        
        if temp >= TEMP_ON and not fan.is_active:
            fan.on()
            print(f"[{subprocess.run(['date', '+%H:%M:%S'], capture_output=True, text=True).stdout.strip()}] Fan ON - {temp}°C")
        elif temp <= TEMP_OFF and fan.is_active:
            fan.off()
            print(f"[{subprocess.run(['date', '+%H:%M:%S'], capture_output=True, text=True).stdout.strip()}] Fan OFF - {temp}°C")
        
        sleep(5)
except KeyboardInterrupt:
    fan.off()
    print("\nFan control stopped")
EOF

# Make executable
chmod +x /tmp/fan-control-temp.py

# Run in background
sudo python3 /tmp/fan-control-temp.py &

# Check it's running
ps aux | grep fan-control
```

**To stop the temporary script:**
```bash
sudo pkill -f fan-control-temp.py
```

### Option 3: Load Overlay Manually (Advanced)

You can try loading the device tree overlay manually, but this is not officially supported and may not work:

```bash
# Compile the overlay (if not already compiled)
sudo dtoverlay gpio-fan gpiopin=18 temp=60000 hyst=5000
```

**Note:** This method is unreliable and the overlay may not persist. A reboot is the proper way to apply config.txt changes.

### Recommended Approach

1. **Immediate:** Use Option 1 (manual GPIO control) to turn fan on now
2. **Edit config.txt:** Add the dtoverlay line for permanent solution
3. **Schedule reboot:** Plan a maintenance window to reboot and apply changes properly

**Quick command to turn fan on now:**
```bash
gpio -g mode 18 out && gpio -g write 18 1 && echo "Fan is now ON"
```


```bash
# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Reboot to apply changes
sudo reboot
```

---

## Method 2: Using raspi-config (If Available)

```bash
sudo raspi-config
```

Navigate to:
1. **Performance Options** → **Fan**
2. Set GPIO pin (usually 14)
3. Set temperature threshold (recommend 60°C)

---

## Recommended Temperature Settings

Based on your current 66.2°C reading:

| Scenario | Trigger Temp | Hysteresis | Notes |
|----------|--------------|------------|-------|
| **Conservative** | 55°C | 5°C | Fan runs more often, quieter operation |
| **Balanced** | 60°C | 5°C | **Recommended** - Good balance |
| **Performance** | 65°C | 5°C | Less fan noise, higher temps |
| **Default** | 80°C | 5°C | Too high - thermal throttling risk |

**For your situation with ClusterHAT:** Use **60°C** with GPIO 18 to keep temps well below the 66.2°C you're currently seeing.

---

## Verify Fan Configuration

After rebooting, check if the fan control is active:

```bash
# Check if gpio-fan overlay is loaded
vcgencmd get_config dtoverlay | grep gpio-fan

# Monitor temperature in real-time
watch -n 2 vcgencmd measure_temp

# Check fan status (ClusterHAT uses GPIO 18)
gpio -g read 18
# Returns: 1 (fan on) or 0 (fan off)
```

---

## Troubleshooting

### Fan Not Working?

1. **Verify GPIO Pin:**
   ```bash
   # ClusterHAT uses GPIO 18 for fan control
   # Standard Pi 4 case fans typically use GPIO 14
   ```

2. **Check Fan Connection:**
   - Ensure fan is connected to correct GPIO pin
   - Verify 5V power connection
   - Check ground connection

3. **Test Fan Manually:**
   ```bash
   # Turn fan on manually (ClusterHAT GPIO 18)
   gpio -g mode 18 out
   gpio -g write 18 1
   
   # Turn fan off
   gpio -g write 18 0
   ```

4. **Check for Conflicting Overlays:**
   ```bash
   # View all loaded overlays
   vcgencmd get_config dtoverlay
   
   # Remove conflicting overlays from /boot/firmware/config.txt
   ```

### Fan Runs Constantly?

- Temperature threshold too low
- Hysteresis too small
- Increase `temp` value or add/increase `hyst` value

### Fan Cycles Too Frequently?

- Increase hysteresis value
- Example: `hyst=10000` (10°C difference)

---

## Alternative: Software Fan Control

If hardware control doesn't work, use a Python script:

```bash
# Install required package
sudo apt-get install python3-gpiozero

# Create fan control script
sudo nano /usr/local/bin/fan-control.py
```

**Script content:**
```python
#!/usr/bin/env python3
from gpiozero import OutputDevice
from time import sleep
import subprocess

FAN_PIN = 18  # ClusterHAT fan GPIO
TEMP_ON = 60.0   # Turn on at 60°C
TEMP_OFF = 55.0  # Turn off at 55°C

fan = OutputDevice(FAN_PIN)

def get_temp():
    result = subprocess.run(['vcgencmd', 'measure_temp'], 
                          capture_output=True, text=True)
    temp_str = result.stdout.strip()
    temp = float(temp_str.split('=')[1].split("'")[0])
    return temp

try:
    while True:
        temp = get_temp()
        
        if temp >= TEMP_ON and not fan.is_active:
            fan.on()
            print(f"Fan ON - Temp: {temp}°C")
        elif temp <= TEMP_OFF and fan.is_active:
            fan.off()
            print(f"Fan OFF - Temp: {temp}°C")
        
        sleep(5)
except KeyboardInterrupt:
    fan.off()
```

**Make executable and create service:**
```bash
sudo chmod +x /usr/local/bin/fan-control.py

# Create systemd service
sudo nano /etc/systemd/system/fan-control.service
```

**Service file:**
```ini
[Unit]
Description=Raspberry Pi Fan Control
After=multi-user.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /usr/local/bin/fan-control.py
Restart=always
User=root

[Install]
WantedBy=multi-user.target
```

**Enable service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable fan-control.service
sudo systemctl start fan-control.service
sudo systemctl status fan-control.service
```

---

## Quick Reference Commands

```bash
# Check current temperature
vcgencmd measure_temp

# Check throttling status
vcgencmd get_throttled

# View boot config
cat /boot/firmware/config.txt | grep -A 2 gpio-fan

# Monitor temperature continuously
watch -n 2 vcgencmd measure_temp

# Check if fan is running (ClusterHAT GPIO 18)
gpio -g read 18
```

---

## Recommended Configuration for Your Pi

Based on your 66.2°C reading, add this to `/boot/firmware/config.txt`:

```ini
# Fan control for ClusterHAT - trigger at 60°C, turn off at 55°C
dtoverlay=gpio-fan,gpiopin=18,temp=60000,hyst=5000
```

This will:
- ✅ Keep temperature below 66°C
- ✅ Prevent thermal throttling (starts at 80°C)
- ✅ Reduce fan cycling with 5°C hysteresis
- ✅ Extend hardware lifespan

---

## Expected Results

After configuration:
- **Idle Temperature:** 45-55°C
- **Under Load:** 55-65°C
- **Fan Activation:** ~60°C
- **Fan Deactivation:** ~55°C

Your current 66.2°C should drop to 55-60°C range with proper fan control.

---

**Next Steps:**
1. SSH into Pi: `ssh admin@192.168.4.110`
2. Edit config: `sudo nano /boot/firmware/config.txt`
3. Add fan settings (60°C trigger recommended)
4. Reboot: `sudo reboot`
5. Monitor: `watch -n 2 vcgencmd measure_temp`