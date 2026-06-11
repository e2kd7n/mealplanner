# SSH Authentication Troubleshooting Summary

**Date:** 2026-06-11  
**Issue:** Cannot authenticate to Pi cluster at admin@192.168.4.110

## Problem Diagnosis

The SSH connection is failing despite:
- ✅ SSH key exists at `~/.ssh/id_ed25519.pub`
- ✅ Server accepts the key (confirmed via `ssh -vvv`)
- ✅ Key was added to authorized_keys (user confirmed)
- ❌ Authentication still fails after key signing

### Debug Output Analysis

```
debug1: Server accepts key: /Users/erik/.ssh/id_ed25519 ED25519 SHA256:fPTvXjCDMLZ+Ln2f6Uuq7JUKBePlof6x7x4Ta/1ek1w
debug3: sign_and_send_pubkey: using publickey-hostbound-v00@openssh.com
```

The server **accepts** the key but authentication fails after signing. This suggests:

1. **SSH Agent Issue**: The key may not be properly loaded in the SSH agent
2. **Authorized Keys Permissions**: The `~/.ssh/authorized_keys` file on the Pi may have incorrect permissions
3. **SELinux/AppArmor**: Security policies may be blocking key authentication
4. **Key Format Mismatch**: The key format may not be compatible with the Pi's SSH version

## Recommended Solutions

### Option 1: Fix SSH Key Authentication (Recommended)

SSH into the Pi manually with password, then run:

```bash
# On the Pi
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
restorecon -R ~/.ssh  # If SELinux is enabled

# Verify the key is present
cat ~/.ssh/authorized_keys | grep "$(cat /path/to/local/id_ed25519.pub)"
```

### Option 2: Use Password Authentication

Add this to your `~/.ssh/config`:

```
Host pi-cluster
    HostName 192.168.4.110
    User admin
    PreferredAuthentications password
```

Then connect with: `ssh pi-cluster`

### Option 3: Manual Monitoring (Immediate Solution)

1. SSH manually: `ssh admin@192.168.4.110`
2. Transfer the monitoring script:
   ```bash
   scp pi-monitoring-commands.sh admin@192.168.4.110:~/
   ```
3. Run on Pi:
   ```bash
   bash ~/pi-monitoring-commands.sh | tee monitoring-report-$(date +%Y%m%d).txt
   ```
4. Copy results back:
   ```bash
   scp admin@192.168.4.110:~/monitoring-report-*.txt ./
   ```

## Monitoring Script Created

A comprehensive monitoring script has been created at `./pi-monitoring-commands.sh` that checks:

1. ✅ Current system health (CPU, memory, disk, temperature)
2. ✅ Pi infrastructure stats (from shared pi-stats.txt)
3. ✅ Container status and resource usage
4. ✅ Application logs from past 7 days
5. ✅ Database health and connections
6. ✅ System uptime and load
7. ✅ Temperature monitoring
8. ✅ System journal errors
9. ✅ ClusterHAT Zero W node status
10. ✅ Recent maintenance logs

## Next Steps

1. **Immediate**: Manually SSH in and run the monitoring script
2. **Short-term**: Fix SSH key authentication using Option 1 above
3. **Long-term**: Set up automated monitoring with proper SSH keys

## Additional Resources

- Pi Health Check Script: `./scripts/pi-health-check.sh`
- Pi Diagnostics: `./scripts/pi-diagnostics.sh`
- ClusterHAT Documentation: `./docs/infrastructure/CLUSTERHAT_ZERO2_UPGRADE.md`
- Deployment Guide: `./docs/deployment/RASPBERRY_PI_DEPLOYMENT.md`