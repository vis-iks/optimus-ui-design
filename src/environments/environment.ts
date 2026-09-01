// Default (development) environment. Replaced by environment.production.ts in
// production builds via `fileReplacements` in angular.json.
export const environment = {
  production: false,
  /** Base URL of the marketplace API (FastAPI backend). No trailing slash. */
  apiUrl: 'http://localhost:8000',
};
