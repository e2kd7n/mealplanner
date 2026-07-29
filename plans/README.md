# Implementation Plans

Plans, epics, and technical design docs for mealplanner, organized by milestone.

## Structure

```
plans/
├── README.md            # This index
└── <milestone-slug>/    # Plans for a specific GitHub milestone
```

`<milestone-slug>` is the milestone name, lowercased with spaces replaced by hyphens
(e.g. the "Public Launch" milestone → `plans/public-launch/`). Milestones here are named,
not strictly semver (`Beta Launch`, `Public Launch`, `v1.1`, ...) — use whatever the
GitHub milestone is actually called.

## Rules

- All implementation plans, epics, and technical design documents live under
  `/plans/<milestone-slug>/` — **never** in `docs/plans/`.
- Determine the target milestone from `gh api repos/:owner/:repo/milestones` (or
  `gh issue view <n>`) before creating a plan — every plan needs a milestone home.
- Update this README's structure listing when adding a new milestone folder.
- Cross-milestone or foundational plans go in the milestone where the work begins.
