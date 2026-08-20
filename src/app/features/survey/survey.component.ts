import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import confetti from 'canvas-confetti';
import { SurveyService } from '../../core/services/survey.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SurveyResponse } from '../../core/models/exhibition.models';

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey.component.html',
  styleUrls: ['./survey.component.css']
})
export class SurveyComponent implements OnInit {
  public readonly surveyService = inject(SurveyService);
  public readonly analyticsService = inject(AnalyticsService);

  public visitorType: SurveyResponse['visitorType'] = 'general';
  public ratingContent = 5;
  public ratingInteractivity = 5;
  public ratingVisual = 5;
  public ratingEase = 5;
  public npsScore = 10;
  public favoriteZone = 'วังสวนบ้านแก้ว & กี่ทอเสื่อ 3D';
  public comment = '';
  public submitted = false;

  public readonly zoneOptions = [
    'ห้องนิทรรศการเสมือนจริง 3D Virtual Hall',
    'ตราพระนามาภิไธยย่อ ร.พ. และเครื่องประดับจำลอง 3D',
    'ยุคพระราชสมภพและพระราชพิธีอภิเษกสมรส (พ.ศ. 2447 – 2468)',
    'ยุคการเจริญสัมพันธไมตรีและกล้องโบราณ (พ.ศ. 2468 – 2477)',
    'ยุคประทับ ณ ประเทศอังกฤษ และพระราชหัตถเลขา (พ.ศ. 2477 – 2492)',
    'วังสวนบ้านแก้ว & กี่ทอเสื่อ 3D (พ.ศ. 2493 – 2511)',
    'สตูดิโอทอเสื่อจันทบูรจำลอง (Interactive Weaving)',
    'แบบทดสอบความรู้ & เกียรติบัตรสถาบันพระปกเกล้า'
  ];

  ngOnInit(): void {
    this.analyticsService.recordPageView('แบบประเมินความพึงพอใจ (Survey)');
  }

  public setRating(field: 'content' | 'interactivity' | 'visual' | 'ease', val: number): void {
    if (field === 'content') this.ratingContent = val;
    if (field === 'interactivity') this.ratingInteractivity = val;
    if (field === 'visual') this.ratingVisual = val;
    if (field === 'ease') this.ratingEase = val;
  }

  public submitForm(): void {
    this.surveyService.submitSurvey({
      visitorType: this.visitorType,
      ratingContent: this.ratingContent,
      ratingInteractivity: this.ratingInteractivity,
      ratingVisual: this.ratingVisual,
      ratingEase: this.ratingEase,
      npsScore: this.npsScore,
      favoriteZone: this.favoriteZone,
      comment: this.comment
    });

    this.submitted = true;
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#d4af37', '#22c55e', '#38bdf8']
      });
    } catch (e) {}
  }

  public resetForm(): void {
    this.submitted = false;
    this.comment = '';
  }
}
