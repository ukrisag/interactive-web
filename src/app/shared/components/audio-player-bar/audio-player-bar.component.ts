import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'app-audio-player-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-player-bar.component.html',
  styleUrls: ['./audio-player-bar.component.css']
})
export class AudioPlayerBarComponent {
  public readonly audioService = inject(AudioService);

  public onVolumeChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.audioService.setVolume(parseFloat(val));
  }
}
