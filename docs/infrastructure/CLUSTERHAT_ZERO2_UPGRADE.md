# ClusterHAT: Pi Zero W → Pi Zero 2 W Upgrade

Research and planning notes for upgrading the four ClusterHAT nodes. Last updated May 2026.

---

## Performance gain

| | Pi Zero W | Pi Zero 2 W |
|---|---|---|
| CPU | 1× ARM1176JZF-S @ 1GHz | 4× Cortex-A53 @ 1GHz |
| Architecture | ARMv6 | ARMv8 (64-bit) |
| RAM | 512MB | 512MB |
| Node.js JIT | Severely limited on ARMv6 | Full V8 JIT |

The architecture jump is the main win. V8's JIT compiler has limited ARMv6 support — Node.js on the current Zeros effectively runs in a degraded mode. On Cortex-A53, full JIT kicks in. For the Express + Prisma API workload, expect **3–5× faster JS execution per node**.

The four cores also help with concurrent I/O — event loop stays responsive while native addons, crypto, and Prisma's connection pool run in parallel.

RAM stays the same at 512MB — that ceiling doesn't change.

---

## Power requirements

**Current setup (4× Zero W):**
- Pi 4B peak: ~2A
- 4× Zero W peak: ~350mA each = ~1.4A
- Total: ~3.4A — already exceeds a standard 3A PSU

**With Zero 2 W:**
- Pi 4B under stress: ~1.4A (~7W)
- 4× Zero 2 W under stress: ~700mA each = ~2.7A (~13.6W)
- Total peak: ~4.1A (~20.6W) — requires at least a 5A PSU

**Critical constraint:** The ClusterHAT powers the Zeros through the Pi 4B's GPIO 5V rail. Adding a second PSU via a splitter cable does **not** work without physically modifying the HAT. The entire cluster runs off one supply.

---

## Community findings (ClusterHAT Google Group, 8086.net)

- **Pi 4B + 4× Zero 2 W on a 45W USB-C brick** — stress tests pass, no undervoltage. Recommended configuration.
- **Pi 4B + 4× Zero 2 W on a 3.5A/5V Adafruit adapter** — works running all 4 cores on all Zeros, but marginal.
- **Pi 3B+ + 4× Zero 2 W on a stock 2.4A PSU** — only worked with WiFi, BT, and HDMI disabled and underclocked to 600MHz. Power light flickered at full clock speed.

Consensus: **5V/5A+ PSU minimum** before upgrading.

---

## Current PSU health (checked May 2026)

Ran voltage checks under heavy load:
- `vcgencmd get_throttled` = `0x0` (sticky register — no events since last boot)
- Core voltage: 0.860V, SDRAM: 1.100V — both normal
- No dmesg or journal voltage events over 30 days

Current PSU is handling the Zero W cluster fine. Headroom concern is specifically for the Zero 2 upgrade.

Note: the Pi's firmware monitors the 5V rail via a hardware comparator with a fixed ~4.63V threshold — it reports binary crossed/not-crossed, not the actual voltage. To measure the actual 5V rail you'd need a multimeter on GPIO pin 2/4 under load, or an INA219 current/voltage sensor on I2C.

---

## Upgrade path

1. **Replace PSU first** — 5V/5A+ or a USB-C 45W adapter (e.g. Lenovo or official Pi 5 27W PSU). Do not swap hardware before this.
2. **Swap Zero W SD cards for Zero 2 W boards** — same ClusterHAT slots, no HAT changes needed.
3. **Re-flash SD cards** with 8086.net CBRIDGE armhf images for Zero 2 W (different image from Zero W).
4. **Rebuild backend image** targeting `linux/arm/v7` or `linux/arm64` instead of `linux/arm/v6` — enables official Node.js builds with full JIT.
5. **Update GitHub Actions workflow** if it cross-compiles for the Zeros specifically.
