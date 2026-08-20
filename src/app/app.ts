import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AudioPlayerBarComponent } from './shared/components/audio-player-bar/audio-player-bar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, AudioPlayerBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'interactive-app';
}
