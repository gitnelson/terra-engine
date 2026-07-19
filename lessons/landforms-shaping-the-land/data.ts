import type { LonLat, Pt } from '../../src/config/schema';

// Landforms lesson data — from docs/textbooks/Geography/extracted/landforms-shaping-the-land.md
// (DK continent-opener spreads, atlas lon/lat, fact-checked 2026-07-18). Markers
// grouped by landform category for the globe module. [lon, lat].

// BUILDING forces (tectonic uplift) — fold/block/volcanic mountains
export const MOUNTAINS: LonLat[] = [
  [86.93, 27.99], [83, 29],          // Everest, Himalaya
  [-70.01, -32.65], [-68, -20],      // Aconcagua, Andes
  [-110, 44], [-81, 37],             // Rockies (young), Appalachians (old)
  [7.66, 45.98], [29.27, -29.47],    // Alps/Matterhorn, Drakensberg
];
export const VOLCANIC: LonLat[] = [
  [37.35, -3.07], [-155.6, 19.47],   // Kilimanjaro, Mauna Loa (hot-spot)
  [-19, 64.9], [176.25, -38.1],      // Iceland, Rotorua geysers
  [36, -0.5],                        // Great Rift Valley
];
// WEARING forces (erosion) — rivers, glacial coasts, deserts
export const RIVERS: LonLat[] = [
  [-112.1, 36.1],                    // Grand Canyon (Colorado)
  [-50, -0.7], [-71.7, -15.5],       // Amazon mouth, Amazon source
  [33.2, 0.4], [121.8, 31.4],        // Nile, Yangtze
  [29.7, 45.2], [44.5, 48.7],        // Danube delta, Volga
];
export const ICE_COAST: LonLat[] = [
  [6.7, 61.2], [167.93, -44.67],     // Sognefjord, Milford Sound
  [147.7, -18.3], [-84, 44],         // Great Barrier Reef, Great Lakes
];
export const DESERTS_LF: LonLat[] = [
  [13, 23], [15, -24], [-69, -24],   // Sahara, Namib, Atacama
  [105, 43], [82, 39], [128, -25],   // Gobi, Takla Makan, Australian outback
];

// TIMELINE — Grand Canyon deep time: rock AGE (Myr) vs depth (m) from rim to river.
// The book says the bottom rock is "2,000 million years" old; the real oldest
// exposed rock (Vishnu Basement) is ~1,750 Myr — the audit.
export const CANYON_AGE: Pt[] = [[0, 270], [300, 525], [760, 740], [1100, 1250], [1400, 1550], [1600, 1750]];
export const CANYON_BOOK: Pt[] = [[0, 270], [1600, 2000]];
