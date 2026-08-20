import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'นิทรรศการเสมือนจริง สมเด็จพระนางเจ้ารำไพพรรณีฯ | สถาบันพระปกเกล้า'
  },
  {
    path: 'virtual-hall',
    loadComponent: () => import('./features/virtual-hall/virtual-hall.component').then((m) => m.VirtualHallComponent),
    title: 'ห้องนิทรรศการ 3 มิติ (3D Virtual Hall) | สถาบันพระปกเกล้า'
  },
  {
    path: 'timeline',
    loadComponent: () => import('./features/timeline/timeline.component').then((m) => m.TimelineComponent),
    title: 'ประวัติศาสตร์มีชีวิต (Interactive Timeline) | สถาบันพระปกเกล้า'
  },
  {
    path: 'workshops',
    loadComponent: () => import('./features/workshops/workshops.component').then((m) => m.WorkshopsComponent),
    title: 'กิจกรรมจำลอง & ควิซเกียรติบัตร | สถาบันพระปกเกล้า'
  },
  {
    path: 'games',
    loadComponent: () => import('./features/games/games.component').then((m) => m.GamesComponent),
    title: 'มินิเกมประวัติศาสตร์ (Interactive Games Hub) | สถาบันพระปกเกล้า'
  },
  {
    path: 'survey',
    loadComponent: () => import('./features/survey/survey.component').then((m) => m.SurveyComponent),
    title: 'แบบประเมินความพึงพอใจ | สถาบันพระปกเกล้า'
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
    title: 'แผงสถิติผู้เข้าชมและประเมินผล | สถาบันพระปกเกล้า'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
