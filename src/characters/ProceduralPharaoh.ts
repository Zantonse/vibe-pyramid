import * as THREE from 'three';
import { CharacterModel, AnimationName } from './CharacterModel.js';

export class ProceduralPharaoh implements CharacterModel {
  mesh: THREE.Group;
  private currentAnimation: AnimationName = 'idle';
  private animTime = 0;

  private body: THREE.Mesh;
  private head: THREE.Mesh;
  private headdress: THREE.Mesh;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private leftLeg: THREE.Group;
  private rightLeg: THREE.Group;
  private whipGroup: THREE.Group;
  private whipSegments: THREE.Mesh[] = [];

  constructor() {
    this.mesh = new THREE.Group();
    const skinColor = 0xc68642;
    const goldColor = 0xffd700;
    const clothColor = 0xfafafa;

    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.4);
    this.body = new THREE.Mesh(torsoGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.body.position.y = 1.25;
    this.body.castShadow = true;
    this.mesh.add(this.body);

    const chestGeo = new THREE.BoxGeometry(0.55, 0.25, 0.42);
    const chest = new THREE.Mesh(chestGeo, new THREE.MeshLambertMaterial({ color: goldColor }));
    chest.position.y = 1.45;
    this.mesh.add(chest);

    const headGeo = new THREE.SphereGeometry(0.24, 8, 6);
    this.head = new THREE.Mesh(headGeo, new THREE.MeshLambertMaterial({ color: skinColor }));
    this.head.position.y = 1.9;
    this.head.castShadow = true;
    this.mesh.add(this.head);

    const hdGeo = new THREE.ConeGeometry(0.35, 0.5, 4);
    this.headdress = new THREE.Mesh(hdGeo, new THREE.MeshLambertMaterial({ color: goldColor }));
    this.headdress.position.y = 2.15;
    this.headdress.rotation.y = Math.PI / 4;
    this.headdress.castShadow = true;
    this.mesh.add(this.headdress);

    const kiltGeo = new THREE.ConeGeometry(0.4, 0.5, 6);
    const kilt = new THREE.Mesh(kiltGeo, new THREE.MeshLambertMaterial({ color: clothColor }));
    kilt.position.y = 0.65;
    kilt.rotation.x = Math.PI;
    this.mesh.add(kilt);

    const bandGeo = new THREE.TorusGeometry(0.12, 0.03, 6, 8);
    const bandMat = new THREE.MeshLambertMaterial({ color: goldColor });

    this.leftArm = this.createLimb(skinColor, 0.13, 0.5);
    this.leftArm.position.set(-0.45, 1.35, 0);
    const lBand = new THREE.Mesh(bandGeo, bandMat);
    lBand.position.y = -0.1;
    lBand.rotation.x = Math.PI / 2;
    this.leftArm.add(lBand);
    this.mesh.add(this.leftArm);

    this.rightArm = this.createLimb(skinColor, 0.13, 0.5);
    this.rightArm.position.set(0.45, 1.35, 0);
    const rBand = new THREE.Mesh(bandGeo.clone(), bandMat);
    rBand.position.y = -0.1;
    rBand.rotation.x = Math.PI / 2;
    this.rightArm.add(rBand);
    this.mesh.add(this.rightArm);

    this.leftLeg = this.createLimb(skinColor, 0.14, 0.5);
    this.leftLeg.position.set(-0.18, 0.5, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = this.createLimb(skinColor, 0.14, 0.5);
    this.rightLeg.position.set(0.18, 0.5, 0);
    this.mesh.add(this.rightLeg);

    this.whipGroup = new THREE.Group();
    this.whipGroup.position.set(0.5, 1.3, 0);
    const whipMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
    for (let i = 0; i < 10; i++) {
      const segGeo = new THREE.SphereGeometry(0.03 - i * 0.002, 4, 4);
      const seg = new THREE.Mesh(segGeo, whipMat);
      seg.position.set(i * 0.15, 0, 0);
      this.whipGroup.add(seg);
      this.whipSegments.push(seg);
    }
    this.mesh.add(this.whipGroup);
  }

  private createLimb(color: number, radius: number, height: number): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius, radius * 0.85, height, 6);
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
  }

  update(delta: number): void {
    this.animTime += delta;
    const t = this.animTime;

    for (let i = 0; i < this.whipSegments.length; i++) {
      const seg = this.whipSegments[i];
      const baseX = i * 0.15;

      if (this.currentAnimation === 'whip') {
        const wave = Math.sin(t * 12 - i * 0.8) * (0.1 + i * 0.04);
        seg.position.set(baseX, wave, Math.sin(t * 8 - i * 0.5) * 0.05);
      } else {
        const sway = Math.sin(t * 1.5 + i * 0.3) * 0.02 * i;
        seg.position.set(baseX, sway - i * 0.01, 0);
      }
    }

    switch (this.currentAnimation) {
      case 'whip':
        this.rightArm.rotation.x = -1.0 + Math.sin(t * 8) * 0.5;
        this.rightArm.rotation.z = -0.3;
        this.leftArm.rotation.x = -0.3;
        if (t > 1.0) {
          this.currentAnimation = 'idle';
          this.animTime = 0;
        }
        break;
      case 'walk':
        this.leftArm.rotation.x = Math.sin(t * 3) * 0.3;
        this.rightArm.rotation.x = -Math.sin(t * 3) * 0.3;
        this.leftLeg.rotation.x = -Math.sin(t * 3) * 0.3;
        this.rightLeg.rotation.x = Math.sin(t * 3) * 0.3;
        break;
      default:
        this.leftArm.rotation.x = -0.7;
        this.leftArm.rotation.z = 0.3;
        this.rightArm.rotation.x = -0.7;
        this.rightArm.rotation.z = -0.3;
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.body.scale.y = 1 + Math.sin(t * 2) * 0.015;
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
