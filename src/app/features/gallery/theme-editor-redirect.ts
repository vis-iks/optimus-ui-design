import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/** Keeps old theme URLs useful by opening the actual editor for that theme. */
export const themeEditorRedirect: CanActivateFn = (route) =>
  inject(Router).createUrlTree(['/designer'], {
    queryParams: { themeId: route.paramMap.get('id') },
  });
