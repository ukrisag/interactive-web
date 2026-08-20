import { Injectable, signal, computed } from '@angular/core';
import { SurveyResponse } from '../models/exhibition.models';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private readonly STORAGE_KEY = 'kpi_exhibition_surveys_v1';

  public readonly responses = signal<SurveyResponse[]>([
    {
      id: 'srv-1',
      createdAt: '2026-08-17 14:32',
      visitorType: 'student',
      ratingContent: 5,
      ratingInteractivity: 5,
      ratingVisual: 5,
      ratingEase: 5,
      npsScore: 10,
      favoriteZone: 'วังสวนบ้านแก้ว & กี่ทอเสื่อ 3D',
      comment: 'ประทับใจระบบจำลองการทอเสื่อจันทบูรมากครับ ภาพ 3 มิติสวยสมจริง และได้ความรู้เรื่องพระราชกรณียกิจอย่างลึกซึ้ง'
    },
    {
      id: 'srv-2',
      createdAt: '2026-08-17 11:15',
      visitorType: 'researcher',
      ratingContent: 5,
      ratingInteractivity: 4,
      ratingVisual: 5,
      ratingEase: 5,
      npsScore: 9,
      favoriteZone: 'จดหมายเหตุ & ยุคประทับ ณ อังกฤษ',
      comment: 'การจัดลำดับเอกสารและประวัติศาสตร์ทำได้กระชับ ถูกต้องตามหลักฐานจดหมายเหตุ ดีไซน์คลีนสไตล์ Apple สบายตามาก'
    },
    {
      id: 'srv-3',
      createdAt: '2026-08-16 19:40',
      visitorType: 'general',
      ratingContent: 5,
      ratingInteractivity: 5,
      ratingVisual: 5,
      ratingEase: 4,
      npsScore: 10,
      favoriteZone: 'ห้องนิทรรศการ 3D Virtual Hall',
      comment: 'เสียงบรรยายเพราะมากครับ เข้าชมผ่านมือถือก็ลื่นไหล ไม่ต้องลงแอพเพิ่ม ชื่นชมผู้จัดทำและสถาบันพระปกเกล้าครับ'
    },
    {
      id: 'srv-4',
      createdAt: '2026-08-16 15:20',
      visitorType: 'kpi_staff',
      ratingContent: 5,
      ratingInteractivity: 5,
      ratingVisual: 5,
      ratingEase: 5,
      npsScore: 10,
      favoriteZone: 'มรดกสู่สถาบันพระปกเกล้า',
      comment: 'เป็นนวัตกรรมการจัดแสดงนิทรรศการออนไลน์ที่ยกระดับภาพลักษณ์ของสถาบันได้ยอดเยี่ยมมากครับ'
    }
  ]);

  // Overall Statistics computed
  public readonly totalSurveys = computed(() => this.responses().length);

  public readonly averageRatings = computed(() => {
    const list = this.responses();
    if (list.length === 0) return { content: 5, interactivity: 5, visual: 5, ease: 5, overall: 5 };

    const sum = list.reduce(
      (acc, curr) => {
        acc.c += curr.ratingContent;
        acc.i += curr.ratingInteractivity;
        acc.v += curr.ratingVisual;
        acc.e += curr.ratingEase;
        return acc;
      },
      { c: 0, i: 0, v: 0, e: 0 }
    );

    const count = list.length;
    const content = parseFloat((sum.c / count).toFixed(2));
    const interactivity = parseFloat((sum.i / count).toFixed(2));
    const visual = parseFloat((sum.v / count).toFixed(2));
    const ease = parseFloat((sum.e / count).toFixed(2));
    const overall = parseFloat(((content + interactivity + visual + ease) / 4).toFixed(2));

    return { content, interactivity, visual, ease, overall };
  });

  public readonly npsScore = computed(() => {
    const list = this.responses();
    if (list.length === 0) return 92;
    const promoters = list.filter((r) => r.npsScore >= 9).length;
    const detractors = list.filter((r) => r.npsScore <= 6).length;
    return Math.round(((promoters - detractors) / list.length) * 100);
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.responses.set(parsed);
          }
        } catch (e) {
          console.warn('Failed to parse saved surveys', e);
        }
      }
    }
  }

  public submitSurvey(data: Omit<SurveyResponse, 'id' | 'createdAt'>) {
    const now = new Date();
    const newSurvey: SurveyResponse = {
      ...data,
      id: `srv-${Date.now()}`,
      createdAt: now.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    this.responses.update((prev) => [newSurvey, ...prev]);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.responses()));
    }
  }
}
