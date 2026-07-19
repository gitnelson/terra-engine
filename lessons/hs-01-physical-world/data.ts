import type { LonLat, Pt } from '../../src/config/schema';

// hs-01 lesson data — verbatim from the console DATA region (362-408, 666-668).
// The archetypes are generic; this is the lesson-specific content they consume.

// approximate major plate boundaries [lon,lat]
const RIDGE: LonLat[] = [[-24, 66], [-30, 58], [-34, 48], [-30, 38], [-26, 26], [-16, 8], [-14, -2], [-12, -18], [-14, -34], [-16, -50]];
const RIFT: LonLat[] = [[36, 16], [38, 10], [36, 2], [35, -6], [34, -13], [33, -18]];
const PAC_E: LonLat[] = [[-73, -46], [-71, -33], [-76, -16], [-79, -2], [-85, 10], [-96, 16], [-106, 22], [-116, 31], [-124, 40], [-130, 48], [-138, 56], [-150, 58], [-164, 55], [-172, 52]];
const PAC_W: LonLat[] = [[159, 54], [152, 48], [144, 40], [139, 34], [132, 32], [126, 24], [122, 12], [126, 2], [132, -4], [142, -6], [152, -8], [160, -10], [176, -18], [178, -34], [174, -42], [167, -47]];
const SANAND: LonLat[] = [[-124, 40], [-122, 37], [-119, 35], [-116, 33], [-114, 32]];
const HIMAL: LonLat[] = [[68, 35], [76, 33], [84, 29], [90, 28], [96, 27]];

export const BOUNDS: { pts: LonLat[]; type: string }[] = [
  { pts: RIDGE, type: 'spread' }, { pts: RIFT, type: 'spread' },
  { pts: PAC_E, type: 'sub' }, { pts: PAC_W, type: 'sub' }, { pts: HIMAL, type: 'sub' },
  { pts: SANAND, type: 'trans' },
];

// Ring of Fire volcano/quake markers [lon,lat] (names dropped — not rendered)
export const ROF: LonLat[] = [
  [138.7, 35.4], [130.6, 31.6], [160.6, 56.1], [-152, 60],
  [-122.2, 46.2], [-98.6, 19.0], [-71.9, -39.4], [-70.2, -22],
  [120.4, 15.1], [105.4, -6.1], [175.6, -39.3], [151, -5],
];
export const SPREADPTS: LonLat[] = [[-19, 64.9], [36, -3.1], [15, 37.7]];
export const DESERTS: LonLat[] = [[13, 23], [45, 25], [70, 28], [22, -24], [133, -25], [-112, 33], [-69, -24]];

// population (billions) [year, value]
export const POP: Pt[] = [[1800, 1.0], [1900, 1.65], [1927, 2.0], [1960, 3.0], [1974, 4.0], [1987, 5.0], [1999, 6.0], [2011, 7.0], [2022, 8.0], [2026, 8.2], [2037, 9.0], [2058, 10.0], [2086, 10.3], [2100, 10.2]];
export const CN: Pt[] = [[1950, 0.544], [1980, 0.987], [2000, 1.27], [2011, 1.345], [2022, 1.426], [2023, 1.425], [2026, 1.408], [2050, 1.31], [2100, 0.77]];
export const IN: Pt[] = [[1950, 0.376], [1980, 0.697], [2000, 1.059], [2011, 1.234], [2022, 1.417], [2023, 1.429], [2026, 1.455], [2050, 1.67], [2100, 1.53]];
