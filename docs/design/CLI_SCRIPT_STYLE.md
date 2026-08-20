# Meal Planner Application - CLI Script Design Specification

**Version:** 1.0
**Last Updated:** 2026-08-19
**Status:** Active

---

## Overview

The `scripts/` directory is the operator-facing surface of this project — the thing a
human actually watches scroll by during setup, deploy, backup, and incident response.
It has grown organically and its scripts currently range from fully plain `echo` output
to a fairly polished "recipe card" style pioneered in
[`pi-deploy-registry.sh`](../../scripts/pi-deploy-registry.sh).

This document extends [Design Principles](DESIGN_PRINCIPLES.md) and the app's
[`theme.ts`](../../frontend/src/theme.ts) palette to the terminal: the same brand,
hierarchy, and accessibility commitments the PWA makes, translated into ANSI output.
It does not introduce a new toolkit — `scripts/utilities.sh` already implements most of
what's specified here (`section`, `steps_init`/`step`, `start_spinner`/`stop_spinner`,
`progress_bar`, `timer_start`/`timer_end`, `wait_for`). The job going forward is
**consistent adoption**, not invention.

Reference implementation: `scripts/pi-deploy-registry.sh`. When in doubt, look at what it
does and match it.

---

## 1. Color Palette

`scripts/utilities.sh` currently exports the 8-color ANSI baseline (`RED`, `GREEN`,
`YELLOW`, `BLUE`, `CYAN`, `BOLD`, `DIM`, `NC`). Keep using these as the **portable
default** — they render correctly in the widest range of terminals (Pi console, SSH
sessions, CI logs) and already map onto the app's semantic colors:

| Token | Use for | App equivalent (`theme.ts`) |
|---|---|---|
| `GREEN` | Success, completion, healthy state | `primary.main` (#66BB6A dark-mode / #2E7D32 light) |
| `YELLOW` | Warnings, non-fatal issues, things needing attention | `warning.main` / `secondary.main` (#FFB74D / #D4880C) |
| `RED` | Errors, failures, destructive-action prompts | `error.main` (#D32F2F) |
| `CYAN` | Section headers, structural chrome | closest terminal-safe analog to `info.main` (#4FC3F7) |
| `BLUE` | Informational body text, secondary detail | `info.main` (#0277BD / #4FC3F7) |
| `BOLD` | Emphasis, headings, key values | maps to the app's heavier heading weights (600-700) |
| `DIM` | Metadata: timestamps, byte counts, file counts | de-emphasized text, same intent as muted `text.secondary` |

Terminals that support 24-bit color may render these close enough to the brand hex
values to be recognizable; scripts should **not** hardcode `\033[38;2;...m` true-color
escapes directly, because that breaks on the Pi's default console and over plain SSH
without a truecolor-aware `$TERM`. Stick to the 8-color tokens above.

**Never use raw ANSI escapes inline.** Every script that prints color must
`source "$SCRIPT_DIR/utilities.sh"` and use its exported variables — no
`printf '\033[0;32m'` copy-pasted locally. This is what lets a future palette change
happen in one file instead of dozens.

## 2. Status Language

Pair every color with a shape, never color alone — this is the same "don't rely on
color alone" rule as [WCAG_COMPLIANCE.md](WCAG_COMPLIANCE.md) applies to the UI, and it
also means colorblind operators and `NO_COLOR`/piped-output cases still get the signal:

| Meaning | Glyph | Example |
|---|---|---|
| Success / done | `✓` (green) | `  ✓  All deployment secrets present.` |
| Failure / blocking | `✗` or `❌` (red) | `❌ Missing secret: secrets/jwt_secret.txt` |
| Warning / needs attention | `⚠️` (yellow) | `⚠️  Disk usage is 78% — pulling a new image may fail` |
| Informational | `ℹ️` or a domain emoji (blue) | `ℹ️  No meal planner containers running` |
| In progress | animated braille spinner via `start_spinner` | `⠋  Logging into GitHub Container Registry` |

## 3. Section Headers ("recipe cards")

Use `section "Title" [emoji]` from `utilities.sh` for every major phase of a script —
this is the terminal equivalent of a `Card` component in the app: a title, an
underline rule, breathing room above and below. A script with more than ~30 lines of
output and no `section` calls is a sign it needs this pass.

```bash
section "Pulling Image" "📥"
```

Keep a **small, consistent emoji vocabulary** per action type rather than picking a new
one per script — this is what keeps output feeling like one product instead of dozens
of independent ones:

| Action | Emoji |
|---|---|
| Deploy / ship | 🚀 |
| Pre-flight / check | 🔍 |
| Auth / secrets | 🔐 |
| Download / pull | 📥 |
| Package / build artifact | 📦 |
| Database | 🗄️ |
| Cleanup | 🧹 |
| Network / cluster | 🌐 |
| Health / diagnostics | 🩺 |
| Codemod / batch source edit | ✏️ |
| Summary / done | 🍽️ (the app's own mark — reserve this one for final summaries) |

If a script needs an emoji not listed here, add it to this table in the same PR rather
than inventing a one-off.

## 4. Progress Feedback

Any operation that blocks for more than ~1-2 seconds (network pulls, SSH round-trips,
`podman`/`prisma` commands, waiting on a health check) must show the user *something is
happening*, exactly like the app's Skeleton loading states
([`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md), Loading States):

- **Single blocking command** → `start_spinner "message"` / `stop_spinner [ok|fail]`
- **Polling until a condition is true** → `wait_for "desc" <timeout> <interval> <cmd>`
- **Iterating a known number of items** (e.g. looping over 4 Zero Ws) → `progress_bar`
- **Multi-step sequential procedure** (e.g. first-time-setup) → `steps_init <n>` /
  `step "description"` so the operator always knows `[3/7]` where they are
- **Anything worth reporting duration for** (builds, pulls, backups) →
  `timer_start` / `timer_end`

A script that runs a slow command with bare output and no spinner or step indicator is
the CLI equivalent of a blank white screen during a fetch — it needs this pass.

## 5. Confirmation & Destructive Actions

The app requires confirmation for destructive actions
([`DESIGN_PRINCIPLES.md`](DESIGN_PRINCIPLES.md) #1, User Ownership & Control). Scripts
that can lose data or state (restores that overwrite a DB, `rm -rf`-style cleanups,
force-pushing secrets, pruning worktrees) must:

1. Explain what will happen and what's about to be affected (counts, paths, sizes —
   not just "are you sure?")
2. Default to the safe choice on bare Enter (`[y/N]`, never `[Y/n]`, for anything
   destructive)
3. Use `RED`/`⚠️` for the prompt itself so it reads as different from routine output

`pi-deploy-registry.sh`'s in-progress-build check (`[w=wait/c=continue/N=abort]`) is a
good model: it names the risk, offers a safe default, and explains the consequence of
each choice.

## 6. Accessibility & Non-Interactive Contexts

Carried over from [`WCAG_COMPLIANCE.md`](WCAG_COMPLIANCE.md), translated to a terminal:

- **Respect `NO_COLOR`.** If `$NO_COLOR` is set, or stdout is not a TTY (piped into a
  log file, running under cron, captured by CI), color codes and the animated spinner
  should degrade gracefully — plain text with the `✓`/`✗`/`⚠️` glyphs still carries the
  signal. This is not yet implemented in `utilities.sh` (see the tracking issue) —
  today every script always emits color regardless of context. This matters in
  practice: `feedback-log-triage.sh` and `send-notification.sh` already run
  unattended under cron, writing straight to a log file.
- **Never require a spinner or progress bar to understand what happened** — the final
  state (`✓`/`✗` + message) must be legible even with all animation stripped, the same
  way the app's loading skeletons are decorative, not load-bearing for correctness.
- **Keep line length reasonable** and avoid wide ASCII-art tables that wrap badly over
  SSH at 80 columns, mirroring the app's ~70-character line-length guidance for body
  text.

## 7. What "done" looks like

A script fully following this spec:

- Sources `scripts/utilities.sh` and uses only its exported color/UI helpers — no
  inline ANSI
- Wraps each logical phase in `section "..." "emoji"` using the vocabulary in §3
- Shows a spinner, step counter, or progress bar for anything slow (§4)
- Prints a final `section "Summary" "🍽️"` recapping what happened
- Pairs every color with a glyph (§2)
- Confirms before anything destructive, defaulting safe (§5)

`scripts/pi-deploy-registry.sh` meets all six points today and is the canonical
reference other scripts should be brought up to.

---

## Related Documentation

- [Design Principles](DESIGN_PRINCIPLES.md) — the app-wide principles this document
  extends to the CLI surface
- [WCAG Compliance](WCAG_COMPLIANCE.md) — the accessibility baseline §6 translates
- [`frontend/src/theme.ts`](../../frontend/src/theme.ts) — source of truth for the
  color palette in §1
- [`scripts/utilities.sh`](../../scripts/utilities.sh) — the implementation of every
  helper referenced above

---

[← Back to Design Documentation](README.md)
