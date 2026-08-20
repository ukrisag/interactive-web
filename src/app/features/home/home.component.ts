import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  HostListener,
  AfterViewInit,
  ElementRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExhibitionDataService } from '../../core/services/exhibition-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AudioService } from '../../core/services/audio.service';
import { SurveyService } from '../../core/services/survey.service';
import { ArtifactItem } from '../../core/models/exhibition.models';
import { ArtifactModalComponent } from '../../shared/components/artifact-modal/artifact-modal.component';

export interface HeroCarouselSlide {
  id: number;
  titleTh: string;
  yearsTh: string;
  imageUrl: string;
  badge: string;
  narrationText: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ArtifactModalComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  public readonly exhibitionService = inject(ExhibitionDataService);
  public readonly analyticsService = inject(AnalyticsService);
  public readonly audioService = inject(AudioService);
  public readonly surveyService = inject(SurveyService);
  private el = inject(ElementRef);

  public selectedArtifact: ArtifactItem | null = null;

  // Parallax Values
  public scrollProgress = signal<number>(0);
  public scrollY = signal<number>(0);
  public heroParallaxOffset = signal<number>(0);
  public banner1Offset = signal<number>(0);
  public banner2Offset = signal<number>(0);

  // Hero Carousel System
  public heroSlides: HeroCarouselSlide[] = [
    {
      id: 1,
      titleTh: 'สมเด็จพระนางเจ้ารำไพพรรณี พระบรมราชินี',
      yearsTh: 'พ.ศ. ๒๔๔๗ – ๒๕๒๗ (๘๐ พรรษา) • ฉลองพระองค์ขัตติยราชนารี',
      imageUrl: 'assets/images/queen_portrait_hero.jpg',
      badge: '👑 พระฉายาลักษณ์องค์ประธาน',
      narrationText: 'สมเด็จพระนางเจ้ารำไพพรรณี พระบรมราชินีในรัชกาลที่ 7 พระอัครมเหสีผู้ทรงเคียงคู่ประชาธิปไตย และปฐมบทแห่งการพัฒนาหัตถศิลป์ไทยสู่นานาชาติ'
    },
    {
      id: 2,
      titleTh: 'เคียงคู่พระบารมียุคเปลี่ยนผ่านประชาธิปไตย',
      yearsTh: 'พ.ศ. ๒๔๖๑ – ๒๔๗๗ • เคียงข้างพระบาทสมเด็จพระปกเกล้าเจ้าอยู่หัว',
      imageUrl: 'assets/images/queen_king_portrait.jpg',
      badge: '🏛️ จดหมายเหตุประชาธิปไตย',
      narrationText: 'ทรงเป็นพระบรมราชินีพระองค์แรกที่เสด็จฯ เยือนสหรัฐอเมริกาและยุโรปอย่างเป็นทางการ ทรงเคียงข้างพระราชหฤทัยในยามบ้านเมืองเปลี่ยนผ่านสู่ประชาธิปไตย'
    },
    {
      id: 3,
      titleTh: 'วังสวนบ้านแก้ว ปฐมบทแห่งหัตถศิลป์เสื่อจันทบูร',
      yearsTh: 'พ.ศ. ๒๔๙๓ เป็นต้นมา • ศูนย์พัฒนาหัตถศิลป์และการเกษตรสมัยใหม่',
      imageUrl: 'assets/images/queen_portrait_chanthaburi.jpg',
      badge: '🎋 มรดกภูมิปัญญาหัตถศิลป์',
      narrationText: 'ทรงพลิกฟื้นภูมิปัญญาท้องถิ่น เสื่อกกจันทบูร สู่งานหัตถศิลป์ระดับสากล และทรงบุกเบิกการเกษตรสมัยใหม่เพื่อราษฎร'
    },
    {
      id: 4,
      titleTh: 'โถงพิพิธภัณฑ์เกียรติยศเสมือนจริง 8K',
      yearsTh: 'สถาบันพระปกเกล้า • King Prajadhipok\'s Institute',
      imageUrl: 'assets/images/queen_museum_main_rotunda.jpg',
      badge: '🏛️ โถงพิพิธภัณฑ์เสมือนจริง',
      narrationText: 'โถงจัดแสดงเสมือนจริง 3 มิติ รวบรวมโบราณวัตถุ เครื่องราชอิสริยยศ และจดหมายเหตุประวัติศาสตร์อันทรงคุณค่า'
    }
  ];

  public currentSlideIndex = signal<number>(0);
  private autoplayTimer: any = null;
  public isHoveringCarousel = false;

  ngOnInit(): void {
    this.analyticsService.recordPageView('หน้าแรก (Home - Apple Parallax & Carousel)');
    this.startAutoplay();
  }

  ngAfterViewInit(): void {
    this.initScrollRevealObserver();
    this.updateScrollParallax();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
    this.audioService.stopNarration();
  }

  // Carousel Controls
  public startAutoplay(): void {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      if (!this.isHoveringCarousel) {
        this.nextSlide();
      }
    }, 5500);
  }

  public stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  public nextSlide(): void {
    this.currentSlideIndex.update((idx) => (idx + 1) % this.heroSlides.length);
  }

  public prevSlide(): void {
    this.currentSlideIndex.update((idx) => (idx - 1 + this.heroSlides.length) % this.heroSlides.length);
  }

  public goToSlide(index: number): void {
    if (index >= 0 && index < this.heroSlides.length) {
      this.currentSlideIndex.set(index);
    }
  }

  public get currentSlide(): HeroCarouselSlide {
    return this.heroSlides[this.currentSlideIndex()];
  }

  @HostListener('window:scroll')
  public onWindowScroll(): void {
    this.updateScrollParallax();
  }

  private updateScrollParallax(): void {
    if (typeof window === 'undefined') return;
    const currentScroll = window.scrollY || window.pageYOffset || 0;
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (currentScroll / totalHeight) * 100 : 0;

    this.scrollY.set(currentScroll);
    this.scrollProgress.set(Math.min(100, Math.max(0, progress)));

    // Smooth subtle Parallax translation
    this.heroParallaxOffset.set(currentScroll * 0.12);
    this.banner1Offset.set((currentScroll - 800) * 0.12);
    this.banner2Offset.set((currentScroll - 1800) * 0.12);
  }

  private initScrollRevealObserver(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    const revealElements = this.el.nativeElement.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el: HTMLElement) => observer.observe(el));
  }

  public openArtifact(item: ArtifactItem): void {
    this.selectedArtifact = item;
    this.analyticsService.recordInteraction(`home-open-artifact-${item.id}`);
  }

  public closeArtifact(): void {
    this.selectedArtifact = null;
  }

  public getArtifactImageUrl(item: ArtifactItem): string {
    const map: { [key: string]: string } = {
      cypher_seal: 'assets/images/royal_cypher_seal.jpg',
      chanthaboon_loom: 'assets/images/chanthaboon_loom.jpg',
      vintage_camera: 'assets/images/vintage_camera.jpg',
      royal_crown: 'assets/images/royal_crown.jpg',
      vintage_car: 'assets/images/vintage_car.jpg',
      royal_letter: 'assets/images/royal_letter.jpg'
    };
    return item.imageUrl || map[item.threeDType] || 'assets/images/royal_cypher_seal.jpg';
  }

  public playHeroBioNarration(): void {
    const text = this.currentSlide.narrationText;
    if (this.audioService.isNarrationPlaying()) {
      this.audioService.stopNarration();
    } else {
      this.audioService.speakNarration(text);
      this.analyticsService.recordInteraction(`home-play-hero-bio-slide-${this.currentSlide.id}`);
    }
  }
}
