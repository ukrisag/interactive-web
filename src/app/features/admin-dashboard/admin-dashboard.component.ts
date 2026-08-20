import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SurveyService } from '../../core/services/survey.service';

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

  public timeRange: 'daily' | 'monthly' | 'yearly' = 'daily';
  private visitorsChartInstance: Chart | null = null;
  private ratingsChartInstance: Chart | null = null;

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
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.4)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

    this.visitorsChartInstance = new Chart(ctx, {
      type: this.timeRange === 'yearly' ? 'bar' : 'line',
      data: {
        labels,
        datasets: [
          {
            label: labelTitle,
            data,
            borderColor: '#d4af37',
            backgroundColor: this.timeRange === 'yearly' ? 'rgba(212, 175, 55, 0.6)' : gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#d4af37',
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
            backgroundColor: 'rgba(14, 16, 23, 0.95)',
            borderColor: 'rgba(212, 175, 55, 0.4)',
            borderWidth: 1,
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            padding: 12,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8',
              font: { family: "'Prompt', sans-serif", size: 11 }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8',
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
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.25)',
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#38bdf8',
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
              color: '#64748b',
              backdropColor: 'transparent'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            angleLines: {
              color: 'rgba(255, 255, 255, 0.08)'
            },
            pointLabels: {
              color: '#e2e8f0',
              font: { family: "'Prompt', sans-serif", size: 11 }
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
