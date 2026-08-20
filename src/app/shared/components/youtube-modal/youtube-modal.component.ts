import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { YouTubeService } from '../../../core/services/youtube.service';

@Component({
  selector: 'app-youtube-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './youtube-modal.component.html',
  styleUrls: ['./youtube-modal.component.css']
})
export class YouTubeModalComponent {
  public readonly ytService = inject(YouTubeService);

  public close(): void {
    this.ytService.closeVideoModal();
  }

  @HostListener('window:keydown.escape')
  public onEscKey(): void {
    this.close();
  }
}
