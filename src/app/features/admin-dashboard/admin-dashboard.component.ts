import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SurveyService } from '../../core/services/survey.service';
import { ThemeService } from '../../core/services/theme.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('visitorsChart', { static: false }) visitorsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ratingsRadarChart', { static: false }) ratingsCanvas!: ElementRef<HTMLCanvasElement>;

  public readonly analyticsService = inject(AnalyticsService);
  public readonly surveyService = inject(SurveyService);
  public readonly themeService = inject(ThemeService);

  public timeRange: 'daily' | 'monthly' | 'yearly' = 'daily';
  private visitorsChartInstance: Chart | null = null;
  private ratingsChartInstance: Chart | null = null;

  constructor() {
    effect(() => {
      // Re-render charts when theme changes
      const theme = this.themeService.currentTheme();
      setTimeout(() => {
        this.renderVisitorsChart();
        this.renderRatingsRadarChart();
      }, 50);
    });
  }

  ngAfterViewInit(): void {
    this.analyticsService.recordPageView('แผงสถิติผู้บริหาร (Admin Dashboard)');
    this.renderVisitorsChart();
    this.renderRatingsRadarChart();
  }

  ngOnDestroy(): void {
    if (this.visitorsChartInstance) {
      this.visitorsChartInstance.destroy();
    }
    if (this.ratingsChartInstance) {
      this.ratingsChartInstance.destroy();
    }
  }

  public setTimeRange(range: 'daily' | 'monthly' | 'yearly'): void {
    this.timeRange = range;
    this.renderVisitorsChart();
  }

  public renderVisitorsChart(): void {
    if (!this.visitorsCanvas) return;
    if (this.visitorsChartInstance) {
      this.visitorsChartInstance.destroy();
    }

    const ctx = this.visitorsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isLight = this.themeService.currentTheme() === 'light';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.05)';
    const tickColor = isLight ? '#5e574f' : '#94a3b8';
    const tooltipBg = isLight ? 'rgba(255, 255, 255, 0.96)' : 'rgba(14, 16, 23, 0.95)';
    const tooltipTitleColor = isLight ? '#23201d' : '#ffffff';
    const tooltipBodyColor = isLight ? '#5e574f' : '#e2e8f0';

    let labels: string[] = [];
    let data: number[] = [];
    let labelTitle = '';

    if (this.timeRange === 'daily') {
      const daily = this.analyticsService.dailyData();
      labels = daily.map((d) => d.date);
      data = daily.map((d) => d.visitors);
      labelTitle = 'ผู้เข้าชมรายวัน (คน)';
    } else if (this.timeRange === 'monthly') {
      const monthly = this.analyticsService.monthlyData();
      labels = monthly.map((m) => m.month);
      data = monthly.map((m) => m.visitors);
      labelTitle = 'ผู้เข้าชมรายเดือน (คน)';
    } else {
      const yearly = this.analyticsService.yearlyData();
      labels = yearly.map((y) => y.year);
      data = yearly.map((y) => y.visitors);
      labelTitle = 'ผู้เข้าชมรายปี (คน)';
    }

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, isLight ? 'rgba(184, 147, 38, 0.3)' : 'rgba(212, 175, 55, 0.4)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

    this.visitorsChartInstance = new Chart(ctx, {
      type: this.timeRange === 'yearly' ? 'bar' : 'line',
      data: {
        labels,
        datasets: [
          {
            label: labelTitle,
            data,
            borderColor: isLight ? '#785c0d' : '#d4af37',
            backgroundColor: this.timeRange === 'yearly' ? (isLight ? 'rgba(184, 147, 38, 0.7)' : 'rgba(212, 175, 55, 0.6)') : gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: isLight ? '#785c0d' : '#d4af37',
            pointRadius: 4,
            pointHoverRadius: 7,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: tooltipBg,
            borderColor: isLight ? 'rgba(184, 147, 38, 0.6)' : 'rgba(212, 175, 55, 0.4)',
            borderWidth: 1,
            titleColor: tooltipTitleColor,
            bodyColor: tooltipBodyColor,
            padding: 12,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: tickColor,
              font: { family: "'Prompt', sans-serif", size: 11 }
            }
          },
          y: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: tickColor,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
            }
          }
        }
      }
    });
  }

  public renderRatingsRadarChart(): void {
    if (!this.ratingsCanvas) return;
    if (this.ratingsChartInstance) {
      this.ratingsChartInstance.destroy();
    }

    const ctx = this.ratingsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const isLight = this.themeService.currentTheme() === 'light';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)';
    const tickColor = isLight ? '#5e574f' : '#64748b';
    const labelColor = isLight ? '#23201d' : '#e2e8f0';
    const chartLineColor = isLight ? '#0284c7' : '#38bdf8';

    const avg = this.surveyService.averageRatings();

    this.ratingsChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [
          'ความถูกต้องเนื้อหา',
          'ระบบปฏิสัมพันธ์ 3D',
          'ความสวยงาม & เสียง',
          'ความสะดวกง่ายดาย'
        ],
        datasets: [
          {
            label: 'คะแนนเฉลี่ย (เต็ม 5)',
            data: [avg.content, avg.interactivity, avg.visual, avg.ease],
            borderColor: chartLineColor,
            backgroundColor: isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(56, 189, 248, 0.25)',
            pointBackgroundColor: '#ffffff',
            pointBorderColor: chartLineColor,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          r: {
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
              color: tickColor,
              backdropColor: 'transparent'
            },
            grid: {
              color: gridColor
            },
            angleLines: {
              color: gridColor
            },
            pointLabels: {
              color: labelColor,
              font: { family: "'Prompt', sans-serif", size: 11, weight: 'bold' }
            }
          }
        }
      }
    });
  }

  public exportReport(type: 'daily' | 'monthly' | 'yearly' | 'heatmap'): void {
    this.analyticsService.exportCSV(type);
  }

  public exportFullJSON(): void {
    this.analyticsService.exportJSON();
  }
}
