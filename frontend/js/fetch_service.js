/* FetchService: object wrapper around fetch with loader integration */
(function(){
  class FetchService {
    constructor() {
      this._orig = window.fetch ? window.fetch.bind(window) : null;
      this._patched = false;
    }

    async fetch(resource, options = {}) {
      options = options || {};
      // Keep `/api/v1/...` calls relative by default so the dev server (Vite)
      // can proxy them to the real backend. Only rewrite if an explicit
      // `window.__API_BASE__` is provided by the environment (developer).
      try {
        if (typeof resource === 'string' && resource.startsWith('/api/')) {
          if (typeof window.__API_BASE__ === 'string' && window.__API_BASE__.trim() !== '') {
            const base = window.__API_BASE__.replace(/\/$/, '');
            resource = base + resource;
          }
        }
      } catch (e) {
        // ignore
      }
      const headers = options.headers || {};
      
      // Inject Authorization header if token exists
      const token = localStorage.getItem('synapse_token');
      if (token && !headers['Authorization'] && !headers['authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      options.headers = headers;

      const noLoader = options._noLoader || headers['X-No-Loader'] || headers['x-no-loader'];
      if (!noLoader && window.UIManager) window.UIManager.showLoader('Carregando...');
      try {
        let resp;
        if (this._orig) {
          resp = await this._orig(resource, options);
        } else {
          // fallback to built-in fetch if available
          resp = await window.fetch(resource, options);
        }

        // Global 401 handler: if unauthorized, clear token and redirect to login
        if (resp && resp.status === 401) {
          console.warn('Unauthorized request detected. Redirecting to login...');
          if (window.AppState && typeof window.AppState.logout === 'function') {
            window.AppState.logout();
          } else {
            localStorage.removeItem('synapse_token');
            window.location.href = '/auth';
          }
        }
        return resp;
      } finally {
        if (!noLoader && window.UIManager) window.UIManager.hideLoader();
      }
    }

    patchGlobal() {
      if (this._patched) return;
      const self = this;
      const original = this._orig || window.fetch.bind(window);
      window.fetch = function(resource, options) {
        return self.fetch(resource, options);
      };
      this._patched = true;
    }

    fetchWithLoader(resource, options = {}, opts = {}) {
      const { message = 'Carregando...', autoHide = true } = opts;
      options = options || {};
      const noLoader = options._noLoader;
      if (!noLoader && window.UIManager) window.UIManager.showLoader(message);
      const p = this.fetch(resource, options);
      if (!autoHide) return p;
      return p.finally(() => { if (!noLoader && window.UIManager) window.UIManager.hideLoader(); });
    }
  }

  window.FetchService = new FetchService();
  // patch global fetch so existing code implicitly shows loader
  window.FetchService.patchGlobal();
  window.fetchWithLoader = window.FetchService.fetchWithLoader.bind(window.FetchService);
})();
