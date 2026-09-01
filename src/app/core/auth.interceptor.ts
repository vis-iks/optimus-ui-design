import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/** Attach the marketplace bearer token to marketplace-API requests only. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const api = environment.apiUrl.replace(/\/$/, '');
  const isMarketplaceCall = api
    ? req.url.startsWith(api)
    : req.url.startsWith('/api/') || req.url.startsWith(`${location.origin}/api/`);

  if (!isMarketplaceCall) {
    return next(req);
  }
  const token = inject(AuthService).token;
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
