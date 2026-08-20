import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AudioService } from '../../../core/services/audio.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  public readonly audioService = inject(AudioService);
  public readonly analyticsService = inject(AnalyticsService);
  public mobileMenuOpen = false;

  public toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  public closeMobileMenu() {
    this.mobileMenuOpen = false;
  }
}
