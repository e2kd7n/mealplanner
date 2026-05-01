# Raspberry Pi SD Card Cloning Guide

## Overview
This guide will help you clone your existing Raspberry Pi SD card to a new, higher-performance card while preserving all data, configurations, and the meal planner application.

## Prerequisites

### Hardware Required
- Current SD card (in your Raspberry Pi)
- New higher-performance SD card (equal or larger capacity)
- SD card reader (USB or built-in)
- Computer (macOS, Linux, or Windows)

### Software Required
- **macOS**: Built-in `dd` command or [balenaEtcher](https://www.balena.io/etcher/)
- **Linux**: Built-in `dd` command
- **Windows**: [Win32 Disk Imager](https://sourceforge.net/projects/win32diskimager/) or [balenaEtcher](https://www.balena.io/etcher/)

## Method 1: Using balenaEtcher (Recommended - Easiest)

### Step 1: Create Image from Current SD Card

1. **Shutdown your Raspberry Pi safely**:
   ```bash
   ssh pi@your-pi-address
   sudo shutdown -h now
   ```

2. **Remove the SD card** from your Raspberry Pi and insert it into your computer's card reader

3. **Download and install balenaEtcher**:
   - Visit https://www.balena.io/etcher/
   - Download for your operating system
   - Install the application

4. **Create the image**:
   - Open balenaEtcher
   - Click "Flash from file" → Select "Clone drive"
   - Select your current SD card as the source
   - Choose a location to save the image file (e.g., `raspberry-pi-backup.img`)
   - Click "Flash!" and wait for completion

### Step 2: Write Image to New SD Card

1. **Remove the old SD card** and insert the **new SD card** into your card reader

2. **Flash the image to the new card**:
   - Open balenaEtcher
   - Click "Flash from file" and select the image you just created
   - Select your new SD card as the target
   - Click "Flash!" and wait for completion

3. **Verify the flash** completed successfully

4. **Eject the new SD card** safely

### Step 3: Expand Filesystem (if new card is larger)

1. **Insert the new SD card** into your Raspberry Pi and boot it up

2. **SSH into your Pi**:
   ```bash
   ssh pi@your-pi-address
   ```

3. **Expand the filesystem** to use the full capacity:
   ```bash
   sudo raspi-config
   ```
   - Navigate to: `Advanced Options` → `Expand Filesystem`
   - Select "Yes" and reboot

   Or use the command line:
   ```bash
   sudo raspi-config --expand-rootfs
   sudo reboot
   ```

4. **Verify the expansion**:
   ```bash
   df -h
   ```
   You should see the root partition using the full capacity of your new card.

## Method 2: Using dd Command (Advanced - macOS/Linux)

### Step 1: Create Image from Current SD Card

1. **Shutdown your Raspberry Pi**:
   ```bash
   ssh pi@your-pi-address
   sudo shutdown -h now
   ```

2. **Insert the current SD card** into your computer

3. **Identify the disk** (macOS):
   ```bash
   diskutil list
   ```
   Look for your SD card (e.g., `/dev/disk2` or `/dev/disk4`)
   
   **IMPORTANT**: Make absolutely sure you identify the correct disk!

4. **Unmount the disk** (macOS):
   ```bash
   diskutil unmountDisk /dev/diskX
   ```
   Replace `X` with your disk number

5. **Create the image**:
   ```bash
   sudo dd if=/dev/rdiskX of=~/raspberry-pi-backup.img bs=4m status=progress
   ```
   - Replace `X` with your disk number
   - Use `rdiskX` (raw disk) for faster performance on macOS
   - This will take 15-60 minutes depending on card size
   - The `status=progress` shows progress (Linux only; omit on macOS)

6. **Compress the image** (optional, saves space):
   ```bash
   gzip ~/raspberry-pi-backup.img
   ```

### Step 2: Write Image to New SD Card

1. **Remove old card, insert new card** into your computer

2. **Identify the new disk**:
   ```bash
   diskutil list
   ```

3. **Unmount the new disk**:
   ```bash
   diskutil unmountDisk /dev/diskX
   ```

4. **Write the image**:
   
   If compressed:
   ```bash
   gunzip -c ~/raspberry-pi-backup.img.gz | sudo dd of=/dev/rdiskX bs=4m
   ```
   
   If not compressed:
   ```bash
   sudo dd if=~/raspberry-pi-backup.img of=/dev/rdiskX bs=4m status=progress
   ```

5. **Sync and eject**:
   ```bash
   sync
   diskutil eject /dev/diskX
   ```

### Step 3: Expand Filesystem

Follow the same steps as Method 1, Step 3.

## Method 3: Using PiShrink (Advanced - Optimal for smaller images)

PiShrink automatically shrinks the image to the minimum size and allows it to expand on first boot.

### Step 1: Create and Shrink Image

1. **Create image using dd** (follow Method 2, Step 1)

2. **Download PiShrink**:
   ```bash
   wget https://raw.githubusercontent.com/Drewsif/PiShrink/master/pishrink.sh
   chmod +x pishrink.sh
   ```

3. **Shrink the image**:
   ```bash
   sudo ./pishrink.sh raspberry-pi-backup.img
   ```
   This will reduce the image size significantly.

4. **Write to new card** (follow Method 2, Step 2)

5. **First boot will auto-expand** the filesystem to fill the new card

## Verification Steps

After cloning and booting from the new SD card:

1. **Check disk space**:
   ```bash
   df -h
   ```

2. **Verify services are running**:
   ```bash
   sudo systemctl status podman
   podman ps
   ```

3. **Test the meal planner application**:
   - Access the web interface
   - Verify database connectivity
   - Check that all features work

4. **Check system logs** for any errors:
   ```bash
   sudo journalctl -xe
   ```

## Performance Comparison

After cloning, you can benchmark the performance improvement:

### Test Read Speed
```bash
sudo hdparm -t /dev/mmcblk0
```

### Test Write Speed
```bash
dd if=/dev/zero of=~/test.tmp bs=500K count=1024
rm ~/test.tmp
```

### Test Random I/O
```bash
sudo apt-get install fio
fio --name=random-write --ioengine=posixaio --rw=randwrite --bs=4k --size=4g --numjobs=1 --runtime=60 --time_based --end_fsync=1
```

## Troubleshooting

### Issue: "Resource busy" error when unmounting
```bash
# Find what's using the disk
sudo lsof | grep /dev/diskX
# Kill the processes or use diskutil
diskutil unmountDisk force /dev/diskX
```

### Issue: New card not booting
- Verify the image was written completely
- Check the SD card is not corrupted
- Try re-flashing the image
- Ensure the new card is compatible with Raspberry Pi

### Issue: Filesystem not expanding
```bash
# Manually resize
sudo raspi-config --expand-rootfs
sudo reboot
```

### Issue: Permission denied with dd
- Make sure you're using `sudo`
- Verify you have the correct disk identifier
- Check the SD card is not write-protected

## Best Practices

1. **Always create a backup** before attempting to clone
2. **Verify the clone** before removing the original card
3. **Use high-quality SD cards** (SanDisk Extreme, Samsung EVO, etc.)
4. **Choose A2-rated cards** for better random I/O performance
5. **Keep the original card** as a backup until you're sure the new one works
6. **Test thoroughly** before relying on the new card

## Recommended SD Cards for Raspberry Pi

For optimal performance with your meal planner application:

- **SanDisk Extreme Pro** (A2, U3, V30) - Best performance
- **Samsung EVO Plus** (A2, U3) - Good balance of price/performance
- **SanDisk Ultra** (A1, U1) - Budget option
- **Kingston Canvas Go! Plus** (A2, U3, V30) - Good alternative

Minimum recommended: 32GB, A1 rating, Class 10

## Additional Resources

- [Raspberry Pi Documentation](https://www.raspberrypi.org/documentation/)
- [SD Card Performance Testing](https://www.jeffgeerling.com/blog/2019/raspberry-pi-microsd-card-performance-comparison-2019)
- [balenaEtcher Documentation](https://www.balena.io/etcher/)

## Related Documentation

- [RASPBERRY_PI_DEPLOYMENT_GUIDE.md](./RASPBERRY_PI_DEPLOYMENT_GUIDE.md) - Full deployment guide
- [DATABASE_BACKUP.md](./DATABASE_BACKUP.md) - Database backup procedures
- [PI_OPTIMIZATION_PROPOSAL.md](./PI_OPTIMIZATION_PROPOSAL.md) - Performance optimization tips