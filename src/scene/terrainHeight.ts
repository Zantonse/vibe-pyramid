/**
 * Shared terrain height function.
 * Must match the displacement formula in SceneManager.createTerrain() exactly.
 */

const OASIS_CX = 40, OASIS_CZ = 35, OASIS_R = 20;
const CITY_CX = 86, CITY_CZ = 68, CITY_R = 45;
const PYRAMID_R = 14;

export function getTerrainHeight(x: number, z: number): number {
  // Multi-octave dune displacement — identical to createTerrain()
  let y = Math.sin(x * 0.015) * Math.cos(z * 0.02) * 1.8         // large swells
        + Math.sin(x * 0.04 + z * 0.03) * 0.8                     // medium ripples
        + Math.sin(x * 0.08 - z * 0.06) * 0.3                     // fine detail
        + Math.cos(x * 0.01 + z * 0.015) * 2.0;                   // broad rolling dunes

  // Flatten near pyramid center
  const pDist = Math.sqrt(x * x + z * z);
  if (pDist < PYRAMID_R) {
    y *= Math.max(0, (pDist - 6) / (PYRAMID_R - 6));
  }
  // Flatten near oasis basin
  const oDist = Math.sqrt((x - OASIS_CX) ** 2 + (z - OASIS_CZ) ** 2);
  if (oDist < OASIS_R) {
    y *= Math.max(0, (oDist - 8) / (OASIS_R - 8));
  }
  // Flatten city zone
  const cDist = Math.sqrt((x - CITY_CX) ** 2 + (z - CITY_CZ) ** 2);
  if (cDist < CITY_R) {
    y *= Math.max(0, (cDist - 35) / (CITY_R - 35));
  }

  return y;
}
