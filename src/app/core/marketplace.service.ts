import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  MarketplaceReport,
  MarketplaceTheme,
  MarketplaceThemeList,
  PublishThemePayload,
  ReportReason,
  ResolveAction,
  ThemeFamily,
  ThemeQuery,
} from './marketplace.models';

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl.replace(/\/$/, '');

  listThemes(query: ThemeQuery = {}): Observable<MarketplaceThemeList> {
    let params = new HttpParams();
    if (query.sort) params = params.set('sort', query.sort);
    if (query.base && query.base !== 'all') params = params.set('base', query.base);
    if (query.search?.trim()) params = params.set('search', query.search.trim());
    if (query.limit != null) params = params.set('limit', query.limit);
    if (query.offset != null) params = params.set('offset', query.offset);
    return this.http.get<MarketplaceThemeList>(`${this.api}/api/themes`, { params });
  }

  getTheme(id: string): Observable<MarketplaceTheme> {
    return this.http.get<MarketplaceTheme>(`${this.api}/api/themes/${id}`);
  }

  getFamily(id: string): Observable<ThemeFamily> {
    return this.http.get<ThemeFamily>(`${this.api}/api/themes/${id}/family`);
  }

  publishTheme(payload: PublishThemePayload): Observable<MarketplaceTheme> {
    return this.http.post<MarketplaceTheme>(`${this.api}/api/themes`, payload);
  }

  updateTheme(id: string, payload: Partial<PublishThemePayload>): Observable<MarketplaceTheme> {
    return this.http.patch<MarketplaceTheme>(`${this.api}/api/themes/${id}`, payload);
  }

  deleteTheme(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/api/themes/${id}`);
  }

  reportTheme(id: string, reason: ReportReason, details?: string): Observable<void> {
    return this.http.post<void>(`${this.api}/api/themes/${id}/report`, { reason, details });
  }

  // --- admin ---------------------------------------------------------------

  listReports(resolved = false): Observable<MarketplaceReport[]> {
    const params = new HttpParams().set('resolved', resolved);
    return this.http.get<MarketplaceReport[]>(`${this.api}/api/admin/reports`, { params });
  }

  resolveReport(id: number, action: ResolveAction): Observable<void> {
    return this.http.post<void>(`${this.api}/api/admin/reports/${id}/resolve`, { action });
  }

  setVisibility(themeId: string, isHidden: boolean): Observable<MarketplaceTheme> {
    return this.http.post<MarketplaceTheme>(
      `${this.api}/api/admin/themes/${themeId}/visibility`,
      { is_hidden: isHidden },
    );
  }
}
