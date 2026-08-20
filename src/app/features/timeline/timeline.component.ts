import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ExhibitionDataService } from '../../core/services/exhibition-data.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AudioService } from '../../core/services/audio.service';
import { TimelineEra, ArtifactItem } from '../../core/models/exhibition.models';
import { ArtifactModalComponent } from '../../shared/components/artifact-modal/artifact-modal.component';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, ArtifactModalComponent],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit {
  public readonly exhibitionService = inject(ExhibitionDataService);
  public readonly analyticsService = inject(AnalyticsService);
  public readonly audioService = inject(AudioService);
  private route = inject(ActivatedRoute);

  public activeEraId = 'era-1';
  public selectedArtifact: ArtifactItem | null = null;
  public restorationSliderValue: { [eraId: string]: number } = {
    'era-1': 50,
    'era-2': 50,
    'era-3': 50,
    'era-4': 50,
    'era-5': 50
  };

  ngOnInit(): void {
    this.analyticsService.recordPageView('ประวัติศาสตร์มีชีวิต (Interactive Timeline)');
    this.route.fragment.subscribe((fragment) => {
      if (fragment) {
        this.scrollToEra(fragment);
      }
    });
  }

  public setActiveEra(eraId: string): void {
    this.activeEraId = eraId;
    this.analyticsService.recordInteraction(eraId);
  }

  public scrollToEra(eraId: string): void {
    this.setActiveEra(eraId);
    const element = document.getElementById(eraId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  public playEraNarration(era: TimelineEra): void {
    const script = `${era.titleTh} ${era.subtitle}. ${era.description}`;
    this.audioService.speakNarration(script);
  }

  public openArtifact(item: ArtifactItem): void {
    this.selectedArtifact = item;
  }

  public closeArtifact(): void {
    this.selectedArtifact = null;
  }

  public getArtifactsForEra(eraId: string): ArtifactItem[] {
    return this.exhibitionService.artifacts().filter((a) => a.eraId === eraId);
  }
}
