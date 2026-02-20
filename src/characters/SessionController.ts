import * as THREE from 'three';
import type { CharacterModel, AnimationName } from './CharacterModel.js';
import type { WorkerActivity } from '../../shared/types.js';

const WORKER_SPEED = 4.0; // units per second
const PHARAOH_SPEED = 3.5;
const ARRIVAL_THRESHOLD = 0.5; // distance to consider "arrived"
const PHARAOH_FOLLOW_DISTANCE = 2.5; // how far pharaoh trails behind worker

/** Key locations in the scene */
const QUARRY_CENTER = new THREE.Vector3(-20, 0, 10);
const PYRAMID_CENTER = new THREE.Vector3(0, 0, 0);

/** Get a target position based on the worker activity */
function getActivityTarget(activity: WorkerActivity, sessionIndex: number): THREE.Vector3 {
  // Spread sessions along a curved path from quarry toward pyramid
  // Each session gets a unique "lane" offset perpendicular to the quarry-pyramid axis
  const clampedIndex = sessionIndex % 6; // wrap after 6 sessions to keep visible
  const laneOffset = (clampedIndex - 2.5) * 5; // 5 units apart, centered

  switch (activity) {
    case 'carry':
      return new THREE.Vector3(-8, 0, laneOffset);
    case 'chisel':
      return new THREE.Vector3(-6, 0, -3 + laneOffset);
    case 'survey':
      return new THREE.Vector3(-14, 0, 4 + laneOffset);
    case 'antenna':
      return new THREE.Vector3(-5, 0, 12 + laneOffset);
    case 'portal':
      return new THREE.Vector3(-18, 0, laneOffset);
    case 'idle':
    default:
      // Return to quarry area
      return new THREE.Vector3(QUARRY_CENTER.x + clampedIndex * 3, 0, QUARRY_CENTER.z + laneOffset);
  }
}

type MovePhase = 'idle' | 'moving_to_target' | 'working';

export class SessionController {
  worker: CharacterModel;
  pharaoh: CharacterModel;
  sessionIndex: number;

  private workerTarget: THREE.Vector3;
  private workerPhase: MovePhase = 'idle';
  private currentActivity: WorkerActivity = 'idle';
  private pendingActivity: AnimationName = 'idle';
  private workTimer = 0;
  private workDuration = 3; // seconds to "work" at destination before going idle
  private idleRoamTimer = 0;
  private idleRoamInterval = 4; // seconds between autonomous roams

  constructor(worker: CharacterModel, pharaoh: CharacterModel, sessionIndex: number) {
    this.worker = worker;
    this.pharaoh = pharaoh;
    this.sessionIndex = sessionIndex;

    // Initial positions near quarry
    const startPos = getActivityTarget('idle', sessionIndex);
    this.workerTarget = startPos.clone();
    this.worker.setPosition(startPos);
    this.pharaoh.setPosition(startPos.clone().add(new THREE.Vector3(-PHARAOH_FOLLOW_DISTANCE, 0, 0)));
    this.pharaoh.lookAt(startPos);
  }

  /** Trigger a new activity — sets a target and starts movement */
  setActivity(activity: WorkerActivity): void {
    this.currentActivity = activity;
    this.workerTarget = getActivityTarget(activity, this.sessionIndex);
    this.workerPhase = 'moving_to_target';
    this.workTimer = 0;

    // Map activity to the animation that plays at the destination
    const activityAnimMap: Record<WorkerActivity, AnimationName> = {
      survey: 'survey',
      carry: 'carry',
      chisel: 'chisel',
      antenna: 'antenna',
      portal: 'portal',
      idle: 'idle',
    };
    this.pendingActivity = activityAnimMap[activity];

    // While moving, always play walk (or carry if hauling a block)
    if (activity === 'carry') {
      this.worker.playAnimation('carry');
    } else {
      this.worker.playAnimation('walk');
    }

    // Pharaoh walks too
    this.pharaoh.playAnimation('walk');
  }

  /** Called every frame */
  update(delta: number): void {
    switch (this.workerPhase) {
      case 'moving_to_target':
        this.updateMovement(delta);
        break;
      case 'working':
        this.updateWorking(delta);
        break;
      case 'idle':
        this.updateIdleRoam(delta);
        break;
    }

    // Always update the pharaoh to trail the worker
    this.updatePharaohFollow(delta);
  }

  private updateMovement(delta: number): void {
    const workerPos = this.worker.mesh.position;
    const direction = new THREE.Vector3().subVectors(this.workerTarget, workerPos);
    direction.y = 0; // Keep on ground plane
    const distance = direction.length();

    if (distance < ARRIVAL_THRESHOLD) {
      // Arrived at target
      this.workerPhase = 'working';
      this.workTimer = 0;
      this.worker.playAnimation(this.pendingActivity);

      // Pharaoh cracks whip when worker starts working
      this.pharaoh.playAnimation('whip');
      return;
    }

    // Move toward target
    direction.normalize();
    const moveDistance = Math.min(WORKER_SPEED * delta, distance);
    workerPos.add(direction.multiplyScalar(moveDistance));
    this.worker.setPosition(workerPos);
    this.worker.lookAt(this.workerTarget);
  }

  private updateWorking(delta: number): void {
    this.workTimer += delta;
    if (this.workTimer >= this.workDuration) {
      // Done working, go idle back at quarry
      this.workerPhase = 'idle';
      this.currentActivity = 'idle';
      this.worker.playAnimation('idle');
      this.pharaoh.playAnimation('idle');
    }
  }

  private updateIdleRoam(delta: number): void {
    this.idleRoamTimer += delta;
    if (this.idleRoamTimer >= this.idleRoamInterval) {
      this.idleRoamTimer = 0;
      // Randomize next roam interval (3-7 seconds)
      this.idleRoamInterval = 3 + Math.random() * 4;

      // Pick a random point near the current position (within 8-15 units)
      const workerPos = this.worker.mesh.position;
      const angle = Math.random() * Math.PI * 2;
      const dist = 8 + Math.random() * 7;
      this.workerTarget = new THREE.Vector3(
        workerPos.x + Math.cos(angle) * dist,
        0,
        workerPos.z + Math.sin(angle) * dist,
      );

      // Clamp to a reasonable area around the build site
      this.workerTarget.x = Math.max(-30, Math.min(30, this.workerTarget.x));
      this.workerTarget.z = Math.max(-20, Math.min(25, this.workerTarget.z));

      this.workerPhase = 'moving_to_target';
      this.pendingActivity = 'idle';
      this.worker.playAnimation('walk');
      this.pharaoh.playAnimation('walk');
    }
  }

  private updatePharaohFollow(delta: number): void {
    const workerPos = this.worker.mesh.position;
    const pharaohPos = this.pharaoh.mesh.position;

    // Target is behind the worker
    const toWorker = new THREE.Vector3().subVectors(workerPos, pharaohPos);
    toWorker.y = 0;
    const dist = toWorker.length();

    if (dist > PHARAOH_FOLLOW_DISTANCE * 1.5) {
      // Too far — move toward worker
      toWorker.normalize();
      const moveDistance = Math.min(PHARAOH_SPEED * delta, dist - PHARAOH_FOLLOW_DISTANCE);
      pharaohPos.add(toWorker.multiplyScalar(Math.max(0, moveDistance)));
      this.pharaoh.setPosition(pharaohPos);
    }

    // Always face the worker
    this.pharaoh.lookAt(workerPos);
  }
}
