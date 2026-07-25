# Terra — Tech Debt

Catalog of known pre-existing issues. Add findings here rather than fixing them inline when they
fall outside the scope of the change in hand.

---

## Index

| ID | Severity | Status | What |
|----|----------|--------|------|
| TD-001 | medium | OPEN | `faceLon()` can't center arbitrary longitudes; `cameraAim` values are hand-calibrated |
| TD-002 | low | OPEN | `lessons/registry.ts` has no importers; registering a lesson is a 3-place operation |
| TD-003 | low | OPEN | Lesson figures (US elevation profile) live in the public engine, not the lesson's `data.ts` |
| TD-004 | low | OPEN | Legend highlight desyncs from the drawn scene on module re-entry |
| TD-005 | low | OPEN | `animated-cross-section` never sets globe glow, so it inherits the previous module's |
| TD-006 | low | OPEN | Deck canvas ignores `devicePixelRatio` — soft text on HiDPI screen-shares |
| TD-007 | — | ACCEPTED | A distributed console file contains all answer content in its bundle |

---

## TD-001 · `faceLon()` in `camera.ts` does not actually center arbitrary longitudes

**Found:** 2026-07-25, while building the `advanced-03-united-states` console.
**Severity:** medium — silently produces a wrong camera aim; costs a manual calibration pass per
country lesson.
**Status:** OPEN — worked around, not fixed.

### What's wrong
`faceLon()` only centers its target near **lon ≈ −90 by coincidence**, not by construction. Two
compounding causes, both proven algebraically and confirmed empirically via the dev harness:
1. The longitude→rotation mapping is not correct for arbitrary inputs.
2. There is an **uncompensated ~17° offset** introduced by the camera's fixed `y = 0.3` position —
   **there is no `lookAt()` call anywhere in the codebase**, so the camera never actually re-aims at
   the globe center.

### Why it went unnoticed
Terra was built for **whole-Earth** lessons (plate tectonics, climate, landforms) where any globe
orientation is acceptable. `advanced-03-united-states` is the **first lesson that needs the globe
reliably pointed at one country**, which is what surfaced it.

### How it manifested
The US console's globe never anchored on the United States. It started at a hardcoded generic default
and auto-spun continuously with no re-centering on module switch. Over ~4 minutes of app time it
drifted from roughly Atlantic/Western-Europe-centered to squarely over Kazakhstan/China/Mongolia — with
the (correctly placed) US city markers squashed onto the globe's far edge **during the Module 02
migration sequence**, the one module that most needs the US front and center. `faceLon`/`snap` were
also dev-only (`import.meta.env.DEV`), so a teacher had no way to recenter.

### The workaround now in place
A new **optional `home: {lon, lat}` field on `LessonConfig`**. `TerraEngine.ts` re-anchors via
`faceLon` on boot completion and on every module activation, and forces idle auto-spin to 0 when
`home` is set (boot/standby spin rates untouched). **`camera.ts` was deliberately not touched.**
Lessons without a `home` field behave exactly as before — verified live against `hs-01-physical-world`
and `landforms-shaping-the-land`.

### ⚠️ The cost this leaves behind
Because the underlying math is wrong, the `cameraAim` value is an **empirically calibrated aim, not a real
coordinate.** The US lesson uses **`{lon: -98, lat: -8}`** — bisected by hand in the dev harness — and
that `lat: -8` is *not* the geographic center of the contiguous US (~39°N). It is a fudge that happens
to aim correctly given the bug.

**Every future single-region lesson will need its own hand-calibrated `home`, and the value will look
wrong to anyone reading it.** This affects the planned **Lesson 4 (Mexico)** and **Lesson 5 (US
regional spreads)** directly.

### Recommended fix (when someone has an hour)
Correct the longitude→rotation mapping in `camera.ts` and add a proper `lookAt()` so the camera aims at
the globe center, compensating for the fixed `y` offset. Then `home` can take **true geographic
coordinates**, existing calibrated values can be replaced with real ones, and future country lessons
need no calibration step. Regression-check the two whole-Earth lessons afterwards — they currently rely
on the existing (wrong-but-consistent) behavior.

> **Note (2026-07-25):** the field is now called **`cameraAim`**, not `home`, precisely so it doesn't
> read as geography, and `src/config/schema.ts` carries the warning at the declaration site. The
> underlying math is still wrong.

---

## TD-002 · `lessons/registry.ts` has no importers; registering a lesson touches 3 places

**Found:** 2026-07-25, review-team pass on the `advanced-03-united-states` build.
**Severity:** low — no runtime effect; costs a pointless step per lesson and misleads authors.
**Status:** OPEN.

`LESSONS` / `DEFAULT_LESSON` are imported by nothing. Lesson selection runs through the static ternaries
in `src/main.ts` (deliberately static, so each build tree-shakes to one lesson) and `scripts/build-all.ts`
drives off `lessons.json`. The README used to claim `registry.ts` powered dev `?lesson=`; it never did.

A build-time consumer was attempted and **reverted**: `build-all.ts` runs under `tsx`, and importing the
registry pulls each lesson config, which imports `.mp3` narration — an extension only Vite can resolve, so
the script dies with `ERR_UNKNOWN_FILE_EXTENSION`. Any future Node-side consumer of lesson configs hits
the same wall unless the configs stop importing assets at module scope.

**Options:** delete the file and drop it from the authoring checklist; or split a Node-safe
`lessons/manifest.ts` (ids + titles + copy targets, no asset imports) and let both `build-all.ts` and the
registry read from it, collapsing registration to two places.

---

## TD-003 · Lesson content lives in the public engine repo rather than the lesson's `data.ts`

**Found:** 2026-07-25, review-team pass.
**Severity:** low now, rising with each region lesson.
**Status:** OPEN — do before Lesson 4 (Mexico), not retroactively.

`src/archetypes/crossSection.ts` holds `USA_PROFILE` (a west→east elevation profile), its reveal indices,
and the plains span. These are **lesson figures traced to the fact-checked bedrock in the private teaching
repo**, sitting in the public engine, outside the lesson folder — so the teaching repo's "every number
traces to bedrock" rule is no longer checkable from the teaching side. It matches the existing
`us`/`glacial`/`rift` precedent, which is why it shipped.

**Fix:** generalize to one `elevationProfile` renderer taking `[label, elev][]` + reveal indices from
`CrossSectionParams`, so the numbers live in `lessons/<id>/data.ts` beside their citation. Retires four
near-identical renderer entries and makes the layout function unit-testable.

---

## TD-004 · Legend highlight desyncs from the drawn scene on module re-entry

**Found:** 2026-07-25 (flagged independently by two reviewers). **Pre-existing.**
**Severity:** low — cosmetic, but legible to students on a shared screen.
**Status:** OPEN.

`TerraEngine.activate()` calls `buildPanel` **before** `onEnter`. `buildPanel` highlights the legend row
matching `handle.deck.secType`, which persists across module switches, while `onEnter` then resets the
deck to `params.default`. Re-entering a module therefore highlights the last-clicked row while the canvas
has correctly reverted to the default scene. Not a spoiler leak — the canvas re-seals properly; only the
highlight is stale. More noticeable in `advanced-03` because there the legend *is* the reveal control.

**Fix:** pass `params.default` as `activeLegendKey`, or reset the deck before `buildPanel`.

---

## TD-005 · `animated-cross-section` never sets the globe glow

**Found:** 2026-07-25. **Pre-existing**, newly visible.
**Severity:** low.
**Status:** OPEN.

`globeMotionOverlay` and `scrubTimeline` both call `ctx.setGlow` in `onEnter`; `animatedCrossSection`
doesn't. `advanced-03` is the first lesson to put that archetype in slot 0 *and* navigate back to it, so
returning to Module 01 from Module 02 leaves the amber glow, and from Module 03 the blue — which reads as
a rendering glitch on a screen-share. One line in `onEnter`, or an optional `glow` param.

---

## TD-006 · Deck canvas ignores `devicePixelRatio`

**Found:** 2026-07-25. **Pre-existing.**
**Severity:** low.
**Status:** OPEN.

`#secCanvas` has a fixed 1080×230 backing store while CSS-scaled to width, so on a HiDPI teacher machine
every deck label is upscaled and soft — including the 13px elevation-profile labels, the smallest text on
the shared screen. Fix by multiplying the backing store by `devicePixelRatio` and `sx.scale(dpr, dpr)`
once at deck construction; renderer math stays in CSS pixels.

---

## TD-007 · A distributed console file exposes all answer content — ACCEPTED, not a defect

**Recorded:** 2026-07-25, so it isn't re-derived as a finding every review.

The spoiler guarantee is **screen-share safety**: no answer reaches the DOM, the canvas, or narration
before the teacher acts. Verified end-to-end by three independent reviewers on 2026-07-25.

It is **not** distribution safety. Because each console is a single self-contained file, the full
`USA_PROFILE` band list, the narration `fallbackText` (including the wheat correction), and the population
figures all exist as string literals in the bundle. A student handed the `.html` and told to view-source
can read ahead. That is inherent to the single-file design, not a bug in any lesson.

**If consoles are ever distributed to students,** build a separate student artifact: blank `fallbackText`
(narration is baked to mp3 anyway), and feed reveal data in per-band rather than bundling every band.
Until then, the rule is simply: **the console is the teacher's file.**
