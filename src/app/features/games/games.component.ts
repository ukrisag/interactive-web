import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  HostListener,
  ChangeDetectorRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import confetti from 'canvas-confetti';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AudioService } from '../../core/services/audio.service';
import { ThemeService } from '../../core/services/theme.service';
import { MemoryCard, HiddenTreasureItem, ChronologyItem } from '../../core/models/exhibition.models';

interface Card3DObject {
  mesh: THREE.Group;
  cardData: MemoryCard;
  targetRotationY: number;
  currentRotationY: number;
  targetPosZ: number;
  currentPosZ: number;
}

interface Detective3DObject {
  group: THREE.Group;
  itemData: HiddenTreasureItem;
}

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css']
})
export class GamesComponent implements OnInit, AfterViewInit, OnDestroy {
  public readonly analyticsService = inject(AnalyticsService);
  public readonly audioService = inject(AudioService);
  public readonly themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);

  public activeGame: 'memory' | 'hidden' | 'chronology' = 'memory';
  public totalGamePoints = 0;

  constructor() {
    effect(() => {
      // Re-initialize active 3D WebGL scene when theme switches!
      const theme = this.themeService.currentTheme();
      setTimeout(() => {
        this.cleanupWebGL();
        this.initWebGLForActiveGame();
      }, 50);
    });
  }

  // WebGL Canvas References
  @ViewChild('memoryCanvas', { static: false }) memoryCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('detectiveCanvas', { static: false }) detectiveCanvasRef?: ElementRef<HTMLCanvasElement>;

  // Three.js Core
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private textureLoader = new THREE.TextureLoader();

  // Cached Photorealistic Textures
  private photoTextures: { [key: string]: THREE.Texture } = {};
  private marbleFloorTexture?: THREE.Texture;

  // Orbit navigation for Game 2 (Detective Room)
  private isDragging = false;
  private previousMousePosition = { x: 0, y: 0 };
  public cameraOrbitAngle = 0.4;
  public cameraOrbitRadius = 9.2;
  public cameraHeight = 2.6;

  // ==========================================
  // GAME 1: 3D WEBGL ROYAL MEMORY MATCH
  // ==========================================
  public memoryCards: MemoryCard[] = [];
  public flippedCards: MemoryCard[] = [];
  public memoryMoves = 0;
  public memoryMatchedPairs = 0;
  public memoryTimer = 0;
  private memoryInterval: any = null;
  public memoryCompleted = false;
  public latestMatchedFact: { name: string; fact: string; icon: string } | null = null;
  private card3DObjects: Card3DObject[] = [];

  // ==========================================
  // GAME 2: 3D WEBGL ARCHIVAL DETECTIVE ROOM
  // ==========================================
  public hiddenItems: HiddenTreasureItem[] = [
    {
      id: 'item-cypher',
      nameTh: 'ตราพระนามาภิไธยย่อ ร.พ.',
      categoryTh: 'ตราประจำพระองค์',
      descriptionTh: 'ตราสัญลักษณ์พระนามย่อ ร.พ. ประดับอัญมณีสีชมพูกลีบบัว',
      clueTh: 'ซ่อนอยู่ในตู้กระจกโบราณ (Showcase Vitrine) กลางห้องจัดแสดง ต้องหมุนมุมกล้องมองผ่านกระจก',
      icon: '👑',
      xPercent: 0,
      yPercent: 0,
      found: false
    },
    {
      id: 'item-camera',
      nameTh: 'กล้องโบราณ Voigtländer',
      categoryTh: 'ภาพถ่ายประวัติศาสตร์',
      descriptionTh: 'กล้องที่ทรงใช้บันทึกภาพเมื่อครั้งเสด็จประพาสยุโรปและอเมริกา',
      clueTh: 'วางอยู่บนขาตั้งกล้องไม้โบราณ ในมุมสตูดิโอด้านหลังเสาหินอ่อนทิศตะวันออกเฉียงเหนือ',
      icon: '📷',
      xPercent: 0,
      yPercent: 0,
      found: false
    },
    {
      id: 'item-shuttle',
      nameTh: 'กระสวยทอเสื่อจันทบูร',
      categoryTh: 'หัตถศิลป์วังสวนบ้านแก้ว',
      descriptionTh: 'อุปกรณ์สอดเส้นกกที่ทรงพัฒนาลวดลายประยุกต์',
      clueTh: 'ซ่อนอยู่บนคานไม้ชั้นล่างของแท่นทอเสื่อจันทบูรณ์ ณ มุมหัตถศิลป์ทิศตะวันตกเฉียงใต้',
      icon: '🎋',
      xPercent: 0,
      yPercent: 0,
      found: false
    },
    {
      id: 'item-key',
      nameTh: 'กุญแจรถยนต์พระที่นั่ง',
      categoryTh: 'ยานยนต์หลวง 1930s',
      descriptionTh: 'สัญลักษณ์ยานยนต์พระที่นั่ง Rolls-Royce เมื่อครั้งประทับ ณ อังกฤษ',
      clueTh: 'วางอยู่บนโต๊ะทำงานไม้มะฮอกกานี ข้างสมุดบันทึกประวัติศาสตร์ทิศตะวันออกเฉียงใต้',
      icon: '🚗',
      xPercent: 0,
      yPercent: 0,
      found: false
    },
    {
      id: 'item-seal',
      nameTh: 'ตราประทับชาดพระราชหัตถเลขา',
      categoryTh: 'จดหมายเหตุประชาธิปไตย',
      descriptionTh: 'ตราประทับชาดสีแดงรับรองพระราชหัตถเลขาส่วนพระองค์',
      clueTh: 'วางอยู่บนแท่นจัดแสดงหลังฉากไม้แกะสลักโบราณทิศตะวันตกเฉียงเหนือ',
      icon: '📜',
      xPercent: 0,
      yPercent: 0,
      found: false
    }
  ];
  public selectedClueItem: HiddenTreasureItem | null = null;
  public foundItemNotification: HiddenTreasureItem | null = null;
  public hiddenGameCompleted = false;
  public detectiveInspections = 0;
  public detectiveTimer = 0;
  private detectiveInterval: any = null;
  private detective3DObjects: Detective3DObject[] = [];

  // ==========================================
  // GAME 3: CHRONOLOGY CHALLENGE
  // ==========================================
  public initialChronology: ChronologyItem[] = [
    {
      id: 'c1',
      yearTh: 'พ.ศ. 2447',
      yearNum: 2447,
      titleTh: 'วันพระราชสมภพ',
      descriptionTh: 'ประสูติ ณ วังสะพานยม เป็นพระธิดาในสมเด็จพระเจ้าบรมวงศ์เธอ กรมพระยาสวัสดิวัดนวิศิษฎ์',
      icon: '🌸',
      order: 1
    },
    {
      id: 'c2',
      yearTh: 'พ.ศ. 2461',
      yearNum: 2461,
      titleTh: 'พระราชพิธีอภิเษกสมรส',
      descriptionTh: 'เข้าสู่พระราชพิธีอภิเษกสมรสกับสมเด็จฯ เจ้าฟ้าประชาธิปกศักดิเดชน์ ณ วังศุโขทัย',
      icon: '💍',
      order: 2
    },
    {
      id: 'c3',
      yearTh: 'พ.ศ. 2474',
      yearNum: 2474,
      titleTh: 'เสด็จเยือนสหรัฐอเมริกา',
      descriptionTh: 'เจริญสัมพันธไมตรีกับนานาชาติและเข้าพบประธานาธิบดีเฮอร์เบิร์ต ฮูเวอร์',
      icon: '🚢',
      order: 3
    },
    {
      id: 'c4',
      yearTh: 'พ.ศ. 2493',
      yearNum: 2493,
      titleTh: 'สร้างวังสวนบ้านแก้ว จันทบุรี',
      descriptionTh: 'บุกเบิกการเกษตรสมัยใหม่และพัฒนาหัตถกรรมเสื่อกกจันทบูรสู่ระดับสากล',
      icon: '🎋',
      order: 4
    },
    {
      id: 'c5',
      yearTh: 'พ.ศ. 2541',
      yearNum: 2541,
      titleTh: 'ก่อตั้งสถาบันพระปกเกล้า',
      descriptionTh: 'สืบสานพระราชปณิธานด้านการพัฒนาประชาธิปไตยและธรรมาภิบาล',
      icon: '🏛️',
      order: 5
    }
  ];
  public userChronology: ChronologyItem[] = [];
  public chronologyChecked = false;
  public chronologyScore = 0;

  ngOnInit(): void {
    this.analyticsService.recordPageView('ศูนย์รวมมินิเกมเสมือนจริง (Photorealistic Games Hub)');
    this.preloadPhotorealisticTextures();
    this.initMemoryData();
    this.initChronologyGame();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initWebGLForActiveGame();
    }, 100);
  }

  ngOnDestroy(): void {
    this.cleanupWebGL();
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    if (this.detectiveInterval) {
      clearInterval(this.detectiveInterval);
    }
  }

  private preloadPhotorealisticTextures(): void {
    const assets = [
      { key: 'cypher', url: 'assets/images/royal_cypher_seal.jpg' },
      { key: 'camera', url: 'assets/images/vintage_camera.jpg' },
      { key: 'loom', url: 'assets/images/chanthaboon_loom.jpg' },
      { key: 'crown', url: 'assets/images/royal_crown.jpg' },
      { key: 'car', url: 'assets/images/vintage_car.jpg' },
      { key: 'letter', url: 'assets/images/royal_letter.jpg' }
    ];

    assets.forEach((a) => {
      this.textureLoader.load(a.url, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        this.photoTextures[a.key] = tex;
      });
    });

    this.textureLoader.load('assets/images/marble_floor.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 4);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.marbleFloorTexture = tex;
    });
  }

  public selectGame(game: 'memory' | 'hidden' | 'chronology'): void {
    this.activeGame = game;
    this.analyticsService.recordInteraction(`game-${game}`);
    this.cleanupWebGL();
    setTimeout(() => {
      this.initWebGLForActiveGame();
    }, 100);
  }

  private cleanupWebGL(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.card3DObjects = [];
    this.detective3DObjects = [];
  }

  private initWebGLForActiveGame(): void {
    if (this.activeGame === 'memory' && this.memoryCanvasRef) {
      this.init3DMemoryScene();
    } else if (this.activeGame === 'hidden' && this.detectiveCanvasRef) {
      this.init3DDetectiveScene();
    }
  }

  // =========================================================================
  // 1. 3D WEBGL ROYAL MEMORY SCENE (PHOTOREALISTIC ARCHIVAL TEXTURES)
  // =========================================================================
  private initMemoryData(): void {
    const basePairs = [
      { pairId: 'cypher', nameTh: 'ตราพระนาม ร.พ.', icon: '👑', factTh: 'ตรา ร.พ. ประดับอัญมณีสีชมพูตามวันพระราชสมภพ (วันอังคาร)' },
      { pairId: 'loom', nameTh: 'กี่ทอเสื่อจันทบูร', icon: '🎋', factTh: 'ทรงบุกเบิกและส่งเสริมการทอเสื่อกก ณ วังสวนบ้านแก้ว จันทบุรี' },
      { pairId: 'camera', nameTh: 'กล้อง Voigtländer', icon: '📷', factTh: 'กล้องโบราณที่ทรงใช้บันทึกภาพระหว่างการเสด็จประพาสต่างประเทศ' },
      { pairId: 'crown', nameTh: 'พระมงกุฎขัตติยราชนารี', icon: '💎', factTh: 'เครื่องประดับพระเศียรจำลองแห่งองค์พระอัครมเหสีแห่งสยาม' },
      { pairId: 'car', nameTh: 'รถยนต์พระที่นั่ง 1930', icon: '🚗', factTh: 'รถยนต์ Rolls-Royce Phantom คลาสสิกเมื่อครั้งประทับ ณ ยุโรป' },
      { pairId: 'letter', nameTh: 'พระราชหัตถเลขา', icon: '📜', factTh: 'เอกสารลายพระหัตถ์การสละราชสมบัติอันเป็นประวัติศาสตร์ประชาธิปไตย' }
    ];

    const cards: MemoryCard[] = [];
    let idCounter = 1;
    basePairs.forEach((p) => {
      cards.push({ id: idCounter++, pairId: p.pairId, nameTh: p.nameTh, icon: p.icon, factTh: p.factTh, flipped: false, matched: false });
      cards.push({ id: idCounter++, pairId: p.pairId, nameTh: p.nameTh, icon: p.icon, factTh: p.factTh, flipped: false, matched: false });
    });

    this.memoryCards = cards.sort(() => Math.random() - 0.5);
  }

  public initMemoryGame(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    this.memoryMoves = 0;
    this.memoryMatchedPairs = 0;
    this.memoryTimer = 0;
    this.memoryCompleted = false;
    this.flippedCards = [];
    this.latestMatchedFact = null;

    this.initMemoryData();
    this.cleanupWebGL();
    setTimeout(() => this.init3DMemoryScene(), 50);
  }

  private init3DMemoryScene(): void {
    if (!this.memoryCanvasRef) return;
    const canvas = this.memoryCanvasRef.nativeElement;
    const width = canvas.clientWidth || 1000;
    const height = canvas.clientHeight || 560;

    const isLight = this.themeService.currentTheme() === 'light';

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(isLight ? 0xefece3 : 0x0e1424);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 8.4);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lights - Crystal Clear
    const ambientLight = new THREE.AmbientLight(0xffffff, isLight ? 3.2 : 2.8);
    this.scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfffbeb, isLight ? 3.4 : 3.2);
    mainKeyLight.position.set(0, 6, 8);
    this.scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, isLight ? 2.2 : 2.0);
    fillLight.position.set(-6, -2, 6);
    this.scene.add(fillLight);

    const goldAccent = new THREE.PointLight(0xfacc15, 3.0, 16);
    goldAccent.position.set(0, 0, 4);
    this.scene.add(goldAccent);

    // Studio Backdrop with warm museum glow
    const backdropGeo = new THREE.PlaneGeometry(18, 11);
    const backdropMat = new THREE.MeshBasicMaterial({ color: isLight ? 0xe3ded0 : 0x111a30 });
    const backdrop = new THREE.Mesh(backdropGeo, backdropMat);
    backdrop.position.set(0, 0, -1);
    this.scene.add(backdrop);

    // Build 12 3D Card Meshes placed on a straight 4 columns x 3 rows grid
    this.card3DObjects = [];
    const cols = 4;
    const rows = 3;
    const spacingX = 1.95;
    const spacingY = 1.85;
    const offsetX = -((cols - 1) * spacingX) / 2;
    const offsetY = ((rows - 1) * spacingY) / 2;

    this.memoryCards.forEach((cardData, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const posX = offsetX + col * spacingX;
      const posY = offsetY - row * spacingY;

      const cardGroup = this.createPhotorealistic3DCardMesh(cardData);
      cardGroup.position.set(posX, posY, 0);
      cardGroup.rotation.set(0, 0, 0);
      (cardGroup as any).cardData = cardData;

      this.scene.add(cardGroup);
      this.card3DObjects.push({
        mesh: cardGroup,
        cardData,
        targetRotationY: 0,
        currentRotationY: 0,
        targetPosZ: 0,
        currentPosZ: 0
      });
    });

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      this.card3DObjects.forEach((c) => {
        c.currentRotationY += (c.targetRotationY - c.currentRotationY) * 0.14;
        c.mesh.rotation.y = c.currentRotationY;

        c.currentPosZ += (c.targetPosZ - c.currentPosZ) * 0.14;
        c.mesh.position.z = c.currentPosZ;
      });

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private createPhotorealistic3DCardMesh(cardData: MemoryCard): THREE.Group {
    const group = new THREE.Group();
    const cardWidth = 1.65;
    const cardHeight = 1.65;
    const cardDepth = 0.06;
    const isLight = this.themeService.currentTheme() === 'light';

    // 1. Slab Body
    const slabGeo = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth);
    const slabMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xfcfbfa : 0x1e293b,
      metalness: isLight ? 0.2 : 0.5,
      roughness: isLight ? 0.4 : 0.3
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    group.add(slab);

    // 2. Beveled Gold Border Frame
    const borderGeo = new THREE.BoxGeometry(cardWidth + 0.05, cardHeight + 0.05, 0.025);
    const borderMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xb89326 : 0xd4af37,
      metalness: 0.95,
      roughness: 0.15
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    group.add(border);

    // 3. Back Texture Canvas (Royal Blue with Gold Monogram)
    const backTex = this.createBackCardTexture();
    const backMat = new THREE.MeshBasicMaterial({ map: backTex });
    const backPlaneGeo = new THREE.PlaneGeometry(cardWidth - 0.06, cardHeight - 0.06);
    const backPlane = new THREE.Mesh(backPlaneGeo, backMat);
    backPlane.position.z = 0.032;
    group.add(backPlane);

    // 4. Front Face: Photorealistic High-Res Archival Photograph!
    let frontMat: THREE.Material;
    const photoTex = this.photoTextures[cardData.pairId];
    if (photoTex) {
      frontMat = new THREE.MeshStandardMaterial({
        map: photoTex,
        roughness: 0.3,
        metalness: 0.1
      });
    } else {
      const frontTex = this.createFrontCardTexture(cardData);
      frontMat = new THREE.MeshBasicMaterial({ map: frontTex });
    }

    const frontPlaneGeo = new THREE.PlaneGeometry(cardWidth - 0.06, cardHeight - 0.06);
    const frontPlane = new THREE.Mesh(frontPlaneGeo, frontMat);
    frontPlane.rotation.y = Math.PI;
    frontPlane.position.z = -0.032;
    group.add(frontPlane);

    return group;
  }

  private createBackCardTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 12;
    ctx.strokeRect(20, 20, 472, 472);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, 440, 440);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 80px "Sarabun", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', 256, 190);

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 54px "Cinzel", "Sarabun", serif';
    ctx.fillText('ร.พ.', 256, 280);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px "Sarabun", sans-serif';
    ctx.fillText('คลิกเพื่อเปิดการ์ด 3D', 256, 380);

    return new THREE.CanvasTexture(canvas);
  }

  private createFrontCardTexture(card: MemoryCard): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#d4af37');
    grad.addColorStop(1, '#b89326');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 70);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px "Sarabun", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('สถาบันพระปกเกล้า', 256, 35);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, 492, 492);

    ctx.font = '140px sans-serif';
    ctx.fillText(card.icon, 256, 230);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 36px "Sarabun", sans-serif';
    ctx.fillText(card.nameTh, 256, 380);

    ctx.fillStyle = '#64748b';
    ctx.font = '24px "Sarabun", sans-serif';
    ctx.fillText('สมบัติหลวงประวัติศาสตร์', 256, 435);

    return new THREE.CanvasTexture(canvas);
  }

  public onMemoryCanvasClick(event: MouseEvent): void {
    if (!this.memoryCanvasRef) return;
    const rect = this.memoryCanvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.card3DObjects.map((c) => c.mesh);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let topObj: any = intersects[0].object;
      while (topObj.parent && !topObj.cardData) {
        topObj = topObj.parent;
      }
      if (topObj.cardData) {
        this.handleMemoryCardFlip(topObj.cardData);
      }
    }
  }

  private handleMemoryCardFlip(card: MemoryCard): void {
    if (card.flipped || card.matched || this.flippedCards.length >= 2) return;

    if (!this.memoryInterval && !this.memoryCompleted) {
      this.memoryInterval = setInterval(() => {
        this.memoryTimer++;
        this.cdr.markForCheck();
      }, 1000);
    }

    card.flipped = true;
    const target3D = this.card3DObjects.find((c) => c.cardData.id === card.id);
    if (target3D) {
      target3D.targetRotationY = Math.PI;
      target3D.targetPosZ = 0.45;
    }

    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      this.memoryMoves++;
      const [card1, card2] = this.flippedCards;
      const obj1 = this.card3DObjects.find((c) => c.cardData.id === card1.id);
      const obj2 = this.card3DObjects.find((c) => c.cardData.id === card2.id);

      if (card1.pairId === card2.pairId) {
        card1.matched = true;
        card2.matched = true;
        this.memoryMatchedPairs++;
        this.totalGamePoints += 150;
        this.latestMatchedFact = { name: card1.nameTh, fact: card1.factTh, icon: card1.icon };

        if (obj1) obj1.targetPosZ = 0.6;
        if (obj2) obj2.targetPosZ = 0.6;

        this.flippedCards = [];

        if (this.memoryMatchedPairs === 6) {
          this.memoryCompleted = true;
          if (this.memoryInterval) clearInterval(this.memoryInterval);
          this.totalGamePoints += 300;
          this.triggerConfetti();
        }
      } else {
        setTimeout(() => {
          card1.flipped = false;
          card2.flipped = false;
          if (obj1) {
            obj1.targetRotationY = 0;
            obj1.targetPosZ = 0;
          }
          if (obj2) {
            obj2.targetRotationY = 0;
            obj2.targetPosZ = 0;
          }
          this.flippedCards = [];
        }, 900);
      }
    }
  }

  // =========================================================================
  // 2. 3D WEBGL ARCHIVAL DETECTIVE ROOM (PHOTOREALISTIC MARBLE & ARTIFACTS)
  // =========================================================================
  public resetHiddenGame(): void {
    this.hiddenItems.forEach((i) => (i.found = false));
    this.selectedClueItem = null;
    this.foundItemNotification = null;
    this.hiddenGameCompleted = false;
    this.detectiveInspections = 0;
    this.detectiveTimer = 0;
    if (this.detectiveInterval) {
      clearInterval(this.detectiveInterval);
      this.detectiveInterval = null;
    }
    this.cleanupWebGL();
    setTimeout(() => this.init3DDetectiveScene(), 50);
  }

  public showClue(item: HiddenTreasureItem): void {
    this.selectedClueItem = item;
    this.cdr.markForCheck();
  }

  public zoomCamera(delta: number): void {
    this.cameraOrbitRadius = Math.max(4.5, Math.min(13.0, this.cameraOrbitRadius + delta));
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    if (!this.camera) return;
    this.camera.position.x = Math.sin(this.cameraOrbitAngle) * this.cameraOrbitRadius;
    this.camera.position.z = Math.cos(this.cameraOrbitAngle) * this.cameraOrbitRadius;
    this.camera.position.y = this.cameraHeight;
    this.camera.lookAt(0, 1.0, 0);
  }

  private init3DDetectiveScene(): void {
    if (!this.detectiveCanvasRef) return;
    const canvas = this.detectiveCanvasRef.nativeElement;
    const width = canvas.clientWidth || 1000;
    const height = canvas.clientHeight || 560;

    const isLight = this.themeService.currentTheme() === 'light';
    const bgHex = isLight ? 0xefece3 : 0x0f172a;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(bgHex);
    this.scene.fog = new THREE.FogExp2(bgHex, isLight ? 0.012 : 0.02);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.updateCameraPosition();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lights - Warm & Atmospheric Museum
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
    this.scene.add(ambientLight);

    const chandelierLight = new THREE.PointLight(0xfff7ed, 4.0, 25);
    chandelierLight.position.set(0, 6.0, 0);
    this.scene.add(chandelierLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    keyLight.position.set(6, 11, 7);
    this.scene.add(keyLight);

    // Build Museum Interior with Photorealistic Marble Floor
    this.buildMuseumRoomInterior();

    // Spawn 5 Photorealistic Hidden 3D Artifacts
    this.spawnAuthenticDetective3DArtifacts();

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      this.detective3DObjects.forEach((item) => {
        if (item.itemData.found) {
          item.group.rotation.y += 0.025;
        }
      });

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private buildMuseumRoomInterior(): void {
    // 1. Photorealistic Carrara Marble Floor
    const floorGeo = new THREE.CircleGeometry(15, 64);
    let floorMat: THREE.Material;
    if (this.marbleFloorTexture) {
      floorMat = new THREE.MeshStandardMaterial({
        map: this.marbleFloorTexture,
        roughness: 0.15,
        metalness: 0.25
      });
    } else {
      floorMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.25,
        metalness: 0.3
      });
    }

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // 2. Royal Carpet Runner
    const carpetGeo = new THREE.RingGeometry(3.5, 4.5, 48);
    const carpetMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.8
    });
    const carpet = new THREE.Mesh(carpetGeo, carpetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = 0.01;
    this.scene.add(carpet);

    // 3. Central Glass Showcase Vitrine (Holds Cypher Seal)
    const vitrineBaseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.9, 32);
    const vitrineBaseMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
    const vitrineBase = new THREE.Mesh(vitrineBaseGeo, vitrineBaseMat);
    vitrineBase.position.set(0, 0.45, 0);
    this.scene.add(vitrineBase);

    // Transparent Glass Vitrine Case
    const glassGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.3, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.85,
      opacity: 0.4,
      transparent: true,
      roughness: 0.1,
      ior: 1.5
    });
    const glassCase = new THREE.Mesh(glassGeo, glassMat);
    glassCase.position.set(0, 1.55, 0);
    this.scene.add(glassCase);

    // 4. Classical Museum Columns
    const colGeo = new THREE.CylinderGeometry(0.4, 0.4, 7.5, 24);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(Math.cos(angle) * 7.8, 3.75, Math.sin(angle) * 7.8);
      this.scene.add(col);
    }

    // 5. Antique Mahogany Writing Desk
    const deskGroup = new THREE.Group();
    deskGroup.position.set(4.2, 0, 3.0);
    const topGeo = new THREE.BoxGeometry(2.2, 0.12, 1.4);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.3 });
    const deskTop = new THREE.Mesh(topGeo, deskMat);
    deskTop.position.y = 0.9;
    deskGroup.add(deskTop);

    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 12);
    const legPositions = [
      [0.95, 0.45, 0.55],
      [-0.95, 0.45, 0.55],
      [0.95, 0.45, -0.55],
      [-0.95, 0.45, -0.55]
    ];
    legPositions.forEach((pos) => {
      const leg = new THREE.Mesh(legGeo, deskMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      deskGroup.add(leg);
    });

    const bookGeo = new THREE.BoxGeometry(0.6, 0.08, 0.45);
    const bookMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    const book = new THREE.Mesh(bookGeo, bookMat);
    book.position.set(0.3, 1.0, 0.1);
    book.rotation.y = 0.2;
    deskGroup.add(book);
    this.scene.add(deskGroup);

    // 6. Weaving Loom Craft Station
    const loomGroup = new THREE.Group();
    loomGroup.position.set(-4.8, 0, 3.5);
    loomGroup.rotation.y = Math.PI / 4;
    const frameGeo = new THREE.BoxGeometry(2.0, 1.6, 1.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x78350f, wireframe: false });
    const loomFrame = new THREE.Mesh(frameGeo, frameMat);
    loomFrame.position.y = 0.8;
    loomGroup.add(loomFrame);
    this.scene.add(loomGroup);

    // 7. Decorative Room Partition Screens
    const screenGeo = new THREE.BoxGeometry(2.4, 2.2, 0.1);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.7 });

    const screen1 = new THREE.Mesh(screenGeo, screenMat);
    screen1.position.set(-4.5, 1.1, -4.2);
    screen1.rotation.y = 0.5;
    this.scene.add(screen1);

    const screen2 = new THREE.Mesh(screenGeo, screenMat);
    screen2.position.set(4.8, 1.1, -4.5);
    screen2.rotation.y = -0.4;
    this.scene.add(screen2);
  }

  private spawnAuthenticDetective3DArtifacts(): void {
    this.detective3DObjects = [];

    const configs: { [id: string]: { pos: [number, number, number]; rotY?: number; texKey: string } } = {
      'item-cypher': { pos: [0, 1.25, 0], texKey: 'cypher' },
      'item-camera': { pos: [5.2, 1.4, -4.0], rotY: -0.6, texKey: 'camera' },
      'item-shuttle': { pos: [-4.6, 0.55, 3.3], rotY: 0.8, texKey: 'loom' },
      'item-key': { pos: [3.8, 1.02, 3.0], rotY: 0.4, texKey: 'car' },
      'item-seal': { pos: [-4.3, 1.3, -3.8], rotY: 0.3, texKey: 'letter' }
    };

    this.hiddenItems.forEach((item) => {
      const conf = configs[item.id] || { pos: [0, 1, 0], texKey: 'cypher' };
      const group = new THREE.Group();
      group.position.set(...conf.pos);
      if (conf.rotY) group.rotation.y = conf.rotY;

      // Realistic 3D Showcase Medallion / Miniature with Photorealistic Texture
      const mesh = this.createPhotoDetectivePlaque(conf.texKey);
      group.add(mesh);

      (group as any).itemData = item;
      this.scene.add(group);

      this.detective3DObjects.push({
        group,
        itemData: item
      });
    });
  }

  private createPhotoDetectivePlaque(texKey: string): THREE.Group {
    const group = new THREE.Group();
    const width = 0.65;
    const height = 0.65;

    // Gold Beveled Frame
    const frameGeo = new THREE.BoxGeometry(width + 0.08, height + 0.08, 0.04);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    group.add(frame);

    // Photorealistic Archival Face
    let mat: THREE.Material;
    const tex = this.photoTextures[texKey];
    if (tex) {
      mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.25,
        metalness: 0.1
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.8
      });
    }

    const planeGeo = new THREE.PlaneGeometry(width, height);
    const plane = new THREE.Mesh(planeGeo, mat);
    plane.position.z = 0.022;
    group.add(plane);

    return group;
  }

  public onDetectiveCanvasClick(event: MouseEvent): void {
    if (!this.detectiveCanvasRef) return;
    const rect = this.detectiveCanvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    if (!this.detectiveInterval && !this.hiddenGameCompleted) {
      this.detectiveInterval = setInterval(() => {
        this.detectiveTimer++;
        this.cdr.markForCheck();
      }, 1000);
    }

    this.detectiveInspections++;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const meshes = this.detective3DObjects.map((d) => d.group);
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      let topObj: any = intersects[0].object;
      while (topObj.parent && !topObj.itemData) {
        topObj = topObj.parent;
      }
      if (topObj.itemData) {
        this.discoverDetectiveItem(topObj.itemData);
      }
    }
  }

  public discoverDetectiveItem(item: HiddenTreasureItem): void {
    if (item.found) return;

    item.found = true;
    this.totalGamePoints += 250;
    this.foundItemNotification = item;
    this.selectedClueItem = null;

    const targetObj = this.detective3DObjects.find((d) => d.itemData.id === item.id);
    if (targetObj) {
      targetObj.group.scale.set(1.4, 1.4, 1.4);
      targetObj.group.position.y += 0.3;
    }

    const allFound = this.hiddenItems.every((i) => i.found);
    if (allFound) {
      this.hiddenGameCompleted = true;
      if (this.detectiveInterval) {
        clearInterval(this.detectiveInterval);
      }
      this.totalGamePoints += 600;
      this.triggerConfetti();
    }
    this.cdr.markForCheck();
  }

  public onMouseDown(event: MouseEvent): void {
    if (this.activeGame !== 'hidden') return;
    this.isDragging = true;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:mousemove', ['$event'])
  public onWindowMouseMove(event: MouseEvent): void {
    if (!this.isDragging || this.activeGame !== 'hidden' || !this.camera) return;
    const deltaX = event.clientX - this.previousMousePosition.x;
    this.cameraOrbitAngle -= deltaX * 0.005;

    this.updateCameraPosition();
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  }

  @HostListener('window:mouseup')
  public onWindowMouseUp(): void {
    this.isDragging = false;
  }

  // ==========================================
  // 3. CHRONOLOGY METHODS & DRAG AND DROP
  // ==========================================
  public draggedItemIndex: number | null = null;
  public dragOverIndex: number | null = null;

  public initChronologyGame(): void {
    this.chronologyChecked = false;
    this.chronologyScore = 0;
    this.userChronology = [...this.initialChronology].sort(() => Math.random() - 0.5);
  }

  public onDragStart(event: DragEvent, index: number): void {
    if (this.chronologyChecked) return;
    this.draggedItemIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  public onDragOver(event: DragEvent, index: number): void {
    if (this.chronologyChecked) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverIndex = index;
  }

  public onDragLeave(index: number): void {
    if (this.dragOverIndex === index) {
      this.dragOverIndex = null;
    }
  }

  public onDrop(event: DragEvent, targetIndex: number): void {
    if (this.chronologyChecked) return;
    event.preventDefault();
    if (this.draggedItemIndex === null || this.draggedItemIndex === targetIndex) {
      this.draggedItemIndex = null;
      this.dragOverIndex = null;
      return;
    }

    const movedItem = this.userChronology.splice(this.draggedItemIndex, 1)[0];
    this.userChronology.splice(targetIndex, 0, movedItem);

    this.draggedItemIndex = null;
    this.dragOverIndex = null;
    this.cdr.markForCheck();
  }

  public onDragEnd(): void {
    this.draggedItemIndex = null;
    this.dragOverIndex = null;
  }

  public moveItem(index: number, direction: 'up' | 'down'): void {
    if (this.chronologyChecked) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= this.userChronology.length) return;

    const temp = this.userChronology[index];
    this.userChronology[index] = this.userChronology[targetIndex];
    this.userChronology[targetIndex] = temp;
  }

  public checkChronology(): void {
    let score = 0;
    this.userChronology.forEach((item, idx) => {
      if (item.order === idx + 1) {
        score += 20;
      }
    });

    this.chronologyScore = score;
    this.chronologyChecked = true;
    this.totalGamePoints += score * 3;

    if (score >= 80) {
      this.triggerConfetti();
    }
  }

  private triggerConfetti(): void {
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#38bdf8', '#22c55e', '#ec4899']
      });
    } catch (e) {}
  }

  @HostListener('window:resize')
  public onResize(): void {
    if (!this.renderer || !this.camera) return;
    let canvas: HTMLCanvasElement | undefined;
    if (this.activeGame === 'memory' && this.memoryCanvasRef) {
      canvas = this.memoryCanvasRef.nativeElement;
    } else if (this.activeGame === 'hidden' && this.detectiveCanvasRef) {
      canvas = this.detectiveCanvasRef.nativeElement;
    }

    if (canvas) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    }
  }
}
