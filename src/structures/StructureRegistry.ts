import * as THREE from 'three';

const BLOCK_SIZE = 1.0;
const BLOCK_GAP = 0.05;
const BLOCK_UNIT = BLOCK_SIZE + BLOCK_GAP;

export interface BlockSlot {
  position: THREE.Vector3;
  placed: boolean;
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
      // Left paw
      slots.push({
        position: new THREE.Vector3(
          offset.x - 2 * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - 5 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
      // Right paw
      slots.push({
        position: new THREE.Vector3(
          offset.x + 1 * BLOCK_UNIT + BLOCK_UNIT / 2,
          y * BLOCK_UNIT + BLOCK_SIZE / 2,
          offset.z - 5 * BLOCK_UNIT + z * BLOCK_UNIT + BLOCK_UNIT / 2
        ),
        placed: false,
      });
    }
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

      // 2x2 base, 6 blocks tall
      for (let y = 0; y < 6; y++) {
        for (let bx = 0; bx < 2; bx++) {
          for (let bz = 0; bz < 2; bz++) {
            slots.push({
              position: new THREE.Vector3(
                x + (bx - 0.5) * BLOCK_UNIT,
                y * BLOCK_UNIT + BLOCK_SIZE / 2,
                z + (bz - 0.5) * BLOCK_UNIT
              ),
              placed: false,
            });
          }
        }
      }
    }
  }

  // Lintel beams connecting column tops
  for (let col = 0; col < columnCount; col++) {
    const z = offset.z + col * spacing;
    for (let bx = 0; bx < 5; bx++) {
      slots.push({
        position: new THREE.Vector3(
          offset.x - rowSpacing / 2 + bx * BLOCK_UNIT,
          6 * BLOCK_UNIT + BLOCK_SIZE / 2,
          z
        ),
        placed: false,
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
      worldOffset: new THREE.Vector3(-20, 0, 8),
      slots: generateSmallPyramidSlots(new THREE.Vector3(-20, 0, 8)),
    },
    {
      id: 'boat',
      name: 'Solar Barque',
      icon: '\u{26F5}',
      worldOffset: new THREE.Vector3(22, 0, -8),
      slots: generateBoatSlots(new THREE.Vector3(22, 0, -8)),
    },
  ];
}
