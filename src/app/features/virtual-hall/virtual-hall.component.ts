import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  HostListener,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExhibitionDataService } from '../../core/services/exhibition-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AudioService } from '../../core/services/audio.service';
import { ArtifactItem } from '../../core/models/exhibition.models';
import { ArtifactModalComponent } from '../../shared/components/artifact-modal/artifact-modal.component';

export interface MuseumHotspot {
  id: string;
  artifactId: string;
  xPercent: number; // Exact physical percentage on the high-res photo
  yPercent: number;
  labelTh: string;
  categoryTh: string;
  icon: string;
  shortFact: string;
}

export interface MuseumRoom {
  id: 'rotunda' | 'craft' | 'archives';
  nameTh: string;
  nameEn: string;
  imageUrl: string;
  descriptionTh: string;
  hotspots: MuseumHotspot[];
}

@Component({
  selector: 'app-virtual-hall',
  standalone: true,
  imports: [CommonModule, ArtifactModalComponent],
  templateUrl: './virtual-hall.component.html',
  styleUrls: ['./virtual-hall.component.css']
})
export class VirtualHallComponent implements OnInit, OnDestroy {
  public readonly exhibitionService = inject(ExhibitionDataService);
  public readonly analyticsService = inject(AnalyticsService);
  public readonly audioService = inject(AudioService);
  private cdr = inject(ChangeDetectorRef);

  // 3 Authentic High-Resolution Queen Rambhai Barni Museum Rooms
  public museumRooms: MuseumRoom[] = [
    {
      id: 'rotunda',
      nameTh: 'โถงใหญ่เกียรติยศสมเด็จพระนางเจ้ารำไพพรรณีฯ',
      nameEn: 'Grand Memorial Rotunda Gallery',
      imageUrl: 'assets/images/queen_museum_main_rotunda.jpg',
      descriptionTh: 'โถงนิทรรศการหลัก ประดับพระฉายาลักษณ์สมเด็จพระนางเจ้ารำไพพรรณีฯ และตู้กระจกแปดเหลี่ยมจัดแสดงพระมงกุฎและตราประจำพระองค์',
      hotspots: [
        {
          id: 'rotunda-crown',
          artifactId: 'art-crown',
          xPercent: 50,
          yPercent: 58,
          labelTh: '👑 พระมงกุฎขัตติยราชนารี & ตราพระนาม ร.พ.',
          categoryTh: 'เครื่องราชอิสริยยศ',
          icon: '👑',
          shortFact: 'จัดแสดงในตู้กระจกแปดเหลี่ยมบนเบาะกำมะหยี่สีน้ำเงินไพลินกลางโถงนิทรรศการ'
        },
        {
          id: 'rotunda-portrait',
          artifactId: 'art-cypher',
          xPercent: 17,
          yPercent: 42,
          labelTh: '🖼️ พระฉายาลักษณ์สมเด็จพระนางเจ้ารำไพพรรณีฯ',
          categoryTh: 'จิตรกรรมประวัติศาสตร์',
          icon: '✨',
          shortFact: 'พระฉายาลักษณ์ในฉลองพระองค์ขัตติยราชนารีในกรอบทองคำแท้'
        },
        {
          id: 'rotunda-regalia-right',
          artifactId: 'art-cypher',
          xPercent: 92,
          yPercent: 56,
          labelTh: '💎 เครื่องประดับและของสะสมส่วนพระองค์',
          categoryTh: 'โบราณวัตถุล้ำค่า',
          icon: '💎',
          shortFact: 'ตู้จัดแสดงโบราณวัตถุและเครื่องประดับพลอยสีชมพูกลีบบัว'
        }
      ]
    },
    {
      id: 'craft',
      nameTh: 'มุมหัตถศิลป์วังสวนบ้านแก้ว จันทบุรี',
      nameEn: 'Suan Ban Kaeo Handicrafts Gallery',
      imageUrl: 'assets/images/queen_museum_suan_ban_kaeo.jpg',
      descriptionTh: 'ห้องจัดแสดงหัตถกรรมเสื่อกกจันทบูร กี่ทอไม้สักทองโบราณจำลอง และแกลเลอรีภาพถ่ายประวัติศาสตร์เมื่อครั้งทรงงาน ณ จันทบุรี',
      hotspots: [
        {
          id: 'craft-loom',
          artifactId: 'art-loom',
          xPercent: 50,
          yPercent: 60,
          labelTh: '🎋 กี่ทอเสื่อจันทบูร & ผืนเสื่อราชสำนัก',
          categoryTh: 'หัตถศิลป์วังสวนบ้านแก้ว',
          icon: '🎋',
          shortFact: 'กี่ทอไม้สักทองโบราณที่ทรงใช้ในการพัฒนาลวดลายเสื่อกกจันทบูร'
        },
        {
          id: 'craft-mat-left',
          artifactId: 'art-loom',
          xPercent: 14,
          yPercent: 72,
          labelTh: '📜 ตู้จัดแสดงผืนเสื่อทอมือลายโบราณ',
          categoryTh: 'งานหัตถกรรมพื้นบ้าน',
          icon: '✨',
          shortFact: 'ตู้กระจกจัดแสดงผืนเสื่อกกจันทบูรลายตารางและลายโบราณ'
        },
        {
          id: 'craft-mat-right',
          artifactId: 'art-loom',
          xPercent: 87,
          yPercent: 72,
          labelTh: '✨ ตู้จัดแสดงเสื่อกกจันทบูรลายประยุกต์',
          categoryTh: 'มรดกภูมิปัญญา',
          icon: '🎋',
          shortFact: 'ลวดลายประยุกต์ร่วมสมัยที่ทรงริเริ่มเพื่อยกระดับสู่สากล'
        },
        {
          id: 'craft-photos',
          artifactId: 'art-cypher',
          xPercent: 6,
          yPercent: 48,
          labelTh: '📷 แกลเลอรีภาพถ่ายประวัติศาสตร์ทรงงาน',
          categoryTh: 'จดหมายเหตุภาพถ่าย',
          icon: '📷',
          shortFact: 'ภาพถ่ายการทรงงานและชีวิตความเป็นอยู่ ณ วังสวนบ้านแก้ว'
        }
      ]
    },
    {
      id: 'archives',
      nameTh: 'จดหมายเหตุประชาธิปไตยและของสะสมส่วนพระองค์',
      nameEn: 'Democracy Archives & Historic Artifacts',
      imageUrl: 'assets/images/queen_museum_democracy_hall.jpg',
      descriptionTh: 'ห้องจัดแสดงเอกสารจดหมายเหตุลายพระหัตถ์การสละราชสมบัติ ๒๔๗๗ กล้องถ่ายภาพ และเครื่องประดับส่วนพระองค์',
      hotspots: [
        {
          id: 'archive-letter',
          artifactId: 'art-abdication',
          xPercent: 18,
          yPercent: 56,
          labelTh: '📜 พระราชหัตถเลขาสละราชสมบัติ ๒๔๗๗',
          categoryTh: 'จดหมายเหตุประชาธิปไตย',
          icon: '📜',
          shortFact: 'เอกสารประวัติศาสตร์ลายพระหัตถ์พร้อมตราประทับครุฑชาดสีแดง'
        },
        {
          id: 'archive-camera',
          artifactId: 'art-camera',
          xPercent: 50,
          yPercent: 54,
          labelTh: '📷 กล้องโบราณ Voigtländer 1930s',
          categoryTh: 'กล้องบันทึกประวัติศาสตร์',
          icon: '📷',
          shortFact: 'กล้องที่ทรงใช้บันทึกภาพระหว่างการเสด็จประพาสต่างประเทศ'
        },
        {
          id: 'archive-regalia',
          artifactId: 'art-crown',
          xPercent: 82,
          yPercent: 54,
          labelTh: '💎 เครื่องประกอบพระราชอิสริยยศและสายสะพาย',
          categoryTh: 'เครื่องราชอิสริยาภรณ์',
          icon: '💎',
          shortFact: 'สายสะพายทองคำประดับอัญมณีและดวงตรามหาจักรีบรมราชวงศ์'
        }
      ]
    }
  ];

  public activeRoomIndex = 0;
  public get currentRoom(): MuseumRoom {
    return this.museumRooms[this.activeRoomIndex];
  }

  // Active Hotspot & Modal
  public activeHotspot: MuseumHotspot | null = null;
  public selectedArtifact: ArtifactItem | null = null;
  public isRoomLoaded = false;

  // High-Precision Pan & Zoom Controls
  public zoomLevel = 1.0;
  public panX = 0; // In pixels
  public panY = 0;
  private isDragging = false;
  private startMousePos = { x: 0, y: 0 };
  private startPan = { x: 0, y: 0 };

  ngOnInit(): void {
    this.analyticsService.recordPageView('ห้องนิทรรศการเสมือนจริงภาพถ่ายแท้ (Photorealistic Queen Museum)');
    this.isRoomLoaded = true;
  }

  ngOnDestroy(): void {
    this.audioService.stopNarration();
  }

  public switchRoom(index: number): void {
    if (index === this.activeRoomIndex || index < 0 || index >= this.museumRooms.length) return;
    this.activeRoomIndex = index;
    this.resetView();
    this.activeHotspot = null;
    this.analyticsService.recordInteraction(`switch-room-${this.currentRoom.id}`);
  }

  public onHotspotClick(hotspot: MuseumHotspot): void {
    this.activeHotspot = hotspot;
    const artifact = this.exhibitionService.artifacts().find((a) => a.id === hotspot.artifactId);
    if (artifact) {
      this.selectedArtifact = artifact;
      this.analyticsService.recordInteraction(`hotspot-open-${artifact.id}`);
    }
  }

  public openArtifact(item: ArtifactItem): void {
    this.selectedArtifact = item;
    this.analyticsService.recordInteraction(`dock-open-${item.id}`);
  }

  public closeArtifact(): void {
    this.selectedArtifact = null;
  }

  // Pan & Zoom Engine
  public zoomIn(): void {
    if (this.zoomLevel < 2.2) {
      this.zoomLevel = +(this.zoomLevel + 0.25).toFixed(2);
      this.clampPan();
    }
  }

  public zoomOut(): void {
    if (this.zoomLevel > 1.0) {
      this.zoomLevel = +(this.zoomLevel - 0.25).toFixed(2);
      this.clampPan();
    }
  }

  public resetView(): void {
    this.zoomLevel = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.activeHotspot = null;
  }

  private clampPan(): void {
    const maxPanX = (this.zoomLevel - 1) * 450;
    const maxPanY = (this.zoomLevel - 1) * 260;
    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY));
  }

  // Mouse Drag Pan
  public onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.startMousePos = { x: event.clientX, y: event.clientY };
    this.startPan = { x: this.panX, y: this.panY };
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const deltaX = event.clientX - this.startMousePos.x;
    const deltaY = event.clientY - this.startMousePos.y;

    this.panX = this.startPan.x + deltaX;
    this.panY = this.startPan.y + deltaY;
    this.clampPan();
  }

  @HostListener('window:mouseup')
  public onMouseUp(): void {
    this.isDragging = false;
  }

  // Touch Drag Pan
  public onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.startMousePos = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      this.startPan = { x: this.panX, y: this.panY };
    }
  }

  public onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    const deltaX = event.touches[0].clientX - this.startMousePos.x;
    const deltaY = event.touches[0].clientY - this.startMousePos.y;

    this.panX = this.startPan.x + deltaX;
    this.panY = this.startPan.y + deltaY;
    this.clampPan();
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
}
