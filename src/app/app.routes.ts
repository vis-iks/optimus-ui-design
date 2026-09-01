import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/gallery/gallery.routes').then((m) => m.galleryRoutes),
  },
  {
    path: 'designer',
    loadChildren: () => import('./features/designer/designer.routes').then((m) => m.designerRoutes),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth-callback/auth-callback').then((m) => m.AuthCallback),
  },
  // Legacy paths — the marketplace is the home page now.
  { path: 'gallery', redirectTo: '', pathMatch: 'full' },
  { path: 'gallery/admin', redirectTo: 'admin', pathMatch: 'full' },
];
