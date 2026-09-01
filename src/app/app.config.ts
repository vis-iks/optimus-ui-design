import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { DEFAULT_THEME_PRESET, THEME_PRESETS } from './theme-presets';
import { provideOptimus } from '@openng/optimus-ui/config';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => inject(AuthService).loadMe()),
    provideOptimus({
      theme: {
        preset: THEME_PRESETS[DEFAULT_THEME_PRESET],
        options: {
          darkModeSelector: '.p-dark',
        },
      },
    }),
  ],
};
