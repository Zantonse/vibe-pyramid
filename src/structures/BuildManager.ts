import * as THREE from 'three';
import { PyramidBuilder } from '../pyramid/PyramidBuilder.js';
import { getStructureRegistry, Structure, BlockSlot, BlockGeometry } from './StructureRegistry.js';
import { ERA_VISUALS, MilestoneBlockRange } from '../../shared/types.js';
import { TextureFactory, StoneType } from '../effects/TextureFactory.js';

const _tempMatrix = new THREE.Matrix4();
const _tempColor = new THREE.Color();

const GEOMETRY_CACHE: Map<string, THREE.BufferGeometry> = new Map();

function getBlockGeometry(type: BlockGeometry = 'cube'): THREE.BufferGeometry {
  const cached = GEOMETRY_CACHE.get(type);
  if (cached) return cached;

  let geo: THREE.BufferGeometry;
  switch (type) {
    case 'cylinder':
      geo = new THREE.CylinderGeometry(0.45, 0.45, 1.0, 8);
      break;
    case 'wedge': {
      // Triangular prism: full bottom, sloped from left-top to right-bottom
      geo = new THREE.BufferGeometry();
      const verts = new Float32Array([
        // Front face (triangle)
        -0.5, -0.5, 0.5,   0.5, -0.5, 0.5,   -0.5, 0.5, 0.5,
        // Back face (triangle)
        0.5, -0.5, -0.5,   -0.5, -0.5, -0.5,   -0.5, 0.5, -0.5,
        // Bottom face (quad as 2 tris)
        -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,   0.5, -0.5, 0.5,   -0.5, -0.5, 0.5,
        // Slope face (quad as 2 tris) — from left-top to right-bottom
        -0.5, 0.5, -0.5,   -0.5, 0.5, 0.5,   0.5, -0.5, 0.5,
        -0.5, 0.5, -0.5,   0.5, -0.5, 0.5,   0.5, -0.5, -0.5,
        // Left face (quad as 2 tris)
        -0.5, -0.5, -0.5,   -0.5, -0.5, 0.5,   -0.5, 0.5, 0.5,
        -0.5, -0.5, -0.5,   -0.5, 0.5, 0.5,   -0.5, 0.5, -0.5,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
      const uvs = new Float32Array([
        // Front face triangle
        0, 0,  1, 0,  0, 1,
        // Back face triangle
        1, 0,  0, 0,  0, 1,
        // Bottom face (2 tris)
        0, 0,  1, 0,  1, 1,
        0, 0,  1, 1,  0, 1,
        // Slope face (2 tris)
        0, 1,  0, 0,  1, 0,
        0, 1,  1, 0,  1, 1,
        // Left face (2 tris)
        0, 0,  1, 0,  1, 1,
        0, 0,  1, 1,  0, 1,
      ]);
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.computeVertexNormals();
      break;
    }
    case 'half':
      geo = new THREE.BoxGeometry(1.0, 0.5, 1.0);
      break;
    case 'capital':
      geo = new THREE.CylinderGeometry(0.6, 0.45, 0.4, 8);
      break;
    case 'slab':
      geo = new THREE.BoxGeometry(1.0, 0.25, 1.0);
      break;
    case 'fluted-cylinder': {
      const points: THREE.Vector2[] = [];
      points.push(new THREE.Vector2(0.38, -0.5));
      points.push(new THREE.Vector2(0.45, -0.45));
      points.push(new THREE.Vector2(0.45, 0.45));
      points.push(new THREE.Vector2(0.38, 0.5));
      geo = new THREE.LatheGeometry(points, 12);
      break;
    }
    case 'beveled-cube': {
      geo = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
      const pos = geo.attributes.position;
      const bevel = 0.06;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
        const cornerDist = (ax > 0.4 ? 1 : 0) + (ay > 0.4 ? 1 : 0) + (az > 0.4 ? 1 : 0);
        if (cornerDist >= 2) {
          pos.setXYZ(i,
            x - Math.sign(x) * bevel * (ax > 0.4 ? 1 : 0),
            y - Math.sign(y) * bevel * (ay > 0.4 ? 1 : 0),
            z - Math.sign(z) * bevel * (az > 0.4 ? 1 : 0),
          );
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
      break;
    }
    case 'lotus-capital': {
      const profile: THREE.Vector2[] = [];
      const steps = 8;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const r = 0.3 + 0.35 * Math.pow(t, 0.5) - (t > 0.85 ? (t - 0.85) * 0.5 : 0);
        const y = -0.2 + t * 0.4;
        profile.push(new THREE.Vector2(r, y));
      }
      geo = new THREE.LatheGeometry(profile, 12);
      break;
    }
    case 'cube':
    default:
      geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      break;
  }
  applyVertexAO(geo);
  GEOMETRY_CACHE.set(type, geo);
  return geo;
}

function applyVertexAO(geo: THREE.BufferGeometry): void {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const normal = geo.attributes.normal;
    const ny = normal ? normal.getY(i) : 0;

    // Base brightness: slightly darker at bottom of block
    const yNorm = (y + 0.5); // 0 at bottom, 1 at top
    let brightness = 0.85 + yNorm * 0.15; // 0.85 at bottom, 1.0 at top

    // Darken downward-facing normals (undersides)
    if (ny < -0.5) {
      brightness *= 0.7;
    }

    // Slight darkening on side faces near the bottom
    if (Math.abs(ny) < 0.5 && yNorm < 0.3) {
      brightness *= 0.9;
    }

    colors[i * 3] = brightness;
    colors[i * 3 + 1] = brightness;
    colors[i * 3 + 2] = brightness;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

interface AnimatingBlock {
  structureIndex: number;
  meshInstanceIdx: number;
  eraIndex: number;
  geoType: BlockGeometry;
  meshKey: string; // cached key to avoid per-frame string allocation
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
  // Key format: "${structureIndex}-${geoType}-${eraIndex}" — lazily created
  private structureMeshes: Map<string, THREE.InstancedMesh> = new Map();
  private structureInstanceCounts: Map<string, number> = new Map();
  private structurePlacedCounts: Map<number, number> = new Map();
  // Pre-computed slot capacities per (structureIndex, geoType)
  private geoSlotCapacities: Map<string, number> = new Map();
  // Shared material pool: one material per era (not per structure)
  private eraMaterials: THREE.MeshStandardMaterial[] = [];
  private currentMilestoneIndex = 0;
  private scene: THREE.Scene;
  private pendingPlacements: { structureIndex: number; slotIndex: number }[] = [];
  private animatingBlocks: AnimatingBlock[] = [];
  private onBlockLandCallback: (() => void) | null = null;
  private onStructureStartCallbacks: ((id: string, offset: THREE.Vector3) => void)[] = [];

  onStructureStart(cb: (id: string, offset: THREE.Vector3) => void): void {
    this.onStructureStartCallbacks.push(cb);
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pyramid = new PyramidBuilder(scene);
    this.structures = getStructureRegistry();

    // Create shared material pool (36 materials instead of ~2800)
    for (let ei = 0; ei < ERA_VISUALS.length; ei++) {
      const era = ERA_VISUALS[ei];
      const stoneType: StoneType = ei < 9 ? 'sandstone' : ei < 18 ? 'limestone' : 'granite';
      // Normal map only (no diffuse .map) to avoid triple multiplication darkening:
      // instance_color × texture_rgb × vertex_ao would compound and over-darken.
      // The normal map provides stone surface detail; instance color provides era tint.
      this.eraMaterials.push(new THREE.MeshStandardMaterial({
        roughness: ei < 6 ? Math.max(era.roughness, 0.75) : era.roughness,
        metalness: era.metalness,
        emissive: new THREE.Color().setHSL(era.hue, era.saturation, era.lightness * 0.3),
        emissiveIntensity: era.emissiveIntensity,
        normalMap: TextureFactory.getNormalMap(stoneType),
        normalScale: new THREE.Vector2(0.4, 0.4),
        vertexColors: true,
      }));
    }

    // Pre-compute slot capacities per (structure, geoType) for lazy mesh creation
    for (let si = 0; si < this.structures.length; si++) {
      const structure = this.structures[si];
      const counts = new Map<string, number>();
      for (const slot of structure.slots) {
        const gt = slot.geometry || 'cube';
        counts.set(gt, (counts.get(gt) || 0) + 1);
      }
      for (const [gt, count] of counts) {
        this.geoSlotCapacities.set(`${si}-${gt}`, count);
      }
      this.structurePlacedCounts.set(si, 0);
    }
    // Meshes are NOT created here — they're created lazily on first block placement
  }

  /** Get or create an InstancedMesh for the given (structure, geoType, era) combo */
  private getOrCreateMesh(structureIndex: number, geoType: BlockGeometry, eraIndex: number): THREE.InstancedMesh {
    const key = `${structureIndex}-${geoType}-${eraIndex}`;
    const existing = this.structureMeshes.get(key);
    if (existing) return existing;

    const geo = getBlockGeometry(geoType);
    const mat = this.eraMaterials[Math.min(eraIndex, this.eraMaterials.length - 1)];
    const capacity = this.geoSlotCapacities.get(`${structureIndex}-${geoType}`) || 1;
    const mesh = new THREE.InstancedMesh(geo, mat, capacity);
    mesh.count = 0;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    this.structureMeshes.set(key, mesh);
    this.structureInstanceCounts.set(key, 0);
    return mesh;
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

    const geoType: BlockGeometry = slot.geometry || 'cube';
    const era = Math.min(eraIndex, ERA_VISUALS.length - 1);
    const mesh = this.getOrCreateMesh(structureIndex, geoType, era);
    const key = `${structureIndex}-${geoType}-${era}`;
    const instanceIdx = this.structureInstanceCounts.get(key)!;

    _tempMatrix.makeTranslation(slot.position.x, slot.position.y, slot.position.z);
    mesh.setMatrixAt(instanceIdx, _tempMatrix);
    mesh.setColorAt(instanceIdx, this.randomBlockColor(era, geoType));

    this.structureInstanceCounts.set(key, instanceIdx + 1);
    mesh.count = instanceIdx + 1;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.structurePlacedCounts.set(structureIndex, (this.structurePlacedCounts.get(structureIndex) || 0) + 1);
    if ((this.structurePlacedCounts.get(structureIndex) || 0) === 1) {
      for (const cb of this.onStructureStartCallbacks) {
        cb(structure.id, structure.worldOffset);
      }
    }
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
      const mesh = this.structureMeshes.get(anim.meshKey)!;
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

    const geoType: BlockGeometry = slot.geometry || 'cube';
    const era = Math.min(this.currentMilestoneIndex, ERA_VISUALS.length - 1);
    const mesh = this.getOrCreateMesh(structureIndex, geoType, era);
    const key = `${structureIndex}-${geoType}-${era}`;
    const instanceIdx = this.structureInstanceCounts.get(key)!;
    const startY = slot.position.y + 15;
    const color = this.randomBlockColor(era, geoType);

    _tempMatrix.makeTranslation(slot.position.x, startY, slot.position.z);
    mesh.setMatrixAt(instanceIdx, _tempMatrix);
    mesh.setColorAt(instanceIdx, color);

    this.structureInstanceCounts.set(key, instanceIdx + 1);
    mesh.count = instanceIdx + 1;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    this.structurePlacedCounts.set(structureIndex, (this.structurePlacedCounts.get(structureIndex) || 0) + 1);
    if ((this.structurePlacedCounts.get(structureIndex) || 0) === 1) {
      for (const cb of this.onStructureStartCallbacks) {
        cb(structure.id, structure.worldOffset);
      }
    }

    // Cache the mesh key to avoid string allocation in update loop
    const meshKey = key;
    this.animatingBlocks.push({
      structureIndex,
      meshInstanceIdx: instanceIdx,
      eraIndex: era,
      geoType,
      target: slot.position.clone(),
      startY,
      progress: 0,
      speed: 1.5,
      meshKey,
    });
  }

  private randomBlockColor(eraIndex: number, geoType: BlockGeometry = 'cube'): THREE.Color {
    const era = ERA_VISUALS[eraIndex];
    let hue = era.hue + (Math.random() - 0.5) * era.hueRange;
    let sat = era.saturation + (Math.random() - 0.5) * era.saturationRange;
    let light = era.lightness + (Math.random() - 0.5) * era.lightnessRange;

    // Sand accumulation: horizontal surfaces on early eras get warmer, lighter
    if (eraIndex < 12 && (geoType === 'slab' || geoType === 'half')) {
      hue = hue * 0.7 + 0.08 * 0.3;
      sat *= 0.6;
      light = light * 0.8 + 0.75 * 0.2;
    }

    // Edge wear on beveled cubes: slightly lighter overall
    if (geoType === 'beveled-cube') {
      light += 0.03;
    }

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
