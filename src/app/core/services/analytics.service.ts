import { Injectable, signal, computed } from '@angular/core';
import { AnalyticsRecord, SurveyResponse } from '../models/exhibition.models';

export interface HeatmapItem {
  id: string;
  name: string;
  category: string;
  visits: number;
  avgDwellSec: number;
  percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly STORAGE_KEY_LOGS = 'kpi_exhibition_analytics_v1';
  private readonly STORAGE_KEY_SESSIONS = 'kpi_exhibition_session_v1';

  // Live Signals
  public readonly liveVisitorsCount = signal<number>(142);
  public readonly todayVisitorsCount = signal<number>(1840);
  public readonly totalVisitorsCount = signal<number>(84920);
  public readonly averageDwellMinutes = signal<number>(14.8);
  public readonly activeSection = signal<string>('home');

  // Heatmap tracking
  public readonly exhibitInteractions = signal<{ [key: string]: number }>({
    'art-cypher': 1420,
    'art-loom': 2380,
    'art-camera': 1890,
    'art-crown': 1650,
    'art-car': 1210,
    'art-letter': 1950,
    'era-1': 3400,
    'era-2': 3100,
    'era-3': 2850,
    'era-4': 4120,
    'era-5': 2600,
    'workshop-weaving': 2950,
    'workshop-quiz': 2140
  });

  // Time series datasets
  public readonly dailyData = signal<{ date: string; visitors: number; pageViews: number; avgDwell: number }[]>([]);
  public readonly monthlyData = signal<{ month: string; visitors: number; pageViews: number; satisfaction: number }[]>([]);
  public readonly yearlyData = signal<{ year: string; visitors: number; growth: string }[]>([]);

  // Computed Heatmap ranking
  public readonly topicHeatmap = computed<HeatmapItem[]>(() => {
    const raw = this.exhibitInteractions();
    const map: { [key: string]: { name: string; cat: string; avgDwell: number } } = {
      'era-4': { name: 'วังสวนบ้านแก้ว & เสื่อจันทบูร', cat: 'ไทม์ไลน์ประวัติศาสตร์', avgDwell: 280 },
      'workshop-weaving': { name: 'สตูดิโอทอเสื่อจันทบูรจำลอง', cat: 'กิจกรรมปฏิสัมพันธ์', avgDwell: 310 },
      'era-1': { name: 'พระราชสมภพ & พระราชพิธีอภิเษกสมรส', cat: 'ไทม์ไลน์ประวัติศาสตร์', avgDwell: 220 },
      'art-loom': { name: 'กี่ทอเสื่อจันทบูร 3D', cat: 'วัตถุจัดแสดง 3 มิติ', avgDwell: 190 },
      'era-2': { name: 'สมเด็จพระบรมราชินี & การทูตโลก', cat: 'ไทม์ไลน์ประวัติศาสตร์', avgDwell: 210 },
      'art-letter': { name: 'พระราชหัตถเลขาประวัติศาสตร์', cat: 'วัตถุจัดแสดง 3 มิติ', avgDwell: 175 },
      'workshop-quiz': { name: 'ควิซประวัติศาสตร์ & เกียรติบัตร', cat: 'กิจกรรมปฏิสัมพันธ์', avgDwell: 240 },
      'art-camera': { name: 'กล้องโบราณ Voigtländer 3D', cat: 'วัตถุจัดแสดง 3 มิติ', avgDwell: 160 },
      'era-3': { name: 'ประทับ ณ ประเทศอังกฤษ', cat: 'ไทม์ไลน์ประวัติศาสตร์', avgDwell: 195 },
      'art-crown': { name: 'พระมงกุฎจำลองขัตติยราชนารี', cat: 'วัตถุจัดแสดง 3 มิติ', avgDwell: 150 },
      'era-5': { name: 'มรดกสู่สถาบันพระปกเกล้า', cat: 'ไทม์ไลน์ประวัติศาสตร์', avgDwell: 180 },
      'art-cypher': { name: 'ตราพระนามาภิไธยย่อ ร.พ.', cat: 'วัตถุจัดแสดง 3 มิติ', avgDwell: 140 },
      'art-car': { name: 'แบบจำลองรถยนต์พระที่นั่ง', cat: 'วัตถุจัดแสดง 3 มิติ', avgDwell: 130 }
    };

    let maxVisits = 1;
    const items: HeatmapItem[] = Object.keys(raw).map((k) => {
      const info = map[k] || { name: k, cat: 'ทั่วไป', avgDwell: 120 };
      const v = raw[k] || 0;
      if (v > maxVisits) maxVisits = v;
      return {
        id: k,
        name: info.name,
        category: info.cat,
        visits: v,
        avgDwellSec: info.avgDwell,
        percentage: 0
      };
    });

    items.forEach((item) => {
      item.percentage = Math.round((item.visits / maxVisits) * 100);
    });

    return items.sort((a, b) => b.visits - a.visits);
  });

  constructor() {
    this.initHistoricalDatasets();
    this.startLiveSimulator();
  }

  private initHistoricalDatasets() {
    // Generate realistic 30-day daily records
    const daily: { date: string; visitors: number; pageViews: number; avgDwell: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      // weekend boost
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const base = isWeekend ? 2100 : 1400;
      const noise = Math.floor(Math.random() * 400) - 200;
      const visitors = base + noise;
      const pageViews = Math.floor(visitors * (3.8 + Math.random() * 0.8));
      const avgDwell = parseFloat((12 + Math.random() * 5).toFixed(1));
      daily.push({ date: dateStr, visitors, pageViews, avgDwell });
    }
    this.dailyData.set(daily);

    // 12-month series
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const monthly = months.map((m, idx) => {
      const visitors = 38000 + (idx * 2100) + Math.floor(Math.random() * 4000);
      const pageViews = Math.floor(visitors * 4.2);
      const satisfaction = parseFloat((4.7 + Math.random() * 0.25).toFixed(2));
      return { month: m, visitors, pageViews, satisfaction: Math.min(5.0, satisfaction) };
    });
    this.monthlyData.set(monthly);

    // Yearly series
    this.yearlyData.set([
      { year: '2565 (2022)', visitors: 284000, growth: '+15.2%' },
      { year: '2566 (2023)', visitors: 392000, growth: '+38.0%' },
      { year: '2567 (2024)', visitors: 512000, growth: '+30.6%' },
      { year: '2568 (2025)', visitors: 645000, growth: '+25.9%' },
      { year: '2569 (2026)', visitors: 789000, growth: '+22.3% (ประมาณการ)' }
    ]);
  }

  private startLiveSimulator() {
    // Subtle live activity heartbeat
    setInterval(() => {
      const delta = Math.floor(Math.random() * 7) - 3;
      this.liveVisitorsCount.update((v) => Math.max(80, Math.min(250, v + delta)));
    }, 4000);
  }

  public recordPageView(pageName: string) {
    this.activeSection.set(pageName);
    this.todayVisitorsCount.update((n) => n + 1);
    this.totalVisitorsCount.update((n) => n + 1);
    this.recordInteraction(pageName);
  }

  public recordInteraction(itemId: string) {
    this.exhibitInteractions.update((map) => {
      const copy = { ...map };
      copy[itemId] = (copy[itemId] || 0) + 1;
      return copy;
    });
  }

  // Export to CSV
  public exportCSV(type: 'daily' | 'monthly' | 'yearly' | 'heatmap') {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    let filename = `kpi_exhibition_report_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === 'daily') {
      csvContent += 'วันที่,จำนวนผู้เข้าชม (คน),ยอดเปิดหน้า (ครั้ง),เวลาเฉลี่ย (นาที)\n';
      this.dailyData().forEach((r) => {
        csvContent += `"${r.date}",${r.visitors},${r.pageViews},${r.avgDwell}\n`;
      });
    } else if (type === 'monthly') {
      csvContent += 'เดือน,ผู้เข้าชมนิทรรศการ (คน),ยอดเปิดหน้า (ครั้ง),คะแนนความพึงพอใจ (5.00)\n';
      this.monthlyData().forEach((r) => {
        csvContent += `"${r.month}",${r.visitors},${r.pageViews},${r.satisfaction}\n`;
      });
    } else if (type === 'yearly') {
      csvContent += 'ปีงบประมาณ,ยอดผู้เข้าชมรวม (คน),อัตราการเติบโต\n';
      this.yearlyData().forEach((r) => {
        csvContent += `"${r.year}",${r.visitors},"${r.growth}"\n`;
      });
    } else if (type === 'heatmap') {
      csvContent += 'อันดับ,หัวข้อ / วัตถุจัดแสดง,หมวดหมู่,จำนวนการเข้าชม (ครั้ง),เวลาเฉลี่ย (วินาที)\n';
      this.topicHeatmap().forEach((item, index) => {
        csvContent += `${index + 1},"${item.name}","${item.category}",${item.visits},${item.avgDwellSec}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export full JSON dataset
  public exportJSON() {
    const data = {
      institution: "King Prajadhipok's Institute (สถาบันพระปกเกล้า)",
      project: "นิทรรศการออนไลน์เสมือนจริง สมเด็จพระนางเจ้ารำไพพรรณี พระบรมราชินีในรัชกาลที่ 7",
      generatedAt: new Date().toISOString(),
      summary: {
        totalVisitors: this.totalVisitorsCount(),
        todayVisitors: this.todayVisitorsCount(),
        liveConcurrentUsers: this.liveVisitorsCount(),
        averageDwellMinutes: this.averageDwellMinutes()
      },
      dailyRecords: this.dailyData(),
      monthlyRecords: this.monthlyData(),
      yearlyRecords: this.yearlyData(),
      topicHeatmap: this.topicHeatmap()
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `kpi_exhibition_analytics_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
