import * as THREE from 'three';
import { PyramidBuilder } from '../pyramid/PyramidBuilder.js';
import { getStructureRegistry, Structure, BlockSlot } from './StructureRegistry.js';
import { ERA_VISUALS, MilestoneBlockRange } from '../../shared/types.js';

const _tempMatrix = new THREE.Matrix4();
const _tempColor = new THREE.Color();

interface AnimatingBlock {
  structureIndex: number;
  meshInstanceIdx: number;
  eraIndex: number;
  target: THREE.Vector3;
  startY: number;
  progress: number;
  speed: number;
}

/**
 * Manages building across multiple structures.
 * Structure 0 is the main pyramid (delegated to PyramidBuilder).
 * Structures 1+ are from the StructureRegistry (obelisk, sphinx, etc.).
 */
export class BuildManager {
  private pyramid: PyramidBuilder;
  private structures: Structure[];
  private structureMeshes: Map<number, THREE.InstancedMesh[]> = new Map();
  private structureInstanceCounts: Map<number, number[]> = new Map();
  private structurePlacedCounts: Map<number, number> = new Map();
  private currentMilestoneIndex = 0;
  private scene: THREE.Scene;
  private pendingPlacements: { structureIndex: number; slotIndex: number }[] = [];
  private animatingBlocks: AnimatingBlock[] = [];
  private onBlockLandCallback: (() => void) | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pyramid = new PyramidBuilder(scene);
    this.structures = getStructureRegistry();

    // Pre-create InstancedMeshes for each structure
    const geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    for (let si = 0; si < this.structures.length; si++) {
      const structure = this.structures[si];
      const meshes: THREE.InstancedMesh[] = [];
      const counts: number[] = [];

      for (let ei = 0; ei < ERA_VISUALS.length; ei++) {
        const era = ERA_VISUALS[ei];
        const mat = new THREE.MeshStandardMaterial({
          roughness: era.roughness,
          metalness: era.metalness,
          emissive: new THREE.Color().setHSL(era.hue, era.saturation, era.lightness * 0.3),
          emissiveIntensity: era.emissiveIntensity,
        });
        const mesh = new THREE.InstancedMesh(geo, mat, structure.slots.length);
        mesh.count = 0;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        meshes.push(mesh);
        counts.push(0);
      }

      this.structureMeshes.set(si, meshes);
      this.structureInstanceCounts.set(si, counts);
      this.structurePlacedCounts.set(si, 0);
    }
  }

  get pyramidBuilder(): PyramidBuilder {
    return this.pyramid;
  }

  /** Total slots across pyramid + all structures */
  get totalSlots(): number {
    let total = this.pyramid.totalSlots;
    for (const s of this.structures) {
      total += s.slots.length;
    }
    return total;
  }

  /** Total blocks placed across pyramid + all structures */
  get totalPlacedCount(): number {
    let total = this.pyramid.currentPlacedCount;
    for (let si = 0; si < this.structures.length; si++) {
      total += this.structurePlacedCounts.get(si) || 0;
    }
    return total;
  }

  /** Name of the structure currently being built */
  get activeStructureName(): string {
    if (this.pyramid.currentPlacedCount < this.pyramid.totalSlots) {
      return 'Great Pyramid';
    }
    for (let si = 0; si < this.structures.length; si++) {
      const placed = this.structurePlacedCounts.get(si) || 0;
      if (placed < this.structures[si].slots.length) {
        return this.structures[si].name;
      }
    }
    return 'Complete';
  }

  /** Icon of the structure currently being built */
  get activeStructureIcon(): string {
    if (this.pyramid.currentPlacedCount < this.pyramid.totalSlots) {
      return '\u{1F3DB}';
    }
    for (let si = 0; si < this.structures.length; si++) {
      const placed = this.structurePlacedCounts.get(si) || 0;
      if (placed < this.structures[si].slots.length) {
        return this.structures[si].icon;
      }
    }
    return '\u{2705}';
  }

  /** Blocks placed in the currently active structure / total for that structure */
  get activeStructureProgress(): { placed: number; total: number } {
    if (this.pyramid.currentPlacedCount < this.pyramid.totalSlots) {
      return { placed: this.pyramid.currentPlacedCount, total: this.pyramid.totalSlots };
    }
    for (let si = 0; si < this.structures.length; si++) {
      const placed = this.structurePlacedCounts.get(si) || 0;
      if (placed < this.structures[si].slots.length) {
        return { placed, total: this.structures[si].slots.length };
      }
    }
    return { placed: this.totalPlacedCount, total: this.totalSlots };
  }

  onBlockLand(callback: () => void): void {
    this.onBlockLandCallback = callback;
    this.pyramid.onBlockLand(callback);
  }

  restoreBlocks(count: number, milestoneBlockRanges: MilestoneBlockRange[]): void {
    const pyramidCapacity = this.pyramid.totalSlots;

    // Fill pyramid first
    const pyramidBlocks = Math.min(count, pyramidCapacity);
    this.pyramid.restoreBlocks(pyramidBlocks, milestoneBlockRanges);

    // Overflow goes to subsequent structures
    let remaining = count - pyramidCapacity;
    if (remaining <= 0) return;

    for (let si = 0; si < this.structures.length; si++) {
      const structure = this.structures[si];
      const toPlace = Math.min(remaining, structure.slots.length);
      const eraIndex = this.getEraForOverflowBlock(pyramidCapacity, si, milestoneBlockRanges);

      for (let i = 0; i < toPlace; i++) {
        this.placeStructureBlockInstant(si, i, eraIndex);
      }
      remaining -= toPlace;
      if (remaining <= 0) break;
    }
  }

  private getEraForOverflowBlock(pyramidCapacity: number, structureIndex: number, ranges: MilestoneBlockRange[]): number {
    // Calculate global block index for the start of this structure
    let globalStart = pyramidCapacity;
    for (let i = 0; i < structureIndex; i++) {
      globalStart += this.structures[i].slots.length;
    }

    for (const range of ranges) {
      if (globalStart >= range.startBlock && globalStart < range.endBlock) {
        return range.milestoneIndex;
      }
    }
    return this.currentMilestoneIndex;
  }

  private placeStructureBlockInstant(structureIndex: number, slotIndex: number, eraIndex: number): void {
    const structure = this.structures[structureIndex];
    const slot = structure.slots[slotIndex];
    if (slot.placed) return;
    slot.placed = true;

    const meshes = this.structureMeshes.get(structureIndex)!;
    const counts = this.structureInstanceCounts.get(structureIndex)!;
    const era = Math.min(eraIndex, meshes.length - 1);
    const mesh = meshes[era];
    const instanceIdx = counts[era];

    _tempMatrix.makeTranslation(slot.position.x, slot.position.y, slot.position.z);
    mesh.setMatrixAt(instanceIdx, _tempMatrix);
    mesh.setColorAt(instanceIdx, this.randomBlockColor(era));

    counts[era]++;
    mesh.count = counts[era];
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.structurePlacedCounts.set(structureIndex, (this.structurePlacedCounts.get(structureIndex) || 0) + 1);
  }

  queueBlocks(targetTotal: number, milestoneIndex?: number): void {
    if (milestoneIndex !== undefined) {
      this.currentMilestoneIndex = milestoneIndex;
    }

    const pyramidCapacity = this.pyramid.totalSlots;

    // Queue blocks for pyramid first
    if (targetTotal <= pyramidCapacity) {
      this.pyramid.queueBlocks(targetTotal, milestoneIndex);
      return;
    }

    // Fill the pyramid completely
    this.pyramid.queueBlocks(pyramidCapacity, milestoneIndex);

    // Queue overflow blocks for structures
    let overflow = targetTotal - pyramidCapacity;
    const alreadyQueued = this.pendingPlacements.length;
    let alreadyPlacedInStructures = 0;
    for (let si = 0; si < this.structures.length; si++) {
      alreadyPlacedInStructures += this.structurePlacedCounts.get(si) || 0;
    }

    let targetStructureBlocks = overflow;
    let currentStructureBlocks = alreadyPlacedInStructures + alreadyQueued;

    if (targetStructureBlocks <= currentStructureBlocks) return;

    // Figure out which structure(s) need blocks
    let blocksToQueue = targetStructureBlocks - currentStructureBlocks;
    let runningTotal = 0;

    // Pre-compute pending counts per structure to avoid O(n) filter
    const pendingByStructure = new Map<number, number>();
    for (const p of this.pendingPlacements) {
      pendingByStructure.set(p.structureIndex, (pendingByStructure.get(p.structureIndex) ?? 0) + 1);
    }

    for (let si = 0; si < this.structures.length && blocksToQueue > 0; si++) {
      const structure = this.structures[si];
      const placed = this.structurePlacedCounts.get(si) || 0;
      const pendingForThis = pendingByStructure.get(si) ?? 0;
      const available = structure.slots.length - placed - pendingForThis;

      if (available <= 0) {
        runningTotal += structure.slots.length;
        continue;
      }

      const toQueue = Math.min(blocksToQueue, available);
      for (let i = 0; i < toQueue; i++) {
        const slotIndex = placed + pendingForThis + i;
        this.pendingPlacements.push({ structureIndex: si, slotIndex });
      }
      blocksToQueue -= toQueue;
      runningTotal += structure.slots.length;
    }
  }

  update(delta: number): void {
    this.pyramid.update(delta);

    // Process pending structure placements
    if (this.pendingPlacements.length > 0 && this.animatingBlocks.length < 3) {
      const pending = this.pendingPlacements.shift()!;
      this.startStructureBlockAnimation(pending.structureIndex, pending.slotIndex);
    }

    // Animate structure blocks
    for (let i = this.animatingBlocks.length - 1; i >= 0; i--) {
      const anim = this.animatingBlocks[i];
      const meshes = this.structureMeshes.get(anim.structureIndex)!;
      const mesh = meshes[anim.eraIndex];
      anim.progress += delta * anim.speed;

      if (anim.progress >= 1) {
        _tempMatrix.makeTranslation(anim.target.x, anim.target.y, anim.target.z);
        mesh.setMatrixAt(anim.meshInstanceIdx, _tempMatrix);
        mesh.instanceMatrix.needsUpdate = true;
        // Swap-and-pop for O(1) removal
        const lastIdx = this.animatingBlocks.length - 1;
        if (i !== lastIdx) {
          this.animatingBlocks[i] = this.animatingBlocks[lastIdx];
        }
        this.animatingBlocks.pop();
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

  private startStructureBlockAnimation(structureIndex: number, slotIndex: number): void {
    const structure = this.structures[structureIndex];
    if (slotIndex >= structure.slots.length) return;
    const slot = structure.slots[slotIndex];
    if (slot.placed) return;
    slot.placed = true;

    const meshes = this.structureMeshes.get(structureIndex)!;
    const counts = this.structureInstanceCounts.get(structureIndex)!;
    const era = Math.min(this.currentMilestoneIndex, meshes.length - 1);
    const mesh = meshes[era];
    const instanceIdx = counts[era];
    const startY = slot.position.y + 15;
    const color = this.randomBlockColor(era);

    _tempMatrix.makeTranslation(slot.position.x, startY, slot.position.z);
    mesh.setMatrixAt(instanceIdx, _tempMatrix);
    mesh.setColorAt(instanceIdx, color);

    counts[era]++;
    mesh.count = counts[era];
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.structurePlacedCounts.set(structureIndex, (this.structurePlacedCounts.get(structureIndex) || 0) + 1);

    this.animatingBlocks.push({
      structureIndex,
      meshInstanceIdx: instanceIdx,
      eraIndex: era,
      target: slot.position.clone(),
      startY,
      progress: 0,
      speed: 1.5,
    });
  }

  private randomBlockColor(eraIndex: number): THREE.Color {
    const era = ERA_VISUALS[eraIndex];
    const hue = era.hue + (Math.random() - 0.5) * era.hueRange;
    const sat = era.saturation + (Math.random() - 0.5) * era.saturationRange;
    const light = era.lightness + (Math.random() - 0.5) * era.lightnessRange;
    return _tempColor.setHSL(hue, sat, light);
  }

  getNextBlockPosition(): THREE.Vector3 | null {
    // Check pyramid first
    const pyramidPos = this.pyramid.getNextBlockPosition();
    if (pyramidPos) return pyramidPos;

    // Check structures
    for (let si = 0; si < this.structures.length; si++) {
      const placed = this.structurePlacedCounts.get(si) || 0;
      if (placed < this.structures[si].slots.length) {
        return this.structures[si].slots[placed].position.clone();
      }
    }
    return null;
  }
}
