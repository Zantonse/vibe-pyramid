import * as THREE from 'three';

const BLOCK_SIZE = 1.0;
const BLOCK_GAP = 0.05;
const BLOCK_UNIT = BLOCK_SIZE + BLOCK_GAP;
const BASE_SIZE = 20;
const LAYER_STEP = 2;

interface BlockSlot {
  layer: number;
  row: number;
  col: number;
  position: THREE.Vector3;
  placed: boolean;
}

interface AnimatingBlock {
  mesh: THREE.Mesh;
  target: THREE.Vector3;
  startY: number;
  progress: number;
  speed: number;
}

export class PyramidBuilder {
  private group: THREE.Group;
  private slots: BlockSlot[] = [];
  private placedCount = 0;
  private animatingBlocks: AnimatingBlock[] = [];
  private pendingPlacements: number[] = [];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.generateSlots();
  }

  private generateSlots(): void {
    let layerIndex = 0;
    for (let size = BASE_SIZE; size >= 2; size -= LAYER_STEP) {
      const yOffset = layerIndex * BLOCK_UNIT;
      const halfExtent = (size * BLOCK_UNIT) / 2;

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const x = -halfExtent + col * BLOCK_UNIT + BLOCK_UNIT / 2;
          const z = -halfExtent + row * BLOCK_UNIT + BLOCK_UNIT / 2;
          const y = yOffset + BLOCK_SIZE / 2;

          this.slots.push({
            layer: layerIndex,
            row,
            col,
            position: new THREE.Vector3(x, y, z),
            placed: false,
          });
        }
      }
      layerIndex++;
    }
  }

  get totalSlots(): number {
    return this.slots.length;
  }

  get currentPlacedCount(): number {
    return this.placedCount;
  }

  restoreBlocks(count: number): void {
    const toPlace = Math.min(count, this.slots.length);
    for (let i = 0; i < toPlace; i++) {
      if (!this.slots[i].placed) {
        this.placeBlockInstant(i);
      }
    }
  }

  private placeBlockInstant(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;

    const mesh = this.createBlockMesh();
    mesh.position.copy(slot.position);
    this.group.add(mesh);
    slot.placed = true;
    this.placedCount++;
  }

  queueBlocks(targetTotal: number): void {
    while (this.placedCount + this.pendingPlacements.length < targetTotal
           && this.placedCount + this.pendingPlacements.length < this.slots.length) {
      const nextIndex = this.placedCount + this.pendingPlacements.length;
      this.pendingPlacements.push(nextIndex);
    }
  }

  update(delta: number): void {
    if (this.pendingPlacements.length > 0 && this.animatingBlocks.length < 5) {
      const index = this.pendingPlacements.shift()!;
      this.startBlockAnimation(index);
    }

    for (let i = this.animatingBlocks.length - 1; i >= 0; i--) {
      const anim = this.animatingBlocks[i];
      anim.progress += delta * anim.speed;

      if (anim.progress >= 1) {
        anim.mesh.position.copy(anim.target);
        anim.mesh.material = this.createBlockMaterial();
        this.animatingBlocks.splice(i, 1);
        continue;
      }

      const t = anim.progress;
      const eased = 1 - Math.pow(1 - t, 3);
      const bounceY = t > 0.8 ? Math.sin((t - 0.8) * 25) * 0.1 * (1 - t) : 0;

      const y = anim.startY + (anim.target.y - anim.startY) * eased + bounceY;
      anim.mesh.position.set(anim.target.x, y, anim.target.z);
    }
  }

  private startBlockAnimation(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;

    const mesh = this.createBlockMesh(0.7);
    const startY = slot.position.y + 15;
    mesh.position.set(slot.position.x, startY, slot.position.z);
    this.group.add(mesh);

    slot.placed = true;
    this.placedCount++;

    this.animatingBlocks.push({
      mesh,
      target: slot.position.clone(),
      startY,
      progress: 0,
      speed: 1.5,
    });
  }

  private createBlockMesh(opacity = 1): THREE.Mesh {
    const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const mat = this.createBlockMaterial(opacity);
    const mesh = new THREE.Mesh(geo, mat);

    const edges = new THREE.EdgesGeometry(geo);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8d6e3d, linewidth: 1 }));
    mesh.add(line);

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  private createBlockMaterial(opacity = 1): THREE.MeshLambertMaterial {
    const hue = 0.08 + Math.random() * 0.04;
    const sat = 0.3 + Math.random() * 0.2;
    const light = 0.6 + Math.random() * 0.15;
    const color = new THREE.Color().setHSL(hue, sat, light);

    return new THREE.MeshLambertMaterial({
      color,
      transparent: opacity < 1,
      opacity,
    });
  }

  getNextBlockPosition(): THREE.Vector3 | null {
    const nextIndex = this.placedCount;
    if (nextIndex >= this.slots.length) return null;
    return this.slots[nextIndex].position.clone();
  }
}
