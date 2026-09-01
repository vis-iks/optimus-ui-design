import { Routes } from '@angular/router';

import { adminGuard } from './admin-guard';

export const galleryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./gallery').then((m) => m.Gallery),
  },
  {
    path: 'theme/:id',
    loadComponent: () => import('./theme-detail').then((m) => m.ThemeDetail),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin-panel').then((m) => m.AdminPanel),
  },
];
