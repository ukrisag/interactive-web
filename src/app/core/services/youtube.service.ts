import { Injectable, inject, signal, computed } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { YouTubeVideoItem } from '../models/exhibition.models';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root'
})
export class YouTubeService {
  private sanitizer = inject(DomSanitizer);
  private analytics = inject(AnalyticsService);

  // Active Video Modal State
  public readonly activeVideo = signal<YouTubeVideoItem | null>(null);
  public readonly isModalOpen = signal<boolean>(false);

  // Curated Historical YouTube Documentaries & Archival Videos
  public readonly videos = signal<YouTubeVideoItem[]>([
    {
      id: 'yt-bio-main',
      youtubeId: 'q6U_uOqM3fA',
      titleTh: 'สมเด็จพระนางเจ้ารำไพพรรณี พระบรมราชินีในรัชกาลที่ ๗',
      titleEn: 'HM Queen Rambhai Barni: The Royal Biography',
      duration: '18:45',
      category: 'biography',
      categoryLabelTh: 'พระราชประวัติ',
      descriptionTh: 'สารคดีเฉลิมพระเกียรติ ย้อนรอยพระราชประวัติ พระจริยวัตรอันงดงาม และพระมหากรุณาธิคุณอันหาที่สุดมิได้ที่ทรงอุทิศพระองค์เพื่อพสกนิกรชาวไทย',
      publishedYear: '๒๕๖๒',
      eraId: 'era-1',
      thumbnailUrl: 'https://img.youtube.com/vi/q6U_uOqM3fA/maxresdefault.jpg',
      featured: true
    },
    {
      id: 'yt-suan-ban-kaeo',
      youtubeId: 'sK-5vGgY_x8',
      titleTh: 'วังสวนบ้านแก้ว: ปฐมบทแห่งหัตถศิลป์เสื่อจันทบูร',
      titleEn: 'Suan Ban Kaeo Palace: Legacy of Chanthaboon Mat Weaving',
      duration: '14:20',
      category: 'handicraft',
      categoryLabelTh: 'ภูมิปัญญาหัตถศิลป์',
      descriptionTh: 'บันทึกประวัติศาสตร์เมื่อครั้งประทับ ณ วังสวนบ้านแก้ว จันทบุรี ทรงพลิกฟื้นและยกระดับการทอเสื่อกกจันทบูรสู่ผลิตภัณฑ์หัตถศิลป์ระดับสากล',
      publishedYear: '๒๕๖๔',
      eraId: 'era-4',
      thumbnailUrl: 'https://img.youtube.com/vi/sK-5vGgY_x8/maxresdefault.jpg',
      featured: true
    },
    {
      id: 'yt-democracy-1932',
      youtubeId: '2b4oK8H1Y6c',
      titleTh: 'บันทึกจดหมายเหตุ สยามในยุคเปลี่ยนผ่าน พ.ศ. ๒๔๗๕',
      titleEn: 'Historical Archives: Siam\'s Democratic Transition 1932',
      duration: '22:15',
      category: 'archive',
      categoryLabelTh: 'จดหมายเหตุประชาธิปไตย',
      descriptionTh: 'ภาพยนตร์จดหมายเหตุหายาก บันทึกเหตุการณ์ประวัติศาสตร์การเปลี่ยนแปลงการปกครอง และบทบาทขององค์พระมหากษัตริย์และพระบรมราชินี',
      publishedYear: '๒๕๖๓',
      eraId: 'era-3',
      thumbnailUrl: 'https://img.youtube.com/vi/2b4oK8H1Y6c/maxresdefault.jpg',
      featured: false
    },
    {
      id: 'yt-kpi-legacy',
      youtubeId: 'wO3e0A5x8aI',
      titleTh: 'สืบสานพระราชปณิธาน: พิพิธภัณฑ์พระบาทสมเด็จพระปกเกล้าเจ้าอยู่หัว',
      titleEn: 'King Prajadhipok Museum & Institutional Legacy',
      duration: '12:50',
      category: 'documentary',
      categoryLabelTh: 'สถาบันพระปกเกล้า',
      descriptionTh: 'การอนุรักษ์มรดกทางประวัติศาสตร์ โบราณวัตถุ และการส่งเสริมการเรียนรู้ประชาธิปไตยและธรรมาภิบาลในสังคมไทย',
      publishedYear: '๒๕๖๕',
      eraId: 'era-5',
      thumbnailUrl: 'https://img.youtube.com/vi/wO3e0A5x8aI/maxresdefault.jpg',
      featured: false
    },
    {
      id: 'yt-royal-visit-1931',
      youtubeId: 'dD8uO1F_uZs',
      titleTh: 'การเสด็จประพาสสหรัฐอเมริกาและยุโรป พ.ศ. ๒๔๗๔',
      titleEn: 'Historical Royal Tour to the United States & Europe (1931)',
      duration: '16:30',
      category: 'archive',
      categoryLabelTh: 'ภาพยนตร์ส่วนพระองค์',
      descriptionTh: 'ภาพยนตร์ส่วนพระองค์ฟิล์มขาวดำ บันทึกการเจริญสัมพันธไมตรีกับประธานาธิบดีเฮอร์เบิร์ต ฮูเวอร์ และการรักษาพระเนตร ณ ประเทศอังกฤษ',
      publishedYear: '๒๕๖๑',
      eraId: 'era-2',
      thumbnailUrl: 'https://img.youtube.com/vi/dD8uO1F_uZs/maxresdefault.jpg',
      featured: false
    }
  ]);

  // Featured Video
  public readonly featuredVideo = computed(() => {
    return this.videos().find(v => v.featured) || this.videos()[0];
  });

  /**
   * Generates a safe YouTube Embed URL with privacy and clean display parameters
   */
  public getEmbedUrl(youtubeId: string, autoplay: boolean = true): SafeResourceUrl {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      enablejsapi: '1',
      autoplay: autoplay ? '1' : '0',
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    });
    const url = `https://www.youtube-nocookie.com/embed/${youtubeId}?${params.toString()}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Get thumbnail fallback URL for YouTube video
   */
  public getThumbnailUrl(youtubeId: string, quality: 'maxres' | 'hq' | 'mq' = 'maxres'): string {
    const qualityMap = {
      maxres: 'maxresdefault.jpg',
      hq: 'hqdefault.jpg',
      mq: 'mqdefault.jpg'
    };
    return `https://img.youtube.com/vi/${youtubeId}/${qualityMap[quality]}`;
  }

  /**
   * Opens the video player modal for the given video item
   */
  public openVideoModal(video: YouTubeVideoItem): void {
    this.activeVideo.set(video);
    this.isModalOpen.set(true);
    this.analytics.recordInteraction(`youtube-play-${video.id}`);
  }

  /**
   * Closes the video player modal
   */
  public closeVideoModal(): void {
    this.activeVideo.set(null);
    this.isModalOpen.set(false);
  }

  /**
   * Get videos associated with a specific historical era
   */
  public getVideosByEra(eraId: string): YouTubeVideoItem[] {
    return this.videos().filter(v => v.eraId === eraId);
  }

  /**
   * Get videos by category
   */
  public getVideosByCategory(category: string): YouTubeVideoItem[] {
    return this.videos().filter(v => v.category === category);
  }
}
