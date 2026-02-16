import * as THREE from 'three';
import { CharacterModel, AnimationName } from './CharacterModel.js';

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
    const skinColor = 0xb07850;
    const clothColor = 0xf5f0e0;

    const torsoGeo = new THREE.BoxGeometry(0.6, 0.7, 0.35);
    this.body = new THREE.Mesh(torsoGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.body.position.y = 1.2;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    const headGeo = new THREE.SphereGeometry(0.22, 8, 6);
    this.head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.head.position.y = 1.8;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    const clothGeo = new THREE.BoxGeometry(0.65, 0.3, 0.4);
    const cloth = new THREE.Mesh(clothGeo, new THREE.MeshLambertMaterial({ color: clothColor }));
    cloth.position.y = 0.75;
    this.mesh.add(cloth);

    this.leftArm = this.createLimb(skinColor, 0.15, 0.5);
    this.leftArm.position.set(-0.4, 1.3, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = this.createLimb(skinColor, 0.15, 0.5);
    this.rightArm.position.set(0.4, 1.3, 0);
    this.mesh.add(this.rightArm);

    this.leftLeg = this.createLimb(skinColor, 0.15, 0.5);
    this.leftLeg.position.set(-0.15, 0.5, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = this.createLimb(skinColor, 0.15, 0.5);
    this.rightLeg.position.set(0.15, 0.5, 0);
    this.mesh.add(this.rightLeg);

    this.prop = new THREE.Group();
    this.mesh.add(this.prop);
  }

  private createLimb(color: number, radius: number, height: number): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius, radius * 0.8, height, 6);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color }));
    mesh.position.y = -height / 2;
    mesh.castShadow = true;
    group.add(mesh);
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
      const scroll = new THREE.Mesh(scrollGeo, new THREE.MeshLambertMaterial({ color: 0xf5deb3 }));
      scroll.rotation.z = Math.PI / 4;
      scroll.position.set(0.5, 1.4, 0.2);
      this.prop.add(scroll);
    } else if (activity === 'carry') {
      const blockGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
      const block = new THREE.Mesh(blockGeo, new THREE.MeshLambertMaterial({ color: 0xc4a56a }));
      block.position.set(0, 2.1, 0);
      block.castShadow = true;
      this.prop.add(block);
    } else if (activity === 'chisel') {
      const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
      const handle = new THREE.Mesh(handleGeo, new THREE.MeshLambertMaterial({ color: 0x8b4513 }));
      handle.position.set(0.5, 1.2, 0.2);
      handle.rotation.z = -Math.PI / 3;
      this.prop.add(handle);

      const hammerHeadGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
      const hammerHead = new THREE.Mesh(hammerHeadGeo, new THREE.MeshLambertMaterial({ color: 0x808080 }));
      hammerHead.position.set(0.6, 1.35, 0.2);
      this.prop.add(hammerHead);
    } else if (activity === 'antenna') {
      const staffGeo = new THREE.CylinderGeometry(0.02, 0.025, 1.5, 6);
      const staff = new THREE.Mesh(staffGeo, new THREE.MeshLambertMaterial({ color: 0xdaa520 }));
      staff.position.set(0.4, 1.5, 0);
      this.prop.add(staff);

      const eyeGeo = new THREE.TorusGeometry(0.08, 0.02, 6, 8);
      const eye = new THREE.Mesh(eyeGeo, new THREE.MeshLambertMaterial({ color: 0x1565c0 }));
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

  lookAt(target: THREE.Vector3): void {
    const dir = new THREE.Vector3().subVectors(target, this.mesh.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      this.mesh.lookAt(this.mesh.position.clone().add(dir));
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
