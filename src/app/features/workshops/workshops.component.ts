import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import confetti from 'canvas-confetti';
import { ExhibitionDataService } from '../../core/services/exhibition-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { QuizQuestion } from '../../core/models/exhibition.models';

interface DyeColor {
  name: string;
  hex: string;
  sourceTh: string;
}

@Component({
  selector: 'app-workshops',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workshops.component.html',
  styleUrls: ['./workshops.component.css']
})
export class WorkshopsComponent implements OnInit {
  public readonly exhibitionService = inject(ExhibitionDataService);
  public readonly analyticsService = inject(AnalyticsService);

  public activeTab: 'weaving' | 'quiz' = 'weaving';

  // 1. Chanthaboon Mat Weaving Studio State
  public readonly gridRows = 8;
  public readonly gridCols = 10;
  public matGrid: string[][] = [];

  public readonly dyeColors: DyeColor[] = [
    { name: 'สีกกธรรมชาติ', hex: '#d1b272', sourceTh: 'ต้นกกตากแห้งบริสุทธิ์' },
    { name: 'สีทองราชสำนัก', hex: '#d4af37', sourceTh: 'ขมิ้นชันและเกสรดอกไม้' },
    { name: 'สีครามกษัตริย์', hex: '#1e3a8a', sourceTh: 'ต้นครามย้อมครามหมัก' },
    { name: 'สีแดงชาดฝาง', hex: '#991b1b', sourceTh: 'แก่นไม้ฝางธรรมชาติ' },
    { name: 'สีเขียวใบเตย', hex: '#15803d', sourceTh: 'ใบเตยหอมและเปลือกเพกา' }
  ];
  public selectedColor = '#d4af37';
  public isWeavingAnimated = false;
  public wovenRowCount = 0;

  // 2. Historical Quiz & Certificate State
  public quizAnswers: { [qId: number]: number } = {};
  public quizSubmitted = false;
  public score = 0;
  public visitorName = '';
  public certificateDate = '';

  ngOnInit(): void {
    this.analyticsService.recordPageView('กิจกรรมจำลอง (Workshops)');
    this.initMatGrid();
    this.applyMotif('royal');
    this.certificateDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  public setTab(tab: 'weaving' | 'quiz'): void {
    this.activeTab = tab;
    this.analyticsService.recordInteraction(`workshop-${tab}`);
  }

  // --- Weaving Matrix Logic ---
  public initMatGrid(): void {
    this.matGrid = [];
    for (let r = 0; r < this.gridRows; r++) {
      const row: string[] = [];
      for (let c = 0; c < this.gridCols; c++) {
        row.push('#d1b272');
      }
      this.matGrid.push(row);
    }
  }

  public paintCell(r: number, c: number): void {
    this.matGrid[r][c] = this.selectedColor;
    this.analyticsService.recordInteraction('workshop-weaving');
  }

  public applyMotif(motif: 'royal' | 'kaew' | 'checkered'): void {
    this.initMatGrid();
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (motif === 'royal') {
          // Royal Diamond Pattern
          const isDiamond = Math.abs(r - 3.5) + Math.abs(c - 4.5) < 3.5;
          this.matGrid[r][c] = isDiamond ? '#d4af37' : (r + c) % 2 === 0 ? '#1e3a8a' : '#d1b272';
        } else if (motif === 'kaew') {
          // Floral Kaew Pattern
          const isFloral = (r === 2 || r === 5) && (c === 3 || c === 6);
          this.matGrid[r][c] = isFloral ? '#991b1b' : (r % 2 === 0 ? '#d4af37' : '#15803d');
        } else {
          // Checkered Classic
          this.matGrid[r][c] = (r + c) % 2 === 0 ? '#d4af37' : '#991b1b';
        }
      }
    }
  }

  public triggerWeaveAnimation(): void {
    this.isWeavingAnimated = true;
    this.wovenRowCount = 0;
    const interval = setInterval(() => {
      this.wovenRowCount++;
      if (this.wovenRowCount >= this.gridRows) {
        clearInterval(interval);
        this.isWeavingAnimated = false;
        this.launchConfetti();
      }
    }, 200);
  }

  // --- Quiz & Certificate Logic ---
  public selectQuizOption(questionId: number, optionIndex: number): void {
    if (this.quizSubmitted) return;
    this.quizAnswers[questionId] = optionIndex;
  }

  public submitQuiz(): void {
    const questions = this.exhibitionService.quiz();
    let calculated = 0;
    questions.forEach((q) => {
      if (this.quizAnswers[q.id] === q.correctIndex) {
        calculated++;
      }
    });

    this.score = calculated;
    this.quizSubmitted = true;
    this.analyticsService.recordInteraction('workshop-quiz');

    if (this.score >= 3) {
      this.launchConfetti();
    }
  }

  public resetQuiz(): void {
    this.quizAnswers = {};
    this.quizSubmitted = false;
    this.score = 0;
  }

  public printCertificate(): void {
    window.print();
  }

  private launchConfetti(): void {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f1e4bf', '#38bdf8', '#4ade80']
      });
    } catch (e) {
      // safe fallback
    }
  }
}
