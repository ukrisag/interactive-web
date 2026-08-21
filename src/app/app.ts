import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AudioPlayerBarComponent } from './shared/components/audio-player-bar/audio-player-bar.component';
import { YouTubeModalComponent } from './shared/components/youtube-modal/youtube-modal.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, AudioPlayerBarComponent, YouTubeModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'interactive-app';
  public readonly themeService = inject(ThemeService);
}

