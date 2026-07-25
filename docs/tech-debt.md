# Terra — Tech Debt

Catalogue of known pre-existing issues. Add findings here rather than fixing them inline when they
fall outside the scope of the change in hand.

---

## TD-001 · `faceLon()` in `camera.ts` does not actually centre arbitrary longitudes

**Found:** 2026-07-25, while building the `advanced-03-united-states` console.
**Severity:** medium — silently produces a wrong camera aim; costs a manual calibration pass per
country lesson.
**Status:** OPEN — worked around, not fixed.

### What's wrong
`faceLon()` only centres its target near **lon ≈ −90 by coincidence**, not by construction. Two
compounding causes, both proven algebraically and confirmed empirically via the dev harness:
1. The longitude→rotation mapping is not correct for arbitrary inputs.
2. There is an **uncompensated ~17° offset** introduced by the camera's fixed `y = 0.3` position —
   **there is no `lookAt()` call anywhere in the codebase**, so the camera never actually re-aims at
   the globe centre.

### Why it went unnoticed
Terra was built for **whole-Earth** lessons (plate tectonics, climate, landforms) where any globe
orientation is acceptable. `advanced-03-united-states` is the **first lesson that needs the globe
reliably pointed at one country**, which is what surfaced it.

### How it manifested
The US console's globe never anchored on the United States. It started at a hardcoded generic default
and auto-spun continuously with no re-centring on module switch. Over ~4 minutes of app time it
drifted from roughly Atlantic/Western-Europe-centred to squarely over Kazakhstan/China/Mongolia — with
the (correctly placed) US city markers squashed onto the globe's far edge **during the Module 02
migration sequence**, the one module that most needs the US front and centre. `faceLon`/`snap` were
also dev-only (`import.meta.env.DEV`), so a teacher had no way to recentre.

### The workaround now in place
A new **optional `home: {lon, lat}` field on `LessonConfig`**. `TerraEngine.ts` re-anchors via
`faceLon` on boot completion and on every module activation, and forces idle auto-spin to 0 when
`home` is set (boot/standby spin rates untouched). **`camera.ts` was deliberately not touched.**
Lessons without a `home` field behave exactly as before — verified live against `hs-01-physical-world`
and `landforms-shaping-the-land`.

### ⚠️ The cost this leaves behind
Because the underlying maths is wrong, the `home` value is an **empirically calibrated aim, not a real
coordinate.** The US lesson uses **`{lon: -98, lat: -8}`** — bisected by hand in the dev harness — and
that `lat: -8` is *not* the geographic centre of the contiguous US (~39°N). It is a fudge that happens
to aim correctly given the bug.

**Every future single-region lesson will need its own hand-calibrated `home`, and the value will look
wrong to anyone reading it.** This affects the planned **Lesson 4 (Mexico)** and **Lesson 5 (US
regional spreads)** directly.

### Recommended fix (when someone has an hour)
Correct the longitude→rotation mapping in `camera.ts` and add a proper `lookAt()` so the camera aims at
the globe centre, compensating for the fixed `y` offset. Then `home` can take **true geographic
coordinates**, existing calibrated values can be replaced with real ones, and future country lessons
need no calibration step. Regression-check the two whole-Earth lessons afterwards — they currently rely
on the existing (wrong-but-consistent) behaviour.
