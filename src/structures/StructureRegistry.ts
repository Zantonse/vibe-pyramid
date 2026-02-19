import * as THREE from 'three';

const BLOCK_SIZE = 1.0;
const BLOCK_GAP = 0.05;
const BLOCK_UNIT = BLOCK_SIZE + BLOCK_GAP;

export type BlockGeometry = 'cube' | 'cylinder' | 'wedge' | 'half' | 'capital' | 'slab';

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
          geometry: 'cylinder',
        });
      }

      // Capital on top
      slots.push({
        position: new THREE.Vector3(x, 5 * BLOCK_UNIT + 0.2, z),
        placed: false,
        geometry: 'capital',
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
        geometry: 'cylinder',
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
      geometry: 'capital',
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

/** Ordered registry of all buildable structures after the main pyramid */
export function getStructureRegistry(): Structure[] {
  return [
    {
      id: 'obelisk',
      name: 'Obelisk',
      icon: '\u{1F5FC}',
      worldOffset: new THREE.Vector3(18, 0, 15),
      slots: generateObeliskSlots(new THREE.Vector3(18, 0, 15)),
    },
    {
      id: 'sphinx',
      name: 'Sphinx',
      icon: '\u{1F981}',
      worldOffset: new THREE.Vector3(0, 0, 22),
      slots: generateSphinxSlots(new THREE.Vector3(0, 0, 22)),
    },
    {
      id: 'colonnade',
      name: 'Colonnade',
      icon: '\u{1F6E4}',
      worldOffset: new THREE.Vector3(0, 0, 14),
      slots: generateColonnadeSlots(new THREE.Vector3(0, 0, 14)),
    },
    {
      id: 'small-pyramid',
      name: 'Queen\'s Pyramid',
      icon: '\u{1F53A}',
      worldOffset: new THREE.Vector3(-20, 0, -8),
      slots: generateSmallPyramidSlots(new THREE.Vector3(-20, 0, -8)),
    },
    {
      id: 'boat',
      name: 'Solar Barque',
      icon: '\u{26F5}',
      worldOffset: new THREE.Vector3(22, 0, -8),
      slots: generateBoatSlots(new THREE.Vector3(22, 0, -8)),
    },
    {
      id: 'step-pyramid',
      name: 'Step Pyramid of Djoser',
      icon: '\u{1F3DB}',
      worldOffset: new THREE.Vector3(-35, 0, -25),
      slots: generateStepPyramidSlots(new THREE.Vector3(-35, 0, -25)),
    },
    {
      id: 'temple',
      name: 'Mortuary Temple',
      icon: '\u{26E9}',
      worldOffset: new THREE.Vector3(15, 0, -25),
      slots: generateTempleSlots(new THREE.Vector3(15, 0, -25)),
    },
    {
      id: 'mastaba',
      name: 'Mastaba Tomb',
      icon: '\u{1F3DA}',
      worldOffset: new THREE.Vector3(-15, 0, -20),
      slots: generateMastabaSlots(new THREE.Vector3(-15, 0, -20)),
    },
    {
      id: 'pylon-gate',
      name: 'Pylon Gate',
      icon: '\u{1F3EF}',
      worldOffset: new THREE.Vector3(0, 0, -18),
      slots: generatePylonGateSlots(new THREE.Vector3(0, 0, -18)),
    },
  ];
}
