# Pi Fan Control - Modern Method (libgpiod)

**Your System:** Debian 12 (bookworm), Kernel 6.12.87  
**Issue:** sysfs GPIO interface (`/sys/class/gpio/`) is deprecated and disabled

---

## Quick Solution: Use libgpiod Tools

### Step 1: Install libgpiod Tools

```bash
sudo apt-get update
sudo apt-get install -y gpiod
```

### Step 2: Turn Fan ON Immediately

```bash
# Turn fan ON (GPIO 18, ClusterHAT)
gpioset gpiochip0 18=1

# This command will hold the GPIO high while running
# Press Ctrl+C to stop (fan will turn off)
```

**To run in background:**
```bash
# Turn fan on and keep it on
gpioset --mode=signal --background gpiochip0 18=1

# Check if it's running
ps aux | grep gpioset

# To turn off, kill the process
sudo pkill gpioset
```

### Step 3: Monitor Temperature

```bash
watch -n 2 vcgencmd measure_temp
```

---

## Alternative: Python Script (Recommended for Auto-Control)

### Install Python GPIO Library

```bash
sudo apt-get install -y python3-gpiod
```

### Create Fan Control Script

```bash
cat > /tmp/fan-control.py << 'EOF'
#!/usr/bin/env python3
import gpiod
import subprocess
import time

# Configuration
FAN_GPIO = 18
TEMP_ON = 60.0   # Turn on at 60°C
TEMP_OFF = 55.0  # Turn off at 55°C
CHECK_INTERVAL = 5  # Check every 5 seconds

def get_temp():
    """Get CPU temperature"""
    result = subprocess.run(['vcgencmd', 'measure_temp'], 
                          capture_output=True, text=True)
    temp_str = result.stdout.strip()
    temp = float(temp_str.split('=')[1].split("'")[0])
    return temp

def main():
    # Open GPIO chip
    chip = gpiod.Chip('gpiochip0')
    
    # Get GPIO line
    fan_line = chip.get_line(FAN_GPIO)
    
    # Request line as output
    fan_line.request(consumer='fan-control', type=gpiod.LINE_REQ_DIR_OUT)
    
    print(f"Fan control active on GPIO {FAN_GPIO}")
    print(f"Fan ON at {TEMP_ON}°C, OFF at {TEMP_OFF}°C")
    print("Press Ctrl+C to stop")
    
    try:
        fan_state = False
        while True:
            temp = get_temp()
            
            if temp >= TEMP_ON and not fan_state:
                fan_line.set_value(1)
                fan_state = True
                print(f"[{time.strftime('%H:%M:%S')}] Fan ON - {temp}°C")
            elif temp <= TEMP_OFF and fan_state:
                fan_line.set_value(0)
                fan_state = False
                print(f"[{time.strftime('%H:%M:%S')}] Fan OFF - {temp}°C")
            
            time.sleep(CHECK_INTERVAL)
    
    except KeyboardInterrupt:
        print("\nStopping fan control...")
        fan_line.set_value(0)
        fan_line.release()
        print("Fan turned off")

if __name__ == '__main__':
    main()
EOF

chmod +x /tmp/fan-control.py
```

### Run the Script

```bash
# Run in foreground (see output)
sudo python3 /tmp/fan-control.py

# Or run in background
sudo python3 /tmp/fan-control.py > /tmp/fan-control.log 2>&1 &

# Check if running
ps aux | grep fan-control

# View log
tail -f /tmp/fan-control.log

# Stop it
sudo pkill -f fan-control.py
```

---

## Permanent Solution: Edit config.txt

The device tree overlay method still works and is the best permanent solution:

```bash
sudo nano /boot/firmware/config.txt
```

Add this line:
```ini
dtoverlay=gpio-fan,gpiopin=18,temp=60000,hyst=5000
```

Save and reboot:
```bash
sudo reboot
```

---

## Quick Commands Summary

### Immediate Fan Control (Simple)
```bash
# Install tools
sudo apt-get install -y gpiod

# Turn fan ON (stays on until you Ctrl+C)
gpioset gpiochip0 18=1

# Or run in background
gpioset --mode=signal --background gpiochip0 18=1

# Turn off
sudo pkill gpioset
```

### Automatic Temperature Control (Better)
```bash
# Install Python GPIO
sudo apt-get install -y python3-gpiod

# Create and run script (see above)
sudo python3 /tmp/fan-control.py
```

### Permanent Solution (Best)
```bash
# Edit config
sudo nano /boot/firmware/config.txt

# Add: dtoverlay=gpio-fan,gpiopin=18,temp=60000,hyst=5000

# Reboot
sudo reboot
```

---

## Troubleshooting

### Check Available GPIO Chips
```bash
gpiodetect
# Should show: gpiochip0 [pinctrl-bcm2711] (58 lines)
```

### List GPIO Lines
```bash
gpioinfo gpiochip0 | grep -A1 "line  18"
```

### Check if GPIO 18 is in Use
```bash
gpioinfo gpiochip0 | grep "line  18"
# If it shows "kernel" or another consumer, it's already in use
```

### Monitor Temperature
```bash
watch -n 2 vcgencmd measure_temp
```

---

## Why sysfs Doesn't Work

The `/sys/class/gpio/` interface was deprecated in Linux kernel 4.8 (2016) and is being phased out. Your kernel (6.12.87) has it disabled. The modern replacement is:

- **libgpiod** - Character device interface (`/dev/gpiochip0`)
- **Device tree overlays** - Kernel-managed GPIO (best for fans)

---

## Expected Results

After turning fan on:
- **Current temp:** 66.2°C
- **Expected after 2-3 minutes:** 55-60°C
- **Steady state:** 50-55°C

Monitor with: `watch -n 2 vcgencmd measure_temp`