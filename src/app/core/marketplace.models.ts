export type BasePreset = 'Aura' | 'Material' | 'Lara' | 'Nora' | 'custom';

export type ReportReason = 'spam' | 'offensive' | 'broken' | 'copyright' | 'other';

export interface MarketplaceAuthor {
  github_login: string;
  avatar_url: string;
}

export interface MarketplaceUser {
  id: number;
  github_login: string;
  avatar_url: string;
  is_admin: boolean;
}

export interface ThemeSummary {
  id: string;
  slug: string;
  name: string;
  base_preset: BasePreset;
  author: MarketplaceAuthor;
  parent_id: string | null;
  fork_count: number;
  created_at: string;
}

export interface MarketplaceTheme {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  base_preset: BasePreset;
  preset: Record<string, unknown>;
  config: { fontSize: string; fontFamily: string };
  author: MarketplaceAuthor;
  parent_id: string | null;
  parent: ThemeSummary | null;
  report_count: number;
  view_count: number;
  fork_count: number;
  created_at: string;
  updated_at: string;
}

export interface ThemeFamily {
  root_id: string;
  focus_id: string;
  nodes: ThemeSummary[];
}

export interface MarketplaceThemeList {
  items: MarketplaceTheme[];
  total: number;
  limit: number;
  offset: number;
}

export interface PublishThemePayload {
  name: string;
  description?: string | null;
  base_preset: BasePreset;
  preset: Record<string, unknown>;
  config: { fontSize: string; fontFamily: string };
  parent_id?: string | null;
}

export interface ThemeQuery {
  sort?: 'recent' | 'popular';
  base?: BasePreset | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface MarketplaceReport {
  id: number;
  reason: ReportReason;
  details: string | null;
  resolved: boolean;
  created_at: string;
  theme: MarketplaceTheme;
  reporter: MarketplaceAuthor;
}

export type ResolveAction = 'dismiss' | 'hide' | 'delete';
