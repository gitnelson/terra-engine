import type { LonLat, Pt } from '../../src/config/schema';

// advanced-03-united-states lesson data — from teacher-key.md "Terra console — SPEC"
// and its fact-checked bedrock (docs/textbooks/Geography/extracted/lesson3-usa-mexico-pp30-39.md).
// Module 01's elevation profile is hardcoded directly in crossSection.ts (matching the
// existing 'us'/'glacial'/'rift' renderer convention — no data.ts import there).

// ---- MODULE 02 · Moving West — named cities on the DK p.31 map [lon, lat] ----
export const SEATTLE: LonLat = [-122.33, 47.61];
export const PORTLAND: LonLat = [-122.68, 45.52];
export const SAN_FRANCISCO: LonLat = [-122.42, 37.77];
export const SAN_JOSE: LonLat = [-121.89, 37.34];
export const LOS_ANGELES: LonLat = [-118.24, 34.05];
export const SAN_DIEGO: LonLat = [-117.16, 32.72];
export const PHOENIX: LonLat = [-112.07, 33.45];
export const DENVER: LonLat = [-104.99, 39.74];
export const MINNEAPOLIS: LonLat = [-93.27, 44.98];
export const CHICAGO: LonLat = [-87.63, 41.88];
export const DETROIT: LonLat = [-83.05, 42.33];
export const CLEVELAND: LonLat = [-81.69, 41.5];
export const INDIANAPOLIS: LonLat = [-86.16, 39.77];
export const CINCINNATI: LonLat = [-84.51, 39.1];
export const ST_LOUIS: LonLat = [-90.2, 38.63];
export const PITTSBURGH: LonLat = [-79.99, 40.44];
export const BUFFALO: LonLat = [-78.88, 42.89];
export const BOSTON: LonLat = [-71.06, 42.36];
export const NEW_YORK: LonLat = [-74.01, 40.71];
export const PHILADELPHIA: LonLat = [-75.16, 39.95];
export const BALTIMORE: LonLat = [-76.61, 39.29];
export const ATLANTA: LonLat = [-84.39, 33.75];
export const JACKSONVILLE: LonLat = [-81.66, 30.33];
export const MIAMI: LonLat = [-80.19, 25.76];
export const NEW_ORLEANS: LonLat = [-90.07, 29.95];
export const HOUSTON: LonLat = [-95.37, 29.76];
export const SAN_ANTONIO: LonLat = [-98.49, 29.42];
export const DALLAS_FT_WORTH: LonLat = [-96.8, 32.78];
export const ANCHORAGE: LonLat = [-149.9, 61.22];

// all 29 named cities — the base marker layer, shown throughout the module.
export const CITIES: LonLat[] = [
  SEATTLE, PORTLAND, SAN_FRANCISCO, SAN_JOSE, LOS_ANGELES, SAN_DIEGO, PHOENIX,
  DENVER, MINNEAPOLIS, CHICAGO, DETROIT, CLEVELAND, INDIANAPOLIS, CINCINNATI,
  ST_LOUIS, PITTSBURGH, BUFFALO, BOSTON, NEW_YORK, PHILADELPHIA, BALTIMORE,
  ATLANTA, JACKSONVILLE, MIAMI, NEW_ORLEANS, HOUSTON, SAN_ANTONIO,
  DALLAS_FT_WORTH, ANCHORAGE,
];

// The five Moving West waves (DK p.31), fired in order by the 'migrate' action.
export const WAVE_EAST_ARRIVAL: LonLat[] = [BOSTON, NEW_YORK, PHILADELPHIA, BALTIMORE];
export const WAVE_GOLD_RAIL: LonLat[] = [SAN_FRANCISCO, DENVER];
export const WAVE_INDUSTRY_LAKES: LonLat[] = [
  CHICAGO, DETROIT, CLEVELAND, PITTSBURGH, BUFFALO, CINCINNATI, INDIANAPOLIS, ST_LOUIS, MINNEAPOLIS,
];
export const WAVE_AIRCRAFT_FILM: LonLat[] = [SEATTLE, LOS_ANGELES];
export const WAVE_SUN_BELT: LonLat[] = [
  SAN_FRANCISCO, SAN_JOSE, LOS_ANGELES, SAN_DIEGO, PHOENIX, HOUSTON, SAN_ANTONIO,
  DALLAS_FT_WORTH, MIAMI, JACKSONVILLE,
];

// ---- MODULE 03 · Who Lives Here — US population, millions [year, value] ----
// US Census anchors from the teacher-key spec. 2004 is the textbook's own year
// (294M was accurate then); the book presents it as current — the audit is that
// growth kept going. bookLine is the book's number held flat past its own year.
export const US_POP: Pt[] = [
  [1800, 5.3], [1850, 23.2], [1900, 76.2], [1950, 151.3], [1970, 203.2],
  [2000, 281.4], [2004, 294], [2010, 308.7], [2020, 331.4], [2026, 342],
];
export const US_POP_BOOK: Pt[] = [[2004, 294], [2026, 294]];
