import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { ArtifactItem } from '../../../core/models/exhibition.models';
import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'app-artifact-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artifact-modal.component.html',
  styleUrls: ['./artifact-modal.component.css']
})
export class ArtifactModalComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) artifact!: ArtifactItem;
  @Output() close = new EventEmitter<void>();

  @ViewChild('rendererCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  public readonly audioService = inject(AudioService);

  // Three.js instances
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private currentMeshGroup = new THREE.Group();
  private textureLoader = new THREE.TextureLoader();

  // Control states
  public isWireframe = false;
  public autoRotate = true;
  public zoomLevel = 1.0;
  public activeHotspot: any = null;

  // Mouse / Touch Drag Orbit
  private isDragging = false;
  private previousMouse = { x: 0, y: 0 };
  private rotationSpeed = 0.008;

  ngAfterViewInit(): void {
    this.initThree();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.audioService.stopNarration();
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const width = canvas.clientWidth || 500;
    const height = canvas.clientHeight || 450;

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 4.2);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting - Crystal Clear & Radiant
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 3.8);
    keyLight.position.set(3, 4, 4);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 2.5);
    rimLight.position.set(-3, -2, -3);
    this.scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 2.0);
    fillLight.position.set(0, -3, 2);
    this.scene.add(fillLight);

    // Build Specific 3D Model Geometry with Photorealistic Texture
    this.buildArtifact3DGeometry();
    this.scene.add(this.currentMeshGroup);

    // Render loop
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      if (this.autoRotate && !this.isDragging) {
        this.currentMeshGroup.rotation.y += 0.006;
      }

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private buildArtifact3DGeometry(): void {
    while (this.currentMeshGroup.children.length > 0) {
      this.currentMeshGroup.remove(this.currentMeshGroup.children[0]);
    }

    const size = 1.9;

    // 1. Solid Beveled Gold Frame
    const frameGeo = new THREE.BoxGeometry(size + 0.15, size + 0.15, 0.1);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
      wireframe: this.isWireframe
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    this.currentMeshGroup.add(frame);

    // 2. Photorealistic Front Face
    const imageMap: { [key: string]: string } = {
      'cypher_seal': 'assets/images/royal_cypher_seal.jpg',
      'vintage_camera': 'assets/images/vintage_camera.jpg',
      'chanthaboon_loom': 'assets/images/chanthaboon_loom.jpg',
      'royal_crown': 'assets/images/royal_crown.jpg',
      'vintage_car': 'assets/images/vintage_car.jpg',
      'royal_letter': 'assets/images/royal_letter.jpg'
    };

    const textureUrl = imageMap[this.artifact.threeDType] || 'assets/images/royal_cypher_seal.jpg';
    this.textureLoader.load(textureUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      const frontMat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.25,
        metalness: 0.1,
        wireframe: this.isWireframe
      });

      const frontPlaneGeo = new THREE.PlaneGeometry(size, size);
      const frontPlane = new THREE.Mesh(frontPlaneGeo, frontMat);
      frontPlane.position.z = 0.055;
      this.currentMeshGroup.add(frontPlane);

      // Back Face
      const backPlane = new THREE.Mesh(frontPlaneGeo, frontMat);
      backPlane.rotation.y = Math.PI;
      backPlane.position.z = -0.055;
      this.currentMeshGroup.add(backPlane);
    });

    // 3. Hotspot markers
    this.createHotspotMarkers();
  }

  private createHotspotMarkers(): void {
    if (!this.artifact.hotspots) return;

    this.artifact.hotspots.forEach((hs, idx) => {
      const geo = new THREE.SphereGeometry(0.08, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: false
      });
      const marker = new THREE.Mesh(geo, mat);
      marker.position.set(...hs.position);
      (marker as any).hotspotIndex = idx;
      this.currentMeshGroup.add(marker);
    });
  }

  public toggleWireframe(): void {
    this.isWireframe = !this.isWireframe;
    this.buildArtifact3DGeometry();
  }

  public toggleAutoRotate(): void {
    this.autoRotate = !this.autoRotate;
  }

  public resetView(): void {
    this.currentMeshGroup.rotation.set(0, 0, 0);
    this.camera.position.set(0, 0, 4.2);
    this.zoomLevel = 1.0;
    this.autoRotate = true;
    this.activeHotspot = null;
  }

  public zoomIn(): void {
    if (this.camera.position.z > 2.2) {
      this.camera.position.z -= 0.5;
      this.zoomLevel = +(4.2 / this.camera.position.z).toFixed(1);
    }
  }

  public zoomOut(): void {
    if (this.camera.position.z < 7.0) {
      this.camera.position.z += 0.5;
      this.zoomLevel = +(4.2 / this.camera.position.z).toFixed(1);
    }
  }

  public selectHotspot(h: any): void {
    this.activeHotspot = h;
    this.autoRotate = false;
    this.currentMeshGroup.rotation.y = 0.25;
  }

  public playVoiceNarration(): void {
    if (this.audioService.isNarrationPlaying()) {
      this.audioService.stopNarration();
    } else {
      const text = `${this.artifact.nameTh}. ${this.artifact.fullDesc} ${this.artifact.provenance}`;
      this.audioService.speakNarration(text);
    }
  }

  // Mouse Drag Orbit Controls
  public onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.previousMouse = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const deltaX = event.clientX - this.previousMouse.x;
    const deltaY = event.clientY - this.previousMouse.y;

    this.currentMeshGroup.rotation.y += deltaX * this.rotationSpeed;
    this.currentMeshGroup.rotation.x += deltaY * this.rotationSpeed;

    this.previousMouse = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:mouseup')
  public onMouseUp(): void {
    this.isDragging = false;
  }

  // Touch controls for mobile
  public onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.previousMouse = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
  }

  public onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    const deltaX = event.touches[0].clientX - this.previousMouse.x;
    const deltaY = event.touches[0].clientY - this.previousMouse.y;

    this.currentMeshGroup.rotation.y += deltaX * this.rotationSpeed;
    this.currentMeshGroup.rotation.x += deltaY * this.rotationSpeed;

    this.previousMouse = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }

  public onTouchEnd(): void {
    this.isDragging = false;
  }

  public onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.zoomIn();
    } else {
      this.zoomOut();
    }
  }

  public onCloseModal(): void {
    this.audioService.stopNarration();
    this.close.emit();
  }
}
