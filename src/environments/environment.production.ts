// Production environment.
// The single-image deployment serves the API and the SPA from the same origin,
// so the API base is relative ('' -> requests go to /api/... on the current host).
// Set this to an absolute origin only if you split the frontend and backend.
export const environment = {
  production: true,
  /** Base URL of the marketplace API. Empty = same origin as the SPA. */
  apiUrl: '',
};
