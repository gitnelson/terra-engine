// Antarctica is absent from world.svg (its geoViewBox stops at ~-58.5°), so this
// approximate coastline (incl. the Antarctic Peninsula reaching toward S. America)
// is appended — otherwise the south pole reads as empty ocean.
export const ANTARCTICA: [number, number][] = [
  [-180, -78], [-160, -77], [-140, -75], [-120, -74], [-100, -73], [-80, -72],
  [-63, -68], [-58, -63], [-55, -72], [-45, -78], [-30, -75], [-15, -71],
  [0, -69], [20, -69], [40, -67], [60, -67], [80, -67], [100, -66], [120, -66],
  [140, -67], [155, -71], [170, -75], [180, -78], [-180, -78],
];
