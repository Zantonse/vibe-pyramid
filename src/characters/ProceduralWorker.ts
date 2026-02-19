import * as THREE from 'three';
import { CharacterModel, AnimationName } from './CharacterModel.js';

const skinMat = new THREE.MeshStandardMaterial({ color: 0xb07850, roughness: 0.8, metalness: 0.0 });
const clothMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.75, metalness: 0.0 });
const headwrapMat = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.7, metalness: 0.0 });
const sandalMat = new THREE.MeshStandardMaterial({ color: 0x6b4a20, roughness: 0.85, metalness: 0.0 });

export class ProceduralWorker implements CharacterModel {
  mesh: THREE.Group;
  private currentAnimation: AnimationName = 'idle';
  private animTime = 0;

  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private prop: THREE.Group;

  constructor() {
    this.mesh = new THREE.Group();

    // Torso — slightly tapered box
    const torsoGeo = new THREE.BoxGeometry(0.6, 0.7, 0.35);
    this.body = new THREE.Mesh(torsoGeo, skinMat);
    this.body.position.y = 1.2;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    // Head — sphere
    const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 1.8;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    // Headwrap — slightly larger sphere wrapping top of head
    const headwrapGeo = new THREE.SphereGeometry(0.24, 8, 4, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const headwrap = new THREE.Mesh(headwrapGeo, headwrapMat);
    headwrap.position.y = 1.82;
    this.mesh.add(headwrap);

    // Headwrap tail — small trailing cloth
    const tailGeo = new THREE.BoxGeometry(0.08, 0.2, 0.04);
    const wrapTail = new THREE.Mesh(tailGeo, headwrapMat);
    wrapTail.position.set(0, 1.7, -0.2);
    wrapTail.rotation.x = 0.3;
    this.mesh.add(wrapTail);

    // Eyes — small dark dots
    for (const side of [-1, 1]) {
      const eyeGeo = new THREE.SphereGeometry(0.03, 4, 4);
      const eye = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ color: 0x201008, roughness: 0.3 }));
      eye.position.set(side * 0.08, 1.82, 0.18);
      this.mesh.add(eye);
    }

    // Cloth skirt (waist)
    const clothGeo = new THREE.BoxGeometry(0.65, 0.35, 0.4);
    const cloth = new THREE.Mesh(clothGeo, clothMat);
    cloth.position.y = 0.75;
    cloth.castShadow = true;
    this.mesh.add(cloth);

    // Belt/sash
    const beltGeo = new THREE.BoxGeometry(0.68, 0.06, 0.42);
    const belt = new THREE.Mesh(beltGeo, sandalMat);
    belt.position.y = 0.9;
    this.mesh.add(belt);

    // Arms with hands
    this.leftArm = this.createArm();
    this.leftArm.position.set(-0.4, 1.3, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = this.createArm();
    this.rightArm.position.set(0.4, 1.3, 0);
    this.mesh.add(this.rightArm);

    // Legs with feet
    this.leftLeg = this.createLeg();
    this.leftLeg.position.set(-0.15, 0.5, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = this.createLeg();
    this.rightLeg.position.set(0.15, 0.5, 0);
    this.mesh.add(this.rightLeg);

    this.prop = new THREE.Group();
    this.mesh.add(this.prop);
  }

  private createArm(): THREE.Group {
    const group = new THREE.Group();

    // Upper arm
    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.35, 6);
    const arm = new THREE.Mesh(armGeo, skinMat);
    arm.position.y = -0.18;
    arm.castShadow = true;
    group.add(arm);

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.065, 0.06, 0.3, 6);
    const forearm = new THREE.Mesh(forearmGeo, skinMat);
    forearm.position.y = -0.42;
    forearm.castShadow = true;
    group.add(forearm);

    // Hand — small sphere
    const handGeo = new THREE.SphereGeometry(0.06, 5, 5);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.y = -0.58;
    group.add(hand);

    return group;
  }

  private createLeg(): THREE.Group {
    const group = new THREE.Group();

    // Upper leg
    const legGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.35, 6);
    const leg = new THREE.Mesh(legGeo, skinMat);
    leg.position.y = -0.18;
    leg.castShadow = true;
    group.add(leg);

    // Lower leg
    const lowerGeo = new THREE.CylinderGeometry(0.065, 0.055, 0.3, 6);
    const lower = new THREE.Mesh(lowerGeo, skinMat);
    lower.position.y = -0.42;
    lower.castShadow = true;
    group.add(lower);

    // Foot/sandal — flat box
    const footGeo = new THREE.BoxGeometry(0.1, 0.04, 0.16);
    const foot = new THREE.Mesh(footGeo, sandalMat);
    foot.position.set(0, -0.57, 0.03);
    group.add(foot);

    return group;
  }

  playAnimation(name: AnimationName): void {
    if (this.currentAnimation === name) return;
    this.currentAnimation = name;
    this.animTime = 0;
    this.updateProp(name);
  }

  private updateProp(activity: AnimationName): void {
    while (this.prop.children.length > 0) {
      this.prop.remove(this.prop.children[0]);
    }

    if (activity === 'survey') {
      const scrollGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6);
      const scroll = new THREE.Mesh(scrollGeo, new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.6 }));
      scroll.rotation.z = Math.PI / 4;
      scroll.position.set(0.5, 1.4, 0.2);
      this.prop.add(scroll);
    } else if (activity === 'carry') {
      const blockGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
      const block = new THREE.Mesh(blockGeo, new THREE.MeshStandardMaterial({ color: 0xc4a56a, roughness: 0.7 }));
      block.position.set(0, 2.1, 0);
      block.castShadow = true;
      this.prop.add(block);
    } else if (activity === 'chisel') {
      const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
      const handle = new THREE.Mesh(handleGeo, new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 }));
      handle.position.set(0.5, 1.2, 0.2);
      handle.rotation.z = -Math.PI / 3;
      this.prop.add(handle);

      const hammerHeadGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
      const hammerHead = new THREE.Mesh(hammerHeadGeo, new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.4, metalness: 0.3 }));
      hammerHead.position.set(0.6, 1.35, 0.2);
      this.prop.add(hammerHead);
    } else if (activity === 'antenna') {
      const staffGeo = new THREE.CylinderGeometry(0.02, 0.025, 1.5, 6);
      const staff = new THREE.Mesh(staffGeo, new THREE.MeshStandardMaterial({ color: 0xdaa520, roughness: 0.4, metalness: 0.3 }));
      staff.position.set(0.4, 1.5, 0);
      this.prop.add(staff);

      const eyeGeo = new THREE.TorusGeometry(0.08, 0.02, 6, 8);
      const eye = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.3, metalness: 0.2 }));
      eye.position.set(0.4, 2.3, 0);
      this.prop.add(eye);
    }
  }

  update(delta: number): void {
    this.animTime += delta;
    const t = this.animTime;

    switch (this.currentAnimation) {
      case 'walk':
      case 'carry':
        this.leftArm.rotation.x = Math.sin(t * 4) * 0.5;
        this.rightArm.rotation.x = -Math.sin(t * 4) * 0.5;
        this.leftLeg.rotation.x = -Math.sin(t * 4) * 0.4;
        this.rightLeg.rotation.x = Math.sin(t * 4) * 0.4;
        this.mesh.position.y = Math.abs(Math.sin(t * 4)) * 0.05;
        break;
      case 'chisel':
        this.rightArm.rotation.x = -0.5 + Math.sin(t * 6) * 0.8;
        this.leftArm.rotation.x = -0.3;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      case 'survey':
        this.head.rotation.y = Math.sin(t * 1.5) * 0.3;
        this.leftArm.rotation.x = -0.5;
        this.rightArm.rotation.x = -0.8;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      case 'antenna':
        this.head.rotation.x = -0.3;
        this.rightArm.rotation.x = -1.2;
        this.leftArm.rotation.x = 0;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        break;
      default:
        this.body.scale.y = 1 + Math.sin(t * 2) * 0.02;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.mesh.position.y = 0;
        break;
    }
  }

  setPosition(pos: THREE.Vector3): void {
    this.mesh.position.copy(pos);
  }

  private static _lookDir = new THREE.Vector3();
  private static _lookTarget = new THREE.Vector3();

  lookAt(target: THREE.Vector3): void {
    const dir = ProceduralWorker._lookDir.subVectors(target, this.mesh.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      ProceduralWorker._lookTarget.copy(this.mesh.position).add(dir);
      this.mesh.lookAt(ProceduralWorker._lookTarget);
    }
  }

  dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }
}
