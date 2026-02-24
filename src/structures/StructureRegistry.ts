import * as THREE from 'three';
import { getTerrainHeight } from '../scene/terrainHeight.js';

const BLOCK_SIZE = 1.0;
const BLOCK_GAP = 0.05;
const BLOCK_UNIT = BLOCK_SIZE + BLOCK_GAP;

export type BlockGeometry = 'cube' | 'cylinder' | 'wedge' | 'half' | 'capital' | 'slab' | 'fluted-cylinder' | 'beveled-cube' | 'lotus-capital';

export interface BlockSlot {
  position: THREE.Vector3;
  placed: boolean;
  geometry?: BlockGeometry;
}

export interface Structure {
  id: string;
  name: string;
  icon: string;
  worldOffset: THREE.Vector3;
  slots: BlockSlot[];
}

function generateObeliskSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 3x3 base tapering to 1x1 over 15 layers
  for (let layer = 0; layer < 15; layer++) {
    const y = layer * BLOCK_UNIT;
    let size: number;
    if (layer < 3) size = 3;
    else if (layer < 6) size = 2;
    else size = 1;

    const half = (size * BLOCK_UNIT) / 2;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - half + col * BLOCK_UNIT + BLOCK_UNIT / 2,
            y + BLOCK_SIZE / 2,
            offset.z - half + row * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }
  // Pyramidion cap on top
  slots.push({
    position: new THREE.Vector3(
      offset.x,
      15 * BLOCK_UNIT + BLOCK_SIZE * 0.25,
      offset.z
    ),
    placed: false,
    geometry: 'half',
  });
  return slots;
}

function generateSphinxSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // Body: 10 long (z), 4 wide (x), 4 tall (y) — rectangular block body
  for (let y = 0; y < 4; y++) {
    for (let z = 0; z < 10; z++) {
      for (let x = 0; x < 4; x++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - 2 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - 5 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Head: 3x3x3 block on top of the front of the body
  for (let y = 4; y < 7; y++) {
    for (let z = 0; z < 3; z++) {
      for (let x = 0; x < 3; x++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - 1.5 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - 5 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Front paws: two 1x2x3 extensions in front
  for (let y = 0; y < 2; y++) {
    for (let z = -3; z < 0; z++) {
      // Wedge tips at the front-most paw blocks (z=-3)
      const isWedgeTip = z === -3 && y === 0;
      // Left paw
      slots.push({
        position: new THREE.Vector3(
          offset.x - 2 * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - 5 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        ...(isWedgeTip ? { geometry: 'wedge' as BlockGeometry } : {}),
      });
      // Right paw
      slots.push({
        position: new THREE.Vector3(
          offset.x + 1 * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - 5 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        ...(isWedgeTip ? { geometry: 'wedge' as BlockGeometry } : {}),
      });
    }
  }

  // Headdress: half-blocks extending above head
  for (let z = 0; z < 3; z++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x,
        7 * BLOCK_UNIT + BLOCK_SIZE * 0.25,
        offset.z - 5 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'half',
    });
  }

  return slots;
}

function generateColonnadeSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const columnCount = 6;
  const spacing = 3 * BLOCK_UNIT;
  const rowSpacing = 5 * BLOCK_UNIT;

  for (let col = 0; col < columnCount; col++) {
    const z = offset.z + col * spacing;
    for (let row = 0; row < 2; row++) {
      const x = offset.x + (row === 0 ? -rowSpacing / 2 : rowSpacing / 2);

      // Cube base (1 block)
      slots.push({
        position: new THREE.Vector3(x, BLOCK_SIZE / 2, z),
        placed: false,
      });

      // Cylinder shaft (4 blocks tall)
      for (let y = 1; y < 5; y++) {
        slots.push({
          position: new THREE.Vector3(x, y * BLOCK_UNIT + BLOCK_SIZE / 2, z),
          placed: false,
          geometry: 'fluted-cylinder',
        });
      }

      // Capital on top
      slots.push({
        position: new THREE.Vector3(x, 5 * BLOCK_UNIT + 0.2, z),
        placed: false,
        geometry: 'lotus-capital',
      });
    }
  }

  // Slab lintel beams connecting column tops
  for (let col = 0; col < columnCount; col++) {
    const z = offset.z + col * spacing;
    for (let bx = 0; bx < 5; bx++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - rowSpacing / 2 + bx * BLOCK_UNIT,
          6 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          z
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateSmallPyramidSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const baseSize = 10;
  const layerStep = 2;

  let layerIndex = 0;
  for (let size = baseSize; size >= 2; size -= layerStep) {
    const y = layerIndex * BLOCK_UNIT;
    const half = (size * BLOCK_UNIT) / 2;

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - half + col * BLOCK_UNIT + BLOCK_UNIT / 2,
            y + BLOCK_SIZE / 2,
            offset.z - half + row * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
    layerIndex++;
  }

  return slots;
}

function generateBoatSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const length = 12;

  for (let z = 0; z < length; z++) {
    // Tapered width: narrow at ends, wide in middle
    const t = z / (length - 1); // 0 to 1
    const widthFactor = Math.sin(t * Math.PI); // 0 → 1 → 0
    const width = Math.max(1, Math.round(widthFactor * 4));
    const half = (width * BLOCK_UNIT) / 2;

    // Hull bottom (1 layer)
    for (let x = 0; x < width; x++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - half + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z + z * BLOCK_UNIT
        ),
        placed: false,
      });
    }

    // Hull sides (1 block high walls on outer edges, only in the wide middle section)
    if (width >= 3) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - half + BLOCK_UNIT / 2,
          BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + z * BLOCK_UNIT
        ),
        placed: false,
      });
      slots.push({
        position: new THREE.Vector3(
          offset.x + half - BLOCK_UNIT / 2,
          BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + z * BLOCK_UNIT
        ),
        placed: false,
      });
    }
  }

  return slots;
}

function generateStepPyramidSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Djoser-style step pyramid: 6 tiers, each stepping in by 1 on each side
  // Base: 14x14, then 12x12, 10x10, 8x8, 6x6, 4x4
  for (let tier = 0; tier < 6; tier++) {
    const size = 14 - tier * 2;
    const tierHeight = 2; // Each tier is 2 blocks tall
    const half = (size * BLOCK_UNIT) / 2;

    for (let dy = 0; dy < tierHeight; dy++) {
      const y = tier * tierHeight * BLOCK_UNIT + dy * BLOCK_UNIT;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          slots.push({
            position: new THREE.Vector3(
              offset.x - half + col * BLOCK_UNIT + BLOCK_UNIT / 2,
              y + BLOCK_SIZE / 2,
              offset.z - half + row * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
          });
        }
      }
    }
  }
  return slots;
}

function generateTempleSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // Mortuary temple: raised platform + walled courtyard + inner sanctum

  // Platform base: 12x8, 1 block tall
  for (let z = 0; z < 8; z++) {
    for (let x = 0; x < 12; x++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - 6 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - 4 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  // Perimeter walls: 4 blocks tall on the edges of the platform
  for (let y = 1; y < 5; y++) {
    for (let x = 0; x < 12; x++) {
      // Front wall (z=0) and back wall (z=7)
      for (const z of [0, 7]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - 6 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - 4 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    // Side walls (x=0 and x=11), excluding corners already placed
    for (let z = 1; z < 7; z++) {
      for (const x of [0, 11]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - 6 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - 4 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Inner sanctum: 4x3 raised block, 2 high, centered
  for (let y = 1; y < 3; y++) {
    for (let z = 3; z < 6; z++) {
      for (let x = 4; x < 8; x++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - 6 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - 4 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Interior cylinder columns (4 columns in courtyard)
  const colPositions = [
    { x: 3, z: 2 }, { x: 8, z: 2 },
    { x: 3, z: 5 }, { x: 8, z: 5 },
  ];
  for (const cp of colPositions) {
    for (let y = 1; y < 4; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - 6 * BLOCK_UNIT + cp.x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - 4 * BLOCK_UNIT + cp.z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    // Capital on each column
    slots.push({
      position: new THREE.Vector3(
        offset.x - 6 * BLOCK_UNIT + cp.x * BLOCK_UNIT + BLOCK_UNIT / 2,
        4 * BLOCK_UNIT + 0.2,
        offset.z - 4 * BLOCK_UNIT + cp.z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  return slots;
}

function generateMastabaSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Mastaba: flat-topped rectangular tomb with sloped sides
  // 3 layers, each stepping in by 1 on each side
  // Base: 8x6, then 6x4, then 4x2 (top platform)
  const layers = [
    { w: 8, d: 6 },
    { w: 6, d: 4 },
    { w: 4, d: 2 },
  ];

  for (let layer = 0; layer < layers.length; layer++) {
    const { w, d } = layers[layer];
    const y = layer * BLOCK_UNIT;
    const halfW = (w * BLOCK_UNIT) / 2;
    const halfD = (d * BLOCK_UNIT) / 2;

    for (let row = 0; row < d; row++) {
      for (let col = 0; col < w; col++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + col * BLOCK_UNIT + BLOCK_UNIT / 2,
            y + BLOCK_SIZE / 2,
            offset.z - halfD + row * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  return slots;
}

function generatePylonGateSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Two massive trapezoidal towers flanking a gate
  // Each tower: 4 wide at base, tapering to 2 wide, 8 blocks tall
  // Gate opening: 3 blocks wide between towers

  const gateHalf = 1.5 * BLOCK_UNIT; // 1.5 blocks each side of center

  for (const side of [-1, 1]) {
    // Tower center X: offset.x + side * (gateHalf + 2 * BLOCK_UNIT)
    const towerCx = offset.x + side * (gateHalf + 2 * BLOCK_UNIT);

    for (let y = 0; y < 8; y++) {
      // Width tapers: 4 at bottom, 3 middle, 2 at top
      let width: number;
      if (y < 3) width = 4;
      else if (y < 6) width = 3;
      else width = 2;

      const halfW = (width * BLOCK_UNIT) / 2;
      for (let x = 0; x < width; x++) {
        // Depth: 2 blocks deep
        for (let z = 0; z < 2; z++) {
          slots.push({
            position: new THREE.Vector3(
              towerCx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              offset.z + (z - 1) * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            ...(y >= 3 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
          });
        }
      }
    }
  }

  // Wedge slopes on tower tops
  for (const side of [-1, 1]) {
    const towerCx = offset.x + side * (gateHalf + 2 * BLOCK_UNIT);
    for (let z = 0; z < 2; z++) {
      slots.push({
        position: new THREE.Vector3(
          towerCx,
          8 * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + (z - 1) * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'wedge',
      });
    }
  }

  // Lintel beam across the top of the gate (connecting the two towers)
  for (let x = -2; x <= 2; x++) {
    for (let z = 0; z < 2; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x + x * BLOCK_UNIT,
          7 * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + (z - 1) * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  return slots;
}

function generateHypostyleHallSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 8 thick cylinder columns in a 2x4 grid (2 rows, 4 columns)
  // Each column: cube base, 3 cylinder blocks tall, capital on top
  // Slab roof beams connecting columns

  const rows = 2;
  const cols = 4;
  const rowSpacing = 4 * BLOCK_UNIT;
  const colSpacing = 3 * BLOCK_UNIT;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offset.x - rowSpacing / 2 + r * rowSpacing + BLOCK_UNIT / 2;
      const z = offset.z - (cols - 1) * colSpacing / 2 + c * colSpacing;

      // Cube base (1 block)
      slots.push({
        position: new THREE.Vector3(x, BLOCK_SIZE / 2, z),
        placed: false,
      });

      // Cylinder shaft (3 blocks tall)
      for (let y = 1; y < 4; y++) {
        slots.push({
          position: new THREE.Vector3(x, y * BLOCK_UNIT + BLOCK_SIZE / 2, z),
          placed: false,
          geometry: 'fluted-cylinder',
        });
      }

      // Capital on top
      slots.push({
        position: new THREE.Vector3(x, 4 * BLOCK_UNIT + 0.2, z),
        placed: false,
        geometry: 'lotus-capital',
      });
    }
  }

  // Slab roof beams across the top
  for (let r = 0; r <= rows; r++) {
    const x = offset.x - rowSpacing / 2 + r * rowSpacing;
    for (let c = 0; c < cols - 1; c++) {
      const z = offset.z - (cols - 1) * colSpacing / 2 + c * colSpacing;
      for (let bx = 0; bx < 2; bx++) {
        slots.push({
          position: new THREE.Vector3(
            x - BLOCK_UNIT / 2 + bx * BLOCK_UNIT,
            5 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
            z
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }

  return slots;
}

function generateSacredLakeSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Rectangular pool: outer perimeter ring of cubes (10x6, 1 block tall)
  // Inner floor of slabs at ground level (8x4)
  // A slab "water surface" floating slightly above the floor

  const outerW = 10;
  const outerD = 6;
  const innerW = 8;
  const innerD = 4;

  const outerHalfW = (outerW * BLOCK_UNIT) / 2;
  const outerHalfD = (outerD * BLOCK_UNIT) / 2;
  const innerHalfW = (innerW * BLOCK_UNIT) / 2;
  const innerHalfD = (innerD * BLOCK_UNIT) / 2;

  // Outer perimeter walls (1 block tall)
  for (let x = 0; x < outerW; x++) {
    // Front and back
    for (const z of [0, outerD - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - outerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - outerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  for (let z = 1; z < outerD - 1; z++) {
    // Left and right
    for (const x of [0, outerW - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - outerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - outerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  // Inner floor (slabs at ground level)
  for (let x = 0; x < innerW; x++) {
    for (let z = 0; z < innerD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - innerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - innerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Water surface (slab floating above floor)
  for (let x = 0; x < innerW; x++) {
    for (let z = 0; z < innerD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - innerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - innerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateWorkerVillageSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 4 small houses in a 2x2 cluster with 2-block gaps between them
  // Each house: 3x3 cube base (2 blocks tall), wedge roof (3 wedges forming peaked roof)

  const gap = 2 * BLOCK_UNIT;
  const houseSize = 3 * BLOCK_UNIT;
  const spacing = houseSize + gap;

  const houses = [
    { rx: 0, rz: 0 },
    { rx: 1, rz: 0 },
    { rx: 0, rz: 1 },
    { rx: 1, rz: 1 },
  ];

  for (const house of houses) {
    const hx = offset.x - spacing / 2 + house.rx * spacing;
    const hz = offset.z - spacing / 2 + house.rz * spacing;
    const halfHouse = (3 * BLOCK_UNIT) / 2;

    // House base: 3x3x2 (3 wide, 3 deep, 2 blocks tall)
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) {
          slots.push({
            position: new THREE.Vector3(
              hx - halfHouse + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              hz - halfHouse + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
          });
        }
      }
    }

    // Wedge roof (3 wedges along the top forming peaked roof)
    for (let x = 0; x < 3; x++) {
      slots.push({
        position: new THREE.Vector3(
          hx - halfHouse + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + BLOCK_SIZE / 2,
          hz
        ),
        placed: false,
        geometry: 'wedge',
      });
    }
  }

  return slots;
}

function generateGranarySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 3 single-column silos in a row, each 4 cylinders tall + half cap
  // Connected by cube walkway at base

  const siloSpacing = 3 * BLOCK_UNIT;

  // 3 silos
  for (let i = 0; i < 3; i++) {
    const x = offset.x - siloSpacing + i * siloSpacing;
    const z = offset.z;

    // Silo base platform (cube)
    slots.push({
      position: new THREE.Vector3(x, BLOCK_SIZE / 2, z),
      placed: false,
    });

    // 4 cylinder blocks tall
    for (let y = 1; y < 5; y++) {
      slots.push({
        position: new THREE.Vector3(x, y * BLOCK_UNIT + BLOCK_SIZE / 2, z),
        placed: false,
        geometry: 'cylinder',
      });
    }

    // Half-block cap on top
    slots.push({
      position: new THREE.Vector3(x, 5 * BLOCK_UNIT + BLOCK_SIZE * 0.25, z),
      placed: false,
      geometry: 'half',
    });
  }

  // Walkway connecting silos at base (cubes)
  for (let i = 0; i < 2; i++) {
    const x1 = offset.x - siloSpacing + i * siloSpacing;
    const x2 = offset.x - siloSpacing + (i + 1) * siloSpacing;
    // Place connecting blocks between silos
    for (let bx = 0; bx < 2; bx++) {
      slots.push({
        position: new THREE.Vector3(
          x1 + bx * (x2 - x1) / 2,
          BLOCK_SIZE / 2,
          offset.z
        ),
        placed: false,
      });
    }
  }

  return slots;
}

function generateAltarSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 3-tier stepped platform: base 6x6, then 4x4, then 2x2
  // Slab altar on top, 4 cube fire pit blocks at corners of top tier

  const tiers = [
    { size: 6, height: 0 },
    { size: 4, height: 1 },
    { size: 2, height: 2 },
  ];

  for (const tier of tiers) {
    const half = (tier.size * BLOCK_UNIT) / 2;
    for (let x = 0; x < tier.size; x++) {
      for (let z = 0; z < tier.size; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - half + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            tier.height * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - half + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Slab altar surface on the very top
  for (let x = 0; x < 2; x++) {
    for (let z = 0; z < 2; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          3 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // 4 fire pit cubes at the corners of the top tier (2x2)
  const corners = [
    { x: -1, z: -1 },
    { x: 1, z: -1 },
    { x: -1, z: 1 },
    { x: 1, z: 1 },
  ];

  for (const corner of corners) {
    slots.push({
      position: new THREE.Vector3(
        offset.x + corner.x * BLOCK_UNIT,
        3 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z + corner.z * BLOCK_UNIT
      ),
      placed: false,
    });
  }

  return slots;
}

function generateValleyTempleSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Cube perimeter walls (10 wide x 6 deep, 3 blocks tall)
  // 6 cylinder columns inside (2 rows of 3, each 3 cylinders tall + capital)
  // Wedge entrance porch (2 wedges forming peaked entrance)

  const wallW = 10;
  const wallD = 6;
  const wallH = 3;

  const halfW = (wallW * BLOCK_UNIT) / 2;
  const halfD = (wallD * BLOCK_UNIT) / 2;

  // Perimeter walls
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < wallW; x++) {
      // Front and back walls
      for (const z of [0, wallD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 1 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
    // Side walls (excluding corners)
    for (let z = 1; z < wallD - 1; z++) {
      for (const x of [0, wallW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 1 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
  }

  // Interior cylinder columns (2 rows of 3)
  const colPositions = [
    { x: 2, z: 1 },
    { x: 5, z: 1 },
    { x: 7, z: 1 },
    { x: 2, z: 4 },
    { x: 5, z: 4 },
    { x: 7, z: 4 },
  ];

  for (const cp of colPositions) {
    for (let y = 0; y < 3; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + cp.x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + cp.z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    // Capital on top of each column
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + cp.x * BLOCK_UNIT + BLOCK_UNIT / 2,
        3 * BLOCK_UNIT + 0.2,
        offset.z - halfD + cp.z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Wedge entrance porch (2 wedges forming peaked entrance on front)
  for (let x = 0; x < 2; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - BLOCK_UNIT / 2 + x * BLOCK_UNIT,
        wallH * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD
      ),
      placed: false,
      geometry: 'wedge',
    });
  }

  return slots;
}

function generateTreasurySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Thick-walled building: 8x6 cube perimeter walls (3 blocks tall, walls are 1 block thick)
  // Single doorway gap on the front wall (remove 1 wall block at y=1, center of front)
  // Internal cube shelves (2 cube blocks placed inside against back wall at y=1)

  const wallW = 8;
  const wallD = 6;
  const wallH = 3;

  const halfW = (wallW * BLOCK_UNIT) / 2;
  const halfD = (wallD * BLOCK_UNIT) / 2;

  // Perimeter walls with doorway gap
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < wallW; x++) {
      // Front wall with doorway gap at y=1, center (x=3 or 4)
      for (const z of [0, wallD - 1]) {
        if (z === 0 && y === 1 && (x === 3 || x === 4)) {
          continue; // Skip doorway blocks
        }
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 1 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
    // Side walls
    for (let z = 1; z < wallD - 1; z++) {
      for (const x of [0, wallW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 1 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
  }

  // Internal shelves: 2 cube blocks against back wall at y=1
  const shelfPositions = [
    { x: 2, z: wallD - 1 },
    { x: wallW - 3, z: wallD - 1 },
  ];
  for (const shelf of shelfPositions) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + shelf.x * BLOCK_UNIT + BLOCK_UNIT / 2,
        1 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + shelf.z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
    });
  }

  return slots;
}

function generateAvenueOfSphinxesSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Pathway: 20 slabs long (1 wide), running along z-axis
  // 3 sphinxes on each side, spaced every 6 blocks along the path
  // Each mini sphinx: 3-block cube body (3x1x1 along z), 1 cube head on top of front block

  const pathwayLength = 20;
  const pathwayWidth = 1;

  // Slab pathway
  for (let z = 0; z < pathwayLength; z++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x,
        BLOCK_SIZE * 0.125,
        offset.z + z * BLOCK_UNIT
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  // 3 sphinxes on each side
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const z = offset.z + (i + 1) * 6 * BLOCK_UNIT;
      const x = offset.x + side * 2 * BLOCK_UNIT;

      // Mini sphinx body: 3-block cube (3x1x1 along z)
      for (let bz = 0; bz < 3; bz++) {
        slots.push({
          position: new THREE.Vector3(
            x,
            BLOCK_SIZE / 2,
            z + (bz - 1) * BLOCK_UNIT
          ),
          placed: false,
        });
      }

      // Head on top of front block (z + BLOCK_UNIT)
      slots.push({
        position: new THREE.Vector3(
          x,
          BLOCK_UNIT + BLOCK_SIZE / 2,
          z + BLOCK_UNIT
        ),
        placed: false,
      });
    }
  }

  return slots;
}

function generateShrineOfAnubisSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Cube platform base (6x6, 1 block tall)
  // 4 cylinder columns at corners (each 3 cylinders tall + capital)
  // Slab roof on top (6x6 slabs at y=5)
  // 2 wedge "ear" blocks on the center-back of the roof

  const platformSize = 6;
  const platformH = 1;
  const colH = 3;

  const half = (platformSize * BLOCK_UNIT) / 2;

  // Platform base
  for (let x = 0; x < platformSize; x++) {
    for (let z = 0; z < platformSize; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - half + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - half + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  // 4 cylinder columns at corners
  const cornerPositions = [
    { x: 0, z: 0 },
    { x: platformSize - 1, z: 0 },
    { x: 0, z: platformSize - 1 },
    { x: platformSize - 1, z: platformSize - 1 },
  ];

  for (const corner of cornerPositions) {
    // 3 cylinder blocks
    for (let y = 1; y < 1 + colH; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - half + corner.x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - half + corner.z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }

    // Capital on top
    slots.push({
      position: new THREE.Vector3(
        offset.x - half + corner.x * BLOCK_UNIT + BLOCK_UNIT / 2,
        (1 + colH) * BLOCK_UNIT + 0.2,
        offset.z - half + corner.z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Slab roof (6x6 slabs at y=5)
  for (let x = 0; x < platformSize; x++) {
    for (let z = 0; z < platformSize; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - half + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          (1 + colH) * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - half + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // 2 wedge "ear" blocks on the center-back of the roof
  for (let x = 1; x < 3; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - BLOCK_UNIT + x * BLOCK_UNIT,
        (1 + colH + 1) * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - half
      ),
      placed: false,
      geometry: 'wedge',
    });
  }

  return slots;
}

function generateGreatQuarrySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Build UP as a reversed quarry with 3 terraced levels
  // Outer wall: 10x8, 3 high
  // Middle wall: 8x6, 2 high at y=0.5 offset
  // Inner wall: 6x4, 1 high

  // Outer ring: 10x8, 3 high
  const outerW = 10;
  const outerD = 8;
  const outerH = 3;

  const outerHalfW = (outerW * BLOCK_UNIT) / 2;
  const outerHalfD = (outerD * BLOCK_UNIT) / 2;

  for (let y = 0; y < outerH; y++) {
    for (let x = 0; x < outerW; x++) {
      // Front and back
      for (const z of [0, outerD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - outerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - outerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
    // Sides
    for (let z = 1; z < outerD - 1; z++) {
      for (const x of [0, outerW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - outerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - outerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Middle ring: 8x6, 2 high, slightly offset inward
  const midW = 8;
  const midD = 6;
  const midH = 2;

  const midHalfW = (midW * BLOCK_UNIT) / 2;
  const midHalfD = (midD * BLOCK_UNIT) / 2;

  for (let y = 0; y < midH; y++) {
    for (let x = 0; x < midW; x++) {
      for (const z of [0, midD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - midHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - midHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
    for (let z = 1; z < midD - 1; z++) {
      for (const x of [0, midW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - midHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - midHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Inner ring: 6x4, 1 high
  const innerW = 6;
  const innerD = 4;
  const innerH = 1;

  const innerHalfW = (innerW * BLOCK_UNIT) / 2;
  const innerHalfD = (innerD * BLOCK_UNIT) / 2;

  for (let x = 0; x < innerW; x++) {
    for (const z of [0, innerD - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - innerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - innerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }
  for (let z = 1; z < innerD - 1; z++) {
    for (const x of [0, innerW - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - innerHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - innerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  // Wedge ramp on one side (back side stepping up)
  for (let z = 0; z < innerD; z++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - innerHalfW - BLOCK_UNIT,
        BLOCK_SIZE / 2,
        offset.z - innerHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'wedge',
    });
  }

  return slots;
}

function generateColossusSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Platform: 10x4 slabs
  // Two seated figures spaced 6 apart:
  // - Legs: 2x2 cubes, 2 high (seated position)
  // - Torso: 2x2 cubes, 3 high (on top of legs)
  // - Head: 1x1 cubes, 2 high (centered on torso)

  const platformW = 10;
  const platformD = 4;

  const halfW = (platformW * BLOCK_UNIT) / 2;
  const halfD = (platformD * BLOCK_UNIT) / 2;

  // Slab platform
  for (let x = 0; x < platformW; x++) {
    for (let z = 0; z < platformD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Two colossi positioned symmetrically
  const colossusXPositions = [-3 * BLOCK_UNIT, 3 * BLOCK_UNIT];

  for (const baseX of colossusXPositions) {
    const cx = offset.x + baseX;
    const cz = offset.z;

    // Legs: 2x2 cubes, 2 high
    for (let y = 0; y < 2; y++) {
      for (let lx = 0; lx < 2; lx++) {
        for (let lz = 0; lz < 2; lz++) {
          slots.push({
            position: new THREE.Vector3(
              cx - BLOCK_UNIT / 2 + lx * BLOCK_UNIT,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              cz - BLOCK_UNIT / 2 + lz * BLOCK_UNIT
            ),
            placed: false,
          });
        }
      }
    }

    // Torso: 2x2 cubes, 3 high (on top of legs)
    for (let y = 2; y < 5; y++) {
      for (let tx = 0; tx < 2; tx++) {
        for (let tz = 0; tz < 2; tz++) {
          slots.push({
            position: new THREE.Vector3(
              cx - BLOCK_UNIT / 2 + tx * BLOCK_UNIT,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              cz - BLOCK_UNIT / 2 + tz * BLOCK_UNIT
            ),
            placed: false,
          });
        }
      }
    }

    // Head: 1x1 cubes, 2 high (centered on torso)
    for (let y = 5; y < 7; y++) {
      slots.push({
        position: new THREE.Vector3(
          cx,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          cz
        ),
        placed: false,
      });
    }
  }

  return slots;
}

function generateCanopicShrineSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Cube platform (6x4, 1 block tall)
  // 4 cylinder "jars" on top: each is 1 cylinder block wide, 3 tall, with a half-block lid on top
  // Jars evenly spaced on the platform

  const platformW = 6;
  const platformD = 4;

  const halfW = (platformW * BLOCK_UNIT) / 2;
  const halfD = (platformD * BLOCK_UNIT) / 2;

  // Platform base
  for (let x = 0; x < platformW; x++) {
    for (let z = 0; z < platformD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  // 4 cylinder jars evenly spaced on the platform
  const jarPositions = [
    { x: 1, z: 1 },
    { x: 4, z: 1 },
    { x: 1, z: 2 },
    { x: 4, z: 2 },
  ];

  for (const jar of jarPositions) {
    // 3 cylinder blocks tall
    for (let y = 1; y < 4; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + jar.x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + jar.z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }

    // Half-block lid on top
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + jar.x * BLOCK_UNIT + BLOCK_UNIT / 2,
        4 * BLOCK_UNIT + BLOCK_SIZE * 0.25,
        offset.z - halfD + jar.z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'half',
    });
  }

  return slots;
}

function generateIrrigationCanalSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Long narrow channel: cube walls (2 high, 1 wide) on both sides running 16 long
  // Slab floor between walls (1 wide, 16 long)
  // Slab water surface floating slightly above floor
  // Small sluice gate (2x2x1) at one end

  const canalLength = 16;
  const canalWidth = 1;

  // Floor: slab running 16 long down the center
  for (let z = 0; z < canalLength; z++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x,
        BLOCK_SIZE * 0.125,
        offset.z + z * BLOCK_UNIT
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  // Water surface: slab floating above floor
  for (let z = 0; z < canalLength; z++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x,
        BLOCK_UNIT + BLOCK_SIZE * 0.125,
        offset.z + z * BLOCK_UNIT
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  // Left wall (x = -1 block): 2 high, 16 long
  for (let y = 0; y < 2; y++) {
    for (let z = 0; z < canalLength; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - BLOCK_UNIT,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + z * BLOCK_UNIT
        ),
        placed: false,
      });
    }
  }

  // Right wall (x = +1 block): 2 high, 16 long
  for (let y = 0; y < 2; y++) {
    for (let z = 0; z < canalLength; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x + BLOCK_UNIT,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + z * BLOCK_UNIT
        ),
        placed: false,
      });
    }
  }

  // Sluice gate at one end (2x2x1 block): positioned at z = 0
  for (let gx = 0; gx < 2; gx++) {
    for (let gz = 0; gz < 1; gz++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - BLOCK_UNIT / 2 + gx * BLOCK_UNIT,
          BLOCK_SIZE / 2,
          offset.z - BLOCK_UNIT + gz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  return slots;
}

function generateCliffTempleSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Tall flat facade: 12 wide x 8 tall cube wall (front face only, 1 block deep)
  // 4 standing figures: each is 1x1x5 cube tall, spaced evenly across facade
  // Wedge cornice: 12 wedges across the very top

  const facadeW = 12;
  const facadeH = 8;

  const halfW = (facadeW * BLOCK_UNIT) / 2;

  // Main facade wall: 12 wide x 8 tall (front face)
  for (let y = 0; y < facadeH; y++) {
    for (let x = 0; x < facadeW; x++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z
        ),
        placed: false,
        ...(y >= 4 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
      });
    }
  }

  // 4 standing figures: 1x1x5 columns, evenly spaced
  const figureSpacing = (facadeW * BLOCK_UNIT) / 5; // 5 sections, 4 figures
  for (let f = 1; f <= 4; f++) {
    const fx = offset.x - halfW + f * figureSpacing;
    for (let y = facadeH; y < facadeH + 5; y++) {
      slots.push({
        position: new THREE.Vector3(
          fx,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z
        ),
        placed: false,
      });
    }
  }

  // Wedge cornice across the top (12 wedges)
  for (let x = 0; x < facadeW; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
        (facadeH + 5) * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z
      ),
      placed: false,
      geometry: 'wedge',
    });
  }

  return slots;
}

function generateMarketplaceSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 4 market stalls in 2x2 grid (spaced 4 blocks apart)
  // Each stall: 3x2 cube base (1 high), 4 cylinder posts (2 tall), 3x2 slab roof

  const stallSpacing = 4 * BLOCK_UNIT;
  const stallW = 3;
  const stallD = 2;
  const postH = 2;

  const stalls = [
    { gx: 0, gz: 0 },
    { gx: 1, gz: 0 },
    { gx: 0, gz: 1 },
    { gx: 1, gz: 1 },
  ];

  for (const stall of stalls) {
    const stx = offset.x - stallSpacing / 2 + stall.gx * stallSpacing;
    const stz = offset.z - stallSpacing / 2 + stall.gz * stallSpacing;
    const halfW = (stallW * BLOCK_UNIT) / 2;
    const halfD = (stallD * BLOCK_UNIT) / 2;

    // Base platform: 3x2 cubes (1 high)
    for (let x = 0; x < stallW; x++) {
      for (let z = 0; z < stallD; z++) {
        slots.push({
          position: new THREE.Vector3(
            stx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            BLOCK_SIZE / 2,
            stz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }

    // 4 cylinder corner posts (2 tall each)
    const corners = [
      { x: 0, z: 0 },
      { x: stallW - 1, z: 0 },
      { x: 0, z: stallD - 1 },
      { x: stallW - 1, z: stallD - 1 },
    ];

    for (const corner of corners) {
      for (let y = 1; y <= postH; y++) {
        slots.push({
          position: new THREE.Vector3(
            stx - halfW + corner.x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            stz - halfD + corner.z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'cylinder',
        });
      }
    }

    // Slab roof: 3x2 slabs on top
    for (let x = 0; x < stallW; x++) {
      for (let z = 0; z < stallD; z++) {
        slots.push({
          position: new THREE.Vector3(
            stx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            (postH + 1) * BLOCK_UNIT + BLOCK_SIZE * 0.125,
            stz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }

  return slots;
}

function generateSarcophagusChamberSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Enclosed chamber: 6x4 room (3 blocks tall, 1 block thick walls on all 4 sides)
  // Slab ceiling on top
  // Cube sarcophagus in center (3x1x1, 1 high)
  // Entrance corridor: 1 wide x 3 long extending from front (walls on both sides, 2 tall)

  const roomW = 6;
  const roomD = 4;
  const roomH = 3;
  const hallW = 1;
  const hallD = 3;
  const hallH = 2;

  const halfW = (roomW * BLOCK_UNIT) / 2;
  const halfD = (roomD * BLOCK_UNIT) / 2;

  // Main chamber walls: 6x4, 3 high
  for (let y = 0; y < roomH; y++) {
    for (let x = 0; x < roomW; x++) {
      // Front and back walls
      for (const z of [0, roomD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
    // Side walls
    for (let z = 1; z < roomD - 1; z++) {
      for (const x of [0, roomW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Slab ceiling on top
  for (let x = 0; x < roomW; x++) {
    for (let z = 0; z < roomD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          roomH * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Sarcophagus in center: 3x1x1 block
  for (let x = 0; x < 3; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - BLOCK_UNIT + x * BLOCK_UNIT,
        BLOCK_SIZE / 2 + roomH * BLOCK_UNIT / 2,
        offset.z
      ),
      placed: false,
    });
  }

  // Entrance corridor: 1 wide x 3 long, extending from front (z=-3)
  // Walls on both sides (x = -1 and x = +1), 2 tall
  const corridorHalfW = BLOCK_UNIT / 2;
  for (let cz = 0; cz < hallD; cz++) {
    // Floor of corridor
    slots.push({
      position: new THREE.Vector3(
        offset.x,
        BLOCK_SIZE / 2,
        offset.z - halfD - cz * BLOCK_UNIT - BLOCK_UNIT / 2
      ),
      placed: false,
    });

    // Left wall (x = -1)
    for (let y = 0; y < hallH; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - BLOCK_UNIT,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD - cz * BLOCK_UNIT - BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }

    // Right wall (x = +1)
    for (let y = 0; y < hallH; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x + BLOCK_UNIT,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD - cz * BLOCK_UNIT - BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  return slots;
}

function generateLighthouseSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // Square cube base: 4x4, 2 high
  // Cylinder tower: 2x2 arrangement (4 cylinders per layer) for 4 layers, then tapers to 1 cylinder for 6 layers
  // Half-block cap on very top
  // Slab observation platform (3x3 slabs) at transition point

  const baseSize = 4;
  const baseH = 2;

  const halfBase = (baseSize * BLOCK_UNIT) / 2;

  // Base: 4x4, 2 high
  for (let y = 0; y < baseH; y++) {
    for (let x = 0; x < baseSize; x++) {
      for (let z = 0; z < baseSize; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfBase + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfBase + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Cylinder tower: 2x2 arrangement (4 cylinders per layer) for 4 layers
  const cylinderPositions = [
    { x: 0.5, z: 0.5 },
    { x: 0.5, z: 1.5 },
    { x: 1.5, z: 0.5 },
    { x: 1.5, z: 1.5 },
  ];

  for (let y = baseH; y < baseH + 4; y++) {
    for (const pos of cylinderPositions) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - BLOCK_UNIT + pos.x * BLOCK_UNIT,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - BLOCK_UNIT + pos.z * BLOCK_UNIT
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }

  // Slab observation platform (3x3 slabs) at transition point
  const platformSize = 3;
  const platformHalf = (platformSize * BLOCK_UNIT) / 2;
  const platformY = (baseH + 4) * BLOCK_UNIT + BLOCK_SIZE * 0.125;
  for (let x = 0; x < platformSize; x++) {
    for (let z = 0; z < platformSize; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - platformHalf + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          platformY,
          offset.z - platformHalf + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Single cylinder for 6 more layers (above the platform)
  for (let y = baseH + 4; y < baseH + 10; y++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x,
        y * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z
      ),
      placed: false,
      geometry: 'cylinder',
    });
  }

  // Half-block cap on very top
  slots.push({
    position: new THREE.Vector3(
      offset.x,
      (baseH + 10) * BLOCK_UNIT + BLOCK_SIZE * 0.25,
      offset.z
    ),
    placed: false,
    geometry: 'half',
  });

  return slots;
}

// ═══════════════════════════════════════════════════════════════════
// CITY BUILDINGS — Egyptian settlement that grows east of the oasis
// ═══════════════════════════════════════════════════════════════════

/** Worker Hovels: 4 tiny mud-brick huts in a cluster. Humble beginnings. */
function generateWorkerHovelSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 4 small huts in a loose cluster, each 2x2 base, 2 tall, flat slab roof
  const huts = [
    { rx: -2.5, rz: -2.5 },
    { rx: 2.5,  rz: -2.0 },
    { rx: -2.0, rz: 2.5 },
    { rx: 3.0,  rz: 3.0 },
  ];

  for (const hut of huts) {
    const hx = offset.x + hut.rx * BLOCK_UNIT;
    const hz = offset.z + hut.rz * BLOCK_UNIT;
    const half = BLOCK_UNIT; // half of 2-wide

    // Walls: 2x2, 2 blocks tall
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        for (let z = 0; z < 2; z++) {
          slots.push({
            position: new THREE.Vector3(
              hx - half + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              hz - half + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
          });
        }
      }
    }
    // Flat slab roof
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        slots.push({
          position: new THREE.Vector3(
            hx - half + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
            hz - half + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }
  return slots;
}

/** Small Market: 3 open-front stalls with cylinder posts and slab canopies. */
function generateSmallMarketSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const stalls = [
    { rx: -3.5, rz: 0 },
    { rx: 0,    rz: 0 },
    { rx: 3.5,  rz: 0 },
  ];

  for (const stall of stalls) {
    const sx = offset.x + stall.rx * BLOCK_UNIT;
    const sz = offset.z + stall.rz * BLOCK_UNIT;
    const halfW = (2 * BLOCK_UNIT) / 2;
    const halfD = (2 * BLOCK_UNIT) / 2;

    // Base platform: 2x2
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        slots.push({
          position: new THREE.Vector3(
            sx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            BLOCK_SIZE / 2,
            sz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
    // 4 cylinder corner posts, 2 tall
    for (const cx of [0, 1]) {
      for (const cz of [0, 1]) {
        for (let y = 1; y <= 2; y++) {
          slots.push({
            position: new THREE.Vector3(
              sx - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              sz - halfD + cz * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'cylinder',
          });
        }
      }
    }
    // Slab canopy roof
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        slots.push({
          position: new THREE.Vector3(
            sx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            3 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
            sz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }
  return slots;
}

/** Craftsmen Quarter: 3 workshop buildings with open fronts and tool posts. */
function generateCraftsmenQuarterSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const shops = [
    { rx: -4, rz: -2 },
    { rx: 0,  rz: 2 },
    { rx: 4,  rz: -1 },
  ];

  for (const shop of shops) {
    const sx = offset.x + shop.rx * BLOCK_UNIT;
    const sz = offset.z + shop.rz * BLOCK_UNIT;
    const w = 3, d = 3, h = 2;
    const halfW = (w * BLOCK_UNIT) / 2;
    const halfD = (d * BLOCK_UNIT) / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          // Open front: skip front wall (z=0) on upper level
          if (z === 0 && y > 0) continue;
          slots.push({
            position: new THREE.Vector3(
              sx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              sz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
          });
        }
      }
    }
    // Wedge roof ridge along center
    for (let x = 0; x < w; x++) {
      slots.push({
        position: new THREE.Vector3(
          sx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          h * BLOCK_UNIT + BLOCK_SIZE / 2,
          sz
        ),
        placed: false,
        geometry: 'wedge',
      });
    }
    // Interior anvil/tool post (single cylinder)
    slots.push({
      position: new THREE.Vector3(sx, BLOCK_UNIT + BLOCK_SIZE / 2, sz),
      placed: false,
      geometry: 'cylinder',
    });
  }
  return slots;
}

/** Pharaoh's Palace: Large columned compound with courtyard and throne platform. */
function generatePharaohPalaceSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 10, d = 8, wallH = 3;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Perimeter walls with entrance gap
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < w; x++) {
      for (const z of [0, d - 1]) {
        // Entrance gap: front wall center at y >= 1
        if (z === 0 && y >= 1 && (x === 4 || x === 5)) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 2 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
    for (let z = 1; z < d - 1; z++) {
      for (const x of [0, w - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 2 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
  }

  // Entrance columns: 2 fluted columns flanking the gate, 3 tall + lotus capital
  for (const ex of [3, 6]) {
    for (let y = 0; y < 3; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + ex * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + ex * BLOCK_UNIT + BLOCK_UNIT / 2,
        3 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Raised throne platform at back center: 4x2, 1 block high
  for (let x = 3; x < 7; x++) {
    for (let z = d - 3; z < d - 1; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }
  // Throne seat: 2 beveled blocks on top of platform
  for (const tx of [4, 5]) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + tx * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + (d - 2) * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'beveled-cube',
    });
  }

  // Interior courtyard columns: 4 columns in 2x2 grid
  for (const cx of [3, 6]) {
    for (const cz of [2, 5]) {
      for (let y = 0; y < 2; y++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + cz * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'fluted-cylinder',
        });
      }
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + cz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'lotus-capital',
      });
    }
  }

  return slots;
}

/** Mud Brick Tenements: 2 taller multi-story worker housing blocks. Dense. */
function generateMudTenementSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const buildings = [
    { rx: -3, rz: 0 },
    { rx: 3,  rz: 0 },
  ];

  for (const bld of buildings) {
    const bx = offset.x + bld.rx * BLOCK_UNIT;
    const bz = offset.z + bld.rz * BLOCK_UNIT;
    const w = 4, d = 3, h = 4;
    const halfW = (w * BLOCK_UNIT) / 2;
    const halfD = (d * BLOCK_UNIT) / 2;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          // Window gaps: skip interior blocks on upper floors
          if (y >= 2 && x > 0 && x < w - 1 && z > 0 && z < d - 1) continue;
          slots.push({
            position: new THREE.Vector3(
              bx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              bz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
          });
        }
      }
    }
    // Flat slab roof
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        slots.push({
          position: new THREE.Vector3(
            bx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            h * BLOCK_UNIT + BLOCK_SIZE * 0.125,
            bz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }
  return slots;
}

/** Grand Bazaar: 6 market stalls in a 3x2 grid with a central walkway. */
function generateGrandBazaarSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  // 6 stalls in 3x2 grid, with a 1-block gap walkway down the center (z axis)
  const stallW = 2, stallD = 2;

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const sx = offset.x + (col - 1) * 4 * BLOCK_UNIT;
      const sz = offset.z + (row === 0 ? -2.5 : 2.5) * BLOCK_UNIT;
      const halfW = (stallW * BLOCK_UNIT) / 2;
      const halfD = (stallD * BLOCK_UNIT) / 2;

      // Base: 2x2
      for (let x = 0; x < stallW; x++) {
        for (let z = 0; z < stallD; z++) {
          slots.push({
            position: new THREE.Vector3(
              sx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              BLOCK_SIZE / 2,
              sz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
          });
        }
      }
      // 4 cylinder corner posts (2 tall)
      for (const cx of [0, stallW - 1]) {
        for (const cz of [0, stallD - 1]) {
          for (let y = 1; y <= 2; y++) {
            slots.push({
              position: new THREE.Vector3(
                sx - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
                y * BLOCK_UNIT + BLOCK_SIZE / 2,
                sz - halfD + cz * BLOCK_UNIT + BLOCK_UNIT / 2
              ),
              placed: false,
              geometry: 'cylinder',
            });
          }
        }
      }
      // Slab canopy
      for (let x = 0; x < stallW; x++) {
        for (let z = 0; z < stallD; z++) {
          slots.push({
            position: new THREE.Vector3(
              sx - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              3 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
              sz - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'slab',
          });
        }
      }
    }
  }

  // Central walkway paving: slabs along the gap
  for (let x = -4; x <= 4; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x + x * BLOCK_UNIT,
        BLOCK_SIZE * 0.125,
        offset.z
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  return slots;
}

/** Noble Villa: Walled compound with courtyard, porch columns, and wedge roof. */
function generateNobleVillaSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 7, d = 6, wallH = 3;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Perimeter walls with entrance
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < w; x++) {
      for (const z of [0, d - 1]) {
        // Entrance gap: center of front wall
        if (z === 0 && y >= 1 && x === 3) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y === wallH - 1 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
    for (let z = 1; z < d - 1; z++) {
      for (const x of [0, w - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y === wallH - 1 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
  }

  // Courtyard pool: 2x2 slabs in center
  for (let x = 2; x < 4; x++) {
    for (let z = 2; z < 4; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Porch columns: 2 at entrance
  for (const cx of [2, 4]) {
    for (let y = 0; y < 2; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
        2 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Wedge roof accents along back wall top
  for (let x = 1; x < w - 1; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
        wallH * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + (d - 1) * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'wedge',
    });
  }

  return slots;
}

/** Government Hall: Grand administrative building — the city's crown jewel. */
function generateGovernmentHallSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 10, d = 7, wallH = 4;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Base platform: full footprint, 1 block raised
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  // Perimeter walls on platform (3 more levels)
  for (let y = 1; y < wallH; y++) {
    for (let x = 0; x < w; x++) {
      for (const z of [0, d - 1]) {
        // Grand entrance: 3-wide gap in front
        if (z === 0 && y >= 2 && x >= 3 && x <= 6) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 3 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
    for (let z = 1; z < d - 1; z++) {
      for (const x of [0, w - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          ...(y >= 3 ? { geometry: 'beveled-cube' as BlockGeometry } : {}),
        });
      }
    }
  }

  // Grand colonnade: 6 columns across the front facade
  for (let col = 2; col <= 7; col++) {
    for (let y = 1; y <= 3; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + col * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    // Lotus capital
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + col * BLOCK_UNIT + BLOCK_UNIT / 2,
        4 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Slab roof along top
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          wallH * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Central elevated dais inside: 4x2, raised 1 more block
  for (let x = 3; x < 7; x++) {
    for (let z = d - 3; z < d - 1; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }

  return slots;
}

/** Ordered registry of all buildable structures after the main pyramid */
export function getStructureRegistry(): Structure[] {
  const registry: Structure[] = [
    {
      id: 'obelisk',
      name: 'Obelisk',
      icon: '\u{1F5FC}',
      worldOffset: new THREE.Vector3(22, 0, 8),
      slots: generateObeliskSlots(new THREE.Vector3(22, 0, 8)),
    },
    {
      id: 'sphinx',
      name: 'Sphinx',
      icon: '\u{1F981}',
      worldOffset: new THREE.Vector3(0, 0, 55),
      slots: generateSphinxSlots(new THREE.Vector3(0, 0, 55)),
    },
    {
      id: 'colonnade',
      name: 'Colonnade',
      icon: '\u{1F6E4}',
      worldOffset: new THREE.Vector3(0, 0, 18),
      slots: generateColonnadeSlots(new THREE.Vector3(0, 0, 18)),
    },
    {
      id: 'small-pyramid',
      name: 'Queen\'s Pyramid',
      icon: '\u{1F53A}',
      worldOffset: new THREE.Vector3(-24, 0, -10),
      slots: generateSmallPyramidSlots(new THREE.Vector3(-24, 0, -10)),
    },
    {
      id: 'boat',
      name: 'Solar Barque',
      icon: '\u{26F5}',
      worldOffset: new THREE.Vector3(25, 0, -12),
      slots: generateBoatSlots(new THREE.Vector3(25, 0, -12)),
    },
    {
      id: 'step-pyramid',
      name: 'Step Pyramid of Djoser',
      icon: '\u{1F3DB}',
      worldOffset: new THREE.Vector3(-44, 0, -30),
      slots: generateStepPyramidSlots(new THREE.Vector3(-44, 0, -30)),
    },
    {
      id: 'temple',
      name: 'Mortuary Temple',
      icon: '\u{26E9}',
      worldOffset: new THREE.Vector3(20, 0, -38),
      slots: generateTempleSlots(new THREE.Vector3(20, 0, -38)),
    },
    {
      id: 'mastaba',
      name: 'Mastaba Tomb',
      icon: '\u{1F3DA}',
      worldOffset: new THREE.Vector3(-18, 0, -30),
      slots: generateMastabaSlots(new THREE.Vector3(-18, 0, -30)),
    },
    {
      id: 'pylon-gate',
      name: 'Pylon Gate',
      icon: '\u{1F3EF}',
      worldOffset: new THREE.Vector3(0, 0, -24),
      slots: generatePylonGateSlots(new THREE.Vector3(0, 0, -24)),
    },
    {
      id: 'hypostyle-hall',
      name: 'Hypostyle Hall',
      icon: '\u{1F3DB}',
      worldOffset: new THREE.Vector3(40, 0, -22),
      slots: generateHypostyleHallSlots(new THREE.Vector3(40, 0, -22)),
    },
    {
      id: 'sacred-lake',
      name: 'Sacred Lake',
      icon: '\u{1F30A}',
      worldOffset: new THREE.Vector3(-32, 0, 25),
      slots: generateSacredLakeSlots(new THREE.Vector3(-32, 0, 25)),
    },
    {
      id: 'worker-hovels',
      name: 'Worker Hovels',
      icon: '\u{1F3DA}',
      worldOffset: new THREE.Vector3(70, 0, 48),
      slots: generateWorkerHovelSlots(new THREE.Vector3(70, 0, 48)),
    },
    {
      id: 'granary',
      name: 'Granary',
      icon: '\u{1F33E}',
      worldOffset: new THREE.Vector3(-50, 0, 35),
      slots: generateGranarySlots(new THREE.Vector3(-50, 0, 35)),
    },
    {
      id: 'altar',
      name: 'Altar of Offerings',
      icon: '\u{1F525}',
      worldOffset: new THREE.Vector3(44, 0, -48),
      slots: generateAltarSlots(new THREE.Vector3(44, 0, -48)),
    },
    {
      id: 'valley-temple',
      name: 'Valley Temple',
      icon: '\u{26E9}',
      worldOffset: new THREE.Vector3(-55, 0, -10),
      slots: generateValleyTempleSlots(new THREE.Vector3(-55, 0, -10)),
    },
    {
      id: 'small-market',
      name: 'Small Market',
      icon: '\u{1F3EA}',
      worldOffset: new THREE.Vector3(92, 0, 42),
      slots: generateSmallMarketSlots(new THREE.Vector3(92, 0, 42)),
    },
    {
      id: 'avenue-of-sphinxes',
      name: 'Avenue of Sphinxes',
      icon: '\u{1F981}',
      worldOffset: new THREE.Vector3(0, 0, 55),
      slots: generateAvenueOfSphinxesSlots(new THREE.Vector3(0, 0, 55)),
    },
    {
      id: 'shrine-of-anubis',
      name: 'Shrine of Anubis',
      icon: '\u{1F43A}',
      worldOffset: new THREE.Vector3(-62, 0, -52),
      slots: generateShrineOfAnubisSlots(new THREE.Vector3(-62, 0, -52)),
    },
    {
      id: 'craftsmen-quarter',
      name: 'Craftsmen Quarter',
      icon: '\u{1F528}',
      worldOffset: new THREE.Vector3(78, 0, 62),
      slots: generateCraftsmenQuarterSlots(new THREE.Vector3(78, 0, 62)),
    },
    {
      id: 'colossi',
      name: 'Colossi of Memnon',
      icon: '\u{1F5FF}',
      worldOffset: new THREE.Vector3(-72, 0, -25),
      slots: generateColossusSlots(new THREE.Vector3(-72, 0, -25)),
    },
    {
      id: 'canopic-shrine',
      name: 'Canopic Shrine',
      icon: '\u{1F3FA}',
      worldOffset: new THREE.Vector3(58, 0, -58),
      slots: generateCanopicShrineSlots(new THREE.Vector3(58, 0, -58)),
    },
    {
      id: 'pharaoh-palace',
      name: 'Pharaoh\'s Palace',
      icon: '\u{1F451}',
      worldOffset: new THREE.Vector3(68, 0, 82),
      slots: generatePharaohPalaceSlots(new THREE.Vector3(68, 0, 82)),
    },
    {
      id: 'mud-tenements',
      name: 'Mud Brick Tenements',
      icon: '\u{1F3E0}',
      worldOffset: new THREE.Vector3(100, 0, 58),
      slots: generateMudTenementSlots(new THREE.Vector3(100, 0, 58)),
    },
    {
      id: 'grand-bazaar',
      name: 'Grand Bazaar',
      icon: '\u{1F3AA}',
      worldOffset: new THREE.Vector3(90, 0, 78),
      slots: generateGrandBazaarSlots(new THREE.Vector3(90, 0, 78)),
    },
    {
      id: 'noble-villa',
      name: 'Noble Villa',
      icon: '\u{1F3DB}',
      worldOffset: new THREE.Vector3(110, 0, 72),
      slots: generateNobleVillaSlots(new THREE.Vector3(110, 0, 72)),
    },
    {
      id: 'government-hall',
      name: 'Government Hall',
      icon: '\u{1F3DB}',
      worldOffset: new THREE.Vector3(80, 0, 100),
      slots: generateGovernmentHallSlots(new THREE.Vector3(80, 0, 100)),
    },
  ];

  // Lift every structure so it sits on the terrain surface
  for (const structure of registry) {
    const terrainY = getTerrainHeight(structure.worldOffset.x, structure.worldOffset.z);
    structure.worldOffset.y = terrainY;
    for (const slot of structure.slots) {
      slot.position.y += terrainY;
    }
  }

  return registry;
}
