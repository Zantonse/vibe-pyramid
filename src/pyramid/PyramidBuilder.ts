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
  isEdge: boolean;
}

interface AnimatingBlock {
  index: number;
  target: THREE.Vector3;
  startY: number;
  progress: number;
  speed: number;
  color: THREE.Color;
}

const _tempMatrix = new THREE.Matrix4();
const _tempColor = new THREE.Color();

export class PyramidBuilder {
  private instancedMesh: THREE.InstancedMesh;
  private slots: BlockSlot[] = [];
  private placedCount = 0;
  private visibleCount = 0;
  private animatingBlocks: AnimatingBlock[] = [];
  private pendingPlacements: number[] = [];
  private onBlockLandCallback: (() => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.generateSlots();

    const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    const mat = new THREE.MeshLambertMaterial();
    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.slots.length);
    this.instancedMesh.count = 0;
    this.instancedMesh.castShadow = true;
    this.instancedMesh.receiveShadow = true;
    scene.add(this.instancedMesh);
  }

  private generateSlots(): void {
    const layers: BlockSlot[][] = [];
    let layerIndex = 0;
    for (let size = BASE_SIZE; size >= 2; size -= LAYER_STEP) {
      const yOffset = layerIndex * BLOCK_UNIT;
      const halfExtent = (size * BLOCK_UNIT) / 2;
      const layer: BlockSlot[] = [];

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          const x = -halfExtent + col * BLOCK_UNIT + BLOCK_UNIT / 2;
          const z = -halfExtent + row * BLOCK_UNIT + BLOCK_UNIT / 2;
          const y = yOffset + BLOCK_SIZE / 2;
          const isEdge = row === 0 || row === size - 1 || col === 0 || col === size - 1;

          layer.push({
            layer: layerIndex,
            row,
            col,
            position: new THREE.Vector3(x, y, z),
            placed: false,
            isEdge,
          });
        }
      }
      layers.push(layer);
      layerIndex++;
    }

    // Sort each layer: edges first, then interior, both shuffled
    for (const layer of layers) {
      const edges = layer.filter(s => s.isEdge).sort(() => Math.random() - 0.5);
      const interior = layer.filter(s => !s.isEdge).sort(() => Math.random() - 0.5);
      layer.length = 0;
      layer.push(...edges, ...interior);
    }

    // Round-robin across layers, weighted toward lower layers
    const cursors = layers.map(() => 0);
    const totalBlocks = layers.reduce((sum, l) => sum + l.length, 0);

    while (this.slots.length < totalBlocks) {
      for (let li = 0; li < layers.length; li++) {
        if (cursors[li] >= layers[li].length) continue;
        const blocksPerRound = Math.max(1, Math.ceil(layers[li].length / layers[0].length * 8));
        for (let b = 0; b < blocksPerRound && cursors[li] < layers[li].length; b++) {
          this.slots.push(layers[li][cursors[li]]);
          cursors[li]++;
        }
      }
    }
  }

  get totalSlots(): number {
    return this.slots.length;
  }

  get currentPlacedCount(): number {
    return this.placedCount;
  }

  onBlockLand(callback: () => void): void {
    this.onBlockLandCallback = callback;
  }

  restoreBlocks(count: number): void {
    const toPlace = Math.min(count, this.slots.length);
    for (let i = this.placedCount; i < toPlace; i++) {
      this.placeBlockInstant(i);
    }
  }

  private placeBlockInstant(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;
    slot.placed = true;

    const instanceIdx = this.visibleCount;
    _tempMatrix.makeTranslation(slot.position.x, slot.position.y, slot.position.z);
    this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
    this.instancedMesh.setColorAt(instanceIdx, this.randomBlockColor());

    this.visibleCount++;
    this.placedCount++;
    this.instancedMesh.count = this.visibleCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;
  }

  private randomBlockColor(): THREE.Color {
    const hue = 0.08 + Math.random() * 0.04;
    const sat = 0.3 + Math.random() * 0.2;
    const light = 0.6 + Math.random() * 0.15;
    return _tempColor.setHSL(hue, sat, light);
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

      const instanceIdx = anim.index;

      if (anim.progress >= 1) {
        _tempMatrix.makeTranslation(anim.target.x, anim.target.y, anim.target.z);
        this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.animatingBlocks.splice(i, 1);
        if (this.onBlockLandCallback) this.onBlockLandCallback();
        continue;
      }

      const t = anim.progress;
      const eased = 1 - Math.pow(1 - t, 3);
      const bounceY = t > 0.8 ? Math.sin((t - 0.8) * 25) * 0.1 * (1 - t) : 0;
      const y = anim.startY + (anim.target.y - anim.startY) * eased + bounceY;

      _tempMatrix.makeTranslation(anim.target.x, y, anim.target.z);
      this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  private startBlockAnimation(index: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;
    slot.placed = true;

    const instanceIdx = this.visibleCount;
    const startY = slot.position.y + 15;
    const color = this.randomBlockColor();

    _tempMatrix.makeTranslation(slot.position.x, startY, slot.position.z);
    this.instancedMesh.setMatrixAt(instanceIdx, _tempMatrix);
    this.instancedMesh.setColorAt(instanceIdx, color);

    this.visibleCount++;
    this.placedCount++;
    this.instancedMesh.count = this.visibleCount;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) this.instancedMesh.instanceColor.needsUpdate = true;

    this.animatingBlocks.push({
      index: instanceIdx,
      target: slot.position.clone(),
      startY,
      progress: 0,
      speed: 1.5,
      color,
    });
  }

  getNextBlockPosition(): THREE.Vector3 | null {
    const nextIndex = this.placedCount;
    if (nextIndex >= this.slots.length) return null;
    return this.slots[nextIndex].position.clone();
  }
}
