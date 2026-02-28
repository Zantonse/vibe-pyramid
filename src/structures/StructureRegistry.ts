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

/** Royal Treasury: Walled vault with thick walls, gold columns, raised platform. */
function generateRoyalTreasurySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 8, d = 6, wallH = 4;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Thick double-layer base platform
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
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
  // Thick perimeter walls (double-thick on sides)
  for (let y = 1; y < wallH; y++) {
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        if (x > 1 && x < w - 2 && z > 0 && z < d - 1) continue; // hollow interior
        // Entrance gap in front center
        if (z === 0 && y >= 2 && x >= 3 && x <= 4) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }
  // Interior gold columns (4 fluted cylinders)
  const colPositions = [
    { x: 3, z: 2 }, { x: 4, z: 2 }, { x: 3, z: 3 }, { x: 4, z: 3 },
  ];
  for (const cp of colPositions) {
    for (let y = 1; y < wallH; y++) {
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
  }
  // Roof slabs
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          wallH * BLOCK_UNIT + 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }
  return slots;
}

/** Great Quarry: Open pit with cut stone blocks and ramp. */
function generateGreatQuarrySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 10, d = 8;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Tiered pit walls (3 levels descending)
  for (let tier = 0; tier < 3; tier++) {
    const inset = tier;
    for (let x = inset; x < w - inset; x++) {
      for (let z = inset; z < d - inset; z++) {
        // Only perimeter of each tier
        if (x > inset && x < w - inset - 1 && z > inset && z < d - inset - 1) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            tier * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }
  // Ramp on one side (3 blocks wide, ascending)
  for (let i = 0; i < 5; i++) {
    for (let w2 = 0; w2 < 3; w2++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + (3 + w2) * BLOCK_UNIT + BLOCK_UNIT / 2,
          i * 0.5 * BLOCK_UNIT + BLOCK_SIZE * 0.25,
          offset.z + halfD + i * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'half',
      });
    }
  }
  // Cut blocks scattered in pit floor
  for (let i = 0; i < 6; i++) {
    const bx = 3 + Math.floor(i % 3) * 2;
    const bz = 3 + Math.floor(i / 3) * 2;
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + bx * BLOCK_UNIT + BLOCK_UNIT / 2,
        3 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + bz * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'beveled-cube',
    });
  }
  return slots;
}

/** Irrigation Canal: Long stone-lined channel with sluice gates. */
function generateIrrigationCanalSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const length = 16;
  const halfL = (length * BLOCK_UNIT) / 2;

  // Canal walls — 2 parallel rows running along Z axis
  for (let i = 0; i < length; i++) {
    for (const side of [-1, 1]) {
      // Wall base
      slots.push({
        position: new THREE.Vector3(
          offset.x + side * BLOCK_UNIT,
          BLOCK_SIZE / 2,
          offset.z - halfL + i * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
      // Wall top
      slots.push({
        position: new THREE.Vector3(
          offset.x + side * BLOCK_UNIT,
          BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfL + i * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'half',
      });
    }
  }
  // Sluice gates — 3 cross-bars
  for (const gz of [3, 8, 13]) {
    for (let y = 0; y < 2; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfL + gz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }
  return slots;
}

/** Cliff Temple: Terraced temple carved into a cliff face (Abu Simbel inspired). */
function generateCliffTempleSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 12, d = 5;
  const halfW = (w * BLOCK_UNIT) / 2;

  // Cliff face — tall back wall (7 blocks high)
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < 7; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + d * BLOCK_UNIT
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }
  // 3 terraces stepping forward, each lower
  for (let tier = 0; tier < 3; tier++) {
    const tierH = 5 - tier * 2;
    const tierZ = d - tier;
    for (let x = 1; x < w - 1; x++) {
      for (let y = 0; y < tierH; y++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z + tierZ * BLOCK_UNIT
          ),
          placed: false,
        });
      }
    }
  }
  // 4 colossal seated figures (fluted cylinders, 5 high each)
  const statueXs = [2, 4, 7, 9];
  for (const sx of statueXs) {
    for (let y = 0; y < 5; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + sx * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + (d - 1) * BLOCK_UNIT
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    // Statue capitals (heads)
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + sx * BLOCK_UNIT + BLOCK_UNIT / 2,
        5 * BLOCK_UNIT + 0.2,
        offset.z + (d - 1) * BLOCK_UNIT
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }
  // Entrance doorway — recessed opening
  for (let y = 0; y < 4; y++) {
    for (const ex of [5, 6]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + ex * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + (d + 1) * BLOCK_UNIT
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }
  return slots;
}

/** Marketplace: Large covered market with stall rows and central fountain. */
function generateMarketplaceSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 10, d = 8;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Stone floor
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.25,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }
  // Stall rows — 2 rows of 4 stalls with canopy posts
  for (const row of [2, 5]) {
    for (let stall = 0; stall < 4; stall++) {
      const sx = 1 + stall * 2;
      // Post
      for (let y = 0; y < 2; y++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + sx * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2 + 0.25,
            offset.z - halfD + row * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'cylinder',
        });
      }
      // Canopy slab
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + sx * BLOCK_UNIT + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + 0.375,
          offset.z - halfD + row * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
      // Counter block
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + (sx + 1) * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.25 + BLOCK_SIZE / 2,
          offset.z - halfD + row * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'half',
      });
    }
  }
  // Central fountain — cylinder base + capital top
  for (let y = 0; y < 2; y++) {
    slots.push({
      position: new THREE.Vector3(offset.x, y * BLOCK_UNIT + BLOCK_SIZE / 2 + 0.25, offset.z),
      placed: false,
      geometry: 'cylinder',
    });
  }
  slots.push({
    position: new THREE.Vector3(offset.x, 2 * BLOCK_UNIT + 0.45, offset.z),
    placed: false,
    geometry: 'lotus-capital',
  });
  return slots;
}

/** Sarcophagus Chamber: Underground tomb with entrance, pillared hall, central sarcophagus. */
function generateSarcophagusChamberSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 8, d = 8, wallH = 3;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Floor
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
  // Perimeter walls
  for (let y = 1; y <= wallH; y++) {
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        if (x > 0 && x < w - 1 && z > 0 && z < d - 1) continue;
        // Entrance gap
        if (z === 0 && x >= 3 && x <= 4 && y <= 2) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }
  // 4 interior pillars
  for (const cp of [{ x: 2, z: 2 }, { x: 5, z: 2 }, { x: 2, z: 5 }, { x: 5, z: 5 }]) {
    for (let y = 1; y <= wallH; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + cp.x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + cp.z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }
  // Central sarcophagus (3x1 beveled box, raised on half-block)
  for (let sx = 3; sx <= 4; sx++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + sx * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_UNIT + BLOCK_SIZE * 0.25,
        offset.z
      ),
      placed: false,
      geometry: 'half',
    });
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + sx * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_UNIT + BLOCK_SIZE * 0.75,
        offset.z
      ),
      placed: false,
      geometry: 'beveled-cube',
    });
  }
  // Roof slabs
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          (wallH + 1) * BLOCK_UNIT + 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }
  return slots;
}

/** Lighthouse of Pharos: 3-tier tower — square base, octagonal mid, cylindrical top. */
function generateLighthouseSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // Tier 1: Square base (5x5, 6 high)
  const base = 5;
  const halfBase = (base * BLOCK_UNIT) / 2;
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < base; x++) {
      for (let z = 0; z < base; z++) {
        // Hollow interior above ground floor
        if (y > 0 && x > 0 && x < base - 1 && z > 0 && z < base - 1) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfBase + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfBase + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }
  // Tier 2: Narrower column (3x3, 5 high) — cylinders
  const mid = 3;
  const halfMid = (mid * BLOCK_UNIT) / 2;
  for (let y = 6; y < 11; y++) {
    for (let x = 0; x < mid; x++) {
      for (let z = 0; z < mid; z++) {
        if (x === 1 && z === 1) continue; // hollow center
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfMid + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfMid + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'fluted-cylinder',
        });
      }
    }
  }
  // Tier 3: Cylindrical beacon column (1x1, 4 high)
  for (let y = 11; y < 15; y++) {
    slots.push({
      position: new THREE.Vector3(offset.x, y * BLOCK_UNIT + BLOCK_SIZE / 2, offset.z),
      placed: false,
      geometry: 'cylinder',
    });
  }
  // Beacon capital at top
  slots.push({
    position: new THREE.Vector3(offset.x, 15 * BLOCK_UNIT + 0.2, offset.z),
    placed: false,
    geometry: 'lotus-capital',
  });
  return slots;
}

/** Eternal City: Grand walled palace complex with colonnaded courtyard. */
function generateEternalCitySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];
  const w = 14, d = 12, wallH = 4;
  const halfW = (w * BLOCK_UNIT) / 2;
  const halfD = (d * BLOCK_UNIT) / 2;

  // Base platform
  for (let x = 0; x < w; x++) {
    for (let z = 0; z < d; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }
  // Perimeter walls
  for (let y = 1; y <= wallH; y++) {
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < d; z++) {
        if (x > 0 && x < w - 1 && z > 0 && z < d - 1) continue;
        // Grand entrance (4-wide gap)
        if (z === 0 && x >= 5 && x <= 8 && y >= 2) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }
  // Courtyard colonnade — 2 rows of 5 columns along the sides
  for (const xCol of [2, 11]) {
    for (let zc = 2; zc <= 9; zc += 2) {
      for (let y = 1; y <= 3; y++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + xCol * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + zc * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'fluted-cylinder',
        });
      }
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + xCol * BLOCK_UNIT + BLOCK_UNIT / 2,
          4 * BLOCK_UNIT + 0.2,
          offset.z - halfD + zc * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'lotus-capital',
      });
    }
  }
  // Throne room at the back — raised platform with columns
  for (let x = 4; x <= 9; x++) {
    for (let z = 8; z <= 10; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }
  // Throne room columns (4)
  for (const tc of [{ x: 5, z: 9 }, { x: 8, z: 9 }, { x: 5, z: 10 }, { x: 8, z: 10 }]) {
    for (let y = 2; y <= wallH; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + tc.x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + tc.z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
  }
  // Entrance pylons — 2 tapered towers flanking the gate
  for (const px of [4, 9]) {
    for (let y = 1; y <= 5; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + px * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: y <= 3 ? 'beveled-cube' : 'half',
      });
    }
  }
  return slots;
}

/** Abu Simbel: Colossal rock-cut temple with 4 seated pharaoh figures. The capstone monument. */
function generateAbuSimbelSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const cliffW = 22;
  const cliffH = 14;
  const cliffD = 2;
  const halfW = (cliffW * BLOCK_UNIT) / 2;
  const halfD = (cliffD * BLOCK_UNIT) / 2;

  // ── Cliff face (back layer — solid) ───────────────────────────
  for (let y = 0; y < cliffH; y++) {
    for (let x = 0; x < cliffW; x++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + halfD - BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
  }

  // ── Cliff face (front layer — with gaps for figures & entrance) ──
  // Figure positions: columns 1-3, 6-8, 13-15, 18-20 (0-indexed)
  const figureColumns = [
    { start: 1, end: 3 },  // leftmost figure
    { start: 6, end: 8 },  // inner-left figure
    { start: 13, end: 15 }, // inner-right figure
    { start: 18, end: 20 }, // rightmost figure
  ];
  // Entrance: columns 10-11, rows 0-3
  const entranceXMin = 10;
  const entranceXMax = 11;
  const entranceYMax = 3;

  for (let y = 0; y < cliffH; y++) {
    for (let x = 0; x < cliffW; x++) {
      // Skip figure zones (y < 8)
      const inFigureZone = y < 8 && figureColumns.some(f => x >= f.start && x <= f.end);
      // Skip entrance zone
      const inEntrance = x >= entranceXMin && x <= entranceXMax && y <= entranceYMax;

      if (!inFigureZone && !inEntrance) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z + halfD - BLOCK_UNIT / 2 - BLOCK_UNIT
          ),
          placed: false,
        });
      }
    }
  }

  // ── Wedge cornice across the top ──────────────────────────────
  for (let x = 0; x < cliffW; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
        cliffH * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z + halfD - BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'wedge',
    });
  }

  // ── 4 Colossal seated figures ─────────────────────────────────
  // Each: 3-wide throne/legs (3 tall), 2-wide torso (3 tall), 1-wide head (2 tall)
  const figureXCenters = [2, 7, 14, 19]; // center column of each figure

  for (const cx of figureXCenters) {
    const fx = offset.x - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2;
    const fz = offset.z + halfD - BLOCK_UNIT / 2 - BLOCK_UNIT; // front layer

    // Throne/legs: 3 wide x 3 tall x 1 deep
    for (let y = 0; y < 3; y++) {
      for (let dx = -1; dx <= 1; dx++) {
        slots.push({
          position: new THREE.Vector3(
            fx + dx * BLOCK_UNIT,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            fz
          ),
          placed: false,
        });
      }
    }

    // Torso: 2 wide x 3 tall, centered
    for (let y = 3; y < 6; y++) {
      for (const dx of [-0.5, 0.5]) {
        slots.push({
          position: new THREE.Vector3(
            fx + dx * BLOCK_UNIT,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            fz
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }

    // Head: 1 wide x 2 tall, centered
    for (let y = 6; y < 8; y++) {
      slots.push({
        position: new THREE.Vector3(
          fx,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          fz
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }

  // ── Interior pillared hall (10 wide x 8 deep) ────────────────
  const hallW = 10;
  const hallD = 8;
  const hallH = 4;
  const hallHalfW = (hallW * BLOCK_UNIT) / 2;

  // Floor slabs
  for (let x = 0; x < hallW; x++) {
    for (let z = 0; z < hallD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - hallHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z + halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // 8 fluted columns (2 rows of 4)
  const colPositions = [
    { x: 2, z: 1 }, { x: 2, z: 3 }, { x: 2, z: 5 }, { x: 2, z: 7 },
    { x: 7, z: 1 }, { x: 7, z: 3 }, { x: 7, z: 5 }, { x: 7, z: 7 },
  ];
  for (const cp of colPositions) {
    for (let y = 1; y <= hallH; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - hallHalfW + cp.x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + halfD + cp.z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
  }

  // Ceiling slabs
  for (let x = 0; x < hallW; x++) {
    for (let z = 0; z < hallD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - hallHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          (hallH + 1) * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z + halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // 3 shrine statues at the back wall
  for (const sx of [-2, 0, 2]) {
    for (let y = 1; y <= 3; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x + sx * BLOCK_UNIT,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + halfD + (hallD - 1) * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }

  return slots;
}

// ─── Inner Ring Structures 35-39 ───────────────────────────────────────────

function generateEmbalmersWorkshopSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const W = 8;
  const D = 6;
  const halfW = (W * BLOCK_UNIT) / 2;
  const halfD = (D * BLOCK_UNIT) / 2;

  // Slab floor (48)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  // Perimeter walls 3-high (beveled-cube) — front wall has doorway gap at center
  const wallH = 3;
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < W; x++) {
      // Front wall (z=0) — leave door gap at y<2 for center 2 columns
      const isFront = true;
      const isDoorGap = x >= 3 && x <= 4 && y < 2;
      for (const z of [0, D - 1]) {
        if (z === 0 && isDoorGap) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    // Side walls (exclude corners already covered above)
    for (let z = 1; z < D - 1; z++) {
      for (const x of [0, W - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 4 interior slab tables (2x1 slabs at y=1, arranged in 2 pairs)
  const tablePositions = [
    { x: 2, z: 2 }, { x: 3, z: 2 },
    { x: 4, z: 3 }, { x: 5, z: 3 },
    { x: 2, z: 4 }, { x: 3, z: 4 },
    { x: 5, z: 1 }, { x: 6, z: 1 },
  ];
  for (const tp of tablePositions) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + tp.x * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_UNIT + BLOCK_SIZE * 0.125,
        offset.z - halfD + tp.z * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  // 6 cylinder jars along back wall (z = D-2, interior side)
  for (let x = 1; x <= 6; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_SIZE / 2,
        offset.z - halfD + (D - 2) * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'cylinder',
    });
  }

  // Slab roof (48)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  return slots;
}

function generateScribesAcademySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const W = 8;
  const D = 8;
  const halfW = (W * BLOCK_UNIT) / 2;
  const halfD = (D * BLOCK_UNIT) / 2;

  // Slab floor (64)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  // Perimeter walls 2-high (beveled-cube)
  const wallH = 2;
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < W; x++) {
      for (const z of [0, D - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < D - 1; z++) {
      for (const x of [0, W - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 4 fluted-cylinder columns + lotus-capitals (2x2 arrangement inside)
  const colPositions = [
    { x: 2, z: 2 },
    { x: 5, z: 2 },
    { x: 2, z: 5 },
    { x: 5, z: 5 },
  ];
  for (const cp of colPositions) {
    // Column shaft (3 tall)
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
    // Lotus capital
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

  // Raised teaching platform 4x2, 1-high at back interior (slab slabs)
  for (let x = 2; x < 6; x++) {
    for (let z = 6; z < 8; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Slab roof (64)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  return slots;
}

function generateNilometerSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // Slab platform surround (10x10 base)
  const platformW = 10;
  const platformD = 10;
  const pHalfW = (platformW * BLOCK_UNIT) / 2;
  const pHalfD = (platformD * BLOCK_UNIT) / 2;
  for (let x = 0; x < platformW; x++) {
    for (let z = 0; z < platformD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - pHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - pHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // 5 concentric square rings stepping down in height
  // Each ring is 1 block thick perimeter, y-level steps down
  const rings = [
    { size: 8, y: 4 },
    { size: 6, y: 3 },
    { size: 4, y: 2 },
    { size: 2, y: 1 },
  ];

  for (const ring of rings) {
    const rHalfW = (ring.size * BLOCK_UNIT) / 2;
    const rHalfD = (ring.size * BLOCK_UNIT) / 2;
    for (let x = 0; x < ring.size; x++) {
      for (let z = 0; z < ring.size; z++) {
        const isPerimeter = x === 0 || x === ring.size - 1 || z === 0 || z === ring.size - 1;
        if (!isPerimeter) continue;
        slots.push({
          position: new THREE.Vector3(
            offset.x - rHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            ring.y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - rHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Center cylinder column 5-high
  for (let y = 0; y < 5; y++) {
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

  return slots;
}

function generateChariotStableSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const W = 12;
  const D = 6;
  const halfW = (W * BLOCK_UNIT) / 2;
  const halfD = (D * BLOCK_UNIT) / 2;
  const wallH = 3;

  // Slab floor (72)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  // 3-high walls on 3 sides — back (z=D-1), left (x=0), right (x=W-1)
  // Front (z=0) is open
  for (let y = 0; y < wallH; y++) {
    // Back wall
    for (let x = 0; x < W; x++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + (D - 1) * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
    // Side walls (left and right), excluding back corner (already placed)
    for (let z = 0; z < D - 1; z++) {
      for (const x of [0, W - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 5 partition walls 2x1-high inside (dividing stalls along depth)
  // Placed at x=2,4,6,8,10, spanning z=1..D-2, y=0..1
  const partitionXs = [2, 4, 6, 8, 10];
  for (const px of partitionXs) {
    for (let y = 0; y < 2; y++) {
      for (let z = 1; z < D - 1; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + px * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 8 cylinder posts along open front (z=0), evenly spaced
  const postXs = [1, 2, 4, 5, 7, 8, 10, 11];
  for (const px of postXs) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + px * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_SIZE / 2,
        offset.z - halfD + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'cylinder',
    });
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + px * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'cylinder',
    });
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + px * BLOCK_UNIT + BLOCK_UNIT / 2,
        2 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'cylinder',
    });
  }

  // Slab roof (72)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  return slots;
}

function generateBreweryBakerySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // Twin 6x4 buildings with 3-unit gap between them
  // Building A: centered at offset.x - 4.5 (left)
  // Building B: centered at offset.x + 4.5 (right)
  const BW = 6;
  const BD = 4;
  const wallH = 3;
  const gap = 3; // blocks between buildings

  const bHalfW = (BW * BLOCK_UNIT) / 2;
  const bHalfD = (BD * BLOCK_UNIT) / 2;
  const centerOffset = (BW + gap) * BLOCK_UNIT / 2;

  for (const side of [-1, 1]) {
    const cx = offset.x + side * centerOffset;

    // Slab floor (24 each)
    for (let x = 0; x < BW; x++) {
      for (let z = 0; z < BD; z++) {
        slots.push({
          position: new THREE.Vector3(
            cx - bHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            BLOCK_SIZE * 0.125,
            offset.z - bHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }

    // 3-high walls (beveled-cube perimeter)
    for (let y = 0; y < wallH; y++) {
      for (let x = 0; x < BW; x++) {
        for (const z of [0, BD - 1]) {
          slots.push({
            position: new THREE.Vector3(
              cx - bHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              offset.z - bHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }
      for (let z = 1; z < BD - 1; z++) {
        for (const x of [0, BW - 1]) {
          slots.push({
            position: new THREE.Vector3(
              cx - bHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              offset.z - bHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }
    }

    // 2 cylinder ovens inside each building (against back wall)
    for (const ox of [1, 4]) {
      for (let y = 0; y < 2; y++) {
        slots.push({
          position: new THREE.Vector3(
            cx - bHalfW + ox * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - bHalfD + (BD - 2) * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'cylinder',
        });
      }
    }

    // Slab roof (24 each)
    for (let x = 0; x < BW; x++) {
      for (let z = 0; z < BD; z++) {
        slots.push({
          position: new THREE.Vector3(
            cx - bHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            wallH * BLOCK_UNIT + BLOCK_SIZE * 0.125,
            offset.z - bHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }

  // Slab walkway bridge between the two buildings (gap x 1 wide, at z=BD/2)
  const bridgeZ = Math.floor(BD / 2);
  const bridgeStartX = offset.x - centerOffset + bHalfW;
  for (let b = 0; b < gap; b++) {
    slots.push({
      position: new THREE.Vector3(
        bridgeStartX + b * BLOCK_UNIT + BLOCK_UNIT / 2,
        BLOCK_SIZE * 0.125,
        offset.z - bHalfD + bridgeZ * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  return slots;
}

function generateGuardBarracksSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const W = 10;
  const D = 8;
  const halfW = (W * BLOCK_UNIT) / 2;
  const halfD = (D * BLOCK_UNIT) / 2;
  const wallH = 3;

  // Slab floor (80)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  // Perimeter walls 3-high (beveled-cube) — 4 sides
  for (let y = 0; y < wallH; y++) {
    // Front and back rows (z = 0 and z = D-1)
    for (let x = 0; x < W; x++) {
      for (const z of [0, D - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    // Left and right columns (x = 0 and x = W-1), skip corners already placed
    for (let z = 1; z < D - 1; z++) {
      for (const x of [0, W - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Corner watchtower at (0,0) corner extending 2 extra levels (total 5-high)
  for (let y = wallH; y < 5; y++) {
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 2; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Interior 2x4 bunk blocks (2 rows of bunks inside)
  const bunkPositions = [
    { bx: 2, bz: 2 },
    { bx: 6, bz: 2 },
  ];
  for (const { bx, bz } of bunkPositions) {
    for (let x = 0; x < 2; x++) {
      for (let z = 0; z < 4; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + (bx + x) * BLOCK_UNIT + BLOCK_UNIT / 2,
            BLOCK_SIZE / 2,
            offset.z - halfD + (bz + z) * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + (bx + x) * BLOCK_UNIT + BLOCK_UNIT / 2,
            BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + (bz + z) * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
        });
      }
    }
  }

  // Slab roof (80)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  // Courtyard: 6x4 walled yard attached on z-side (positive z side)
  const cyardW = 6;
  const cyardD = 4;
  const cyardHalfW = (cyardW * BLOCK_UNIT) / 2;
  const cyardStartZ = halfD; // starts right after main building

  // Courtyard slab floor
  for (let x = 0; x < cyardW; x++) {
    for (let z = 0; z < cyardD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - cyardHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z + cyardStartZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Courtyard perimeter walls (2-high)
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < cyardW; x++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - cyardHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + cyardStartZ + (cyardD - 1) * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
    for (let z = 0; z < cyardD - 1; z++) {
      for (const x of [0, cyardW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - cyardHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z + cyardStartZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  return slots;
}

function generateSphinxAvenueGateSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // Central pylon gate: 2 tapered towers (4x2 base, 4-high tapering)
  const towerBaseW = 4;
  const towerBaseD = 2;
  const towerH = 4;
  const towerSpacing = 6; // gap between towers in x

  for (const side of [-1, 1]) {
    const towerCX = offset.x + side * (towerSpacing / 2 + towerBaseW / 2) * BLOCK_UNIT;
    const towerHalfW = (towerBaseW * BLOCK_UNIT) / 2;
    const towerHalfD = (towerBaseD * BLOCK_UNIT) / 2;

    for (let y = 0; y < towerH; y++) {
      // Taper: reduce by 1 each side per 2 layers
      const shrink = Math.floor(y / 2);
      const curW = Math.max(towerBaseW - shrink, 2);
      const curD = Math.max(towerBaseD, 1);
      const curHalfW = (curW * BLOCK_UNIT) / 2;
      const curHalfD = (curD * BLOCK_UNIT) / 2;

      for (let x = 0; x < curW; x++) {
        for (let z = 0; z < curD; z++) {
          slots.push({
            position: new THREE.Vector3(
              towerCX - curHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              offset.z - curHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }
    }
  }

  // Slab lintel spanning between towers at top (y = towerH)
  const lintelW = towerSpacing + towerBaseW;
  const lintelHalfW = (lintelW * BLOCK_UNIT) / 2;
  for (let x = 0; x < lintelW; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - lintelHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
        towerH * BLOCK_UNIT + BLOCK_SIZE * 0.125,
        offset.z
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  // 2 sphinx pedestals flanking the gate road approach
  // Each pedestal: 4x2 base (slab) + 2x2x2 body + 1x1x2 head
  for (const side of [-1, 1]) {
    const pedCX = offset.x + side * 5 * BLOCK_UNIT;
    const pedCZ = offset.z + 6 * BLOCK_UNIT;

    // 4x2 base (slab)
    for (let x = 0; x < 4; x++) {
      for (let z = 0; z < 2; z++) {
        slots.push({
          position: new THREE.Vector3(
            pedCX - 2 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            BLOCK_SIZE * 0.125,
            pedCZ - BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }

    // 2x2x2 body
    for (let y = 0; y < 2; y++) {
      for (let x = 0; x < 2; x++) {
        for (let z = 0; z < 2; z++) {
          slots.push({
            position: new THREE.Vector3(
              pedCX - BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              pedCZ - BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
          });
        }
      }
    }

    // 1x1x2 head
    for (let y = 0; y < 2; y++) {
      slots.push({
        position: new THREE.Vector3(
          pedCX,
          2 * BLOCK_UNIT + y * BLOCK_UNIT + BLOCK_SIZE / 2,
          pedCZ
        ),
        placed: false,
        geometry: y === 1 ? 'half' : undefined,
      });
    }
  }

  // 4 cylinder flag poles 6-high
  const flagPolePositions = [
    { px: offset.x - 8 * BLOCK_UNIT, pz: offset.z - 4 * BLOCK_UNIT },
    { px: offset.x - 8 * BLOCK_UNIT, pz: offset.z + 4 * BLOCK_UNIT },
    { px: offset.x + 8 * BLOCK_UNIT, pz: offset.z - 4 * BLOCK_UNIT },
    { px: offset.x + 8 * BLOCK_UNIT, pz: offset.z + 4 * BLOCK_UNIT },
  ];
  for (const { px, pz } of flagPolePositions) {
    for (let y = 0; y < 6; y++) {
      slots.push({
        position: new THREE.Vector3(px, y * BLOCK_UNIT + BLOCK_SIZE / 2, pz),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }

  // Slab road approach (4x4 slabs leading toward gate)
  for (let x = 0; x < 4; x++) {
    for (let z = 0; z < 4; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - 2 * BLOCK_UNIT + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z + 3 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateSedFestivalPavilionSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const W = 12;
  const D = 10;
  const halfW = (W * BLOCK_UNIT) / 2;
  const halfD = (D * BLOCK_UNIT) / 2;

  // Slab floor (120)
  for (let x = 0; x < W; x++) {
    for (let z = 0; z < D; z++) {
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

  // Outer ring of fluted-cylinder columns: 16 columns, 3-high + lotus-capital
  // Placed along perimeter at x=1,3,5,7,9,11 front/back and z=1,3,5,7 sides
  const outerColPositions: { cx: number; cz: number }[] = [];
  for (const cz of [1, D - 2]) {
    for (let cx = 1; cx < W - 1; cx += 2) {
      outerColPositions.push({ cx, cz });
    }
  }
  for (const cx of [1, W - 2]) {
    for (let cz = 3; cz < D - 3; cz += 2) {
      outerColPositions.push({ cx, cz });
    }
  }

  for (const { cx, cz } of outerColPositions) {
    for (let y = 0; y < 3; y++) {
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
    // Lotus capital on top
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
        3 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + cz * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Inner ring of fluted-cylinder columns: 8 columns, 3-high + capital
  const innerColPositions: { cx: number; cz: number }[] = [];
  for (const cz of [3, D - 4]) {
    for (let cx = 3; cx < W - 3; cx += 3) {
      innerColPositions.push({ cx, cz });
    }
  }

  for (const { cx, cz } of innerColPositions) {
    for (let y = 0; y < 3; y++) {
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
        3 * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + cz * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Raised 4x3 throne dais 2-high (centered)
  const diaisW = 4;
  const diaisD = 3;
  const diaisHalfW = (diaisW * BLOCK_UNIT) / 2;
  const diaisHalfD = (diaisD * BLOCK_UNIT) / 2;
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < diaisW; x++) {
      for (let z = 0; z < diaisD; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - diaisHalfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - diaisHalfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Slab roof ring — outer edge (~44 slabs along perimeter)
  for (let x = 0; x < W; x++) {
    for (const z of [0, D - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          4 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }
  for (let z = 1; z < D - 1; z++) {
    for (const x of [0, W - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          4 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Wedge cornice blocks at roof corners
  const cornersXZ = [
    { cx: 0, cz: 0 },
    { cx: W - 1, cz: 0 },
    { cx: 0, cz: D - 1 },
    { cx: W - 1, cz: D - 1 },
  ];
  for (const { cx, cz } of cornersXZ) {
    for (let w = 0; w < 4; w++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
          4 * BLOCK_UNIT + w * BLOCK_UNIT * 0.25 + BLOCK_SIZE / 2,
          offset.z - halfD + cz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'wedge',
      });
    }
  }

  return slots;
}

function generateObservatorySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const baseSize = 6;
  const halfBase = (baseSize * BLOCK_UNIT) / 2;

  // 6x6 base platform (slab, 36)
  for (let x = 0; x < baseSize; x++) {
    for (let z = 0; z < baseSize; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfBase + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - halfBase + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Circular-approximated walls 8-high: 6x6 perimeter per level (~160 beveled-cube)
  const towerH = 8;
  for (let y = 0; y < towerH; y++) {
    // Front and back rows
    for (let x = 0; x < baseSize; x++) {
      for (const z of [0, baseSize - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfBase + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfBase + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    // Left and right columns (skip corners)
    for (let z = 1; z < baseSize - 1; z++) {
      for (const x of [0, baseSize - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfBase + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfBase + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Rooftop slab observation deck (36)
  for (let x = 0; x < baseSize; x++) {
    for (let z = 0; z < baseSize; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfBase + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          towerH * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - halfBase + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // 4 calibration obelisks at corners (cylinder, 5-high each = 20 total)
  const cornerOffsets = [
    { cx: -halfBase - BLOCK_UNIT, cz: -halfBase - BLOCK_UNIT },
    { cx: halfBase, cz: -halfBase - BLOCK_UNIT },
    { cx: -halfBase - BLOCK_UNIT, cz: halfBase },
    { cx: halfBase, cz: halfBase },
  ];
  for (const { cx, cz } of cornerOffsets) {
    for (let y = 0; y < 5; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x + cx + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + cz + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }

  // Staircase ramp interior: diagonal ascending slots inside (20)
  for (let s = 0; s < 5; s++) {
    for (let w = 0; w < 2; w++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfBase + (1 + w) * BLOCK_UNIT + BLOCK_UNIT / 2,
          s * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfBase + (1 + s) * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateAnimalNecropolisSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // 4x4 grid of vault chambers, each 2x2 base with 2-high walls + slab lid
  const gridSize = 4;
  const vaultSize = 2;
  const vaultSpacing = 3; // total cell pitch (2 vault + 1 path)
  const gridHalfW = (gridSize * vaultSpacing * BLOCK_UNIT) / 2;

  for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize; gz++) {
      const vaultCX = offset.x - gridHalfW + gx * vaultSpacing * BLOCK_UNIT + BLOCK_UNIT;
      const vaultCZ = offset.z - gridHalfW + gz * vaultSpacing * BLOCK_UNIT + BLOCK_UNIT;

      // 2x2 base (slab floor)
      for (let x = 0; x < vaultSize; x++) {
        for (let z = 0; z < vaultSize; z++) {
          slots.push({
            position: new THREE.Vector3(
              vaultCX + x * BLOCK_UNIT,
              BLOCK_SIZE * 0.125,
              vaultCZ + z * BLOCK_UNIT
            ),
            placed: false,
            geometry: 'slab',
          });
        }
      }

      // 2x2x2 walls (beveled-cube perimeter, 2-high)
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < vaultSize; x++) {
          for (const z of [0, vaultSize - 1]) {
            slots.push({
              position: new THREE.Vector3(
                vaultCX + x * BLOCK_UNIT,
                y * BLOCK_UNIT + BLOCK_SIZE / 2,
                vaultCZ + z * BLOCK_UNIT
              ),
              placed: false,
              geometry: 'beveled-cube',
            });
          }
        }
        for (const x of [0, vaultSize - 1]) {
          slots.push({
            position: new THREE.Vector3(
              vaultCX + x * BLOCK_UNIT,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              vaultCZ + BLOCK_UNIT
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }

      // Slab lid
      for (let x = 0; x < vaultSize; x++) {
        for (let z = 0; z < vaultSize; z++) {
          slots.push({
            position: new THREE.Vector3(
              vaultCX + x * BLOCK_UNIT,
              2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
              vaultCZ + z * BLOCK_UNIT
            ),
            placed: false,
            geometry: 'slab',
          });
        }
      }
    }
  }

  // Central shrine: 4x4 slab floor + 3-high walls + 4 cylinder jars + slab roof
  const shrineSize = 4;
  const shrineHalf = (shrineSize * BLOCK_UNIT) / 2;
  const shrineH = 3;

  // Slab floor (16)
  for (let x = 0; x < shrineSize; x++) {
    for (let z = 0; z < shrineSize; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - shrineHalf + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - shrineHalf + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Walls 3-high (perimeter beveled-cube)
  for (let y = 0; y < shrineH; y++) {
    for (let x = 0; x < shrineSize; x++) {
      for (const z of [0, shrineSize - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - shrineHalf + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - shrineHalf + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < shrineSize - 1; z++) {
      for (const x of [0, shrineSize - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - shrineHalf + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - shrineHalf + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 4 cylinder canopic jars inside shrine (at inner corners)
  const jarPositions = [
    { jx: 1, jz: 1 },
    { jx: 2, jz: 1 },
    { jx: 1, jz: 2 },
    { jx: 2, jz: 2 },
  ];
  for (const { jx, jz } of jarPositions) {
    for (let y = 0; y < 3; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - shrineHalf + jx * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - shrineHalf + jz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }

  // Slab roof (16)
  for (let x = 0; x < shrineSize; x++) {
    for (let z = 0; z < shrineSize; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - shrineHalf + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          shrineH * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - shrineHalf + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Walkways between vaults (slab paths ~60): horizontal and vertical grid lines
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gz = 0; gz < gridSize - 1; gz++) {
      const pathX = offset.x - gridHalfW + gx * vaultSpacing * BLOCK_UNIT + BLOCK_UNIT;
      const pathZ = offset.z - gridHalfW + gz * vaultSpacing * BLOCK_UNIT + (vaultSize + 0.5) * BLOCK_UNIT;
      for (let x = 0; x < vaultSize; x++) {
        slots.push({
          position: new THREE.Vector3(
            pathX + x * BLOCK_UNIT,
            BLOCK_SIZE * 0.125,
            pathZ
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }
  for (let gz = 0; gz < gridSize; gz++) {
    for (let gx = 0; gx < gridSize - 1; gx++) {
      const pathX = offset.x - gridHalfW + gx * vaultSpacing * BLOCK_UNIT + (vaultSize + 0.5) * BLOCK_UNIT;
      const pathZ = offset.z - gridHalfW + gz * vaultSpacing * BLOCK_UNIT + BLOCK_UNIT;
      for (let z = 0; z < vaultSize; z++) {
        slots.push({
          position: new THREE.Vector3(
            pathX,
            BLOCK_SIZE * 0.125,
            pathZ + z * BLOCK_UNIT
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }

  return slots;
}

function generatePriestsResidencesSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  // 6 houses in a 3x2 grid, each house is 4x3 footprint
  const houseW = 4;
  const houseD = 3;
  const cols = 3;
  const rows = 2;
  const houseSpacingX = (houseW + 1) * BLOCK_UNIT;
  const houseSpacingZ = (houseD + 1) * BLOCK_UNIT;
  const gridW = cols * houseSpacingX;
  const gridD = rows * houseSpacingZ;

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const hx = offset.x - gridW / 2 + col * houseSpacingX;
      const hz = offset.z - gridD / 2 + row * houseSpacingZ;

      // Slab floor (4x3 = 12 per house, 72 total)
      for (let x = 0; x < houseW; x++) {
        for (let z = 0; z < houseD; z++) {
          slots.push({
            position: new THREE.Vector3(
              hx + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              BLOCK_SIZE * 0.125,
              hz + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'slab',
          });
        }
      }

      // 2-high perimeter walls (beveled-cube)
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < houseW; x++) {
          for (const z of [0, houseD - 1]) {
            slots.push({
              position: new THREE.Vector3(
                hx + x * BLOCK_UNIT + BLOCK_UNIT / 2,
                y * BLOCK_UNIT + BLOCK_SIZE / 2,
                hz + z * BLOCK_UNIT + BLOCK_UNIT / 2
              ),
              placed: false,
              geometry: 'beveled-cube',
            });
          }
        }
        for (let z = 1; z < houseD - 1; z++) {
          for (const x of [0, houseW - 1]) {
            slots.push({
              position: new THREE.Vector3(
                hx + x * BLOCK_UNIT + BLOCK_UNIT / 2,
                y * BLOCK_UNIT + BLOCK_SIZE / 2,
                hz + z * BLOCK_UNIT + BLOCK_UNIT / 2
              ),
              placed: false,
              geometry: 'beveled-cube',
            });
          }
        }
      }

      // Slab roof (4x3 = 12 per house, 72 total)
      for (let x = 0; x < houseW; x++) {
        for (let z = 0; z < houseD; z++) {
          slots.push({
            position: new THREE.Vector3(
              hx + x * BLOCK_UNIT + BLOCK_UNIT / 2,
              2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
              hz + z * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'slab',
          });
        }
      }
    }
  }

  // Compound perimeter wall 2-high around all houses (~80 beveled-cube)
  const wallMinX = offset.x - gridW / 2 - BLOCK_UNIT;
  const wallMinZ = offset.z - gridD / 2 - BLOCK_UNIT;
  const wallMaxX = offset.x + gridW / 2 + BLOCK_UNIT;
  const wallMaxZ = offset.z + gridD / 2 + BLOCK_UNIT;
  const wallStepsX = Math.round((wallMaxX - wallMinX) / BLOCK_UNIT);
  const wallStepsZ = Math.round((wallMaxZ - wallMinZ) / BLOCK_UNIT);

  for (let y = 0; y < 2; y++) {
    for (let i = 0; i < wallStepsX; i++) {
      const wx = wallMinX + i * BLOCK_UNIT + BLOCK_UNIT / 2;
      for (const wz of [wallMinZ + BLOCK_UNIT / 2, wallMaxZ - BLOCK_UNIT / 2]) {
        slots.push({
          position: new THREE.Vector3(wx, y * BLOCK_UNIT + BLOCK_SIZE / 2, wz),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let i = 1; i < wallStepsZ - 1; i++) {
      const wz = wallMinZ + i * BLOCK_UNIT + BLOCK_UNIT / 2;
      for (const wx of [wallMinX + BLOCK_UNIT / 2, wallMaxX - BLOCK_UNIT / 2]) {
        slots.push({
          position: new THREE.Vector3(wx, y * BLOCK_UNIT + BLOCK_SIZE / 2, wz),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Central courtyard slab (3x4 strip between the two rows)
  const courtZ = offset.z - houseSpacingZ / 2;
  for (let x = 0; x < 3; x++) {
    for (let z = 0; z < 4; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - BLOCK_UNIT * 1.5 + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          courtZ + z * BLOCK_UNIT
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateStoneWharfSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const dockW = 20;
  const dockD = 4;
  const halfDockW = (dockW * BLOCK_UNIT) / 2;
  const halfDockD = (dockD * BLOCK_UNIT) / 2;

  // Dock slab floor (20x4 = 80)
  for (let x = 0; x < dockW; x++) {
    for (let z = 0; z < dockD; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfDockW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - halfDockD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Edge walls 1-high (perimeter of dock, ~44 beveled-cube)
  for (let x = 0; x < dockW; x++) {
    for (const z of [0, dockD - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfDockW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfDockD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }
  for (let z = 1; z < dockD - 1; z++) {
    for (const x of [0, dockW - 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfDockW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfDockD + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }

  // 6 cylinder crane posts 4-high (spaced along dock)
  const cranePositions = [3, 6, 9, 12, 15, 18];
  for (const cx of cranePositions) {
    for (let y = 0; y < 4; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfDockW + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }

  // Loading ramp 4x3 wedge
  for (let x = 0; x < 4; x++) {
    for (let z = 0; z < 3; z++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfDockW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE / 2,
          offset.z - halfDockD - (z + 1) * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'wedge',
      });
    }
  }

  // 3 mooring bollards (cylinder, 2-high)
  const bollardPositions = [4, 10, 16];
  for (const bx of bollardPositions) {
    for (let y = 0; y < 2; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfDockW + bx * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z + halfDockD + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }

  // Storage shed: 6x3, walls 2-high + slab roof (~48 total)
  const shedX = offset.x + halfDockW / 2 - 3 * BLOCK_UNIT;
  const shedZ = offset.z + halfDockD + 2 * BLOCK_UNIT;
  const shedW = 6;
  const shedD = 3;

  // Shed slab floor
  for (let x = 0; x < shedW; x++) {
    for (let z = 0; z < shedD; z++) {
      slots.push({
        position: new THREE.Vector3(
          shedX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          shedZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Shed walls 2-high
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < shedW; x++) {
      for (const z of [0, shedD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            shedX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            shedZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < shedD - 1; z++) {
      for (const x of [0, shedW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            shedX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            shedZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Shed slab roof
  for (let x = 0; x < shedW; x++) {
    for (let z = 0; z < shedD; z++) {
      slots.push({
        position: new THREE.Vector3(
          shedX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          shedZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateTempleOfHathorSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const templeW = 10;
  const templeD = 8;
  const halfW = (templeW * BLOCK_UNIT) / 2;
  const halfD = (templeD * BLOCK_UNIT) / 2;

  // Slab floor (10x8 = 80)
  for (let x = 0; x < templeW; x++) {
    for (let z = 0; z < templeD; z++) {
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

  // 3-high perimeter walls (beveled-cube, ~96)
  const wallH = 3;
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < templeW; x++) {
      for (const z of [0, templeD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < templeD - 1; z++) {
      for (const x of [0, templeW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 6 Hathor columns on facade: fluted-cylinder 4-high + lotus capital (5 slots each = 30)
  const facadeZ = offset.z - halfD + BLOCK_UNIT / 2;
  const colSpacing = (templeW * BLOCK_UNIT) / 7;
  for (let c = 1; c <= 6; c++) {
    const colX = offset.x - halfW + c * colSpacing;
    for (let y = 0; y < 4; y++) {
      slots.push({
        position: new THREE.Vector3(colX, y * BLOCK_UNIT + BLOCK_SIZE / 2, facadeZ),
        placed: false,
        geometry: 'fluted-cylinder',
      });
    }
    // Lotus capital on top
    slots.push({
      position: new THREE.Vector3(colX, 4 * BLOCK_UNIT + BLOCK_SIZE / 2, facadeZ),
      placed: false,
      geometry: 'lotus-capital',
    });
  }

  // Inner sanctuary 4x4 raised (2 levels of slab = 32)
  const sanctW = 4;
  const sanctHalf = (sanctW * BLOCK_UNIT) / 2;
  for (let level = 0; level < 2; level++) {
    for (let x = 0; x < sanctW; x++) {
      for (let z = 0; z < sanctW; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - sanctHalf + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            level * BLOCK_UNIT + BLOCK_SIZE * 0.125,
            offset.z - sanctHalf + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'slab',
        });
      }
    }
  }

  // Slab roof (10x8 = 80)
  for (let x = 0; x < templeW; x++) {
    for (let z = 0; z < templeD; z++) {
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

  // Rooftop shrine 3x3x3 (27)
  const shrineW = 3;
  const shrineHalf = (shrineW * BLOCK_UNIT) / 2;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < shrineW; x++) {
      for (let z = 0; z < shrineW; z++) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - shrineHalf + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            (wallH + 1) * BLOCK_UNIT + y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - shrineHalf + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'cube',
        });
      }
    }
  }

  // Entrance pylon: 2 towers, each 2x2x4 (48)
  const pylonY = offset.z + halfD;
  const pylonOffsets = [
    { px: offset.x - halfW + BLOCK_UNIT / 2, pz: pylonY },
    { px: offset.x + halfW - 2 * BLOCK_UNIT + BLOCK_UNIT / 2, pz: pylonY },
  ];
  for (const { px, pz } of pylonOffsets) {
    for (let y = 0; y < 4; y++) {
      for (let tx = 0; tx < 2; tx++) {
        for (let tz = 0; tz < 3; tz++) {
          slots.push({
            position: new THREE.Vector3(
              px + tx * BLOCK_UNIT,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              pz + tz * BLOCK_UNIT
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }
    }
  }

  // Wedge cornice along front facade (20)
  for (let x = 0; x < templeW; x++) {
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
        wallH * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z + halfD - BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'wedge',
    });
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
        wallH * BLOCK_UNIT + BLOCK_SIZE / 2,
        offset.z - halfD + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'wedge',
    });
  }

  return slots;
}

function generateWeavingMillSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const mainW = 8;
  const mainD = 8;
  const halfW = (mainW * BLOCK_UNIT) / 2;
  const halfD = (mainD * BLOCK_UNIT) / 2;

  // Main workshop slab floor (8x8 = 64)
  for (let x = 0; x < mainW; x++) {
    for (let z = 0; z < mainD; z++) {
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

  // 2-high perimeter walls (~56 beveled-cube)
  const wallH = 2;
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < mainW; x++) {
      for (const z of [0, mainD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < mainD - 1; z++) {
      for (const x of [0, mainW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 4 loom frame sets (cylinder uprights 2-high + slab crossbar = 3+3 = 6 each, 24 total)
  const loomPositions = [
    { lx: 2, lz: 2 },
    { lx: 5, lz: 2 },
    { lx: 2, lz: 5 },
    { lx: 5, lz: 5 },
  ];
  for (const { lx, lz } of loomPositions) {
    for (let y = 0; y < 2; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + lx * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + lz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + (lx + 1) * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + lz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
    // Slab crossbar atop the two uprights
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + lx * BLOCK_UNIT + BLOCK_UNIT,
        2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
        offset.z - halfD + lz * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'slab',
    });
    slots.push({
      position: new THREE.Vector3(
        offset.x - halfW + (lx + 1) * BLOCK_UNIT + BLOCK_UNIT / 2,
        2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
        offset.z - halfD + lz * BLOCK_UNIT + BLOCK_UNIT / 2
      ),
      placed: false,
      geometry: 'slab',
    });
  }

  // 3 dye vats (cylinder, 3-high each = 9)
  const vatPositions = [
    { vx: 3, vz: 4 },
    { vx: 4, vz: 4 },
    { vx: 5, vz: 4 },
  ];
  for (const { vx, vz } of vatPositions) {
    for (let y = 0; y < 3; y++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfW + vx * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - halfD + vz * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'cylinder',
      });
    }
  }

  // Slab roof for main workshop (8x8 = 64)
  for (let x = 0; x < mainW; x++) {
    for (let z = 0; z < mainD; z++) {
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

  // Storage wing 4x4 (attached to side of main workshop)
  const wingW = 4;
  const wingD = 4;
  const wingX = offset.x + halfW;
  const wingZ = offset.z - (wingD * BLOCK_UNIT) / 2;

  // Wing slab floor (16)
  for (let x = 0; x < wingW; x++) {
    for (let z = 0; z < wingD; z++) {
      slots.push({
        position: new THREE.Vector3(
          wingX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          wingZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Wing walls 2-high (~24)
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < wingW; x++) {
      for (const z of [0, wingD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            wingX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            wingZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < wingD - 1; z++) {
      slots.push({
        position: new THREE.Vector3(
          wingX + (wingW - 1) * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          wingZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'beveled-cube',
      });
    }
  }

  // Wing slab roof (16)
  for (let x = 0; x < wingW; x++) {
    for (let z = 0; z < wingD; z++) {
      slots.push({
        position: new THREE.Vector3(
          wingX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          wingZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateProcessionalWaySlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const roadLen = 30;
  const roadW = 3;
  const halfRoadW = (roadW * BLOCK_UNIT) / 2;
  const halfRoadLen = (roadLen * BLOCK_UNIT) / 2;

  // Slab floor 30x3 = 90
  for (let z = 0; z < roadLen; z++) {
    for (let x = 0; x < roadW; x++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfRoadW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          offset.z - halfRoadLen + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Flanking walls 2-high x 30-long on both sides (~120 beveled-cube)
  for (let z = 0; z < roadLen; z++) {
    for (let y = 0; y < 2; y++) {
      for (const xOff of [-BLOCK_UNIT / 2, roadW * BLOCK_UNIT - BLOCK_UNIT / 2]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfRoadW + xOff + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfRoadLen + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Slab capping on walls (60 total: 30 per side)
  for (let z = 0; z < roadLen; z++) {
    for (const xOff of [-BLOCK_UNIT / 2, roadW * BLOCK_UNIT - BLOCK_UNIT / 2]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfRoadW + xOff + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          offset.z - halfRoadLen + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // 6 shrine alcoves spaced along road (each 2x2x3 = 12, total 72)
  const shrineSpacing = Math.floor(roadLen / 7);
  for (let s = 0; s < 6; s++) {
    const shrineZ = offset.z - halfRoadLen + (s + 1) * shrineSpacing * BLOCK_UNIT;
    for (const shrineXOff of [-3, roadW]) {
      for (let y = 0; y < 3; y++) {
        for (let sx = 0; sx < 2; sx++) {
          slots.push({
            position: new THREE.Vector3(
              offset.x - halfRoadW + (shrineXOff + sx) * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              shrineZ
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }
    }
  }

  // Terminal gate pylon: 2 towers 4-high (32)
  const pylonZ = offset.z + halfRoadLen;
  const pylonOffsets = [
    { px: offset.x - halfRoadW - 2 * BLOCK_UNIT },
    { px: offset.x + halfRoadW },
  ];
  for (const { px } of pylonOffsets) {
    for (let y = 0; y < 4; y++) {
      for (let tx = 0; tx < 2; tx++) {
        for (let tz = 0; tz < 2; tz++) {
          slots.push({
            position: new THREE.Vector3(
              px + tx * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              pylonZ + tz * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }
    }
  }

  // 10 pairs of small sphinx pedestals (2 slab blocks each = 40)
  const pedestalSpacing = Math.floor(roadLen / 11);
  for (let p = 0; p < 10; p++) {
    const pedZ = offset.z - halfRoadLen + (p + 1) * pedestalSpacing * BLOCK_UNIT + BLOCK_UNIT / 2;
    for (const pedXOff of [-2, roadW + 1]) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfRoadW + pedXOff * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          pedZ
        ),
        placed: false,
        geometry: 'slab',
      });
      slots.push({
        position: new THREE.Vector3(
          offset.x - halfRoadW + pedXOff * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_UNIT + BLOCK_SIZE * 0.125,
          pedZ
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  return slots;
}

function generateMilitaryFortressSlots(offset: THREE.Vector3): BlockSlot[] {
  const slots: BlockSlot[] = [];

  const fortW = 14;
  const fortD = 14;
  const halfW = (fortW * BLOCK_UNIT) / 2;
  const halfD = (fortD * BLOCK_UNIT) / 2;

  // Slab floor (14x14 = 196)
  for (let x = 0; x < fortW; x++) {
    for (let z = 0; z < fortD; z++) {
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

  // Perimeter walls 4-high (~200 beveled-cube)
  const wallH = 4;
  for (let y = 0; y < wallH; y++) {
    for (let x = 0; x < fortW; x++) {
      for (const z of [0, fortD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < fortD - 1; z++) {
      for (const x of [0, fortW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            offset.x - halfW + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            offset.z - halfD + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // 4 corner towers 6-high (2x2 cross-section, extra 2 levels above wall = 4 towers * 2x2*2 = 64)
  const cornerTowerDefs = [
    { tx: -halfW, tz: -halfD },
    { tx: halfW - 2 * BLOCK_UNIT, tz: -halfD },
    { tx: -halfW, tz: halfD - 2 * BLOCK_UNIT },
    { tx: halfW - 2 * BLOCK_UNIT, tz: halfD - 2 * BLOCK_UNIT },
  ];
  for (const { tx, tz } of cornerTowerDefs) {
    // Extra 2 levels above the main wall height
    for (let y = wallH; y < wallH + 2; y++) {
      for (let cx = 0; cx < 2; cx++) {
        for (let cz = 0; cz < 2; cz++) {
          slots.push({
            position: new THREE.Vector3(
              offset.x + tx + cx * BLOCK_UNIT + BLOCK_UNIT / 2,
              y * BLOCK_UNIT + BLOCK_SIZE / 2,
              offset.z + tz + cz * BLOCK_UNIT + BLOCK_UNIT / 2
            ),
            placed: false,
            geometry: 'beveled-cube',
          });
        }
      }
    }
  }

  // Gatehouse 4x3x5 (36 blocks)
  const gateX = offset.x - 2 * BLOCK_UNIT;
  const gateZ = offset.z + halfD;
  for (let y = 0; y < 5; y++) {
    for (let gx = 0; gx < 4; gx++) {
      for (let gz = 0; gz < 3; gz++) {
        // Leave center gap open at ground level for entrance
        if (y < 2 && gx >= 1 && gx <= 2 && gz === 1) continue;
        slots.push({
          position: new THREE.Vector3(
            gateX + gx * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            gateZ + gz * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Inner barracks 8x4: floor + 2-high walls + roof (~80)
  const barracksW = 8;
  const barracksD = 4;
  const barracksX = offset.x - halfW + 2 * BLOCK_UNIT;
  const barracksZ = offset.z - halfD + 2 * BLOCK_UNIT;

  // Barracks slab floor
  for (let x = 0; x < barracksW; x++) {
    for (let z = 0; z < barracksD; z++) {
      slots.push({
        position: new THREE.Vector3(
          barracksX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          barracksZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Barracks walls 2-high
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < barracksW; x++) {
      for (const z of [0, barracksD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            barracksX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            barracksZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < barracksD - 1; z++) {
      for (const x of [0, barracksW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            barracksX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            barracksZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Barracks slab roof
  for (let x = 0; x < barracksW; x++) {
    for (let z = 0; z < barracksD; z++) {
      slots.push({
        position: new THREE.Vector3(
          barracksX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          barracksZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Parade ground slab (8x6 open area = 48)
  const paradeX = offset.x - halfW + 2 * BLOCK_UNIT;
  const paradeZ = offset.z + 1 * BLOCK_UNIT;
  for (let x = 0; x < 8; x++) {
    for (let z = 0; z < 6; z++) {
      slots.push({
        position: new THREE.Vector3(
          paradeX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          paradeZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Armory 4x4: floor + walls + roof (~56)
  const armoryW = 4;
  const armoryD = 4;
  const armoryX = offset.x + 3 * BLOCK_UNIT;
  const armoryZ = offset.z - halfD + 2 * BLOCK_UNIT;

  // Armory slab floor (16)
  for (let x = 0; x < armoryW; x++) {
    for (let z = 0; z < armoryD; z++) {
      slots.push({
        position: new THREE.Vector3(
          armoryX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          BLOCK_SIZE * 0.125,
          armoryZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
      });
    }
  }

  // Armory walls 2-high (~24)
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < armoryW; x++) {
      for (const z of [0, armoryD - 1]) {
        slots.push({
          position: new THREE.Vector3(
            armoryX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            armoryZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
    for (let z = 1; z < armoryD - 1; z++) {
      for (const x of [0, armoryW - 1]) {
        slots.push({
          position: new THREE.Vector3(
            armoryX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
            y * BLOCK_UNIT + BLOCK_SIZE / 2,
            armoryZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
          ),
          placed: false,
          geometry: 'beveled-cube',
        });
      }
    }
  }

  // Armory slab roof (16)
  for (let x = 0; x < armoryW; x++) {
    for (let z = 0; z < armoryD; z++) {
      slots.push({
        position: new THREE.Vector3(
          armoryX + x * BLOCK_UNIT + BLOCK_UNIT / 2,
          2 * BLOCK_UNIT + BLOCK_SIZE * 0.125,
          armoryZ + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
        geometry: 'slab',
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
    {
      id: 'royal-treasury',
      name: 'Royal Treasury',
      icon: '\u{1F48E}',
      worldOffset: new THREE.Vector3(-40, 0, 55),
      slots: generateRoyalTreasurySlots(new THREE.Vector3(-40, 0, 55)),
    },
    {
      id: 'great-quarry',
      name: 'The Great Quarry',
      icon: '\u{26CF}',
      worldOffset: new THREE.Vector3(-62, 0, -52),
      slots: generateGreatQuarrySlots(new THREE.Vector3(-62, 0, -52)),
    },
    {
      id: 'irrigation-canal',
      name: 'Irrigation Canal',
      icon: '\u{1F6BF}',
      worldOffset: new THREE.Vector3(0, 0, -65),
      slots: generateIrrigationCanalSlots(new THREE.Vector3(0, 0, -65)),
    },
    {
      id: 'cliff-temple',
      name: 'Cliff Temple',
      icon: '\u{1F3D4}',
      worldOffset: new THREE.Vector3(-80, 0, 50),
      slots: generateCliffTempleSlots(new THREE.Vector3(-80, 0, 50)),
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      icon: '\u{1F3EA}',
      worldOffset: new THREE.Vector3(55, 0, -75),
      slots: generateMarketplaceSlots(new THREE.Vector3(55, 0, -75)),
    },
    {
      id: 'sarcophagus-chamber',
      name: 'Sarcophagus Chamber',
      icon: '\u{26B0}',
      worldOffset: new THREE.Vector3(-55, 0, 70),
      slots: generateSarcophagusChamberSlots(new THREE.Vector3(-55, 0, 70)),
    },
    {
      id: 'lighthouse',
      name: 'Lighthouse of Pharos',
      icon: '\u{1F5FC}',
      worldOffset: new THREE.Vector3(75, 0, -85),
      slots: generateLighthouseSlots(new THREE.Vector3(75, 0, -85)),
    },
    {
      id: 'eternal-city',
      name: 'Eternal City',
      icon: '\u{1F451}',
      worldOffset: new THREE.Vector3(0, 0, 85),
      slots: generateEternalCitySlots(new THREE.Vector3(0, 0, 85)),
    },
    {
      id: 'abu-simbel',
      name: 'Great Temple of Abu Simbel',
      icon: '\u{1F3DB}',
      worldOffset: new THREE.Vector3(0, 0, -100),
      slots: generateAbuSimbelSlots(new THREE.Vector3(0, 0, -100)),
    },
    {
      id: 'embalmers-workshop',
      name: "Embalmer's Workshop",
      icon: '\u{1FA79}',
      worldOffset: new THREE.Vector3(-45, 0, 48),
      slots: generateEmbalmersWorkshopSlots(new THREE.Vector3(-45, 0, 48)),
    },
    {
      id: 'scribes-academy',
      name: "Scribes' Academy",
      icon: '\u{1F4DC}',
      worldOffset: new THREE.Vector3(55, 0, -40),
      slots: generateScribesAcademySlots(new THREE.Vector3(55, 0, -40)),
    },
    {
      id: 'nilometer',
      name: 'Nilometer',
      icon: '\u{1F4CF}',
      worldOffset: new THREE.Vector3(48, 0, 52),
      slots: generateNilometerSlots(new THREE.Vector3(48, 0, 52)),
    },
    {
      id: 'chariot-stable',
      name: 'Chariot Stable',
      icon: '\u{1F6F4}',
      worldOffset: new THREE.Vector3(-48, 0, -45),
      slots: generateChariotStableSlots(new THREE.Vector3(-48, 0, -45)),
    },
    {
      id: 'brewery-bakery',
      name: 'Brewery & Bakery',
      icon: '\u{1F37A}',
      worldOffset: new THREE.Vector3(60, 0, 25),
      slots: generateBreweryBakerySlots(new THREE.Vector3(60, 0, 25)),
    },
    {
      id: 'guard-barracks',
      name: 'Guard Barracks',
      icon: '\u{1F6E1}',
      worldOffset: new THREE.Vector3(-55, 0, -20),
      slots: generateGuardBarracksSlots(new THREE.Vector3(-55, 0, -20)),
    },
    {
      id: 'sphinx-avenue-gate',
      name: 'Sphinx Avenue Gate',
      icon: '\u{1F6AA}',
      worldOffset: new THREE.Vector3(0, 0, 42),
      slots: generateSphinxAvenueGateSlots(new THREE.Vector3(0, 0, 42)),
    },
    {
      id: 'sed-festival-pavilion',
      name: 'Sed Festival Pavilion',
      icon: '\u{1F3DB}',
      worldOffset: new THREE.Vector3(65, 0, -55),
      slots: generateSedFestivalPavilionSlots(new THREE.Vector3(65, 0, -55)),
    },
    {
      id: 'observatory',
      name: 'Observatory',
      icon: '\u{1F52D}',
      worldOffset: new THREE.Vector3(-65, 0, 35),
      slots: generateObservatorySlots(new THREE.Vector3(-65, 0, 35)),
    },
    {
      id: 'animal-necropolis',
      name: 'Animal Necropolis',
      icon: '\u{1F40F}',
      worldOffset: new THREE.Vector3(50, 0, -65),
      slots: generateAnimalNecropolisSlots(new THREE.Vector3(50, 0, -65)),
    },
    {
      id: 'priests-residences',
      name: "Priests' Residences",
      icon: '\u{1F6D5}',
      worldOffset: new THREE.Vector3(-75, 0, 55),
      slots: generatePriestsResidencesSlots(new THREE.Vector3(-75, 0, 55)),
    },
    {
      id: 'stone-wharf',
      name: 'Stone Wharf',
      icon: '\u{2693}',
      worldOffset: new THREE.Vector3(80, 0, 40),
      slots: generateStoneWharfSlots(new THREE.Vector3(80, 0, 40)),
    },
    {
      id: 'temple-of-hathor',
      name: 'Temple of Hathor',
      icon: '\u{1F4AB}',
      worldOffset: new THREE.Vector3(-80, 0, -40),
      slots: generateTempleOfHathorSlots(new THREE.Vector3(-80, 0, -40)),
    },
    {
      id: 'weaving-mill',
      name: 'Weaving Mill',
      icon: '\u{1F9F5}',
      worldOffset: new THREE.Vector3(75, 0, -50),
      slots: generateWeavingMillSlots(new THREE.Vector3(75, 0, -50)),
    },
    {
      id: 'processional-way',
      name: 'Processional Way',
      icon: '\u{1F6E3}',
      worldOffset: new THREE.Vector3(0, 0, -80),
      slots: generateProcessionalWaySlots(new THREE.Vector3(0, 0, -80)),
    },
    {
      id: 'military-fortress',
      name: 'Military Fortress',
      icon: '\u{1F3F0}',
      worldOffset: new THREE.Vector3(-90, 0, -65),
      slots: generateMilitaryFortressSlots(new THREE.Vector3(-90, 0, -65)),
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
