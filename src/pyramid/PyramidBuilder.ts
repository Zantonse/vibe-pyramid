import * as THREE from 'three';
import { ERA_VISUALS, MilestoneBlockRange } from '../../shared/types.js';

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
  slotIndex: number;
  eraIndex: number;
  meshInstanceIdx: number;
  target: THREE.Vector3;
  startY: number;
  progress: number;
  speed: number;
  color: THREE.Color;
}

const _tempMatrix = new THREE.Matrix4();
const _tempColor = new THREE.Color();

export class PyramidBuilder {
  private eraMeshes: THREE.InstancedMesh[] = [];
  private eraInstanceCounts: number[] = [];
  private currentMilestoneIndex = 0;
  private slots: BlockSlot[] = [];
  private placedCount = 0;
  private animatingBlocks: AnimatingBlock[] = [];
  private pendingPlacements: number[] = [];
  private onBlockLandCallback: (() => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.generateSlots();

    const geo = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

    for (let i = 0; i < ERA_VISUALS.length; i++) {
      const era = ERA_VISUALS[i];
      const mat = new THREE.MeshStandardMaterial({
        roughness: era.roughness,
        metalness: era.metalness,
        emissive: new THREE.Color().setHSL(era.hue, era.saturation, era.lightness * 0.3),
        emissiveIntensity: era.emissiveIntensity,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, this.slots.length);
      mesh.count = 0;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      this.eraMeshes.push(mesh);
      this.eraInstanceCounts.push(0);
    }
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

  restoreBlocks(count: number, milestoneBlockRanges: MilestoneBlockRange[]): void {
    const toPlace = Math.min(count, this.slots.length);
    for (let i = this.placedCount; i < toPlace; i++) {
      const era = this.getEraForBlock(i, milestoneBlockRanges);
      this.placeBlockInstant(i, era);
    }
  }

  private getEraForBlock(blockIndex: number, ranges: MilestoneBlockRange[]): number {
    for (const range of ranges) {
      if (blockIndex >= range.startBlock && blockIndex < range.endBlock) {
        return range.milestoneIndex;
      }
    }
    // Fallback: use current milestone
    return this.currentMilestoneIndex;
  }

  private placeBlockInstant(index: number, eraIndex: number): void {
    const slot = this.slots[index];
    if (slot.placed) return;
    slot.placed = true;

    const era = Math.min(eraIndex, this.eraMeshes.length - 1);
    const mesh = this.eraMeshes[era];
    const instanceIdx = this.eraInstanceCounts[era];

    _tempMatrix.makeTranslation(slot.position.x, slot.position.y, slot.position.z);
    mesh.setMatrixAt(instanceIdx, _tempMatrix);
    mesh.setColorAt(instanceIdx, this.randomBlockColor(era));

    this.eraInstanceCounts[era]++;
    mesh.count = this.eraInstanceCounts[era];
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.placedCount++;
  }

  private randomBlockColor(eraIndex: number): THREE.Color {
    const era = ERA_VISUALS[eraIndex];
    const hue = era.hue + (Math.random() - 0.5) * era.hueRange;
    const sat = era.saturation + (Math.random() - 0.5) * era.saturationRange;
    const light = era.lightness + (Math.random() - 0.5) * era.lightnessRange;
    return _tempColor.setHSL(hue, sat, light);
  }

  queueBlocks(targetTotal: number, milestoneIndex?: number): void {
    if (milestoneIndex !== undefined) {
      this.currentMilestoneIndex = milestoneIndex;
    }

    while (this.placedCount + this.pendingPlacements.length < targetTotal
           && this.placedCount + this.pendingPlacements.length < this.slots.length) {
      const nextIndex = this.placedCount + this.pendingPlacements.length;
      this.pendingPlacements.push(nextIndex);
    }

    // Safety cap: never exceed slot count
    while (this.placedCount + this.pendingPlacements.length > this.slots.length && this.pendingPlacements.length > 0) {
      this.pendingPlacements.pop();
    }
  }

  update(delta: number): void {
    if (this.pendingPlacements.length > 0 && this.animatingBlocks.length < 5) {
      const index = this.pendingPlacements.shift()!;
      this.startBlockAnimation(index);
    }

    for (let i = this.animatingBlocks.length - 1; i >= 0; i--) {
      const anim = this.animatingBlocks[i];
      const mesh = this.eraMeshes[anim.eraIndex];
      anim.progress += delta * anim.speed;

      if (anim.progress >= 1) {
        _tempMatrix.makeTranslation(anim.target.x, anim.target.y, anim.target.z);
        mesh.setMatrixAt(anim.meshInstanceIdx, _tempMatrix);
        mesh.instanceMatrix.needsUpdate = true;
        this.animatingBlocks.splice(i, 1);
        if (this.onBlockLandCallback) this.onBlockLandCallback();
        continue;
      }

      const t = anim.progress;
      const eased = 1 - Math.pow(1 - t, 3);
      const bounceY = t > 0.8 ? Math.sin((t - 0.8) * 25) * 0.1 * (1 - t) : 0;
      const y = anim.startY + (anim.target.y - anim.startY) * eased + bounceY;

      _tempMatrix.makeTranslation(anim.target.x, y, anim.target.z);
      mesh.setMatrixAt(anim.meshInstanceIdx, _tempMatrix);
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  private startBlockAnimation(index: number): void {
    if (index >= this.slots.length) return;
    const slot = this.slots[index];
    if (slot.placed) return;
    slot.placed = true;

    const era = Math.min(this.currentMilestoneIndex, this.eraMeshes.length - 1);
    const mesh = this.eraMeshes[era];
    const instanceIdx = this.eraInstanceCounts[era];
    const startY = slot.position.y + 15;
    const color = this.randomBlockColor(era);

    _tempMatrix.makeTranslation(slot.position.x, startY, slot.position.z);
    mesh.setMatrixAt(instanceIdx, _tempMatrix);
    mesh.setColorAt(instanceIdx, color);

    this.eraInstanceCounts[era]++;
    mesh.count = this.eraInstanceCounts[era];
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.placedCount++;

    this.animatingBlocks.push({
      slotIndex: index,
      eraIndex: era,
      meshInstanceIdx: instanceIdx,
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
